import type { CommercialFollowupType } from './prospect.types.ts';
import type { Employe } from './user.types.ts';
import type { AnsweredBy, CallClassification } from './dialer.types.ts';

export type StatutAppel =
  | 'en_cours'
  | 'abouti'
  | 'non_abouti'
  | 'rendez_vous_pris'
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
  | 'optout'
  | 'repondeur'
  | 'relance'
  | 'amd_repondeur_auto'
  | 'amd_fax_auto'
  | 'amd_machine_start_auto';

export type OrigineAppel = 'auto' | 'manuel' | 'rappel';
export type TelephonyCallState = 'ringing' | 'answered' | 'ended' | 'failed';

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
  telephony_provider?: 'twilio' | 'asterisk';
  provider_call_id?: string | null;
  asterisk_outbound_ticket?: string;
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
  progpa_atteint: number | null;
  type_suivi_commercial?: CommercialFollowupType | null;
  id_vente_suivie?: number | null;
  id_lead_suivi?: number | null;
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
  telephony_provider?: 'twilio' | 'asterisk';
  numero_telephone?: string;
  id_rendez_vous_source?: number;
  progpa_atteint?: number;
}

export interface TerminerAppelData {
  statut_appel: StatutAppel;
  notes?: string;
  abouti?: boolean;
  duree_secondes?: number;
  id_prospection?: number;
  progpa_atteint?: number;
}

export interface UpdateAppelData {
  statut_appel?: StatutAppel;
  duree_secondes?: number;
  notes?: string;
  abouti?: boolean;
  progpa_atteint?: number;
}

export interface UpdateTelephonyStateData {
  state: TelephonyCallState;
  provider_call_id: string;
  reason?: string;
}
