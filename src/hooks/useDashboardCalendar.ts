import { useState, useCallback, useEffect, useMemo } from 'react';
import { startOfDay } from 'date-fns';
import { useUser, useToast, useDialer } from './index';
import { rendezVousService } from '../API/services';
import type { RendezVous, CalendarEvent } from '../utils/types';
import { getErrorMessage } from '../utils/scripts/formatters';
import { toCalendarEvent } from './useRendezVous';

export function useDashboardCalendar() {
  const { user } = useUser();
  const { showToast } = useToast();
  const { openProspectManual } = useDialer();

  const today = startOfDay(new Date());

  const [agentRdvList, setAgentRdvList] = useState<RendezVous[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentDateView] = useState<'month' | 'week' | 'day'>('month');

  const loadRendezVous = useCallback(async () => {
    if (!user?.id_employe) return;
    const agentId = user.id_employe;

    try {
      setIsLoading(true);
      const agentData = await rendezVousService.getRendezVousByAgent(agentId);
      setAgentRdvList(agentData);
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Erreur lors du chargement des rendez-vous'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id_employe, showToast]);

  useEffect(() => {
    loadRendezVous();
  }, [loadRendezVous]);

  const events: CalendarEvent[] = useMemo(() => {
    return agentRdvList
      .filter(rdv => rdv.statut !== 'annule')  // Exclure les RDV annulés
      .map(rdv => {
        // Tous les événements sont "mine-other" car on est pas sur une fiche prospect
        return toCalendarEvent(rdv, 'mine-other');
      });
  }, [agentRdvList]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    const rdv = event.resource;
    if (rdv.prospect) {
      openProspectManual(rdv.prospect.id_prospect, 'rappel', rdv.prospect.telephone);
    }
  }, [openProspectManual]);

  return {
    today,
    events,
    isLoading,
    currentDate,
    currentView,
    setCurrentDate,
    setCurrentDateView,
    handleSelectEvent,
    loadRendezVous,
  };
}
