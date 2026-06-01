/**
 * Twilio Voice SDK Provider
 *
 * Fournit un contexte pour gérer les appels via Twilio Voice SDK v2.x
 * Utilise @twilio/voice-sdk (version npm) et non le CDN
 * Documentation: https://www.twilio.com/docs/voice/sdks/javascript
 *
 * NOTE: Dans le SDK v2.x, Device est une CLASSE à instancier avec new Device(token, options)
 * PAS un singleton avec Device.setup() comme dans l'ancienne API v1.x
 */

import { useState, useCallback, useRef, useEffect, useMemo, createContext } from 'react';
import type { ReactNode } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
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
  incomingCall: Call | null;

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
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deviceRef = useRef<Device | null>(null);
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
    console.groupCollapsed('🚀 [TWILIO] Initialisation Device v2.x (API new Device())');

    try {
      // Récupérer le Access Token depuis le backend
      const { accessToken, identity } = await twilioService.getAccessToken();
      console.log(`✅ Token reçu pour: ${identity}`);

      // Détruire l'ancien device s'il existe
      if (deviceRef.current) {
        console.log('[TWILIO] Destruction de l\'ancien Device');
        deviceRef.current.removeAllListeners();
        deviceRef.current.destroy();
        deviceRef.current = null;
      }

      // Créer une NOUVELLE instance de Device (SDK v2.x API)
      const device = new Device(accessToken, {
        codecPreferences: ['opus', 'PCMU'] as any,
        edge: import.meta.env.VITE_TWILIO_EDGE || undefined,
        enableImprovedSignalingErrorPrecision: true,
        maxAverageBitrate: 16000,
      });

      deviceRef.current = device;

      console.log('📱 [TWILIO] Device instance créée, état actuel:', device.state);
      console.log('📱 [TWILIO] Device.listeners:', device.eventNames());

      // Enregistrer les event listeners
      device.on('registered', () => {
        console.log('✅ [TWILIO] Device registered (connecté au serveur Twilio)');
        console.log('📱 [TWILIO] Device.state après registration:', device.state);
        setTwilioConnected(true);
        setIsTwilioReady(true);
      });

      device.on('unregistered', () => {
        console.warn('⚠️ [TWILIO] Device unregistered');
        console.log('📱 [TWILIO] Device.state après unregister:', device.state);
        setTwilioConnected(false);
      });

      device.on('registering', () => {
        console.log('🔄 [TWILIO] Device registering...');
        console.log('📱 [TWILIO] Device.state pendant registering:', device.state);
        setIsTwilioReady(false);
      });

      device.on('error', (error: any) => {
        console.error('❌ [TWILIO] Erreur Device:', error);
        console.error('❌ [TWILIO] Error.code:', error.code);
        console.error('❌ [TWILIO] Error.message:', error.message);
        setTwilioConnected(false);
        showToast('error', 'Erreur Twilio: ' + error.message, 5000);
      });

      device.on('incoming', (call: Call) => {
        console.groupCollapsed('📞 [TWILIO] Appel entrant');
        console.log('From:', call.parameters.From);
        console.log('Call SID:', call.parameters.CallSid);
        setIncomingCall(call);
        console.groupEnd();
        showToast('info', `Appel entrant de: ${call.parameters.From}`, 10000);
      });

      // Quand un call est accepté/connecté
      const handleCallConnected = (call: Call) => {
        console.groupCollapsed('✅ [TWILIO] Appel connecté');
        console.log('Call SID:', call.parameters.CallSid);
        setActiveCallSid(call.parameters.CallSid);
        setIsCallActive(true);
        startCallTimer();
        console.groupEnd();
        showToast('success', 'Appel connecté', 3000);
      };

      // Écouter les événements des calls sortants
      device.on('callConnecting', (call: Call) => {
        console.log('🔄 [TWILIO] Call connecting:', call.parameters.CallSid);
      });

      device.on('callConnected', handleCallConnected);

      device.on('callOpen', (call: Call) => {
        console.log('📞 [TWILIO] Call open (media established):', call.parameters.CallSid);
      });

      // Quand un call se termine
      device.on('callEnded', (call: Call) => {
        console.groupCollapsed('📞 [TWILIO] Appel terminé');
        console.log('Call SID:', call.parameters.CallSid);
        stopCallTimer();
        setIsCallActive(false);
        setActiveCallSid(null);

        // Si c'était un appel entrant, le supprimer
        if (incomingCall?.parameters.CallSid === call.parameters.CallSid) {
          setIncomingCall(null);
        }
        console.groupEnd();
        showToast('info', 'Appel terminé', 3000);
      });

      device.on('callDisconnected', (call: Call) => {
        console.log('⚠️ [TWILIO] Call disconnected:', call.parameters.CallSid);
        if (incomingCall?.parameters.CallSid === call.parameters.CallSid) {
          setIncomingCall(null);
        }
      });

      device.on('cancel', (call: Call) => {
        console.log('⚠️ [TWILIO] Appel annulé:', call.parameters.CallSid);
        if (incomingCall?.parameters.CallSid === call.parameters.CallSid) {
          setIncomingCall(null);
        }
        showToast('warning', 'Appel annulé', 3000);
      });

      device.on('tokenWillExpire', () => {
        console.log('⚠️ [TWILIO] Token va expirer - Rafraîchissement nécessaire');
        // TODO: Implémenter le rafraîchissement automatique du token
      });

      device.on('destroyed', () => {
        console.log('💥 [TWILIO] Device destroyed');
        setTwilioConnected(false);
        setIsTwilioReady(false);
        deviceRef.current = null;
      });

      // Lancer manuellement la registration pour forcer la connexion
      console.log('📞 [TWILIO] Tentative de registration manuelle...');
      console.log('📱 [TWILIO] Device state AVANT register:', device.state);
      try {
        await device.register();
        console.log('✅ [TWILIO] Register appelé avec succès');
        console.log('📱 [TWILIO] Device state APRÈS register:', device.state);
      } catch (err) {
        console.error('❌ [TWILIO] Erreur lors de register():', err);
      }

      console.log('✅ [TWILIO] Device v2.x créé avec succès, attente registration...');
      console.groupEnd();

    } catch (error) {
      console.error('❌ [TWILIO] Erreur initialisation:', error);
      console.groupEnd();
      showToast('error', 'Impossible d\'initialiser Twilio: ' + (error as Error).message, 8000);
      setTwilioConnected(false);
      setIsTwilioReady(false);
    }
  }, [showToast, startCallTimer, stopCallTimer]);

  // Passer un appel sortant
  const call = useCallback(async (phoneNumber: string): Promise<string | null> => {
    const device = deviceRef.current;

    if (!device) {
      console.error('❌ [TWILIO] Device non initialisé');
      showToast('error', 'Twilio non initialisé', 5000);
      return null;
    }

    if (!isTwilioReady || device.state !== 'registered') {
      console.error('❌ [TWILIO] Device non prêt (state:', device.state, ')');
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
      const call = await device.connect({ params: { To: formattedNumber } });

      if (!call) {
        throw new Error('device.connect() a retourné null');
      }

      setActiveCallSid(call.parameters.CallSid);
      setIsCallActive(true);
      startCallTimer();

      console.log('✅ Appel lancé, Call SID:', call.parameters.CallSid);
      console.groupEnd();

      return call.parameters.CallSid;

    } catch (error) {
      console.error('❌ [TWILIO] Erreur appel:', error);
      console.groupEnd();
      showToast('error', 'Échec de l\'appel: ' + (error as Error).message, 5000);
      return null;
    }
  }, [isTwilioReady, isCallActive, startCallTimer, showToast]);

  // Raccrocher l'appel
  const hangup = useCallback(() => {
    const device = deviceRef.current;

    if (!device) {
      console.error('❌ [TWILIO] Device non initialisé');
      return;
    }

    const activeCalls = device.calls;
    if (activeCalls.length === 0) {
      console.warn('⚠️ [TWILIO] Aucun appel actif');
      return;
    }

    console.groupCollapsed('📞 [TWILIO] Fin d\'appel');
    activeCalls.forEach((call) => {
      console.log('Raccrocher:', call.parameters.CallSid);
      call.disconnect();
    });
    stopCallTimer();
    setIsCallActive(false);
    setActiveCallSid(null);
    console.groupEnd();
  }, [stopCallTimer]);

  // Répondre à un appel entrant
  const answer = useCallback(() => {
    const call = incomingCall;

    if (!call) {
      console.warn('⚠️ [TWILIO] Aucun appel entrant');
      showToast('warning', 'Aucun appel en attente', 3000);
      return;
    }

    console.groupCollapsed('📞 [TWILIO] Réponse à appel entrant');
    call.accept();
    setIncomingCall(null);
    setIsCallActive(true);
    startCallTimer();
    setActiveCallSid(call.parameters.CallSid);
    console.log('✅ Appel accepté:', call.parameters.CallSid);
    console.groupEnd();
    showToast('success', 'Appel accepté', 3000);
  }, [incomingCall, startCallTimer, showToast]);

  // Rejeter un appel entrant
  const reject = useCallback(() => {
    const call = incomingCall;

    if (!call) {
      console.warn('⚠️ [TWILIO] Aucun appel entrant à rejeter');
      return;
    }

    console.groupCollapsed('📞 [TWILIO] Rejet appel entrant');
    call.reject();
    setIncomingCall(null);
    console.log('❌ Appel rejeté:', call.parameters.CallSid);
    console.groupEnd();
    showToast('info', 'Appel rejeté', 3000);
  }, [incomingCall, showToast]);

  // Nettoyer
  const cleanup = useCallback(async () => {
    const device = deviceRef.current;

    if (device) {
      console.log('[TWILIO] Nettoyage Device');
      stopCallTimer();

      // Déconnecter les appels actifs
      const activeCalls = device.calls;
      activeCalls.forEach((call) => call.disconnect());

      // Retirer tous les listeners
      device.removeAllListeners();

      // Détruire le device
      device.destroy();
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
