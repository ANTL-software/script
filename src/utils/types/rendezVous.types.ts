export type RendezVousStatut = 'planifie' | 'effectue' | 'annule' | 'reporte';

export interface RendezVous {
  id_rendez_vous: number;
  id_agent: number;
  id_prospect: number;
  id_campagne: number;
  date_rdv: string;
  heure_rdv: string;
  motif: string | null;
  notes: string | null;
  statut: RendezVousStatut;
  created_at: string;
  updated_at: string;
  prospect?: {
    id_prospect: number;
    nom: string;
    prenom: string | null;
    telephone: string;
  };
}

export interface CreateRendezVousData {
  id_agent: number;
  id_prospect: number;
  id_campagne: number;
  date_rdv: string;
  heure_rdv: string;
  motif?: string;
  notes?: string;
}

export interface UpdateRendezVousData {
  date_rdv?: string;
  heure_rdv?: string;
  motif?: string;
  notes?: string;
  statut?: RendezVousStatut;
}

export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: RendezVous;
}
