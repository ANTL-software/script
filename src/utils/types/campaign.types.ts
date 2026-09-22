import type { CampaignVariant } from '../scripts/campaignVariants.ts';
import type { ModePaiement } from './vente.types.ts';

export type LeadBookingWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface LeadBookingConfig {
  open_weekdays: LeadBookingWeekday[];
}

export interface CampaignConfiguration {
  lead_booking?: LeadBookingConfig | null;
}

export interface Campaign {
  id_campagne: number;
  nom_campagne: string;
  description?: string;
  type_campagne?: CampaignVariant | null;
  id_type_campagne?: number;
  date_debut: string;
  date_fin?: string;
  budget?: number;
  objectif_ventes?: number;
  actif?: boolean;
  statut?: 'inactive' | 'active' | 'terminee';
  autoriser_mobile?: boolean;
  modes_paiement?: ModePaiement[];
  bon_commande_config?: CampaignConfiguration | null;
  logo_path?: string | null;
  logo_file_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadExternalBookingConfig {
  provider: 'google_appointment_schedule';
  bookingUrl: string;
  embedUrl: string;
  ownerLabel: string;
}

export interface GoogleBookingCopyField {
  key: 'contact_name' | 'email' | 'phone' | 'siret' | 'company';
  label: string;
  value: string;
}

export interface TypeCampagne {
  id_type_campagne: number;
  libelle: string;
  description?: string;
}

export interface AgentCampagne {
  id_agent_campagne: number;
  id_agent: number;
  id_campagne: number;
  date_affectation: string;
  actif: boolean;
}
