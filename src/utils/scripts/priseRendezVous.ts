import type {
  Campaign,
  CreateLeadData,
  GoogleBookingCopyField,
  LeadExternalBookingConfig,
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

const CAILLIBOTTE_ZOE_NOE_BOOKING_CONFIG: LeadExternalBookingConfig = {
  provider: 'google_appointment_schedule',
  bookingUrl: 'https://calendar.google.com/appointments/schedules/AcZssZ2g-7ShOEU4D0P8UTqNcVfqSVFEWngmxEwoJ4ixGGETJRm75H3Jda2KR5cd0O56KSBzT7vWc8Jo',
  embedUrl: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ2g-7ShOEU4D0P8UTqNcVfqSVFEWngmxEwoJ4ixGGETJRm75H3Jda2KR5cd0O56KSBzT7vWc8Jo?gv=true',
  ownerLabel: 'Zoé-Noé Caillibotte',
};

const normalizeCampaignName = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export function getLeadExternalBookingConfig(
  campaign: Pick<Campaign, 'nom_campagne'> | null | undefined,
): LeadExternalBookingConfig | null {
  const normalizedName = normalizeCampaignName(campaign?.nom_campagne ?? '');
  const isCaillibotte = /\bcaillibot{1,2}e\b/.test(normalizedName);
  const isZoeNoe = /\bzoe\b/.test(normalizedName) && /\bnoe\b/.test(normalizedName);

  return isCaillibotte && isZoeNoe ? CAILLIBOTTE_ZOE_NOE_BOOKING_CONFIG : null;
}

export function buildGoogleBookingCopyFields({
  prospect,
  interlocuteurNom,
  telephone,
  email,
}: {
  prospect: Prospect | null;
  interlocuteurNom: string;
  telephone: string;
  email: string;
}): GoogleBookingCopyField[] {
  return [
    { key: 'contact_name', label: 'Prénom / nom', value: interlocuteurNom.trim() },
    { key: 'email', label: 'Adresse email', value: email.trim() },
    { key: 'phone', label: 'Téléphone', value: telephone.trim() },
    { key: 'siret', label: 'SIRET', value: prospect?.siret?.trim() ?? '' },
    { key: 'company', label: 'Nom de la société', value: prospect?.raison_sociale?.trim() ?? '' },
  ];
}

export function supportsMmaEmployeeCountQualification(
  campaign: Pick<Campaign, 'id_campagne'> | null | undefined,
): boolean {
  return campaign?.id_campagne === MMA_EMPLOYEE_COUNT_QUALIFICATION_CAMPAIGN_ID;
}

const LEAD_B2B_TIME_CONFIG = {
  morning: { start: '08:00', end: '12:00' },
  afternoon: { start: '14:00', end: '17:00' },
  intervalMinutes: 15,
};

function parseTimeInMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTimeFromMinutes(minutesTotal: number): string {
  const hours = Math.floor(minutesTotal / 60);
  const minutes = minutesTotal % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function getLeadB2BTimeSlots(): RendezVousTimeOption[] {
  const slots: RendezVousTimeOption[] = [];
  const addRange = (start: string, end: string): void => {
    let current = parseTimeInMinutes(start);
    const endInMinutes = parseTimeInMinutes(end);

    while (current <= endInMinutes) {
      const value = formatTimeFromMinutes(current);
      slots.push({ value, label: value });
      current += LEAD_B2B_TIME_CONFIG.intervalMinutes;
    }
  };

  addRange(LEAD_B2B_TIME_CONFIG.morning.start, LEAD_B2B_TIME_CONFIG.morning.end);
  addRange(LEAD_B2B_TIME_CONFIG.afternoon.start, LEAD_B2B_TIME_CONFIG.afternoon.end);
  return slots;
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

export function getTodayInputDateString(referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isLeadB2BDateAllowed(dateStr: string): boolean {
  return dateStr.trim().length > 0;
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
