/**
 * Twilio Voice SDK Provider
 *
 * Fournit un contexte pour gérer les appels via Twilio Voice SDK v2.x
 * Utilise @twilio/voice-sdk (version npm) et non le CDN
 * Documentation: https://www.twilio.com/docs/voice/sdks/javascript
 */

import { useState, useCallback, useRef, useEffect, useMemo, createContext } from 'react';
import type { ReactNode } from 'react';
import { Device, type Connection } from '@twilio/voice-sdk';
import { twilioService } from '../../API/services/Twilio.service';
import { useToast } from '../../hooks';
import { formatPhoneE164 } from '../../utils/scripts/formatters';

// Types pour le contexte Twilio
export interface TwilioContextType {
  // État de connexion
  isTwilioReady: boolean;
  twilioConnected: boolean;

  // Appel
  callDuration: number;
  callDurationFormatted: string;
  isCallActive: boolean;
  activeCallSid: string | null;
  incomingCall: Connection | null;

  // Fonctions
  initializeTwilio: () => Promise<void>;
  call: (phoneNumber: string) => Promise<string | null>;
  hangup: () => void;
  answer: () => void;
  reject: () => void;
  cleanup: () => Promise<void>;
}

// Types pour le contexte Twilio
export interface TwilioContextType {
  // État de connexion
  isTwilioReady: boolean;
  twilioConnected: boolean;

  // Appel
  callDuration: number;
  callDurationFormatted: string;
  isCallActive: boolean;
  activeCallSid: string | null;
  incomingCall: Connection | null;

  // Fonctions
  initializeTwilio: () => Promise<void>;
  call: (phoneNumber: string) => Promise<string | null>;
  hangup: () => void;
  answer: () => void;
  reject: () => void;
  cleanup: () => Promise<void>;
}

// Contexte par défaut
export const TwilioContext = createContext<TwilioContextType | null>(null);

interface TwilioProviderProps {
  children: ReactNode;
}

