import './rendezVous.scss';
import { useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View, NavigateAction } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfDay, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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

const messages = {
  allDay: 'Journée',
  previous: 'Précédent',
  next: 'Suivant',
  today: "Aujourd'hui",
  month: 'Mois',
  week: 'Semaine',
  day: 'Jour',
  agenda: 'Agenda',
  date: 'Date',
  time: 'Heure',
  event: 'Événement',
  noEventsInRange: 'Aucun rendez-vous sur cette période.',
  showMore: (total: number) => `+ ${total} de plus`,
};

export default function RendezVous() {
  const today = startOfDay(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('week');

  const events = [
    {
      id: 1,
      title: 'Rappel - M. Dupont',
      start: new Date(),
      end: new Date(new Date().setHours(new Date().getHours() + 1)),
    },
  ];

  const handleNavigate = useCallback((newDate: Date, _view: View, action: NavigateAction) => {
    if (action === 'PREV' && isBefore(startOfDay(newDate), today)) {
      return;
    }
    setCurrentDate(newDate);
  }, [today]);

  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  return (
    <div className="rendez-vous">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ flex: 1, minHeight: 0 }}
        messages={messages}
        culture="fr"
        view={currentView}
        onView={handleViewChange}
        views={['month', 'week', 'day']}
        date={currentDate}
        onNavigate={handleNavigate}
        min={new Date(1970, 0, 1, 8, 30)}
        max={new Date(1970, 0, 1, 18, 30)}
      />
    </div>
  );
}
