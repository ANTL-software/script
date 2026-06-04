import { apiCalls } from '../APICalls';
import { throwIfApiError } from '../apiHelpers';
import type { StatutDialer, RaisonPause, StatutDialerResponse, Prospect, ProspectAssigne } from '../../utils/types';

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

  public async changerStatut(statut: StatutDialer, raison_pause?: RaisonPause): Promise<StatutDialerResponse> {
    const logRaison = raison_pause ? ` (${raison_pause})` : '';
    console.groupCollapsed(`📊 [API] Changement statut: ${statut}${logRaison}`);
    const payload = raison_pause ? { statut, raison_pause } : { statut };
    const response = await apiCalls.patch<StatutDialerResponse>('/agents/me/statut', payload);
    const result = throwIfApiError(response, 'Erreur lors du changement de statut');
    console.log('✅ OK');
    console.groupEnd();
    return result;
  }

  public async getNextProspect(): Promise<Prospect & ProspectAssigne> {
    console.groupCollapsed('📥 [API] Demande prospect');
    const response = await apiCalls.get<Prospect & ProspectAssigne>('/agents/me/next-prospect');
    const prospect = throwIfApiError(response, 'Aucun prospect disponible');
    console.log(`✅ ${prospect.id_prospect} - ${prospect.nom} ${prospect.prenom}`);
    console.log(`📱 ${prospect.telephone}`);
    console.groupEnd();
    return prospect;
  }

  public async heartbeat(): Promise<void> {
    await apiCalls.post('/agents/me/heartbeat');
  }

  public async getCampagnesAgent(): Promise<Array<{ id_campagne: number; nom_campagne: string; statut: string; autoriser_mobile: boolean }>> {
    const response = await apiCalls.get<Array<{ id_campagne: number; nom_campagne: string; statut: string; autoriser_mobile: boolean }>>('/agents/me/campagnes');
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

  public async startSession(prospectId: number, campagneId: number): Promise<void> {
    console.groupCollapsed('📞 [API] Session start');
    console.log(`Prospect: ${prospectId} | Campagne: ${campagneId}`);
    await apiCalls.post('/dialer/session', { id_prospect: prospectId, id_campagne: campagneId });
    console.log('✅ OK');
    console.groupEnd();
  }

  public async endSession(): Promise<void> {
    console.groupCollapsed('📞 [API] Session end');
    await apiCalls.delete('/dialer/session');
    console.log('✅ OK');
    console.groupEnd();
  }
}

export const dialerService = DialerService.getInstance();
