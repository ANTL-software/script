import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';

// Déclaration de type pour window.Twilio (chargé via import dans main.tsx)
declare global {
  interface Window {
    Twilio: {
      Device: {
        setup: (token: string, options?: any) => void;
        connect: (options: { phoneNumber: string }) => any;
        activeConnections: () => any[];
        incomingConnections: () => any[];
        status: () => string;
        destroy: () => void;
        on: (event: string, handler: (...args: any[]) => void) => void;
        off: (event: string, handler: (...args: any[]) => void) => void;
      };
    };
  }
}
import { DialerContext } from './DialerContext';
import type { IncomingCall } from './DialerContext';
import { UserContext } from '../userContext/UserContext';
import { useContext } from 'react';
import { dialerService, appelService, closingService, twilioService } from '../../API/services';
import type { StatutDialer, RaisonPause, Prospect, ProspectAssigne, OrigineAppel } from '../../utils/types';
import { formatPhoneE164, isMobilePhone } from '../../utils/scripts/formatters';
import { useToast } from '../../hooks';

interface DialerProviderProps {
  children: ReactNode;
}

// Types pour Twilio.window.Twilio.Device
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

export const DialerProvider = ({ children }: DialerProviderProps) => {
  const userContext = useContext(UserContext);
  const isAuthenticated = userContext?.isAuthenticated ?? false;
  const { showToast } = useToast();

  // État Dialer (compatible avec l'existant)
  const [statut, setStatut] = useState<StatutDialer>('hors_ligne');
  const [raisonPause, setRaisonPause] = useState<RaisonPause | null>(null);
  const [depuisLe, setDepuisLe] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [sipConnected, setSipConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [prochainProspect, setProchainProspect] = useState<(Prospect & ProspectAssigne) | null>(null);
  const [currentCampagneId, setCurrentCampagneId] = useState<number | null>(null);
  const [currentAppelId, setCurrentAppelId] = useState<number | null>(null);
  const [currentIdProspection, setCurrentIdProspection] = useState<number | null>(null);
  const [currentOrigineAppel, setCurrentOrigineAppel] = useState<OrigineAppel | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deviceRef = useRef<TwilioDevice | null>(null);
  const incomingConnectionRef = useRef<TwilioConnection | null>(null);
  const isClosingRef = useRef<boolean>(false);
  const isCallActiveRef = useRef<boolean>(false);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const hasCalledEstablishedRef = useRef<boolean>(false);

  // Formatage de la durée d'appel en MM:SS
  const callDurationFormatted = useMemo(() => {
    const minutes = Math.floor(callDuration / 60);
    const seconds = callDuration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [callDuration]);

  const startCallTimer = useCallback(() => {
    setCallDuration(0);
    hasCalledEstablishedRef.current = false;
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  }, []);

  const stopCallTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ============================================================
  // INITIALISATION TWILIO
  // ============================================================

  // Récupérer l'Access Token Twilio depuis le backend
  const fetchTwilioToken = useCallback(async () => {
    console.groupCollapsed('🔐 [TWILIO] Récupération Access Token');
    try {
      // Utiliser l'endpoint dédié pour Twilio Voice SDK
      const tokenData = await twilioService.getAccessToken();
      console.log('✅ Token reçu pour:', tokenData.identity);
      console.groupEnd();
      return tokenData.accessToken;
    } catch (error) {
      console.error('[TWILIO] Erreur récupération token:', error);
      console.groupEnd();
      return null;
    }
  }, []);

  // Initialiser Twilio.window.Twilio.Device (appelé depuis useEffect quand auth change)
  const initializeTwilioDevice = useCallback(async () => {
    console.groupCollapsed('🚀 [TWILIO] Initialisation window.Twilio.Device');
    
    try {
      console.log('✅ [TWILIO] window.Twilio.Device disponible (CDN)');
      
      // Récupérer le Access Token depuis le backend
      const accessToken = await fetchTwilioToken();
      
      if (!accessToken) {
        throw new Error('Impossible de récupérer le Access Token Twilio');
      }

      // Vérifier que Twilio est chargé
      if (typeof window === 'undefined' || !window.Twilio.Device) {
        throw new Error('Twilio Voice SDK non chargé. CDN manquant.');
      }

      // Stocker la référence
      deviceRef.current = window.Twilio.Device;

      // Configurer les événements Twilio
      window.Twilio.Device.on('ready', () => {
        console.log('✅ [TWILIO] window.Twilio.Device prêt');
        setSipConnected(true);
      });

      window.Twilio.Device.on('error', (error: any) => {
        console.error('❌ [TWILIO] Erreur window.Twilio.Device:', error);
        setSipConnected(false);
        showToast('error', 'Erreur Twilio: ' + error.message, 5000);
      });

      window.Twilio.Device.on('offline', () => {
        console.warn('⚠️ [TWILIO] window.Twilio.Device hors ligne');
        setSipConnected(false);
      });

      window.Twilio.Device.on('incoming', (connection: TwilioConnection) => {
        console.groupCollapsed('📞 [TWILIO] Appel entrant');
        console.log('From:', connection.parameters.From);
        console.log('CallSid:', connection.parameters.CallSid);
        incomingConnectionRef.current = connection;
        setIncomingCall({
          from: connection.parameters.From,
          displayName: connection.parameters.From
        });
        console.groupEnd();
        showToast('info', `Appel entrant de: ${connection.parameters.From}`, 10000);
      });

      window.Twilio.Device.on('connect', (connection: TwilioConnection) => {
        console.groupCollapsed('✅ [TWILIO] Appel connecté');
        console.log('CallSid:', connection.sid);
        isCallActiveRef.current = true;
        startCallTimer();
        setStatut('en_appel');
        setDepuisLe(new Date());
        console.groupEnd();
        showToast('success', 'Appel établi', 3000);
      });

      window.Twilio.Device.on('disconnect', (connection: TwilioConnection) => {
        console.groupCollapsed('📞 [TWILIO] Appel terminé');
        console.log('CallSid:', connection.sid);
        stopCallTimer();
        isCallActiveRef.current = false;
        setStatut('pause_apres_appel');
        setDepuisLe(new Date());
        setIncomingCall(null);
        
        // Synchro backend
        dialerService.changerStatut('pause_apres_appel').catch(() => {});
        console.groupEnd();
        showToast('info', 'Appel terminé', 3000);
      });

      window.Twilio.Device.on('cancel', (connection: TwilioConnection) => {
        console.log('⚠️ [TWILIO] Appel annulé:', connection.sid);
        if (incomingConnectionRef.current?.sid === connection.sid) {
          setIncomingCall(null);
          incomingConnectionRef.current = null;
        }
        showToast('warning', 'Appel annulé', 3000);
      });

      // Configurer window.Twilio.Device avec l'Access Token
      const isDev = import.meta.env.MODE === 'development';
      window.Twilio.Device.setup(accessToken, {
        debug: isDev,
        logLevel: isDev ? 3 : 1,
        region: import.meta.env.VITE_TWILIO_REGION || undefined,
        edge: import.meta.env.VITE_TWILIO_EDGE || undefined,
        insights: true
      });

      console.log('✅ [TWILIO] window.Twilio.Device configuré');
      console.groupEnd();
      
    } catch (error) {
      console.error('❌ [TWILIO] Erreur initialisation:', error);
      console.groupEnd();
      showToast('error', 'Impossible d\'initialiser Twilio: ' + (error as Error).message, 8000);
      setSipConnected(false);
    }
  }, [showToast, startCallTimer, stopCallTimer, fetchTwilioToken]);

  // ============================================================
  // INITIALISATION AU MONTAGE
  // ============================================================

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initialiser Twilio
    initializeTwilioDevice();

    // Récupérer le statut backend
    const recoverStatus = async () => {
      try {
        const data = await dialerService.getStatut();
        setStatut(data.statut);
        setRaisonPause(data.raison_pause ?? null);
        if (data.debut_statut) {
          setDepuisLe(new Date(data.debut_statut));
        }
      } catch {}
    };
    recoverStatus();

    // Charger la première campagne
    const loadAgentCampaign = async () => {
      try {
        const campagnes = await dialerService.getCampagnesAgent();
        if (campagnes && campagnes.length > 0) {
          setCurrentCampagneId(campagnes[0].id_campagne);
        }
      } catch (err) {
        console.error('[DIALER] Erreur chargement campagnes:', err);
      }
    };
    loadAgentCampaign();

    // Heartbeat
    const sendHeartbeat = () => {
      dialerService.heartbeat().catch(() => {});
    };
    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 60000);

    // Beforeunload
    const handleBeforeUnload = () => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8800/api';
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      fetch(`${baseUrl}/agents/me/statut`, {
        method: 'PATCH',
        credentials: 'include',
        headers,
        body: JSON.stringify({ statut: 'hors_ligne' }),
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        sessionStorage.setItem('antl_hidden_since', Date.now().toString());
      } else {
        const hiddenSince = sessionStorage.getItem('antl_hidden_since');
        if (hiddenSince) {
          const elapsed = Date.now() - parseInt(hiddenSince, 10);
          sessionStorage.removeItem('antl_hidden_since');
          if (elapsed > 10 * 60 * 1000) {
            dialerService.getStatut().then(data => {
              setStatut(data.statut);
              setRaisonPause(data.raison_pause ?? null);
              if (data.debut_statut) setDepuisLe(new Date(data.debut_statut));
            }).catch(() => {});
          }
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
      
      // Nettoyer Twilio
      if (window.Twilio.Device) {
        window.Twilio.Device.destroy();
      }
    };
  }, [isAuthenticated, initializeTwilioDevice]);

  // ============================================================
  // FONCTIONS D'APPEL
  // ============================================================

  // Appel sortant
  const call = useCallback(async (phoneNumber: string, campagneId?: number, prospectId?: number) => {
    console.groupCollapsed(`📞 [APPEL] ${phoneNumber}`);
    console.log('Campagne:', campagneId, '| Prospect:', prospectId);

    if (!window.Twilio.Device || window.Twilio.Device.status() !== 'ready') {
      console.error('❌ Impossible d\'appeler — Twilio window.Twilio.Device non prêt');
      console.groupEnd();
      showToast('error', 'Twilio non prêt - Veuillez réessayer', 5000);
      return;
    }

    if (isCallActiveRef.current) {
      console.warn('⚠️ Annulé — Appel déjà en cours');
      console.groupEnd();
      return;
    }

    try {
      setCurrentCampagneId(campagneId ?? null);
      isClosingRef.current = false;
      isCallActiveRef.current = true;

      // Créer l'appel en DB
      if (campagneId && prospectId) {
        setCurrentOrigineAppel('auto');
        try {
          const appel = await appelService.createAppel({
            id_prospect: prospectId,
            id_campagne: campagneId,
            statut_appel: 'en_cours',
            origine_appel: 'auto',
            id_prospection: prochainProspect?.id_prospection,
          });
          setCurrentAppelId(appel.id_appel);
        } catch (err) {
          console.error('❌ Erreur création appel:', err);
        }
      }

      // Formater le numéro
      const formattedNumber = formatPhoneE164(phoneNumber);
      console.log('📤 [TWILIO] Appel vers:', formattedNumber);

      // Passer l'appel via Twilio
      const connection = window.Twilio.Device.connect({
        phoneNumber: formattedNumber
      });

      if (!connection) {
        throw new Error('window.Twilio.Device.connect() a retourné null');
      }

      isCallActiveRef.current = true;
      setStatut('en_appel');
      setDepuisLe(new Date());
      startCallTimer();

      // Mettre à jour la session backend
      if (prospectId && campagneId) {
        dialerService.startSession(prospectId, campagneId).catch(err => {
          console.error('[Session] Erreur startSession:', err);
        });
      }

      console.log('✅ [TWILIO] Appel lancé, Call SID:', connection.sid);
      console.groupEnd();
      
    } catch (err) {
      isCallActiveRef.current = false;
      console.error('❌ [ERREUR] Appel:', err);
      console.groupEnd();
      showToast('error', 'Échec de l\'appel — Vérifiez votre connexion', 5000);
    }
  }, [startCallTimer, prochainProspect]);

  // Raccrocher
  const hangup = useCallback(() => {
    if (!window.Twilio.Device) return;

    const activeConnections = window.Twilio.Device.activeConnections();
    if (activeConnections.length === 0) {
      console.warn('⚠️ Aucun appel actif');
      return;
    }

    console.groupCollapsed('📞 [APPEL] Hangup manuel');
    activeConnections.forEach((conn: any) => conn.disconnect());
    stopCallTimer();
    isCallActiveRef.current = false;
    setStatut('pause_apres_appel');
    setDepuisLe(new Date());
    dialerService.changerStatut('pause_apres_appel').catch(() => {});
    dialerService.endSession().catch(() => {});
    console.groupEnd();
  }, [stopCallTimer]);

  // Répondre
  const answer = useCallback(() => {
    const connection = incomingConnectionRef.current;
    if (!connection) {
      console.warn('⚠️ Aucune connexion à répondre');
      return;
    }

    console.groupCollapsed('📞 [APPEL ENTRANT] Réponse');
    connection.accept();
    incomingConnectionRef.current = null;
    setIncomingCall(null);
    isCallActiveRef.current = true;
    startCallTimer();
    setStatut('en_appel');
    setDepuisLe(new Date());
    console.log('✅ Appel accepté');
    console.groupEnd();
  }, [startCallTimer]);

  // Rejeter
  const reject = useCallback(() => {
    const connection = incomingConnectionRef.current;
    if (!connection) {
      console.warn('⚠️ Aucune connexion à rejeter');
      return;
    }

    connection.reject();
    incomingConnectionRef.current = null;
    setIncomingCall(null);
    console.log('❌ Appel rejeté');
  }, []);

  // Changer de statut
  const changerStatut = useCallback(async (nouveauStatut: StatutDialer, raison?: RaisonPause) => {
    // Guards
    if (nouveauStatut === 'disponible' && closingService.hasPending()) {
      console.warn('[DIALER] Impossible de passer disponible : closing en attente');
      return;
    }

    if (nouveauStatut === 'disponible' && isCallActiveRef.current) {
      console.warn('[DIALER] Impossible de passer disponible : appel en cours');
      return;
    }

    if (nouveauStatut === 'disponible' && !sipConnected) {
      console.warn('[DIALER] Impossible de passer disponible : Twilio non connecté');
      showToast('error', 'Twilio non connecté — Impossible de passer disponible', 5000);
      return;
    }

    setStatut(nouveauStatut);
    setRaisonPause(raison ?? null);
    setDepuisLe(new Date());
    setProchainProspect(null);

    setIsLoading(true);
    try {
      await dialerService.changerStatut(nouveauStatut, raison);

      if (nouveauStatut === 'disponible') {
        const MAX_SKIPS = 10;
        for (let i = 0; i < MAX_SKIPS; i++) {
          try {
            const candidate = await dialerService.getNextProspect();
            if (candidate.telephone && isMobilePhone(candidate.telephone) && !candidate.autoriser_mobile) {
              console.warn(`[DIALER] Prospect #${candidate.id_prospect} skip (mobile ${candidate.telephone})`);
              if (candidate.id_prospection) dialerService.markMobile(candidate.id_prospection).catch(() => {});
              continue;
            }
            setProchainProspect(candidate);
            break;
          } catch {
            break;
          }
        }
      }
    } catch (error) {
      console.warn('[Dialer] Échec synchro backend, statut local appliqué', error);
    } finally {
      setIsLoading(false);
    }
  }, [sipConnected, showToast]);

  // Ouvrir un prospect manuellement
  const openProspectManual = useCallback(async (prospectId: number, origin: 'manuel' | 'rappel', prospectPhone?: string) => {
    try {
      const campagnes = await dialerService.getCampagnesAgent();
      if (!campagnes || campagnes.length === 0) {
        console.warn('[DIALER] Aucune campagne active');
        return;
      }
      const campagne = campagnes[0];
      const campagneId = campagne.id_campagne;

      if (prospectPhone && isMobilePhone(prospectPhone) && !campagne.autoriser_mobile) {
        console.error('[DIALER] Appel bloqué : numéro mobile détecté', prospectPhone);
        throw new Error('Impossible d\'appeler un numéro mobile (campagne ne l\'autorise pas)');
      }

      setStatut('appel_sortant');
      setRaisonPause(null);
      setDepuisLe(new Date());
      setProchainProspect(null);
      await dialerService.changerStatut('appel_sortant');

      const appel = await appelService.createAppel({
        id_prospect: prospectId,
        id_campagne: campagneId,
        statut_appel: 'en_cours',
        origine_appel: origin,
        numero_telephone: prospectPhone,
      });

      setCurrentAppelId(appel.id_appel);
      setCurrentCampagneId(campagneId);
      setCurrentOrigineAppel(origin);

      if (prospectPhone) {
        await call(prospectPhone, campagneId, prospectId);
      }
    } catch (err) {
      console.error('[DIALER] Erreur openProspectManual:', err);
      throw err;
    }
  }, [call]);

  // Clear prochain prospect
  const clearProchainProspect = useCallback(() => {
    setProchainProspect(null);
    setCurrentAppelId(null);
    setCurrentIdProspection(null);
    setCurrentOrigineAppel(null);
    isClosingRef.current = false;
  }, []);

  // Contexte à retourner
  return (
    <DialerContext.Provider value={{
      statut,
      raisonPause,
      depuisLe,
      isLoading,
      sipConnected,
      callDuration,
      callDurationFormatted,
      incomingCall,
      prochainProspect,
      currentCampagneId,
      currentAppelId,
      currentIdProspection,
      currentOrigineAppel,
      remoteAudioRef,
      changerStatut,
      clearProchainProspect,
      call,
      hangup,
      answer,
      reject,
      openProspectManual,
    }}>
      {children}
      <audio ref={remoteAudioRef} id="remoteAudio" autoPlay playsInline muted={false} />
    </DialerContext.Provider>
  );
};
