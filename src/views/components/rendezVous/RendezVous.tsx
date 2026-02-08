import './rendezVous.scss';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View, NavigateAction, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfDay, isBefore, addHours, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaPlus, FaCalendarAlt } from 'react-icons/fa';
import { useUser, useProspect, useCampaign, useToast } from '../../../hooks';
import { rendezVousService } from '../../../API/services';
import type { RendezVous as RendezVousType, CalendarEvent, CreateRendezVousData } from '../../../utils/types';
import { CALENDAR_MESSAGES, STATUT_RENDEZ_VOUS_COLORS } from '../../../utils/constants';
import { getErrorMessage, formatProspectName } from '../../../utils/scripts/formatters';
import Button from '../button/Button';
import Loader from '../loader/Loader';
import RendezVousModal from '../rendezVousModal/RendezVousModal';

const locales = {
  'fr': fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function RendezVous() {
  const { user } = useUser();
  const { currentProspect, fullName: prospectFullName } = useProspect();
  const { currentCampaign } = useCampaign();
  const { showToast } = useToast();

  const today = startOfDay(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('week');
  const [rendezVousList, setRendezVousList] = useState<RendezVousType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRendezVous, setSelectedRendezVous] = useState<RendezVousType | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

  const loadRendezVous = useCallback(async () => {
    if (!user?.id_employe) return;

    try {
      setIsLoading(true);
      const data = await rendezVousService.getRendezVousByAgent(user.id_employe);
      setRendezVousList(data);
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
    return rendezVousList.map(rdv => {
      const [hours, minutes] = rdv.heure_rdv.split(':').map(Number);
      const startDate = parseISO(rdv.date_rdv);
      startDate.setHours(hours, minutes, 0, 0);
      const endDate = addHours(startDate, 1);

      const prospectName = rdv.prospect
        ? formatProspectName(rdv.prospect)
        : 'Prospect';

      return {
        id: rdv.id_rendez_vous,
        title: `${prospectName}${rdv.motif ? ` - ${rdv.motif}` : ''}`,
        start: startDate,
        end: endDate,
        resource: rdv,
      };
    });
  }, [rendezVousList]);

  const handleNavigate = useCallback((newDate: Date, _view: View, action: NavigateAction) => {
    if (action === 'PREV' && isBefore(startOfDay(newDate), today)) {
      return;
    }
    setCurrentDate(newDate);
  }, [today]);

  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    if (isBefore(slotInfo.start, new Date())) {
      showToast('error', 'Impossible de creer un rendez-vous dans le passe');
      return;
    }

    if (!currentProspect) {
      showToast('error', 'Veuillez selectionner un prospect');
      return;
    }

    setSelectedSlot({ start: slotInfo.start, end: slotInfo.end });
    setSelectedRendezVous(null);
    setIsModalOpen(true);
  }, [currentProspect, showToast]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedRendezVous(event.resource);
    setSelectedSlot(null);
    setIsModalOpen(true);
  }, []);

  const handleCreateRendezVous = async (data: { date: Date; motif: string; notes: string }) => {
    if (!user?.id_employe || !currentProspect || !currentCampaign) {
      showToast('error', 'Donnees manquantes pour creer le rendez-vous');
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
      showToast('success', 'Rendez-vous cree avec succes');
      setIsModalOpen(false);
      loadRendezVous();
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Erreur lors de la creation'));
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
        statut: data.statut as 'planifie' | 'effectue' | 'annule' | 'reporte',
      });
      showToast('success', 'Rendez-vous mis a jour');
      setIsModalOpen(false);
      loadRendezVous();
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Erreur lors de la mise a jour'));
    }
  };

  const handleDeleteRendezVous = async () => {
    if (!selectedRendezVous) return;

    try {
      await rendezVousService.deleteRendezVous(selectedRendezVous.id_rendez_vous);
      showToast('success', 'Rendez-vous supprime');
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
  };

  const handleNewRendezVous = () => {
    if (!currentProspect) {
      showToast('error', 'Veuillez selectionner un prospect');
      return;
    }
    setSelectedSlot({ start: new Date(), end: addHours(new Date(), 1) });
    setSelectedRendezVous(null);
    setIsModalOpen(true);
  };

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const statut = event.resource.statut;
    const backgroundColor = STATUT_RENDEZ_VOUS_COLORS[statut] || STATUT_RENDEZ_VOUS_COLORS.planifie;

    return {
      style: {
        backgroundColor,
        borderRadius: '0.375rem',
        opacity: statut === 'annule' ? 0.6 : 1,
        border: 'none',
        color: 'white',
      },
    };
  }, []);

  if (isLoading) {
    return (
      <div className="rendez-vous rendez-vous--loading">
        <Loader size="medium" />
        <p>Chargement des rendez-vous...</p>
      </div>
    );
  }

  return (
    <div className="rendez-vous">
      <div className="rendez-vous__header">
        <div className="rendez-vous__title">
          <FaCalendarAlt className="rendez-vous__icon" />
          <h2>Mes Rendez-vous</h2>
        </div>
        <div className="rendez-vous__actions">
          <div className="rendez-vous__legend">
            <span className="rendez-vous__legend-item rendez-vous__legend-item--planifie">Planifie</span>
            <span className="rendez-vous__legend-item rendez-vous__legend-item--effectue">Effectue</span>
            <span className="rendez-vous__legend-item rendez-vous__legend-item--reporte">Reporte</span>
            <span className="rendez-vous__legend-item rendez-vous__legend-item--annule">Annule</span>
          </div>
          <Button variant="primary" size="small" onClick={handleNewRendezVous}>
            <FaPlus /> Nouveau
          </Button>
        </div>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ flex: 1, minHeight: 0 }}
        messages={CALENDAR_MESSAGES}
        culture="fr"
        view={currentView}
        onView={handleViewChange}
        views={['month', 'week', 'day']}
        date={currentDate}
        onNavigate={handleNavigate}
        min={new Date(1970, 0, 1, 8, 0)}
        max={new Date(1970, 0, 1, 19, 0)}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
      />

      <RendezVousModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        rendezVous={selectedRendezVous}
        initialDate={selectedSlot?.start}
        prospectName={prospectFullName || undefined}
        onCreate={handleCreateRendezVous}
        onUpdate={handleUpdateRendezVous}
        onDelete={handleDeleteRendezVous}
      />
    </div>
  );
}
