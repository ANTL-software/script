import { apiCalls } from '../APICalls';
import type { StatutDialer, RaisonPause, StatutDialerResponse, SipCredentials } from '../../utils/types';

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
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération du statut');
    }
    return response.data;
  }

  public async getSipCredentials(): Promise<SipCredentials> {
    const response = await apiCalls.get<SipCredentials>('/auth/sip-credentials');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération des credentials SIP');
    }
    return response.data;
  }

  public async changerStatut(statut: StatutDialer, raison_pause?: RaisonPause): Promise<StatutDialerResponse> {
    const payload = raison_pause ? { statut, raison_pause } : { statut };
    const response = await apiCalls.patch<StatutDialerResponse>('/agents/me/statut', payload);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors du changement de statut');
    }
    return response.data;
  }
}

export const dialerService = DialerService.getInstance();
