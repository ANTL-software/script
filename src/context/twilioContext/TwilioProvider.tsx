/**
 * Twilio Voice SDK Provider
 * 
 * Fournit un contexte pour gérer les appels via Twilio Voice SDK
 * Remplace progressivement le DialerProvider basé sur JsSIP
 */

import { useState, useCallback, useRef, useEffect, useMemo, createContext } from 'react';
import type { ReactNode } from 'react';
import { Device } from '@twilio/voice-sdk';
import { twilioService } from '../../API/services/Twilio.service';
import { useToast } from '../../hooks';
import { formatPhoneE164 } from '../../utils/scripts/formatters';

// Types pour Twilio.Device
interface TwilioConnection {
  sid: string;
  parameters: {
    From: string;
    To: string;
    CallSid: string;
  };
  disconnect: () => void;
  accept: () => void;
  reject: () => void;
}

interface TwilioDevice {
  setup: (token: string, options?: any) => void;
  connect: (options: { phoneNumber: string }) => TwilioConnection | null;
  activeConnections: () => TwilioConnection[];
  incomingConnections: () => TwilioConnection[];
  status: () => string;
  destroy: () => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler: (...args: any[]) => void) => void;
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
  incomingCall: TwilioConnection | null;
  
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
  const [incomingCall, setIncomingCall] = useState<TwilioConnection | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deviceRef = useRef<TwilioDevice | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

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
    console.groupCollapsed('🚀 [TWILIO] Initialisation');
    
    try {
      // Récupérer le Access Token depuis le backend
      const { accessToken, identity } = await twilioService.getAccessToken();
      console.log(`✅ Token reçu pour: ${identity}`);

      // Stocker la référence
      deviceRef.current = Device;

      // Configurer les gestionnaires d'événements
      Device.on('ready', () => {
        console.log('✅ [TWILIO] Device prêt');
        setIsTwilioReady(true);
        setTwilioConnected(true);
      });

      Device.on('error', (error: any) => {
        console.error('❌ [TWILIO] Erreur Device:', error);
        setTwilioConnected(false);
        showToast('error', 'Erreur Twilio: ' + error.message, 5000);
      });

      Device.on('offline', () => {
        console.warn('⚠️ [TWILIO] Device hors ligne');
        setTwilioConnected(false);
        setIsTwilioReady(false);
      });

      Device.on('incoming', (connection: TwilioConnection) => {
        console.groupCollapsed('📞 [TWILIO] Appel entrant');
        console.log('From:', connection.parameters.From);
        console.log('CallSid:', connection.parameters.CallSid);
        setIncomingCall(connection);
        console.groupEnd();
        showToast('info', `Appel entrant de: ${connection.parameters.From}`, 10000);
      });

      Device.on('connect', (connection: TwilioConnection) => {
        console.groupCollapsed('✅ [TWILIO] Appel connecté');
        console.log('CallSid:', connection.sid);
        setActiveCallSid(connection.sid);
        setIsCallActive(true);
        startCallTimer();
        console.groupEnd();
        showToast('success', 'Appel connecté', 3000);
      });

      Device.on('disconnect', (connection: TwilioConnection) => {
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
      });

      Device.on('cancel', (connection: TwilioConnection) => {
        console.log('⚠️ [TWILIO] Appel annulé:', connection.sid);
        if (incomingCall?.sid === connection.sid) {
          setIncomingCall(null);
        }
        showToast('warning', 'Appel annulé', 3000);
      });

      // Initialiser le device avec le token
      const isDev = import.meta.env.MODE === 'development';
      Device.setup(accessToken, {
        debug: isDev,
        logLevel: isDev ? 3 : 1,
        region: import.meta.env.VITE_TWILIO_REGION || undefined,
        edge: import.meta.env.VITE_TWILIO_EDGE || undefined,
        insights: true
      });

      console.log('✅ [TWILIO] Initialisation terminée');
      console.groupEnd();
      
    } catch (error) {
      console.error('❌ [TWILIO] Erreur initialisation:', error);
      console.groupEnd();
      showToast('error', 'Impossible d\'initialiser Twilio: ' + (error as Error).message, 8000);
      setTwilioConnected(false);
      setIsTwilioReady(false);
    }
  }, [showToast, startCallTimer]);

  // Passer un appel sortant
  const call = useCallback(async (phoneNumber: string): Promise<string | null> => {
    const Device = deviceRef.current;
    
    if (!Device) {
      console.error('❌ [TWILIO] Device non initialisé');
      showToast('error', 'Twilio non initialisé', 5000);
      return null;
    }

    if (Device.status() !== 'ready') {
      console.error('❌ [TWILIO] Device non prêt');
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
    const Device = deviceRef.current;
    
    if (!Device) {
      console.error('❌ [TWILIO] Device non initialisé');
      return;
    }

    const activeConnections = Device.activeConnections();
    if (activeConnections.length === 0) {
      console.warn('⚠️ [TWILIO] Aucun appel actif');
      return;
    }

    console.groupCollapsed('📞 [TWILIO] Fin d\'appel');
    activeConnections.forEach((connection) => {
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
    const Device = deviceRef.current;
    
    if (Device) {
      console.log('[TWILIO] Nettoyage');
      stopCallTimer();
      
      // Déconnecter les appels actifs
      const activeConnections = Device.activeConnections();
      activeConnections.forEach((connection) => connection.disconnect());
      
      // Détruire le device
      Device.destroy();
      deviceRef.current = null;
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
