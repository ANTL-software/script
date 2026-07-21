export type RendezVousStatut = 'planifie' | 'effectue' | 'annule' | 'reporte' | 'non_honore';

export interface RendezVous {
  id_rendez_vous: number;
  id_agent: number;
  id_prospect: number;
  id_campagne: number;
  date_rdv: string;
  heure_rdv: string;
  motif: string | null;
  interlocuteur_nom?: string | null;
  interlocuteur_role?: string | null;
  telephone_contact_snapshot?: string | null;
  email_contact_snapshot?: string | null;
  notes: string | null;
  derniere_note_closing?: string | null;
  statut: RendezVousStatut;
  created_at: string;
  updated_at: string;
  prospect?: {
    id_prospect: number;
    nom: string;
    prenom: string | null;
    nom_contact?: string | null;
    email?: string | null;
    telephone: string;
    telephone_contact?: string | null;
    raison_sociale?: string | null;
    decisionnaire_nom?: string | null;
    decisionnaire_fonction?: string | null;
    decisionnaire_email_pro?: string | null;
    relation_commerciale_campagne?: import('./prospect.types.ts').ProspectRelationCommercialeCampagne;
    statut?: string;
  };
  agent?: {
    id_employe: number;
    nom: string;
    prenom: string | null;
    email?: string | null;
  };
  campagne?: {
    id_campagne: number;
    nom_campagne: string;
    type_campagne?: string | null;
  };
  appelsSource?: Array<{
    id_appel: number;
    statut_appel: string;
  }>;
}

export interface CreateRendezVousData {
  id_agent?: number;
  id_prospect: number;
  id_campagne: number;
  date_rdv: string;
  heure_rdv: string;
  motif?: string;
  notes?: string;
  interlocuteur_nom?: string;
  interlocuteur_role?: string;
  telephone_contact_snapshot?: string;
  email_contact_snapshot?: string;
}

export interface UpdateRendezVousData {
  date_rdv?: string;
  heure_rdv?: string;
  motif?: string;
  notes?: string;
  statut?: RendezVousStatut;
}

export type CalendarEventType = 'mine-other' | 'mine-prospect' | 'other-agent-prospect';

export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: RendezVous;
  eventType: CalendarEventType;
}

export interface RendezVousTimeOption {
  value: string;
  label: string;
}

export interface RendezVousRecapData {
  prospectLabel: string;
  campaignLabel: string;
  dateLabel: string;
  heure: string;
  interlocuteurNom: string;
  interlocuteurRole: string;
  telephone: string;
  email: string;
  notes: string;
}
