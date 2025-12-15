export type StatutAppel =
  | 'abouti'
  | 'non_abouti'
  | 'occupe'
  | 'pas_de_reponse'
  | 'messagerie'
  | 'rdv_pris'
  | 'vente_conclue'
  | 'refus_definitif';

export interface Appel {
  id_appel: number;
  id_prospect: number;
  id_agent: number;
  id_campagne: number;
  date_appel: string;
  duree_secondes?: number;
  statut: StatutAppel;
  notes?: string;
  abouti: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAppelData {
  id_prospect: number;
  id_campagne: number;
  statut?: StatutAppel;
  notes?: string;
}

export interface UpdateAppelData {
  statut?: StatutAppel;
  duree_secondes?: number;
  notes?: string;
  abouti?: boolean;
}