export const TwilioProvider = ({ children }: TwilioProviderProps) => {
  const { showToast } = useToast();
  
  const [isTwilioReady, setIsTwilioReady] = useState(false);
  const [twilioConnected, setTwilioConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [activeCallSid, setActiveCallSid] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<Connection | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deviceReadyRef = useRef(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Event handlers stables pour pouvoir les retirer
  // @ts-ignore - TypeScript ne peut pas infirmer le type exact des handlers
  const readyHandlerRef = useRef<((...args: any[]) => void) | null>(null);
  // @ts-ignore
  const errorHandlerRef = useRef<((...args: any[]) => void) | null>(null);
  // @ts-ignore
  const offlineHandlerRef = useRef<((...args: any[]) => void) | null>(null);
  // @ts-ignore
  const incomingHandlerRef = useRef<((...args: any[]) => void) | null>(null);
  // @ts-ignore
  const connectHandlerRef = useRef<((...args: any[]) => void) | null>(null);
  // @ts-ignore
  const disconnectHandlerRef = useRef<((...args: any[]) => void) | null>(null);
  // @ts-ignore
  const cancelHandlerRef = useRef<((...args: any[]) => void) | null>(null);

  // Formatage de la durée d'appel en MM:SS
  const callDurationFormatted = useMemo(() => {
    const minutes = Math.floor(callDuration / 60);
    const seconds = callDuration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [callDuration]);

  // Démarrer le timer d'appel
  const startCallTimer = useCallback(() => {
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  }, []);

  // Arrêter le timer d'appel
  const stopCallTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Initialiser Twilio.Device avec un Access Token
  const initializeTwilio = useCallback(async () => {
    console.groupCollapsed('🚀 [TWILIO] Initialisation Device v2.x');

    try {
      // Récupérer le Access Token depuis le backend
      const { accessToken, identity } = await twilioService.getAccessToken();
      console.log(`✅ Token reçu pour: ${identity}`);

      // Nettoyer les anciens event handlers si présents
      if (deviceReadyRef.current) {
        readyHandlerRef.current && Device.off('ready', readyHandlerRef.current);
        errorHandlerRef.current && Device.off('error', errorHandlerRef.current);
        offlineHandlerRef.current && Device.off('offline', offlineHandlerRef.current);
        incomingHandlerRef.current && Device.off('incoming', incomingHandlerRef.current);
        connectHandlerRef.current && Device.off('connect', connectHandlerRef.current);
        disconnectHandlerRef.current && Device.off('disconnect', disconnectHandlerRef.current);
        cancelHandlerRef.current && Device.off('cancel', cancelHandlerRef.current);
      }

      // Créer les event handlers
      readyHandlerRef.current = () => {
        console.log('✅ [TWILIO] Device prêt (state: ready)');
        setIsTwilioReady(true);
        setTwilioConnected(true);
        deviceReadyRef.current = true;
      };

      errorHandlerRef.current = (error: any) => {
        console.error('❌ [TWILIO] Erreur Device:', error);
        setTwilioConnected(false);
        showToast('error', 'Erreur Twilio: ' + error.message, 5000);
      };

      offlineHandlerRef.current = () => {
        console.warn('⚠️ [TWILIO] Device hors ligne (state: offline)');
        setTwilioConnected(false);
        setIsTwilioReady(false);
      };

      incomingHandlerRef.current = (connection: Connection) => {
        console.groupCollapsed('📞 [TWILIO] Appel entrant');
        console.log('From:', connection.parameters.From);
        console.log('CallSid:', connection.parameters.CallSid);
        setIncomingCall(connection);
        console.groupEnd();
        showToast('info', `Appel entrant de: ${connection.parameters.From}`, 10000);
      };

      connectHandlerRef.current = (connection: Connection) => {
        console.groupCollapsed('✅ [TWILIO] Appel connecté');
        console.log('CallSid:', connection.sid);
        setActiveCallSid(connection.sid);
        setIsCallActive(true);
        startCallTimer();
        console.groupEnd();
        showToast('success', 'Appel connecté', 3000);
      };

      disconnectHandlerRef.current = (connection: Connection) => {
        console.groupCollapsed('📞 [TWILIO] Appel terminé');
        console.log('CallSid:', connection.sid);
        stopCallTimer();
        setIsCallActive(false);
        setActiveCallSid(null);

        // Si c'est l'appel entrant, le supprimer
        if (incomingCall?.sid === connection.sid) {
          setIncomingCall(null);
        }
        console.groupEnd();
        showToast('info', 'Appel terminé', 3000);
      };

      cancelHandlerRef.current = (connection: Connection) => {
        console.log('⚠️ [TWILIO] Appel annulé:', connection.sid);
        if (incomingCall?.sid === connection.sid) {
          setIncomingCall(null);
        }
        showToast('warning', 'Appel annulé', 3000);
      };

      // Enregistrer les event handlers AVANT setup()
      Device.on('ready', readyHandlerRef.current);
      Device.on('error', errorHandlerRef.current);
      Device.on('offline', offlineHandlerRef.current);
      Device.on('incoming', incomingHandlerRef.current);
      Device.on('connect', connectHandlerRef.current);
      Device.on('disconnect', disconnectHandlerRef.current);
      Device.on('cancel', cancelHandlerRef.current);

      // Initialiser le device avec le token
      const isDev = import.meta.env.MODE === 'development';
      Device.setup(accessToken, {
        debug: isDev,
        logLevel: isDev ? 3 : 1,
        region: import.meta.env.VITE_TWILIO_REGION || undefined,
        edge: import.meta.env.VITE_TWILIO_EDGE || undefined,
        insights: true,
        // Audio constraints pour un meilleur comportement
        audioConstraints: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      console.log('✅ [TWILIO] Initialisation terminée - Device.setup() appelé');
      console.groupEnd();

    } catch (error) {
      console.error('❌ [TWILIO] Erreur initialisation:', error);
      console.groupEnd();
      showToast('error', 'Impossible d\'initialiser Twilio: ' + (error as Error).message, 8000);
      setTwilioConnected(false);
      setIsTwilioReady(false);
      deviceReadyRef.current = false;
    }
  }, [showToast, startCallTimer]);

  // Passer un appel sortant
  const call = useCallback(async (phoneNumber: string): Promise<string | null> => {
    if (!deviceReadyRef.current) {
      console.error('❌ [TWILIO] Device non initialisé');
      showToast('error', 'Twilio non initialisé - Veuillez réessayer', 5000);
      return null;
    }

    if (Device.state !== 'ready') {
      console.error('❌ [TWILIO] Device non prêt (state:', Device.state, ')');
      showToast('error', 'Twilio non prêt - Veuillez réessayer', 5000);
      return null;
    }

    if (isCallActive) {
      console.warn('⚠️ [TWILIO] Appel déjà en cours');
      showToast('warning', 'Un appel est déjà en cours', 3000);
      return null;
    }

    console.groupCollapsed(`📞 [TWILIO] Appel sortant vers ${phoneNumber}`);

    // Formater le numéro en E.164
    const formattedNumber = formatPhoneE164(phoneNumber);
    console.log('Numéro formaté:', formattedNumber);

    try {
      const connection = Device.connect({
        params: { To: formattedNumber },
        phoneNumber: formattedNumber
      });

      if (!connection) {
        throw new Error('Device.connect() a retourné null');
      }

      setActiveCallSid(connection.sid);
      setIsCallActive(true);
      startCallTimer();

      console.log('✅ Appel lancé, Call SID:', connection.sid);
      console.groupEnd();

      return connection.sid;

    } catch (error) {
      console.error('❌ [TWILIO] Erreur appel:', error);
      console.groupEnd();
      showToast('error', 'Échec de l\'appel: ' + (error as Error).message, 5000);
      return null;
    }
  }, [isCallActive, startCallTimer, showToast]);

  // Raccrocher l'appel
  const hangup = useCallback(() => {
    if (!deviceReadyRef.current) {
      console.error('❌ [TWILIO] Device non initialisé');
      return;
    }

    const activeConnections = Device.activeConnections();
    if (activeConnections.length === 0) {
      console.warn('⚠️ [TWILIO] Aucun appel actif');
      return;
    }

    console.groupCollapsed('📞 [TWILIO] Fin d\'appel');
    activeConnections.forEach((connection: Connection) => {
      console.log('Raccrocher:', connection.sid);
      connection.disconnect();
    });
    stopCallTimer();
    setIsCallActive(false);
    setActiveCallSid(null);
    console.groupEnd();
  }, [stopCallTimer]);

  // Répondre à un appel entrant
  const answer = useCallback(() => {
    const connection = incomingCall;

    if (!connection) {
      console.warn('⚠️ [TWILIO] Aucun appel entrant');
      showToast('warning', 'Aucun appel en attente', 3000);
      return;
    }

    console.groupCollapsed('📞 [TWILIO] Réponse à appel entrant');
    connection.accept();
    setIncomingCall(null);
    setIsCallActive(true);
    startCallTimer();
    setActiveCallSid(connection.sid);
    console.log('✅ Appel accepté:', connection.sid);
    console.groupEnd();
    showToast('success', 'Appel accepté', 3000);
  }, [incomingCall, startCallTimer, showToast]);

  // Rejeter un appel entrant
  const reject = useCallback(() => {
    const connection = incomingCall;

    if (!connection) {
      console.warn('⚠️ [TWILIO] Aucun appel entrant à rejeter');
      return;
    }

    console.groupCollapsed('📞 [TWILIO] Rejet appel entrant');
    connection.reject();
    setIncomingCall(null);
    console.log('❌ Appel rejeté:', connection.sid);
    console.groupEnd();
    showToast('info', 'Appel rejeté', 3000);
  }, [incomingCall, showToast]);

  // Nettoyer
  const cleanup = useCallback(async () => {
    if (deviceReadyRef.current) {
      console.log('[TWILIO] Nettoyage Device');
      stopCallTimer();

      // Déconnecter les appels actifs
      const activeConnections = Device.activeConnections();
      activeConnections.forEach((connection: Connection) => connection.disconnect());

      // Retirer les event handlers
      if (readyHandlerRef.current) Device.off('ready', readyHandlerRef.current);
      if (errorHandlerRef.current) Device.off('error', errorHandlerRef.current);
      if (offlineHandlerRef.current) Device.off('offline', offlineHandlerRef.current);
      if (incomingHandlerRef.current) Device.off('incoming', incomingHandlerRef.current);
      if (connectHandlerRef.current) Device.off('connect', connectHandlerRef.current);
      if (disconnectHandlerRef.current) Device.off('disconnect', disconnectHandlerRef.current);
      if (cancelHandlerRef.current) Device.off('cancel', cancelHandlerRef.current);

      // Détruire le device
      Device.destroy();
      deviceReadyRef.current = false;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
  }, [stopCallTimer]);

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Valeur du contexte
  const contextValue: TwilioContextType = {
    isTwilioReady,
    twilioConnected,
    callDuration,
    callDurationFormatted,
    isCallActive,
    activeCallSid,
    incomingCall,
    initializeTwilio,
    call,
    hangup,
    answer,
    reject,
    cleanup
  };

  return (
    <TwilioContext.Provider value={contextValue}>
      {children}
      <audio id="twilioRemoteAudio" autoPlay playsInline muted={false} />
    </TwilioContext.Provider>
  );
};
