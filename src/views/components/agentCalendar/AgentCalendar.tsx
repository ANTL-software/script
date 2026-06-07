import './agentCalendar.scss';
import { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View, NavigateAction, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfDay, isBefore, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaTrash, FaUser, FaExclamationTriangle } from 'react-icons/fa';
import type { CalendarEvent } from '../../../utils/types';
import { CALENDAR_MESSAGES, STATUT_RENDEZ_VOUS_COLORS } from '../../../utils/constants';
import { rendezVousService } from '../../../API/services';
import type { UpdateRendezVousData, CreateRendezVousData } from '../../../utils/types/rendezVous.types';
import { getErrorMessage, formatHeure } from '../../../utils/scripts/formatters';
import Loader from '../loader/Loader';
import CalendarTooltip from '../calendarTooltip/CalendarTooltip';
import RendezVousDetailsModal from '../rendezVousDetailsModal/RendezVousDetailsModal';
import RendezVousModal from '../rendezVousModal/RendezVousModal';
import ConfirmModal from '../confirmModal/ConfirmModal';
import { createPortal } from 'react-dom';
import { useToast, useUser, useCampaign } from '../../../hooks';
import { useAgentCalendar } from '../../../hooks/useAgentCalendar';

const locales = { 'fr': fr };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

function eventStyleGetter(event: CalendarEvent) {
  const { statut } = event.resource;
  const { eventType } = event;

  if (eventType === 'other-agent-prospect') {
    return {
      style: {
        backgroundColor: '#d97706',
        borderRadius: '0.375rem',
        border: 'none',
        color: 'white',
        opacity: 0.9,
        fontStyle: 'italic',
      },
      className: 'event event--other-agent',
    };
  }

  const color = STATUT_RENDEZ_VOUS_COLORS[statut] ?? STATUT_RENDEZ_VOUS_COLORS.planifie;

  if (eventType === 'mine-prospect') {
    return {
      style: {
        backgroundColor: color,
        borderRadius: '0.375rem',
        border: 'none',
        boxShadow: `inset 0 0 0 2px white, 0 0 0 2px ${color}`,
        color: 'white',
        fontWeight: 600,
      },
      className: `event event--${statut} event--mine-prospect`,
    };
  }

  return {
    style: {
      backgroundColor: color,
      borderRadius: '0.375rem',
      border: 'none',
      color: 'white',
      opacity: statut === 'annule' ? 0.35 : 0.65,
      fontWeight: statut === 'planifie' ? 600 : 400,
    },
    className: `event event--${statut} event--mine-other`,
  };
}

interface AgentCalendarProps {
  prospectId?: number;
  prospectName?: string;
  isReadOnly?: boolean;
}

