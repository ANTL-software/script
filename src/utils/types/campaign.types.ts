export interface Campaign {
  id_campagne: number;
  nom_campagne: string;
  description?: string;
  id_type_campagne: number;
  date_debut: string;
  date_fin?: string;
  budget?: number;
  objectif_ventes?: number;
  actif: boolean;
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
