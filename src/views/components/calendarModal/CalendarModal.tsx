import './calendarModal.scss';
import { FaTimes, FaCalendarAlt } from 'react-icons/fa';
import AgentCalendar from '../agentCalendar/AgentCalendar';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CalendarModal({
  isOpen,
  onClose,
}: CalendarModalProps) {
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
          <span className="calendar-modal__legend-item calendar-modal__legend-item--commande">Commande à établir</span>
          <span className="calendar-modal__legend-item calendar-modal__legend-item--rendez-vous-pris">Rendez-vous pris</span>
          <span className="calendar-modal__legend-item calendar-modal__legend-item--relance">Relance</span>
          <span className="calendar-modal__legend-item calendar-modal__legend-item--planifie">Rendez-vous</span>
          <span className="calendar-modal__legend-hint">Cliquez sur un rendez-vous pour voir les détails</span>
        </div>

        <div className="calendar-modal__calendar-wrapper">
          <AgentCalendar />
        </div>
      </div>
    </div>
  );
}
