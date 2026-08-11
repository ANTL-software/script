import { apiCalls } from '../APICalls';
import { throwIfApiError } from '../apiHelpers';
import type { AsteriskTelephonySession, TelephonyConfiguration } from '../../utils/types';

export class TelephonyService {
  private static instance: TelephonyService;

  private constructor() {}

  public static getInstance(): TelephonyService {
    if (!TelephonyService.instance) {
      TelephonyService.instance = new TelephonyService();
    }
    return TelephonyService.instance;
  }

  public async getConfiguration(): Promise<TelephonyConfiguration> {
    const response = await apiCalls.get<TelephonyConfiguration>('/telephony/config');
    return throwIfApiError(response, 'Impossible de récupérer la configuration téléphonie');
  }

  public async getAsteriskSession(): Promise<AsteriskTelephonySession> {
    const response = await apiCalls.get<AsteriskTelephonySession>('/telephony/session');
    return throwIfApiError(response, 'Impossible de créer la session Asterisk');
  }
}

export const telephonyService = TelephonyService.getInstance();
