/**
 * Twilio Voice SDK Service
 * 
 * Service pour gérer les appels via le Twilio Voice JavaScript SDK
 * Remplace l'ancienne implémentation JsSIP
 */

import { apiCalls } from '../APICalls';
import { throwIfApiError } from '../apiHelpers';

export interface TwilioAccessTokenResponse {
  accessToken: string;
  identity: string;
}

export interface TwilioDeviceOptions {
  // Options pour Twilio.Device.setup()
  debug?: boolean;
  logLevel?: number;
  region?: string;
  edge?: string;
  insights?: boolean;
}

export interface CallOptions {
  phoneNumber: string; // Numéro à appeler (format E.164 ou identity)
}

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
   * @returns Promise<TwilioAccessTokenResponse>
   */
  public async getAccessToken(): Promise<TwilioAccessTokenResponse> {
    console.groupCollapsed('🔐 [TWILIO] Récupération Access Token');
    const response = await apiCalls.get<TwilioAccessTokenResponse>('/twilio/token');
    const tokenData = throwIfApiError(response, 'Erreur lors de la récupération du token Twilio');
    console.log('✅ Token reçu pour:', tokenData.identity);
    console.groupEnd();
    return tokenData;
  }

  /**
   * Initialise Twilio.Device avec un Access Token
   * @param {string} token - Access Token JWT
   * @param {TwilioDeviceOptions} options - Options pour Device.setup()
   * @returns Promise<void>
   */
  public async initializeDevice(token: string, options: TwilioDeviceOptions = {}): Promise<void> {
    // Charger le SDK Twilio dynamiquement
    // @ts-ignore - Twilio.Device est disponible globalement après chargement du SDK
    if (typeof window !== 'undefined' && !window.Twilio) {
      throw new Error('Twilio Voice SDK non chargé. Assurez-vous que @twilio/voice-sdk est importé.');
    }

    // @ts-ignore
    const Device = window.Twilio.Device;

    console.groupCollapsed('📱 [TWILIO] Initialisation Device');
    console.log('Token:', token.substring(0, 20) + '...');
    console.log('Options:', options);

    // Configurer le device
    Device.setup(token, options);

    console.log('✅ Device initialisé avec succès');
    console.groupEnd();
  }

  /**
   * Passe un appel sortant via Twilio
   * @param {string} phoneNumber - Numéro à appeler (format E.164: +33123456789)
   * @returns Promise<string> - Call SID
   */
  public async makeOutboundCall(phoneNumber: string): Promise<string> {
    // @ts-ignore
    const Device = window.Twilio.Device;

    if (!Device || !Device.connect) {
      throw new Error('Twilio.Device non initialisé. Appelez initializeDevice() d\'abord.');
    }

    console.groupCollapsed(`📞 [TWILIO] Appel sortant vers ${phoneNumber}`);
    console.log('Device status:', Device.status());

    // Passer l'appel
    const call = Device.connect({
      phoneNumber: phoneNumber
    });

    if (!call) {
      throw new Error('Impossible de démarrer l\'appel - Device.connect() a retourné null');
    }

    console.log('✅ Appel lancé, Call SID:', call.sid);
    console.groupEnd();

    return call.sid;
  }

  /**
   * Met fin à l'appel en cours
   * @returns Promise<void>
   */
  public async hangupCall(): Promise<void> {
    // @ts-ignore
    const Device = window.Twilio.Device;

    if (!Device) {
      throw new Error('Twilio.Device non initialisé');
    }

    const activeCalls = Device.activeConnections();
    if (activeCalls.length === 0) {
      console.warn('[TWILIO] Aucun appel actif à raccrocher');
      return;
    }

    console.groupCollapsed('📞 [TWILIO] Fin d\'appel');
    activeCalls.forEach((call: any) => {
      console.log('Raccrocher:', call.sid);
      call.disconnect();
    });
    console.groupEnd();
  }

  /**
   * Répond à un appel entrant
   * @returns Promise<void>
   */
  public async answerIncomingCall(): Promise<void> {
    // @ts-ignore
    const Device = window.Twilio.Device;

    if (!Device) {
      throw new Error('Twilio.Device non initialisé');
    }

    const incomingConnections = Device.incomingConnections();
    if (incomingConnections.length === 0) {
      throw new Error('Aucun appel entrant en attente');
    }

    console.groupCollapsed('📞 [TWILIO] Réponse à appel entrant');
    incomingConnections.forEach((connection: any) => {
      connection.accept();
      console.log('✅ Appel accepté:', connection.parameters.CallSid);
    });
    console.groupEnd();
  }

  /**
   * Rejette un appel entrant
   * @returns Promise<void>
   */
  public async rejectIncomingCall(): Promise<void> {
    // @ts-ignore
    const Device = window.Twilio.Device;

    if (!Device) {
      throw new Error('Twilio.Device non initialisé');
    }

    const incomingConnections = Device.incomingConnections();
    if (incomingConnections.length === 0) {
      throw new Error('Aucun appel entrant à rejeter');
    }

    console.groupCollapsed('📞 [TWILIO] Rejet appel entrant');
    incomingConnections.forEach((connection: any) => {
      connection.reject();
      console.log('❌ Appel rejeté:', connection.parameters.CallSid);
    });
    console.groupEnd();
  }

  /**
   * Retourne le statut actuel de Twilio.Device
   * @returns string
   */
  public getDeviceStatus(): string {
    // @ts-ignore
    const Device = window.Twilio.Device;
    return Device ? Device.status() : 'uninitialized';
  }

  /**
   * Retourne true si Twilio.Device est prêt
   * @returns boolean
   */
  public isDeviceReady(): boolean {
    // @ts-ignore
    const Device = window.Twilio.Device;
    return Device && Device.status() === 'ready';
  }

  /**
   * Retourne true si un appel est en cours
   * @returns boolean
   */
  public isCallActive(): boolean {
    // @ts-ignore
    const Device = window.Twilio.Device;
    return Device && Device.activeConnections().length > 0;
  }

  /**
   * Nettoie Twilio.Device
   * @returns Promise<void>
   */
  public async cleanup(): Promise<void> {
    // @ts-ignore
    const Device = window.Twilio.Device;

    if (Device) {
      console.log('[TWILIO] Nettoyage Device');
      // Déconnecter tous les appels
      const activeCalls = Device.activeConnections();
      activeCalls.forEach((call: any) => call.disconnect());

      // Désinitialiser le device
      Device.destroy();
    }
  }
}

export const twilioService = TwilioService.getInstance();
