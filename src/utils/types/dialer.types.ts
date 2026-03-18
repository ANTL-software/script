export type StatutDialer =
  | 'disponible'
  | 'en_appel'
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
  depuis: string;
}

export interface SipCredentials {
  sip_uri: string;
  sip_password: string;
  ws_url: string;
  sip_domain: string;
}
