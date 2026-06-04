import './rendezVous.scss';
import { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View, NavigateAction } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfDay, isBefore, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaPlus, FaCalendarAlt, FaUser, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { useProspect } from '../../../hooks';
import { useRendezVous } from '../../../hooks/useRendezVous';
import type { CalendarEvent } from '../../../utils/types';
import { CALENDAR_MESSAGES, STATUT_RENDEZ_VOUS_COLORS } from '../../../utils/constants';
import { formatHeure } from '../../../utils/scripts/formatters';
import Button from '../button/Button';
import Loader from '../loader/Loader';
import RendezVousModal from '../rendezVousModal/RendezVousModal';
import CalendarTooltip from '../calendarTooltip/CalendarTooltip';
import ConfirmModal from '../confirmModal/ConfirmModal';
import { useToast } from '../../../hooks/useToast';

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
      className: 'event--other-agent',
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
      className: 'event--mine-prospect',
    };
  }

  return {
    style: {
      backgroundColor: color,
      borderRadius: '0.375rem',
      border: 'none',
      color: 'white',
      opacity: statut === 'annule' ? 0.35 : 0.65,
    },
    className: 'event--mine-other',
  };
}

export default function RendezVous() {
  const { fullName: prospectFullName, currentProspect } = useProspect();
  const { showToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState<{ fromDetails: boolean; event: CalendarEvent | null }>({ fromDetails: false, event: null });
  const {
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
  } = useRendezVous();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('week');
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; event: CalendarEvent | null }>({
    visible: false, x: 0, y: 0, event: null,
  });

  const handleNavigate = useCallback((newDate: Date, _view: View, action: NavigateAction) => {
    if (action === 'PREV' && isBefore(startOfDay(newDate), today)) return;
    setCurrentDate(newDate);
  }, [today]);

  const handleViewChange = useCallback((view: View) => setCurrentView(view), []);

  const handleQuickDelete = useCallback((event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete({ fromDetails: false, event });
  }, []);

  const handleDeleteFromDetails = useCallback(() => {
    if (!selectedRendezVous) return;
    // Créer un événement temporaire pour la confirmation
    const tempEvent: CalendarEvent = {
      id: selectedRendezVous.id_rendez_vous,
      title: `${prospectFullName} — ${selectedRendezVous.motif || 'Rendez-vous'}`,
      start: new Date(), // Pas important pour la confirmation
      end: new Date(),
      resource: selectedRendezVous,
      eventType: 'mine-prospect',
    };
    setConfirmDelete({ fromDetails: true, event: tempEvent });
  }, [selectedRendezVous, prospectFullName]);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete.event) return;
    try {
      await handleDeleteRendezVous();
      setConfirmDelete({ fromDetails: false, event: null });
    } catch (err) {
      showToast('error', 'Erreur lors de la suppression');
    }
  }, [confirmDelete, handleDeleteRendezVous, showToast]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDelete({ fromDetails: false, event: null });
    // Si la suppression venait de la modale de détails, ne pas la réouvrir
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
          <h2>Rendez-vous</h2>
        </div>
        <div className="rendez-vous__actions">
          <div className="rendez-vous__legend">
            <span className="rendez-vous__legend-group-label">Mon planning :</span>
            <span className="rendez-vous__legend-item rendez-vous__legend-item--planifie">Planifié</span>
            <span className="rendez-vous__legend-item rendez-vous__legend-item--effectue">Effectué</span>
            <span className="rendez-vous__legend-item rendez-vous__legend-item--reporte">Reporté</span>
            <span className="rendez-vous__legend-item rendez-vous__legend-item--annule">Annulé</span>
            <span className="rendez-vous__legend-sep" />
            <span className="rendez-vous__legend-item rendez-vous__legend-item--prospect">Ce prospect</span>
            <span className="rendez-vous__legend-item rendez-vous__legend-item--autre-agent">Autre agent</span>
          </div>
          <Button variant="primary" size="small" onClick={handleNewRendezVous}>
            <FaPlus /> Nouveau
          </Button>
        </div>
      </div>

      {currentProspect && myProspectRdvs.length > 0 && (
        <div className="rendez-vous__prospect-banner">
          <FaUser className="rendez-vous__prospect-banner-icon" />
          <span>
            <strong>{prospectFullName}</strong> —{' '}
            {myProspectRdvs.length} RDV{myProspectRdvs.length > 1 ? 's' : ''} existant{myProspectRdvs.length > 1 ? 's' : ''}
          </span>
          {nextMyProspectRdv && (
            <span className="rendez-vous__prospect-banner-next">
              · Prochain le{' '}
              {format(parseISO(nextMyProspectRdv.date_rdv), 'EEE d MMM', { locale: fr })}{' '}
              à {formatHeure(nextMyProspectRdv.heure_rdv)}
            </span>
          )}
        </div>
      )}

      {currentProspect && otherAgentRdvList.length > 0 && (
        <div className="rendez-vous__prospect-banner rendez-vous__prospect-banner--warning">
          <FaExclamationTriangle className="rendez-vous__prospect-banner-icon" />
          <span>
            {otherAgentRdvList.length} RDV{otherAgentRdvList.length > 1 ? 's' : ''} pris avec ce prospect par un autre agent
          </span>
        </div>
      )}

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
        step={15}
        timeslots={4}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        components={{ event: CustomEventComponent }}
      />

      {tooltip.visible && tooltip.event && createPortal(
        <CalendarTooltip event={tooltip.event} x={tooltip.x} y={tooltip.y} />,
        document.body
      )}

      <RendezVousModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        rendezVous={selectedRendezVous}
        initialDate={selectedSlot?.start}
        prospectName={prospectFullName || undefined}
        isReadOnly={isReadOnly}
        onCreate={handleCreateRendezVous}
        onUpdate={handleUpdateRendezVous}
        onRequestDelete={handleDeleteFromDetails}
        showToast={showToast}
      />

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
