import type { LeadClient } from '../types/index.ts';
import { formatProspectName, formatHeure } from './formatters.ts';

export interface RendezVousHistoryCardModel {
  id: number;
  date: string;
  heure: string;
  statut: string;
  statutLabel: string;
  campagneLabel: string;
  interlocuteurNom: string;
  interlocuteurRole: string | null;
  telephone: string | null;
  email: string | null;
  agentLabel: string;
  motif: string | null;
  notesPlanification: string | null;
  closingNotes: string | null;
}

const STATUT_LABELS: Record<string, string> = {
  planifie: 'Planifie',
  effectue: 'Effectue',
  reporte: 'Reporte',
  annule: 'Annule',
  non_honore: 'Non honore',
};

const buildAgentLabel = (lead: LeadClient): string => {
  const firstName = lead.agent?.prenom?.trim();
  const lastName = lead.agent?.nom?.trim();

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  return firstName || lastName || 'Agent inconnu';
};

const buildProspectFallbackName = (lead: LeadClient): string => {
  if (!lead.prospect) {
    return 'Prospect';
  }

  if (lead.prospect.raison_sociale?.trim()) {
    return lead.prospect.raison_sociale.trim();
  }

  return formatProspectName({
    nom: lead.prospect.nom,
    prenom: lead.prospect.prenom ?? undefined,
  });
};

export function mapRendezVousToHistoryCardModel(lead: LeadClient): RendezVousHistoryCardModel {
  const interlocuteurNom = lead.interlocuteur_nom?.trim()
    || lead.prospect?.decisionnaire_nom?.trim()
    || lead.prospect?.nom_contact?.trim()
    || buildProspectFallbackName(lead);

  const interlocuteurRole = lead.interlocuteur_role?.trim()
    || lead.prospect?.decisionnaire_fonction?.trim()
    || null;
  const telephone = lead.telephone_contact_snapshot?.trim()
    || lead.prospect?.telephone_contact?.trim()
    || lead.prospect?.telephone?.trim()
    || null;
  const email = lead.email_contact_snapshot?.trim()
    || lead.prospect?.decisionnaire_email_pro?.trim()
    || lead.prospect?.email?.trim()
    || null;

  return {
    id: lead.id_lead,
    date: lead.date_rdv,
    heure: formatHeure(lead.heure_rdv),
    statut: lead.statut,
    statutLabel: STATUT_LABELS[lead.statut] ?? lead.statut,
    campagneLabel: lead.campagne?.nom_campagne || 'Campagne inconnue',
    interlocuteurNom,
    interlocuteurRole,
    telephone,
    email,
    agentLabel: buildAgentLabel(lead),
    motif: lead.motif?.trim() || null,
    notesPlanification: lead.notes?.trim() || null,
    closingNotes: lead.derniere_note_closing?.trim() || null,
  };
}
