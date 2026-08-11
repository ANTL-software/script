/**
 * Twilio Voice SDK Service
 *
 * Service pour interagir avec le backend Twilio
 * La gestion du Device (Device.setup, Device.connect, etc.) se fait dans le TwilioProvider
 * Ce service ne gère que la communication avec le backend (tokens, logs, etc.)
 *
 * Documentation: https://www.twilio.com/docs/voice/sdks/javascript
 */

import { apiCalls } from '../APICalls';
import { throwIfApiError } from '../apiHelpers';

// ============================================
// TYPES
// ============================================

export interface TwilioAccessTokenResponse {
  accessToken: string;
  identity: string;
  expiresIn?: number; // Durée de validité en secondes
}

export interface TwilioCallLogRequest {
  callSid: string; // Twilio Call SID
  from: string; // Numéro appelé (prospect)
  to?: string; // Numéro Twilio (optionnel)
  duration?: number; // Durée en secondes
  status: 'completed' | 'failed' | 'busy' | 'no-answer' | 'canceled';
  recordingUrl?: string; // URL de l'enregistrement (si activé)
  metadata?: Record<string, unknown>; // Métadonnées additionnelles
}

export interface TwilioCallLogResponse {
  id: number;
  callSid: string;
  loggedAt: string;
}

// ============================================
// SERVICE
// ============================================

export class TwilioService {
  private static instance: TwilioService;

  private constructor() {}

  public static getInstance(): TwilioService {
    if (!TwilioService.instance) {
      TwilioService.instance = new TwilioService();
    }
    return TwilioService.instance;
  }

  /**
   * Récupère un Access Token depuis le backend
   *
   * Le backend génère un JWT token signé avec les credentials Twilio
   * qui autorise ce client à utiliser le Twilio Voice SDK
   *
   * @returns Promise<TwilioAccessTokenResponse>
   */
  public async getAccessToken(): Promise<TwilioAccessTokenResponse> {
    console.groupCollapsed('🔐 [TWILIO] Récupération Access Token');

    try {
      // /twilio/token au lieu de /api/twilio/token car baseURL contient déjà /api
      const response = await apiCalls.get<TwilioAccessTokenResponse>('/twilio/token');
      const tokenData = throwIfApiError(response, 'Erreur lors de la récupération du token Twilio');

      console.log('✅ Token reçu pour:', tokenData.identity);
      console.log('⏰ Expire dans:', tokenData.expiresIn ? `${tokenData.expiresIn}s` : 'inconnu');
      console.groupEnd();

      return tokenData;
    } catch (error) {
      console.error('❌ [TWILIO] Erreur récupération token:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Rafraîchit un Access Token expiré
   *
   * Le SDK Twilio émettra un événement 'tokenWillExpire' avant l'expiration
   * Cette méthode permet de récupérer un nouveau token sans recharger la page
   *
   * @returns Promise<TwilioAccessTokenResponse>
   */
  public async refreshAccessToken(): Promise<TwilioAccessTokenResponse> {
    console.log('🔄 [TWILIO] Rafraîchissement Access Token');
    return this.getAccessToken(); // Même endpoint pour le rafraîchissement
  }

  /**
   * Enregistre un log d'appel dans le backend
   *
   * Permet de synchroniser les informations Twilio (Call SID, durée, statut)
   * avec notre base de données pour le traçage
   *
   * @param {TwilioCallLogRequest} data - Données de l'appel
   * @returns Promise<TwilioCallLogResponse>
   */
  public async logCall(data: TwilioCallLogRequest): Promise<TwilioCallLogResponse> {
    console.groupCollapsed('📝 [TWILIO] Enregistrement appel');
    console.log('Call SID:', data.callSid);
    console.log('Status:', data.status);
    console.log('Duration:', data.duration, 's');

    try {
      const response = await apiCalls.post<TwilioCallLogResponse>('/twilio/calls/log', data);
      const result = throwIfApiError(response, 'Erreur lors de l\'enregistrement de l\'appel');

      console.log('✅ Appel enregistré, ID:', result.id);
      console.groupEnd();

      return result;
    } catch (error) {
      console.error('❌ [TWILIO] Erreur enregistrement appel:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Signale un problème technique avec Twilio au backend
   *
   * @param {string} type - Type d'erreur (connection_failed, no_audio, etc.)
   * @param {Error} error - Erreur originale
   */
  public async reportError(type: string, error: Error): Promise<void> {
    console.warn('⚠️ [TWILIO] Rapport d\'erreur:', type, error.message);

    try {
      await apiCalls.post('/twilio/errors', {
        type,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('❌ [TWILIO] Erreur rapport erreur:', err);
    }
  }

}

// Instance singleton
export const twilioService = TwilioService.getInstance();
