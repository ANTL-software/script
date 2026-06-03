import './calendarModal.scss';
import { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View, NavigateAction } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfDay, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaTimes, FaCalendarAlt } from 'react-icons/fa';
import type { CalendarEvent } from '../../../utils/types';
import { CALENDAR_MESSAGES, STATUT_RENDEZ_VOUS_COLORS } from '../../../utils/constants';
import Loader from '../loader/Loader';
import CalendarTooltip from '../calendarTooltip/CalendarTooltip';
import { createPortal } from 'react-dom';

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
  onSelectEvent: (event: CalendarEvent) => void;
}

export default function CalendarModal({
  isOpen,
  onClose,
  today,
  events,
  isLoading,
  onSelectEvent,
}: CalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(today);
  const [currentView, setCurrentView] = useState<View>('month');
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; event: CalendarEvent | null }>({
    visible: false, x: 0, y: 0, event: null,
  });

  const handleNavigate = useCallback((newDate: Date, _view: View, action: NavigateAction) => {
    if (action === 'PREV' && isBefore(startOfDay(newDate), today)) return;
    setCurrentDate(newDate);
  }, [today]);

  const handleViewChange = useCallback((view: View) => setCurrentView(view), []);

  const CustomEventComponent = useMemo(() => {
    return function CustomEvent({ event }: { event: CalendarEvent }) {
      return (
        <div
          className="cal-event-content"
          onMouseEnter={(e) => setTooltip({ visible: true, x: e.clientX, y: e.clientY, event })}
          onMouseMove={(e) => setTooltip((prev) => ({ ...prev, x: e.clientX, y: e.clientY }))}
          onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
        >
          {event.title}
        </div>
      );
    };
  }, []);

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
          <span className="calendar-modal__legend-hint">Cliquez sur un rendez-vous pour ouvrir la fiche prospect</span>
        </div>

        {isLoading ? (
          <div className="calendar-modal__loading">
            <Loader size="medium" />
            <p>Chargement du calendrier...</p>
          </div>
        ) : (
          <div className="calendar-modal__calendar-wrapper">
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
              selectable={false}
              onSelectEvent={onSelectEvent}
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
    </div>
  );
}
