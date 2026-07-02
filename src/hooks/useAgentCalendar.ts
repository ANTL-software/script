import { useState, useCallback, useEffect, useMemo } from 'react';
import { startOfDay, addMinutes, parseISO } from 'date-fns';
import { useUser, useToast, useDialer } from './index';
import { rendezVousService } from '../API/services';
import type { RendezVous, CalendarEvent, CalendarEventType } from '../utils/types';
import { getErrorMessage, formatProspectName } from '../utils/scripts/formatters';

export function toCalendarEvent(rdv: RendezVous, eventType: CalendarEventType): CalendarEvent {
  // Construire la date correctement en combinant date et heure pour éviter les problèmes de timezone
  const dateTimeString = `${rdv.date_rdv}T${rdv.heure_rdv}`;
  const startDate = parseISO(dateTimeString);
  const endDate = addMinutes(startDate, 15);

  const prospectName = rdv.prospect ? formatProspectName({
    nom: rdv.prospect.nom,
    prenom: rdv.prospect.prenom,
  }) : 'Prospect';

  const title = eventType === 'other-agent-prospect'
    ? `Autre agent — ${prospectName}${rdv.motif ? ` (${rdv.motif})` : ''}`
    : `${prospectName}${rdv.motif ? ` — ${rdv.motif}` : ''}`;

  return { id: rdv.id_rendez_vous, title, start: startDate, end: endDate, resource: rdv, eventType };
}

export function useAgentCalendar(prospectId: number | null = null, campagneId: number | null = null) {
  const { user } = useUser();
  const { showToast } = useToast();
  const { currentOrigineAppel, currentRendezVousSourceId } = useDialer();

  const today = startOfDay(new Date());

  const [agentRdvList, setAgentRdvList] = useState<RendezVous[]>([]);
  const [otherAgentRdvList, setOtherAgentRdvList] = useState<RendezVous[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRendezVous = useCallback(async () => {
    if (!user?.id_employe) return;
    const agentId = user.id_employe;

    try {
      setIsLoading(true);

      const [agentData, prospectData] = await Promise.all([
        rendezVousService.getRendezVousByAgent(agentId, campagneId ?? undefined),
        prospectId
          ? rendezVousService.getRendezVousByProspect(prospectId, campagneId ?? undefined)
          : Promise.resolve([]),
      ]);

      setAgentRdvList(agentData);
      setOtherAgentRdvList(prospectData.filter((r) => r.id_agent !== agentId));
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Erreur lors du chargement des rendez-vous'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id_employe, prospectId, campagneId, showToast]);

  useEffect(() => {
    loadRendezVous();
  }, [loadRendezVous]);

  const events: CalendarEvent[] = useMemo(() => {
    const result: CalendarEvent[] = [];

    // Ajouter les RDV de l'agent
    for (const rdv of agentRdvList) {
      if (rdv.statut === 'annule' || rdv.statut === 'effectue') continue;
      
      const isThisProspect = Boolean(
        prospectId &&
        rdv.id_prospect === prospectId &&
        (!campagneId || rdv.id_campagne === campagneId)
      );
      result.push(toCalendarEvent(rdv, isThisProspect ? 'mine-prospect' : 'mine-other'));
    }

    // Ajouter les RDV des autres agents sur ce prospect (mode fiche prospect/closing)
    for (const rdv of otherAgentRdvList) {
      if (rdv.statut === 'annule' || rdv.statut === 'effectue') continue;
      result.push(toCalendarEvent(rdv, 'other-agent-prospect'));
    }

    return result;
  }, [agentRdvList, otherAgentRdvList, prospectId, campagneId]);

  const myProspectRdvs = useMemo(() =>
    agentRdvList.filter(rdv =>
      prospectId &&
      rdv.id_prospect === prospectId &&
      (!campagneId || rdv.id_campagne === campagneId) &&
      rdv.statut !== 'annule' &&
      rdv.statut !== 'effectue'
    ),
    [agentRdvList, prospectId, campagneId]
  );

  const nextMyProspectRdv = useMemo(() => {
    const futureRdvs = myProspectRdvs
      .filter(rdv => new Date(`${rdv.date_rdv}T${rdv.heure_rdv}`) >= new Date())
      .sort((a, b) => new Date(`${a.date_rdv}T${a.heure_rdv}`).getTime() - new Date(`${b.date_rdv}T${b.heure_rdv}`).getTime());
    return futureRdvs[0] || null;
  }, [myProspectRdvs]);

  const currentRendezVousSource = useMemo(() => {
    if (!currentRendezVousSourceId) {
      return null;
    }

    return agentRdvList.find((rdv) => rdv.id_rendez_vous === currentRendezVousSourceId) ?? null;
  }, [agentRdvList, currentRendezVousSourceId]);

  const shouldRescheduleSourceRendezVous = Boolean(
    prospectId &&
    currentOrigineAppel === 'rappel' &&
    currentRendezVousSource &&
    ['planifie', 'reporte', 'non_honore'].includes(currentRendezVousSource.statut)
  );

  return {
    today,
    events,
    isLoading,
    myProspectRdvs,
    otherAgentRdvList,
    nextMyProspectRdv,
    currentRendezVousSource,
    shouldRescheduleSourceRendezVous,
    loadRendezVous,
  };
}
