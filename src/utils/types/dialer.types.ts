export type StatutDialer =
  | 'disponible'
  | 'en_appel'
  | 'appel_sortant'
  | 'pause_apres_appel'
  | 'pause'
  | 'hors_ligne';

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
