import type { CampaignVariant } from '../scripts/campaignVariants.ts';

export type LeadClientStatut =
  | 'planifie'
  | 'effectue'
  | 'annule'
  | 'reporte'
  | 'non_honore';

export interface LeadClientAgent {
  id_employe: number;
  nom: string;
  prenom: string;
  email?: string | null;
}

export interface LeadClientProspect {
  id_prospect: number;
  nom: string;
  prenom?: string | null;
  nom_contact?: string | null;
  email?: string | null;
  telephone?: string | null;
  telephone_contact?: string | null;
  raison_sociale?: string | null;
  adresse_facturation?: string | null;
  code_postal?: string | null;
  ville?: string | null;
  pays?: string | null;
  decisionnaire_nom?: string | null;
  decisionnaire_fonction?: string | null;
  decisionnaire_email_pro?: string | null;
  statut?: string | null;
}

export interface LeadClientCampagne {
  id_campagne: number;
  nom_campagne: string;
  type_campagne?: CampaignVariant | null;
}

export interface LeadClientAppelSource {
  id_appel: number;
  statut_appel: string;
}

export interface LeadClient {
  id_lead: number;
  id_agent: number;
  id_prospect: number;
  id_campagne: number;
  id_appel?: number | null;
  date_rdv: string;
  heure_rdv: string;
  motif: string | null;
  interlocuteur_nom?: string | null;
  interlocuteur_role?: string | null;
  telephone_contact_snapshot?: string | null;
  email_contact_snapshot?: string | null;
  entreprise_plus_de_cinq_salaries: boolean;
  notes: string | null;
  derniere_note_closing?: string | null;
  statut: LeadClientStatut;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  prospect?: LeadClientProspect;
  agent?: LeadClientAgent;
  campagne?: LeadClientCampagne;
  appelsSource?: LeadClientAppelSource[];
}

export interface CreateLeadData {
  id_prospect: number;
  id_campagne: number;
  id_appel?: number;
  date_rdv: string;
  heure_rdv: string;
  motif?: string;
  notes?: string;
  interlocuteur_nom?: string;
  interlocuteur_role?: string;
  telephone_contact_snapshot?: string;
  email_contact_snapshot?: string;
  entreprise_plus_de_cinq_salaries: boolean;
}
