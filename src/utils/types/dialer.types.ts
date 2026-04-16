export type StatutDialer =
  | 'disponible'
  | 'en_appel'
  | 'appel_sortant'
  | 'apres_appel'
  | 'pause'
  | 'hors_ligne';

export type RaisonPause =
  | 'dejeuner'
  | 'technique'
  | 'formation'
  | 'reunion'
  | 'personnel';

export interface StatutDialerPayload {
  statut: StatutDialer;
  raison_pause?: RaisonPause;
}

export interface StatutDialerResponse {
  statut: StatutDialer;
  raison_pause?: RaisonPause;
  debut_statut: string;
}

export interface SipCredentials {
  sip_uri: string;
  sip_password: string;
  ws_url: string;
  sip_domain: string;
}

// Prospect retourné par /agents/me/next-prospect
// Étend Prospect avec la campagne à utiliser pour l'appel
export interface ProspectAssigne {
  id_campagne_assignee: number | null;
  id_prospection?: number;
  nb_tentatives?: number;
}