export default function AgentCalendar({
  prospectId = undefined,
  prospectName = undefined,
  isReadOnly = false,
}: AgentCalendarProps) {
  const { user } = useUser();
  const { currentCampaign } = useCampaign();
  const { showToast } = useToast();

  const {
    today,
    events,
    isLoading,
    myProspectRdvs,
    otherAgentRdvList,
    nextMyProspectRdv,
    loadRendezVous,
  } = useAgentCalendar(prospectId);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('week');
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; event: CalendarEvent | null }>({
    visible: false, x: 0, y: 0, event: null,
  });
  const [selectedRendezVous, setSelectedRendezVous] = useState<CalendarEvent['resource'] | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRdvModalOpen, setIsRdvModalOpen] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<{ event: CalendarEvent | null }>({ event: null });

  const handleNavigate = useCallback((newDate: Date, _view: View, action: NavigateAction) => {
    if (action === 'PREV' && isBefore(startOfDay(newDate), today)) return;
    setCurrentDate(newDate);
  }, [today]);

  const handleViewChange = useCallback((view: View) => setCurrentView(view), []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedRendezVous(event.resource);
    setIsDetailsModalOpen(true);
  }, []);

  const handleSelectSlot = useCallback(({ start, end }: SlotInfo) => {
    if (isReadOnly || !prospectId) return;
    // Ne pas permettre de prendre un rdv dans le passé
    if (isBefore(startOfDay(start), today)) {
      showToast('error', 'Impossible de prendre un rendez-vous dans le passé');
      return;
    }
    setSelectedSlot({ start, end });
    setSelectedRendezVous(null);
    setIsRdvModalOpen(true);
  }, [isReadOnly, prospectId, today, showToast]);

  const handleCloseDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedRendezVous(null);
  }, []);

  const handleEditRendezVous = useCallback(() => {
    setIsDetailsModalOpen(false);
    setIsRdvModalOpen(true);
  }, []);

  const handleCloseRdvModal = useCallback(() => {
    setIsRdvModalOpen(false);
    setSelectedSlot(null);
  }, []);

  const handleCreateRendezVous = useCallback(async (data: { date: Date; motif: string; notes: string }) => {
    if (!user?.id_employe || !prospectId) return;
    try {
      const createData: CreateRendezVousData = {
        id_agent: user.id_employe,
        id_prospect: prospectId,
        id_campagne: currentCampaign?.id_campagne ?? 7, // Fallback aux Cigales
        date_rdv: format(data.date, 'yyyy-MM-dd'),
        heure_rdv: format(data.date, 'HH:mm:ss'),
        motif: data.motif,
        notes: data.notes,
      };
      await rendezVousService.createRendezVous(createData);
      showToast('success', 'Rendez-vous planifié avec succès');
      setIsRdvModalOpen(false);
      setSelectedSlot(null);
      await loadRendezVous();
      setCalendarKey(prev => prev + 1);
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Erreur lors de la planification'));
    }
  }, [user?.id_employe, prospectId, currentCampaign, showToast, loadRendezVous]);

  const handleUpdateRendezVous = useCallback(async (data: { date: Date; motif: string; notes: string; statut: string }) => {
    if (!selectedRendezVous) return;
    try {
      const updateData: UpdateRendezVousData = {
        date_rdv: format(data.date, 'yyyy-MM-dd'),
        heure_rdv: format(data.date, 'HH:mm:ss'),
        motif: data.motif || undefined,
        notes: data.notes || undefined,
        statut: data.statut as any,
      };

      await rendezVousService.updateRendezVous(selectedRendezVous.id_rendez_vous, updateData);
      showToast('success', 'Rendez-vous modifié');
      setIsRdvModalOpen(false);
      setIsDetailsModalOpen(false);
      setSelectedRendezVous(null);
      await loadRendezVous();
      setCalendarKey(prev => prev + 1);
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Erreur lors de la modification'));
    }
  }, [selectedRendezVous, showToast, loadRendezVous]);

  const handleDeleteRendezVous = useCallback(async () => {
    if (!selectedRendezVous) return;
    try {
      await rendezVousService.deleteRendezVous(selectedRendezVous.id_rendez_vous);
      showToast('success', 'Rendez-vous supprimé');
      setIsDetailsModalOpen(false);
      setSelectedRendezVous(null);
      await loadRendezVous();
      setCalendarKey(prev => prev + 1);
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Erreur lors de la suppression'));
    }
  }, [selectedRendezVous, showToast, loadRendezVous]);

  const handleQuickDelete = useCallback((event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche l'ouverture du modal de détails
    setConfirmDelete({ event });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete.event) return;
    try {
      await rendezVousService.deleteRendezVous(confirmDelete.event.resource.id_rendez_vous);
      showToast('success', 'Rendez-vous supprimé');
      setConfirmDelete({ event: null });
      await loadRendezVous();
      setCalendarKey(prev => prev + 1);
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Erreur lors de la suppression'));
    }
  }, [confirmDelete, showToast, loadRendezVous]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDelete({ event: null });
  }, []);

  const CustomEventComponent = useMemo(() => {
    return function CustomEvent({ event }: { event: CalendarEvent }) {
      return (
        <div className="cal-event-wrapper">
          <div
            className="cal-event-content"
            onMouseEnter={(e) => setTooltip({ visible: true, x: e.clientX, y: e.clientY, event })}
            onMouseMove={(e) => setTooltip((prev) => ({ ...prev, x: e.clientX, y: e.clientY }))}
            onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
          >
            {event.title}
          </div>
          <button
            className="cal-event-delete-btn"
            onClick={(e) => handleQuickDelete(event, e)}
            title="Supprimer ce rendez-vous"
          >
            <FaTrash />
          </button>
        </div>
      );
    };
  }, [handleQuickDelete]);

  if (isLoading) {
    return (
      <div className="agent-calendar__loading">
        <Loader size="medium" />
        <p>Chargement du calendrier...</p>
      </div>
    );
  }

  return (
    <div className="agent-calendar">
      {/* Bannières d'information spécifique au prospect */}
      {prospectId && myProspectRdvs.length > 0 && (
        <div className="agent-calendar__prospect-banner">
          <FaUser className="agent-calendar__prospect-banner-icon" />
          <span>
            <strong>{prospectName || 'Prospect'}</strong> —{' '}
            {myProspectRdvs.length} RDV{myProspectRdvs.length > 1 ? 's' : ''} existant{myProspectRdvs.length > 1 ? 's' : ''}
          </span>
          {nextMyProspectRdv && (
            <span className="agent-calendar__prospect-banner-next">
              · Prochain le{' '}
              {format(parseISO(nextMyProspectRdv.date_rdv), 'EEE d MMM', { locale: fr })}{' '}
              à {formatHeure(nextMyProspectRdv.heure_rdv)}
            </span>
          )}
        </div>
      )}

      {prospectId && otherAgentRdvList.length > 0 && (
        <div className="agent-calendar__prospect-banner agent-calendar__prospect-banner--warning">
          <FaExclamationTriangle className="agent-calendar__prospect-banner-icon" />
          <span>
            {otherAgentRdvList.length} RDV{otherAgentRdvList.length > 1 ? 's' : ''} pris avec ce prospect par un autre agent
          </span>
        </div>
      )}

      <div className="agent-calendar__calendar-wrapper">
        <Calendar
          key={calendarKey}
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
          step={15}
          timeslots={4}
          selectable={!isReadOnly && !!prospectId}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          components={{ event: CustomEventComponent }}
        />
      </div>

      {tooltip.visible && tooltip.event && createPortal(
        <CalendarTooltip event={tooltip.event} x={tooltip.x} y={tooltip.y} />,
        document.body
      )}

      <RendezVousDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        rendezVous={selectedRendezVous}
        onEdit={handleEditRendezVous}
        onDelete={handleDeleteRendezVous}
        showMonterFiche={!prospectId}
      />

      {isRdvModalOpen && (
        <RendezVousModal
          isOpen={isRdvModalOpen}
          onClose={handleCloseRdvModal}
          rendezVous={selectedRendezVous}
          initialDate={selectedSlot?.start}
          prospectName={prospectName || undefined}
          isReadOnly={isReadOnly}
          onCreate={handleCreateRendezVous}
          onUpdate={handleUpdateRendezVous}
          onRequestDelete={() => {
            if (selectedRendezVous) {
              const tempEvent: CalendarEvent = {
                id: selectedRendezVous.id_rendez_vous,
                title: `${prospectName || 'Prospect'} — ${selectedRendezVous.motif || 'Rendez-vous'}`,
                start: new Date(),
                end: new Date(),
                resource: selectedRendezVous,
                eventType: 'mine-prospect',
              };
              setConfirmDelete({ event: tempEvent });
              setIsRdvModalOpen(false);
            }
          }}
        />
      )}

      {confirmDelete.event && (
        <ConfirmModal
          isOpen={!!confirmDelete.event}
          title="Supprimer le rendez-vous"
          message={`Êtes-vous sûr de vouloir supprimer le rendez-vous « ${confirmDelete.event.title} » ?`}
          type="danger"
          confirmText="Supprimer"
          cancelText="Annuler"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}
