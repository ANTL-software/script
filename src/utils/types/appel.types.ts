import type { Employe } from './user.types';

export type StatutAppel =
  | 'en_cours'
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
  duree_secondes?: number | null;
  statut_appel: StatutAppel;
  notes?: string | null;
  abouti: boolean;
  created_at: string;
  updated_at: string;
  Employe?: Employe;
}

export interface CreateAppelData {
  id_prospect: number;
  id_campagne: number;
  statut_appel?: StatutAppel;
  notes?: string;
  id_prospection?: number;
}

export interface TerminerAppelData {
  statut_appel: StatutAppel;
  notes?: string;
  abouti?: boolean;
  duree_secondes?: number;
  id_prospection?: number;
}

export interface UpdateAppelData {
  statut_appel?: StatutAppel;
  duree_secondes?: number;
  notes?: string;
  abouti?: boolean;
}
