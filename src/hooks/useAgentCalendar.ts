import { useState, useCallback, useEffect, useMemo } from 'react';
import { startOfDay, addMinutes, format, isBefore, parseISO } from 'date-fns';
import { useUser, useToast, useCampaign } from './index';
import { rendezVousService } from '../API/services';
import type {
  CalendarEvent,
  CalendarEventType,
  CreateRendezVousData,
  RendezVous,
  RendezVousStatut,
} from '../utils/types';
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

export function isUpcomingActiveRendezVous(rendezVous: RendezVous, referenceDate = new Date()): boolean {
  if (!['planifie', 'reporte'].includes(rendezVous.statut)) {
    return false;
  }

  return !isBefore(parseISO(`${rendezVous.date_rdv}T${rendezVous.heure_rdv}`), referenceDate);
}

export function useAgentCalendar(prospectId: number | null = null, campagneId: number | null = null) {
  const { user } = useUser();
  const { showToast } = useToast();
  const { currentCampaign } = useCampaign();
  const resolvedCampagneId = campagneId ?? currentCampaign?.id_campagne ?? null;

  const today = useMemo(() => startOfDay(new Date()), []);

  const [agentRdvList, setAgentRdvList] = useState<RendezVous[]>([]);
  const [otherAgentRdvList, setOtherAgentRdvList] = useState<RendezVous[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRendezVous = useCallback(async () => {
    if (!user?.id_employe) return;
    const agentId = user.id_employe;

    try {
      setIsLoading(true);

      const [agentData, prospectData] = await Promise.all([
        rendezVousService.getRendezVousByAgent(agentId, resolvedCampagneId ?? undefined),
        prospectId
          ? rendezVousService.getRendezVousByProspect(prospectId, resolvedCampagneId ?? undefined)
          : Promise.resolve([]),
      ]);

      setAgentRdvList(agentData);
      setOtherAgentRdvList(prospectData.filter((rendezVous) =>
        Number(rendezVous.id_agent) !== Number(agentId)
        && isUpcomingActiveRendezVous(rendezVous)
      ));
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Erreur lors du chargement des rendez-vous'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id_employe, prospectId, resolvedCampagneId, showToast]);

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
        (!resolvedCampagneId || rdv.id_campagne === resolvedCampagneId)
      );
      result.push(toCalendarEvent(rdv, isThisProspect ? 'mine-prospect' : 'mine-other'));
    }

    // Ajouter les RDV des autres agents sur ce prospect (mode fiche prospect/closing)
    for (const rdv of otherAgentRdvList) {
      if (rdv.statut === 'annule' || rdv.statut === 'effectue') continue;
      result.push(toCalendarEvent(rdv, 'other-agent-prospect'));
    }

    return result;
  }, [agentRdvList, otherAgentRdvList, prospectId, resolvedCampagneId]);

  const myProspectRdvs = useMemo(() =>
    agentRdvList.filter(rdv =>
      prospectId &&
      rdv.id_prospect === prospectId &&
      (!resolvedCampagneId || rdv.id_campagne === resolvedCampagneId) &&
      rdv.statut !== 'annule' &&
      rdv.statut !== 'effectue'
    ),
    [agentRdvList, prospectId, resolvedCampagneId]
  );

  const nextMyProspectRdv = useMemo(() => {
    const futureRdvs = myProspectRdvs
      .filter(rdv => new Date(`${rdv.date_rdv}T${rdv.heure_rdv}`) >= new Date())
      .sort((a, b) => new Date(`${a.date_rdv}T${a.heure_rdv}`).getTime() - new Date(`${b.date_rdv}T${b.heure_rdv}`).getTime());
    return futureRdvs[0] || null;
  }, [myProspectRdvs]);

  const canSelectSlot = useCallback((start: Date, isReadOnly: boolean): boolean => {
    if (isReadOnly || !prospectId) return false;
    if (isBefore(startOfDay(start), today)) {
      showToast('error', 'Impossible de prendre un rendez-vous dans le passé');
      return false;
    }
    return true;
  }, [prospectId, showToast, today]);

  const createRendezVous = useCallback(async (date: Date, motif: string | null = null): Promise<boolean> => {
    if (!user?.id_employe || !prospectId) return false;
    if (!resolvedCampagneId) {
      showToast('error', 'Impossible de planifier sans campagne associée');
      return false;
    }

    try {
      const dateRdv = format(date, 'yyyy-MM-dd');
      const heureRdv = format(date, 'HH:mm:ss');

      const createData: CreateRendezVousData = {
        id_agent: user.id_employe,
        id_prospect: prospectId,
        id_campagne: resolvedCampagneId,
        date_rdv: dateRdv,
        heure_rdv: heureRdv,
        ...(motif ? { motif } : {}),
      };
      await rendezVousService.createRendezVous(createData);
      showToast('success', 'Rendez-vous planifié avec succès');

      await loadRendezVous();
      return true;
    } catch (error) {
      showToast('error', getErrorMessage(error, 'Erreur lors de la planification'));
      return false;
    }
  }, [
    loadRendezVous,
    prospectId,
    resolvedCampagneId,
    showToast,
    user?.id_employe,
  ]);

  const updateRendezVous = useCallback(async (
    idRendezVous: number,
    date: Date,
    statut: RendezVousStatut,
  ): Promise<boolean> => {
    try {
      await rendezVousService.updateRendezVous(idRendezVous, {
        date_rdv: format(date, 'yyyy-MM-dd'),
        heure_rdv: format(date, 'HH:mm:ss'),
        statut,
      });
      showToast('success', 'Rendez-vous modifié');
      await loadRendezVous();
      return true;
    } catch (error) {
      showToast('error', getErrorMessage(error, 'Erreur lors de la modification'));
      return false;
    }
  }, [loadRendezVous, showToast]);

  const deleteRendezVous = useCallback(async (idRendezVous: number): Promise<boolean> => {
    try {
      await rendezVousService.deleteRendezVous(idRendezVous);
      showToast('success', 'Rendez-vous supprimé');
      await loadRendezVous();
      return true;
    } catch (error) {
      showToast('error', getErrorMessage(error, 'Erreur lors de la suppression'));
      return false;
    }
  }, [loadRendezVous, showToast]);

  return {
    today,
    resolvedCampagneId,
    events,
    isLoading,
    myProspectRdvs,
    otherAgentRdvList,
    nextMyProspectRdv,
    loadRendezVous,
    canSelectSlot,
    createRendezVous,
    updateRendezVous,
    deleteRendezVous,
  };
}
