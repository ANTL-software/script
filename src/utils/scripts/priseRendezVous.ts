import type {
  Campaign,
  CreateLeadData,
  LeadBookingWeekday,
  Prospect,
  RendezVousTimeOption,
} from '../types/index.ts';

export interface LeadB2BRendezVousPrefill {
  interlocuteurNom: string;
  interlocuteurRole: string;
  telephone: string;
  email: string;
}

export interface BuildLeadB2BRendezVousPayloadArgs {
  prospectId: number;
  campagneId: number;
  appelId?: number;
  dateRdv: string;
  timeValue: string;
  interlocuteurNom: string;
  interlocuteurRole: string;
  telephone: string;
  email: string;
  notes: string;
  entreprisePlusDeCinqSalaries: boolean;
}

export const LEAD_B2B_RENDEZ_VOUS_MOTIF = 'Prise de rendez-vous client';
export const MMA_EMPLOYEE_COUNT_QUALIFICATION_CAMPAIGN_ID = 10;
export const DEFAULT_LEAD_BOOKING_OPEN_WEEKDAYS: LeadBookingWeekday[] = [1, 2, 3, 4, 5, 6, 7];

export interface LeadBookingCalendarDay {
  isoDate: string;
  dayOfMonth: number;
  disabled: boolean;
}

export function supportsMmaEmployeeCountQualification(
  campaign: Pick<Campaign, 'id_campagne'> | null | undefined,
): boolean {
  return campaign?.id_campagne === MMA_EMPLOYEE_COUNT_QUALIFICATION_CAMPAIGN_ID;
}

export function hasFixedLeadBookingTimes(
  campaign: Pick<Campaign, 'bon_commande_config'> | null | undefined,
): boolean {
  return campaign?.bon_commande_config?.lead_booking?.allow_manual_time !== true;
}

export function getLeadBookingTimeSlots(
  campaign: Pick<Campaign, 'bon_commande_config'> | null | undefined,
  dateStr: string,
): RendezVousTimeOption[] {
  if (!isLeadB2BDateAllowed(dateStr, getLeadBookingOpenWeekdays(campaign))) return [];
  const times = campaign?.bon_commande_config?.lead_booking?.weekly_slots?.[getIsoWeekday(parseDateInput(dateStr))] ?? [];
  return [...times].sort().map((value) => ({ value, label: value }));
}

export function isLeadBookingTimeAllowed(
  campaign: Pick<Campaign, 'bon_commande_config'> | null | undefined,
  dateStr: string,
  time: string,
): boolean {
  if (!isLeadB2BDateAllowed(dateStr, getLeadBookingOpenWeekdays(campaign))) return false;
  if (!hasFixedLeadBookingTimes(campaign)) return true;
  return /^\d{1,2}:\d{2}(?::00)?$/.test(time)
    && getLeadBookingTimeSlots(campaign, dateStr)
      .some((slot) => slot.value === normalizeLeadB2BTimeSlot(time));
}

export function normalizeLeadB2BTimeSlot(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (hours > 23 || minutes > 59) return null;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function filterAvailableLeadB2BTimeSlots(
  slots: RendezVousTimeOption[],
  unavailableSlots: string[],
): RendezVousTimeOption[] {
  const unavailableSet = new Set(
    unavailableSlots
      .map((timeSlot) => normalizeLeadB2BTimeSlot(timeSlot))
      .filter((timeSlot): timeSlot is string => timeSlot !== null),
  );

  return slots.filter((slot) => !unavailableSet.has(slot.value));
}

export function isLeadB2BTimeSlotUnavailable(timeSlot: string, unavailableSlots: string[]): boolean {
  const normalizedTimeSlot = normalizeLeadB2BTimeSlot(timeSlot);
  if (!normalizedTimeSlot) return false;

  return unavailableSlots.some((unavailableSlot) => normalizeLeadB2BTimeSlot(unavailableSlot) === normalizedTimeSlot);
}

const trimToUndefined = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const parseDateInput = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map((part) => Number(part));
  return new Date(year, month - 1, day);
};

const formatDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function getLeadBookingOpenWeekdays(
  campaign: Pick<Campaign, 'bon_commande_config'> | null | undefined,
): LeadBookingWeekday[] {
  const booking = campaign?.bon_commande_config?.lead_booking;
  const configuredWeekdays = booking?.open_weekdays;
  if (booking?.weekly_slots != null) {
    return DEFAULT_LEAD_BOOKING_OPEN_WEEKDAYS.filter((day) =>
      (booking.weekly_slots?.[day]?.length ?? 0) > 0
      && (!configuredWeekdays?.length || configuredWeekdays.includes(day)));
  }
  if (!Array.isArray(configuredWeekdays) || configuredWeekdays.length === 0) {
    return DEFAULT_LEAD_BOOKING_OPEN_WEEKDAYS;
  }

  const normalizedWeekdays = Array.from(new Set(
    configuredWeekdays.filter(
      (weekday): weekday is LeadBookingWeekday => Number.isInteger(weekday) && weekday >= 1 && weekday <= 7,
    ),
  ));
  return normalizedWeekdays.length > 0 ? normalizedWeekdays : DEFAULT_LEAD_BOOKING_OPEN_WEEKDAYS;
}

function getIsoWeekday(date: Date): LeadBookingWeekday {
  const weekday = date.getDay();
  return (weekday === 0 ? 7 : weekday) as LeadBookingWeekday;
}

export function getTodayInputDateString(referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isLeadB2BDateAllowed(
  dateStr: string,
  openWeekdays: LeadBookingWeekday[] = DEFAULT_LEAD_BOOKING_OPEN_WEEKDAYS,
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = parseDateInput(dateStr);
  return formatDateInput(date) === dateStr && openWeekdays.includes(getIsoWeekday(date));
}

export function getLeadBookingCalendarDays(
  visibleMonth: Date,
  minimumDate: string,
  openWeekdays: LeadBookingWeekday[],
): Array<LeadBookingCalendarDay | null> {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const leadingEmptyDays = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays: Array<LeadBookingCalendarDay | null> = Array.from(
    { length: leadingEmptyDays },
    () => null,
  );

  for (let dayOfMonth = 1; dayOfMonth <= daysInMonth; dayOfMonth += 1) {
    const date = new Date(year, month, dayOfMonth);
    const isoDate = formatDateInput(date);
    calendarDays.push({
      isoDate,
      dayOfMonth,
      disabled: isoDate < minimumDate || !openWeekdays.includes(getIsoWeekday(date)),
    });
  }

  while (calendarDays.length % 7 !== 0) calendarDays.push(null);
  return calendarDays;
}

export function formatLeadB2BDateLabel(dateStr: string): string {
  const date = parseDateInput(dateStr);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getLeadB2BRendezVousPrefill(prospect: Prospect | null): LeadB2BRendezVousPrefill {
  if (!prospect) {
    return {
      interlocuteurNom: '',
      interlocuteurRole: '',
      telephone: '',
      email: '',
    };
  }

  return {
    interlocuteurNom: prospect.decisionnaire_nom?.trim()
      || prospect.nom_contact?.trim()
      || '',
    interlocuteurRole: prospect.decisionnaire_fonction?.trim() || '',
    telephone: prospect.telephone_contact?.trim()
      || prospect.telephone?.trim()
      || '',
    email: prospect.decisionnaire_email_pro?.trim()
      || prospect.email?.trim()
      || '',
  };
}

export function buildLeadB2BRendezVousPayload({
  prospectId,
  campagneId,
  appelId,
  dateRdv,
  timeValue,
  interlocuteurNom,
  interlocuteurRole,
  telephone,
  email,
  notes,
  entreprisePlusDeCinqSalaries,
}: BuildLeadB2BRendezVousPayloadArgs): CreateLeadData {
  return {
    id_prospect: prospectId,
    id_campagne: campagneId,
    ...(appelId ? { id_appel: appelId } : {}),
    date_rdv: dateRdv,
    heure_rdv: `${timeValue}:00`,
    motif: LEAD_B2B_RENDEZ_VOUS_MOTIF,
    interlocuteur_nom: interlocuteurNom.trim(),
    telephone_contact_snapshot: telephone.trim(),
    interlocuteur_role: trimToUndefined(interlocuteurRole),
    email_contact_snapshot: trimToUndefined(email),
    entreprise_plus_de_cinq_salaries: supportsMmaEmployeeCountQualification({ id_campagne: campagneId })
      && entreprisePlusDeCinqSalaries,
    notes: trimToUndefined(notes),
  };
}
