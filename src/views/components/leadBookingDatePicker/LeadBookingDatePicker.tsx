import { useMemo, useState } from 'react';
import { IoChevronBack, IoChevronForward, IoCalendarOutline } from 'react-icons/io5';

import {
  formatLeadB2BDateLabel,
  getLeadBookingCalendarDays,
} from '../../../utils/scripts/index.ts';
import type { LeadBookingWeekday } from '../../../utils/types/index.ts';
import './leadBookingDatePicker.scss';

interface LeadBookingDatePickerProps {
  id: string;
  value: string;
  minimumDate: string;
  openWeekdays: LeadBookingWeekday[];
  disabled: boolean;
  onChange: (value: string) => void;
}

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTH_LABELS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

function parseMonth(value: string): Date {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function LeadBookingDatePicker({
  id,
  value,
  minimumDate,
  openWeekdays,
  disabled,
  onChange,
}: LeadBookingDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPeriodPickerOpen, setIsPeriodPickerOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => parseMonth(value || minimumDate));
  const minimumMonth = parseMonth(minimumDate);
  const minimumYear = minimumMonth.getFullYear();
  const maximumYear = Math.max(minimumYear + 20, visibleMonth.getFullYear() + 5);
  const yearOptions = Array.from(
    { length: maximumYear - minimumYear + 1 },
    (_, index) => minimumYear + index,
  );
  const calendarDays = useMemo(
    () => getLeadBookingCalendarDays(visibleMonth, minimumDate, openWeekdays),
    [minimumDate, openWeekdays, visibleMonth],
  );
  const previousMonthDisabled = monthKey(visibleMonth) <= minimumDate.slice(0, 7);
  const monthLabel = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth);

  const moveMonth = (offset: number): void => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    setIsPeriodPickerOpen(false);
  };

  const toggleCalendar = (): void => {
    if (!isOpen) {
      setVisibleMonth(parseMonth(value || minimumDate));
      setIsPeriodPickerOpen(false);
    }
    setIsOpen(!isOpen);
  };

  const selectMonth = (month: number): void => {
    setVisibleMonth((current) => new Date(current.getFullYear(), month, 1));
    setIsPeriodPickerOpen(false);
  };

  const selectYear = (year: number): void => {
    setVisibleMonth((current) => {
      const month = year === minimumYear
        ? Math.max(current.getMonth(), minimumMonth.getMonth())
        : current.getMonth();
      return new Date(year, month, 1);
    });
    setIsPeriodPickerOpen(false);
  };

  return (
    <div className="lead-booking-date-picker">
      <button
        id={id}
        type="button"
        className="lead-booking-date-picker__trigger"
        onClick={toggleCalendar}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        data-value={value}
      >
        <span>{value ? formatLeadB2BDateLabel(value) : 'Choisir une date'}</span>
        <IoCalendarOutline aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="lead-booking-date-picker__calendar" role="dialog" aria-label="Choisir la date du rendez-vous">
          <div className="lead-booking-date-picker__navigation">
            <button type="button" onClick={() => moveMonth(-1)} disabled={previousMonthDisabled} aria-label="Mois précédent"><IoChevronBack /></button>
            <button
              type="button"
              className="lead-booking-date-picker__period-trigger"
              onClick={() => setIsPeriodPickerOpen((current) => !current)}
              aria-expanded={isPeriodPickerOpen}
              aria-label={`Changer le mois ou l’année, période affichée ${monthLabel}`}
            >
              {monthLabel}
            </button>
            <button type="button" onClick={() => moveMonth(1)} aria-label="Mois suivant"><IoChevronForward /></button>
          </div>
          {isPeriodPickerOpen ? (
            <div className="lead-booking-date-picker__period-picker">
              <label>
                <span>Mois</span>
                <select
                  size={6}
                  value={visibleMonth.getMonth()}
                  onChange={(event) => selectMonth(Number(event.target.value))}
                >
                  {MONTH_LABELS.map((label, month) => (
                    <option
                      key={label}
                      value={month}
                      disabled={visibleMonth.getFullYear() === minimumYear && month < minimumMonth.getMonth()}
                    >
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Année</span>
                <select
                  size={6}
                  value={visibleMonth.getFullYear()}
                  onChange={(event) => selectYear(Number(event.target.value))}
                >
                  {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>
            </div>
          ) : (
            <div className="lead-booking-date-picker__grid">
              {WEEKDAY_LABELS.map((label) => <span key={label} className="lead-booking-date-picker__weekday">{label}</span>)}
              {calendarDays.map((day, index) => day ? (
                <button
                  key={day.isoDate}
                  type="button"
                  className={day.isoDate === value ? 'lead-booking-date-picker__day lead-booking-date-picker__day--selected' : 'lead-booking-date-picker__day'}
                  disabled={day.disabled}
                  onClick={() => {
                    onChange(day.isoDate);
                    setIsOpen(false);
                  }}
                  aria-pressed={day.isoDate === value}
                >
                  {day.dayOfMonth}
                </button>
              ) : <span key={`empty-${index}`} />)}
            </div>
          )}
          <p>Seuls les jours ouverts pour cette campagne peuvent être sélectionnés.</p>
        </div>
      )}
    </div>
  );
}
