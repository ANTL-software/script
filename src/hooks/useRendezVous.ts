import { useState, useCallback, useEffect, useMemo } from 'react';
import { format, addHours, parseISO, isBefore, startOfDay } from 'date-fns';
import type { SlotInfo } from 'react-big-calendar';
import { useUser, useProspect, useCampaign, useToast } from './index';
import { rendezVousService } from '../API/services';
import type {
  RendezVous,
  CalendarEvent,
  CalendarEventType,
  CreateRendezVousData,
} from '../utils/types';
import { getErrorMessage, formatProspectName } from '../utils/scripts/formatters';

export function toCalendarEvent(rdv: RendezVous, eventType: CalendarEventType): CalendarEvent {
  const [hours, minutes] = rdv.heure_rdv.split(':').map(Number);
  const startDate = parseISO(rdv.date_rdv);
  startDate.setHours(hours, minutes, 0, 0);
  const endDate = addHours(startDate, 1);

  const prospectName = rdv.prospect ? formatProspectName({
    nom: rdv.prospect.nom,
    prenom: rdv.prospect.prenom,
  }) : 'Prospect';

  const title = eventType === 'other-agent-prospect'
    ? `Autre agent — ${prospectName}${rdv.motif ? ` (${rdv.motif})` : ''}`
    : `${prospectName}${rdv.motif ? ` — ${rdv.motif}` : ''}`;

  return { id: rdv.id_rendez_vous, title, start: startDate, end: endDate, resource: rdv, eventType };
}

export function useRendezVous() {
  const { user } = useUser();
  const { currentProspect } = useProspect();
  const { currentCampaign } = useCampaign();
  const { showToast } = useToast();

  const today = startOfDay(new Date());

  const [agentRdvList, setAgentRdvList] = useState<RendezVous[]>([]);
  const [otherAgentRdvList, setOtherAgentRdvList] = useState<RendezVous[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [selectedRendezVous, setSelectedRendezVous] = useState<RendezVous | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

  const prospectId = currentProspect?.id_prospect ?? null;

  const loadRendezVous = useCallback(async () => {
    if (!user?.id_employe) return;
    const agentId = user.id_employe;

    try {
      setIsLoading(true);

      const [agentData, prospectData] = await Promise.all([
        rendezVousService.getRendezVousByAgent(agentId),
        prospectId
          ? rendezVousService.getRendezVousByProspect(prospectId)
          : Promise.resolve([]),
      ]);

      setAgentRdvList(agentData);
      setOtherAgentRdvList(prospectData.filter(r => r.id_agent !== agentId));
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Erreur lors du chargement des rendez-vous'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id_employe, prospectId, showToast]);

  useEffect(() => {
    loadRendezVous();
  }, [loadRendezVous]);

  const events: CalendarEvent[] = useMemo(() => {
    const result: CalendarEvent[] = [];

    for (const rdv of agentRdvList) {
      const isThisProspect = currentProspect && rdv.id_prospect === currentProspect.id_prospect;
      result.push(toCalendarEvent(rdv, isThisProspect ? 'mine-prospect' : 'mine-other'));
    }

    for (const rdv of otherAgentRdvList) {
      result.push(toCalendarEvent(rdv, 'other-agent-prospect'));
    }

    return result;
  }, [agentRdvList, otherAgentRdvList, currentProspect]);

  const myProspectRdvs = useMemo(() =>
    agentRdvList.filter(rdv =>
      currentProspect &&
      rdv.id_prospect === currentProspect.id_prospect &&
      rdv.statut !== 'annule'
    ),
    [agentRdvList, currentProspect]
  );

  const nextMyProspectRdv = useMemo(() => {
    const now = new Date();
    return myProspectRdvs
      .filter(rdv => {
        const [h, m] = rdv.heure_rdv.split(':').map(Number);
        const d = parseISO(rdv.date_rdv);
        d.setHours(h, m, 0, 0);
        return d > now && rdv.statut === 'planifie';
      })
      .sort((a, b) => a.date_rdv.localeCompare(b.date_rdv))[0] ?? null;
  }, [myProspectRdvs]);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    if (isBefore(slotInfo.start, new Date())) {
      showToast('error', 'Impossible de créer un rendez-vous dans le passé');
      return;
    }
    if (!currentProspect) {
      showToast('error', 'Veuillez sélectionner un prospect');
      return;
    }
    setSelectedSlot({ start: slotInfo.start, end: slotInfo.end });
    setSelectedRendezVous(null);
    setIsReadOnly(false);
    setIsModalOpen(true);
  }, [currentProspect, showToast]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedRendezVous(event.resource);
    setSelectedSlot(null);
    setIsReadOnly(event.eventType === 'other-agent-prospect');
    setIsModalOpen(true);
  }, []);

  const handleCreateRendezVous = async (data: { date: Date; motif: string; notes: string }) => {
    if (!user?.id_employe || !currentProspect || !currentCampaign) {
      showToast('error', 'Données manquantes pour créer le rendez-vous');
      return;
    }

    const createData: CreateRendezVousData = {
      id_agent: user.id_employe,
      id_prospect: currentProspect.id_prospect,
      id_campagne: currentCampaign.id_campagne,
      date_rdv: format(data.date, 'yyyy-MM-dd'),
      heure_rdv: format(data.date, 'HH:mm:ss'),
      motif: data.motif || undefined,
      notes: data.notes || undefined,
    };

    try {
      await rendezVousService.createRendezVous(createData);
      showToast('success', 'Rendez-vous créé avec succès');
      setIsModalOpen(false);
      loadRendezVous();
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Erreur lors de la création'));
    }
  };

  const handleUpdateRendezVous = async (data: { date: Date; motif: string; notes: string; statut: string }) => {
    if (!selectedRendezVous) return;
    try {
      await rendezVousService.updateRendezVous(selectedRendezVous.id_rendez_vous, {
        date_rdv: format(data.date, 'yyyy-MM-dd'),
        heure_rdv: format(data.date, 'HH:mm:ss'),
        motif: data.motif || undefined,
        notes: data.notes || undefined,
        statut: data.statut as RendezVous['statut'],
      });
      showToast('success', 'Rendez-vous mis à jour');
      setIsModalOpen(false);
      loadRendezVous();
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Erreur lors de la mise à jour'));
    }
  };

  const handleDeleteRendezVous = async () => {
    if (!selectedRendezVous) return;
    try {
      await rendezVousService.deleteRendezVous(selectedRendezVous.id_rendez_vous);
      showToast('success', 'Rendez-vous supprimé');
      setIsModalOpen(false);
      loadRendezVous();
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Erreur lors de la suppression'));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRendezVous(null);
    setSelectedSlot(null);
    setIsReadOnly(false);
  };

  const handleNewRendezVous = () => {
    if (!currentProspect) {
      showToast('error', 'Veuillez sélectionner un prospect');
      return;
    }
    setSelectedSlot({ start: new Date(), end: addHours(new Date(), 1) });
    setSelectedRendezVous(null);
    setIsReadOnly(false);
    setIsModalOpen(true);
  };

  return {
    today,
    events,
    isLoading,
    isModalOpen,
    isReadOnly,
    selectedRendezVous,
    selectedSlot,
    otherAgentRdvList,
    myProspectRdvs,
    nextMyProspectRdv,
    handleSelectSlot,
    handleSelectEvent,
    handleCreateRendezVous,
    handleUpdateRendezVous,
    handleDeleteRendezVous,
    handleCloseModal,
    handleNewRendezVous,
  };
}
