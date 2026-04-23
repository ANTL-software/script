import { apiCalls } from '../APICalls';
import { throwIfApiError } from '../apiHelpers';
import type { StatutDialer, RaisonPause, StatutDialerResponse, SipCredentials, Prospect, ProspectAssigne } from '../../utils/types';

export class DialerService {
  private static instance: DialerService;

  private constructor() {}

  public static getInstance(): DialerService {
    if (!DialerService.instance) {
      DialerService.instance = new DialerService();
    }
    return DialerService.instance;
  }

  public async getStatut(): Promise<StatutDialerResponse> {
    const response = await apiCalls.get<StatutDialerResponse>('/agents/me/statut');
    return throwIfApiError(response, 'Erreur lors de la récupération du statut');
  }

  public async getSipCredentials(): Promise<SipCredentials> {
    const response = await apiCalls.get<SipCredentials>('/auth/sip-credentials');
    return throwIfApiError(response, 'Erreur lors de la récupération des credentials SIP');
  }

  public async changerStatut(statut: StatutDialer, raison_pause?: RaisonPause): Promise<StatutDialerResponse> {
    const payload = raison_pause ? { statut, raison_pause } : { statut };
    const response = await apiCalls.patch<StatutDialerResponse>('/agents/me/statut', payload);
    return throwIfApiError(response, 'Erreur lors du changement de statut');
  }

  public async getNextProspect(): Promise<Prospect & ProspectAssigne> {
    const response = await apiCalls.get<Prospect & ProspectAssigne>('/agents/me/next-prospect');
    return throwIfApiError(response, 'Aucun prospect disponible dans le pool');
  }

  public async heartbeat(): Promise<void> {
    await apiCalls.post('/agents/me/heartbeat');
  }

  public async getCampagnesAgent(): Promise<Array<{ id_campagne: number; nom_campagne: string; statut: string }>> {
    const response = await apiCalls.get<Array<{ id_campagne: number; nom_campagne: string; statut: string }>>('/agents/me/campagnes');
    return throwIfApiError(response, 'Erreur lors de la récupération des campagnes');
  }

  public async markMobile(idProspection: number): Promise<void> {
    await apiCalls.patch(`/agents/queue/${idProspection}/mark-mobile`);
  }

  public async updateSession(stats: {
    duration_seconds: number;
    packets_lost?: number;
    packets_received?: number;
    packet_loss_percent?: number;
    round_trip_time?: number;
    jitter?: number;
  }): Promise<void> {
    await apiCalls.patch('/dialer/session', stats);
  }
}

export const dialerService = DialerService.getInstance();
