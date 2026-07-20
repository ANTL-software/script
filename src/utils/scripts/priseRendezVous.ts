import type { CreateLeadData, Prospect, RendezVousTimeOption } from '../types/index.ts';

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
}

export const LEAD_B2B_RENDEZ_VOUS_MOTIF = 'Prise de rendez-vous client';

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
  if (!dateStr) {
    return false;
  }

  const date = parseDateInput(dateStr);
  const day = date.getDay();
  return day === 2 || day === 4;
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
    notes: trimToUndefined(notes),
  };
}
