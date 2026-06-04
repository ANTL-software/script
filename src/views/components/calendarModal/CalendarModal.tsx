import './calendarModal.scss';
import { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View, NavigateAction } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfDay, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaTimes, FaCalendarAlt, FaTrash } from 'react-icons/fa';
import type { CalendarEvent } from '../../../utils/types';
import { CALENDAR_MESSAGES, STATUT_RENDEZ_VOUS_COLORS } from '../../../utils/constants';
import { rendezVousService } from '../../../API/services';
import type { UpdateRendezVousData } from '../../../utils/types/rendezVous.types';
import { getErrorMessage, formatProspectName } from '../../../utils/scripts/formatters';
import Loader from '../loader/Loader';
import CalendarTooltip from '../calendarTooltip/CalendarTooltip';
import RendezVousDetailsModal from '../rendezVousDetailsModal/RendezVousDetailsModal';
import RendezVousModal from '../rendezVousModal/RendezVousModal';
import ConfirmModal from '../confirmModal/ConfirmModal';
import { createPortal } from 'react-dom';
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

  const color = STATUT_RENDEZ_VOUS_COLORS[statut] ?? STATUT_RENDEZ_VOUS_COLORS.planifie;

  return {
    style: {
      backgroundColor: color,
      borderRadius: '0.375rem',
      border: 'none',
      color: 'white',
      opacity: statut === 'annule' ? 0.35 : 0.8,
      fontWeight: statut === 'planifie' ? 600 : 400,
    },
    className: `event event--${statut}`,
  };
}

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  today: Date;
  events: CalendarEvent[];
  isLoading: boolean;
  loadRendezVous: () => Promise<void>;
}

export default function CalendarModal({
  isOpen,
  onClose,
  today,
  events,
  isLoading,
  loadRendezVous,
}: CalendarModalProps) {
  const { showToast } = useToast();
  const [currentDate, setCurrentDate] = useState(today);
  const [currentView, setCurrentView] = useState<View>('month');
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; event: CalendarEvent | null }>({
    visible: false, x: 0, y: 0, event: null,
  });
  const [selectedRendezVous, setSelectedRendezVous] = useState<CalendarEvent['resource'] | null>(null);
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

  const handleCloseDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedRendezVous(null);
  }, []);

  const handleEditRendezVous = useCallback(() => {
    setIsDetailsModalOpen(false);
    setIsRdvModalOpen(true);
  }, []);

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

  const handleUpdateRendezVous = useCallback(async (data: { date: Date; motif: string; notes: string; statut: string }) => {
    if (!selectedRendezVous) return;
    try {
      // Convertir les données au format attendu par le service
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
      // Force le rechargement du calendrier
      await loadRendezVous();
      setCalendarKey(prev => prev + 1);
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Erreur lors de la modification'));
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

  if (!isOpen) return null;

  return (
    <div className="calendar-modal-overlay" onClick={onClose}>
      <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="calendar-modal__header">
          <div className="calendar-modal__title">
            <FaCalendarAlt className="calendar-modal__icon" />
            <h2>Mon calendrier</h2>
          </div>
          <button className="calendar-modal__close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="calendar-modal__legend">
          <span className="calendar-modal__legend-item calendar-modal__legend-item--planifie">Planifié</span>
          <span className="calendar-modal__legend-item calendar-modal__legend-item--effectue">Effectué</span>
          <span className="calendar-modal__legend-item calendar-modal__legend-item--reporte">Reporté</span>
          <span className="calendar-modal__legend-item calendar-modal__legend-item--annule">Annulé</span>
          <span className="calendar-modal__legend-hint">Cliquez sur un rendez-vous pour voir les détails</span>
        </div>

        {isLoading ? (
          <div className="calendar-modal__loading">
            <Loader size="medium" />
            <p>Chargement du calendrier...</p>
          </div>
        ) : (
          <div className="calendar-modal__calendar-wrapper">
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
              selectable={false}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              components={{ event: CustomEventComponent }}
            />
          </div>
        )}
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
      />

      {selectedRendezVous && (
        <RendezVousModal
          isOpen={isRdvModalOpen}
          onClose={() => setIsRdvModalOpen(false)}
          rendezVous={selectedRendezVous}
          onCreate={async () => {}}
          onUpdate={handleUpdateRendezVous}
          onDelete={handleDeleteRendezVous}
          onRequestDelete={() => {
            // Créer un événement temporaire pour la confirmation
            const tempEvent: CalendarEvent = {
              id: selectedRendezVous.id_rendez_vous,
              title: `${selectedRendezVous.prospect ? formatProspectName(selectedRendezVous.prospect) : 'Prospect'} — ${selectedRendezVous.motif || 'Rendez-vous'}`,
              start: new Date(),
              end: new Date(),
              resource: selectedRendezVous,
              eventType: 'mine-other',
            };
            setConfirmDelete({ event: tempEvent });
            setIsRdvModalOpen(false);
          }}
        />
      )}

      {confirmDelete.event && (
        <ConfirmModal
          isOpen={!!confirmDelete.event}
          title="Supprimer le rendez-vous"
          message={`Êtes-vous sûr de vouloir supprimer le rendez-vous « ${confirmDelete.event.title }» ?`}
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
