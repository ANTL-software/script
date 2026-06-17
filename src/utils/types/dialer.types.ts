export type StatutDialer =
  | 'disponible'
  | 'en_appel'
  | 'qualification_en_cours'
  | 'svi_a_naviguer'
  | 'appel_sortant'
  | 'pause_apres_appel'
  | 'pause'
  | 'hors_ligne';

export type AnsweredBy =
  | 'human'
  | 'machine_start'
  | 'machine_end_beep'
  | 'machine_end_silence'
  | 'machine_end_other'
  | 'fax'
  | 'unknown';

export type CallClassification =
  | 'qualification_en_cours'
  | 'humain_detecte'
  | 'svi_detecte'
  | 'messagerie_detectee'
  | 'fax_detecte'
  | 'unknown_a_traiter';

export type RaisonPause =
  | 'technique'
  | 'repas'
  | 'personnelle'
  | 'legale'
  | 'brief';

export interface StatutDialerPayload {
  statut: StatutDialer;
  raison_pause?: RaisonPause;
}

export interface StatutDialerResponse {
  statut: StatutDialer;
  raison_pause?: RaisonPause;
  debut_statut: string;
}

// Prospect retourné par /agents/me/next-prospect
// Étend Prospect avec la campagne à utiliser pour l'appel
export interface ProspectAssigne {
  id_campagne_assignee: number | null;
  id_prospection?: number;
  nb_tentatives?: number;
  autoriser_mobile?: boolean;
  distribution_mode?: 'auto' | 'rappel';
  id_rendez_vous_source?: number | null;
}

export interface ActiveCallInsights {
  answeredBy: AnsweredBy | null;
  classification: CallClassification | null;
  amdStatus: string | null;
  sviDetecte: boolean;
  bridgedToAgentAt: string | null;
  endedBySystem: boolean;
  endReason: string | null;
}
