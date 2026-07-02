import type { RendezVous } from '../types/index.ts';
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

const buildAgentLabel = (rendezVous: RendezVous): string => {
  const firstName = rendezVous.agent?.prenom?.trim();
  const lastName = rendezVous.agent?.nom?.trim();

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  return firstName || lastName || 'Agent inconnu';
};

const buildProspectFallbackName = (rendezVous: RendezVous): string => {
  if (!rendezVous.prospect) {
    return 'Prospect';
  }

  if (rendezVous.prospect.raison_sociale?.trim()) {
    return rendezVous.prospect.raison_sociale.trim();
  }

  return formatProspectName({
    nom: rendezVous.prospect.nom,
    prenom: rendezVous.prospect.prenom ?? undefined,
  });
};

export function mapRendezVousToHistoryCardModel(rendezVous: RendezVous): RendezVousHistoryCardModel {
  const interlocuteurNom = rendezVous.interlocuteur_nom?.trim()
    || rendezVous.prospect?.decisionnaire_nom?.trim()
    || rendezVous.prospect?.nom_contact?.trim()
    || buildProspectFallbackName(rendezVous);

  const interlocuteurRole = rendezVous.interlocuteur_role?.trim()
    || rendezVous.prospect?.decisionnaire_fonction?.trim()
    || null;
  const telephone = rendezVous.telephone_contact_snapshot?.trim()
    || rendezVous.prospect?.telephone_contact?.trim()
    || rendezVous.prospect?.telephone?.trim()
    || null;
  const email = rendezVous.email_contact_snapshot?.trim()
    || rendezVous.prospect?.decisionnaire_email_pro?.trim()
    || rendezVous.prospect?.email?.trim()
    || null;

  return {
    id: rendezVous.id_rendez_vous,
    date: rendezVous.date_rdv,
    heure: formatHeure(rendezVous.heure_rdv),
    statut: rendezVous.statut,
    statutLabel: STATUT_LABELS[rendezVous.statut] ?? rendezVous.statut,
    campagneLabel: rendezVous.campagne?.nom_campagne || 'Campagne inconnue',
    interlocuteurNom,
    interlocuteurRole,
    telephone,
    email,
    agentLabel: buildAgentLabel(rendezVous),
    motif: rendezVous.motif?.trim() || null,
    notesPlanification: rendezVous.notes?.trim() || null,
    closingNotes: rendezVous.derniere_note_closing?.trim() || null,
  };
}
