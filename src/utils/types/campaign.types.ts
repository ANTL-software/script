import type { CampaignVariant } from '../scripts/campaignVariants.ts';
import type { ModePaiement } from './vente.types.ts';

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
  logo_path?: string | null;
  logo_file_name?: string | null;
  created_at: string;
  updated_at: string;
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
