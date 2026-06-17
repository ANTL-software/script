import type { Employe } from './user.types';
import type { AnsweredBy, CallClassification } from './dialer.types';

export type StatutAppel =
  | 'en_cours'
  | 'abouti'
  | 'non_abouti'
  | 'messagerie'
  | 'rdv_pris'
  | 'vente_conclue'
  | 'refus_definitif'
  | 'siege'
  | 'faillite'
  | 'pas_attribue'
  | 'particulier'
  | 'pas_disponible'
  | 'fax'
  | 'doublon'
  | 'optout';

export type OrigineAppel = 'auto' | 'manuel' | 'rappel';

export interface Appel {
  id_appel: number;
  id_prospect: number;
  id_agent: number;
  id_campagne: number;
  id_rendez_vous_source?: number | null;
  date_appel: string;
  duree_secondes?: number | null;
  statut_appel: StatutAppel;
  notes?: string | null;
  abouti: boolean;
  answered_by?: AnsweredBy | null;
  amd_mode?: string | null;
  amd_status?: string | null;
  amd_completed_at?: string | null;
  amd_latency_ms?: number | null;
  call_classification?: CallClassification | null;
  svi_detecte?: boolean;
  bridged_to_agent_at?: string | null;
  ended_by_system?: boolean;
  end_reason?: string | null;
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
  origine_appel?: OrigineAppel;
  numero_telephone?: string;
  id_rendez_vous_source?: number;
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
