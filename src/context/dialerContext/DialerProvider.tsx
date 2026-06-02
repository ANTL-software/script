import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
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
  const deviceRef = useRef<Device | null>(null);
  const isClosingRef = useRef<boolean>(false);
  const isCallActiveRef = useRef<boolean>(false);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const hasCalledEstablishedRef = useRef<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);

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
    console.log('[TWILIO] 📍 STEP 2.1: Entrée fetchTwilioToken');
    try {
      console.log('[TWILIO] 📍 STEP 2.2: Appel twilioService.getAccessToken()...');
      const tokenData = await twilioService.getAccessToken();
      console.log('[TWILIO] 📍 STEP 2.3: Token reçu pour:', tokenData.identity);
      console.log('✅ [TWILIO] Token reçu pour:', tokenData.identity);
      return tokenData.accessToken;
    } catch (error) {
      console.error('[TWILIO] ❌ Erreur récupération token:', error);
      return null;
    }
  }, []);

  // Initialiser Twilio Device (SDK v2.x - new Device())
  const initializeTwilioDevice = useCallback(async () => {
    console.log('[TWILIO] 📍 STEP 1: Entrée initializeTwilioDevice');
    console.log('[TWILIO] 📍 STEP 1: isInitializingRef.current =', isInitializingRef.current);
    console.log('[TWILIO] 📍 STEP 1: deviceRef.current =', deviceRef.current);

    // Guard : ne pas réinitialiser si déjà en cours ou déjà existant
    if (isInitializingRef.current) {
      console.log('[TWILIO] ⚠️ Initialisation déjà en cours, skip');
      return;
    }

    if (deviceRef.current) {
      console.log('[TWILIO] ⚠️ Device déjà existant, skip réinitialisation');
      return;
    }

    isInitializingRef.current = true;
    console.log('[TWILIO] 📍 STEP 2: Guards passés, appel fetchTwilioToken...');

    try {
      // Récupérer le Access Token depuis le backend
      const accessToken = await fetchTwilioToken();
      console.log('[TWILIO] 📍 STEP 3: Token reçu =', accessToken ? 'OUI' : 'NON');

      if (!accessToken) {
        throw new Error('Impossible de récupérer le Access Token Twilio');
      }

      console.groupCollapsed('🚀 [TWILIO] Initialisation Device v2.x (new Device())');

      // Créer une NOUVELLE instance de Device (SDK v2.x API)
      // SANS options pour éviter les problèmes de compatibilité
      console.log('[TWILIO] 📍 STEP 3.5: Création Device avec token (longueur:', accessToken.length, ')');
      const device = new Device(accessToken);
      console.log('[TWILIO] 📍 STEP 3.6: Device créé, type:', typeof device, 'état:', device.state);

      deviceRef.current = device;

      // Enregistrer les event handlers
      device.on('registered', () => {
        console.log('✅ [TWILIO] Device registered (connecté au serveur Twilio)');
        setSipConnected(true);
      });

      device.on('unregistered', () => {
        console.warn('⚠️ [TWILIO] Device unregistered');
        setSipConnected(false);
      });

      device.on('registering', () => {
        console.log('🔄 [TWILIO] Device registering...');
      });

      // Tracer TOUS les changements d'état pour le debug
      device.on('stateChanged', (state: any) => {
        console.log('🔄 [TWILIO] État Device changé:', state);
      });

      device.on('error', (error: any) => {
        console.error('❌ [TWILIO] Erreur Device:', error);
        setSipConnected(false);
        showToast('error', 'Erreur Twilio: ' + error.message, 5000);
      });

      device.on('incoming', (call: Call) => {
        console.groupCollapsed('📞 [TWILIO] Appel entrant');
        console.log('From:', call.parameters.From);
        console.log('Call SID:', call.parameters.CallSid);
        setIncomingCall({
          from: call.parameters.From,
          displayName: call.parameters.From
        });
        console.groupEnd();
        showToast('info', `Appel entrant de: ${call.parameters.From}`, 10000);
      });

      device.on('callConnected', (call: Call) => {
        console.groupCollapsed('✅ [TWILIO] Appel connecté');
        console.log('Call SID:', call.parameters.CallSid);
        isCallActiveRef.current = true;
        startCallTimer();
        setStatut('en_appel');
        setDepuisLe(new Date());
        console.groupEnd();
        showToast('success', 'Appel établi', 3000);
      });

      device.on('callEnded', (call: Call) => {
        console.groupCollapsed('📞 [TWILIO] Appel terminé');
        console.log('Call SID:', call.parameters.CallSid);
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

      device.on('cancel', (call: Call) => {
        console.log('⚠️ [TWILIO] Appel annulé:', call.parameters.CallSid);
        if (incomingCall?.from === call.parameters.From) {
          setIncomingCall(null);
        }
        showToast('warning', 'Appel annulé', 3000);
      });

      device.on('destroyed', () => {
        console.error('💥 [TWILIO] Device destroyed - STACK TRACE:');
        console.error('💥 [TWILIO] isInitializingRef.current:', isInitializingRef.current);
        console.trace('[TWILIO] Appelé depuis:');
        setSipConnected(false);
        deviceRef.current = null;
        isInitializingRef.current = false;
      });

      // IMPORTANT: Enregistrer manuellement le Device APRÈS avoir configuré tous les event handlers
      console.log('📞 [TWILIO] Appel manuel à device.register()...');
      console.log('📞 [TWILIO] Device state AVANT register:', device.state);

      try {
        // Timeout de 10 secondes pour l'enregistrement
        const registerPromise = device.register();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Register timeout après 10s')), 10000)
        );

        await Promise.race([registerPromise, timeoutPromise]);
        console.log('✅ [TWILIO] Register appelé avec succès, attente événement registered...');
      } catch (err) {
        console.error('❌ [TWILIO] Erreur lors de register():', err);
        console.error('❌ [TWILIO] Device state APRÈS échec register:', device.state);
        // Ne pas détruire le Device - continuer à attendre l'événement registered
      }

      console.log('✅ [TWILIO] Device v2.x créé avec succès, registration en cours...');
      console.log('✅ [TWILIO] Device state FINAL:', device.state);
      console.groupEnd();
      isInitializingRef.current = false;

    } catch (error) {
      console.error('❌ [TWILIO] Erreur initialisation:', error);
      console.groupEnd();
      showToast('error', 'Impossible d\'initialiser Twilio: ' + (error as Error).message, 8000);
      setSipConnected(false);
      isInitializingRef.current = false;
    }
  }, [showToast, startCallTimer, stopCallTimer, fetchTwilioToken]);

  // ============================================================
  // INITIALISATION TWILIO (useEffect séparé pour éviter les re-créations)
  // ============================================================

  useEffect(() => {
    if (!isAuthenticated) {
      // Nettoyer Twilio si déconnexion
      const device = deviceRef.current;
      if (device) {
        console.log('[TWILIO] Déconnexion - destruction Device');
        device.removeAllListeners();
        device.destroy();
        deviceRef.current = null;
        setSipConnected(false);
      }
      return;
    }

    // Initialiser Twilio SEULEMENT si pas déjà initialisé
    console.log('[TWILIO] useEffect - isAuthenticated:', isAuthenticated, ', deviceRef.current:', deviceRef.current);
    initializeTwilioDevice();
  }, [isAuthenticated, initializeTwilioDevice]);

  // ============================================================
  // INITIALISATION AU MONTAGE (sans Twilio)
  // ============================================================

  useEffect(() => {
    if (!isAuthenticated) return;

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
    };
  }, [isAuthenticated]);

  // ============================================================
  // FONCTIONS D'APPEL
  // ============================================================

  // Appel sortant
  const call = useCallback(async (phoneNumber: string, campagneId?: number, prospectId?: number) => {
    console.groupCollapsed(`📞 [APPEL] ${phoneNumber}`);
    console.log('Campagne:', campagneId, '| Prospect:', prospectId);

    const device = deviceRef.current;
    if (!device || device.state !== 'registered') {
      console.error('❌ Impossible d\'appeler — Twilio Device non prêt (state:', device?.state, ')');
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

      // Passer l'appel via Twilio (SDK v2.x - Promise)
      const call = await device.connect({ params: { To: formattedNumber } });

      if (!call) {
        throw new Error('device.connect() a retourné null');
      }

      isCallActiveRef.current = true;
      setStatut('en_appel');
      setDepuisLe(new Date());
      startCallTimer();

      // IMPORTANT: Écouter les événements de fin d'appel sur le call lui-même
      // L'événement 'disconnect' se déclenche quand l'interlocuteur raccroche
      call.on('disconnect', () => {
        console.groupCollapsed('📞 [TWILIO] Appel terminé (disconnect)');
        console.log('Call SID:', call.parameters.CallSid);
        stopCallTimer();
        isCallActiveRef.current = false;
        setStatut('pause_apres_appel');
        setDepuisLe(new Date());

        // Synchro backend
        dialerService.changerStatut('pause_apres_appel').catch((err) => {
          console.error('❌ [TWILIO] Erreur changement statut:', err);
        });

        console.groupEnd();
        showToast('info', 'Appel terminé', 3000);
      });

      // Écouter aussi les autres événements du call pour robustesse
      call.on('reject', () => {
        console.log('⚠️ [TWILIO] Appel rejeté');
      });

      call.on('cancel', () => {
        console.log('⚠️ [TWILIO] Appel annulé');
      });

      // Mettre à jour la session backend
      if (prospectId && campagneId) {
        dialerService.startSession(prospectId, campagneId).catch(err => {
          console.error('[Session] Erreur startSession:', err);
        });
      }

      console.log('✅ [TWILIO] Appel lancé, Call SID:', call.parameters.CallSid);
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
    const device = deviceRef.current;
    if (!device) return;

    const activeCalls = device.calls;
    if (activeCalls.length === 0) {
      console.warn('⚠️ Aucun appel actif');
      return;
    }

    console.groupCollapsed('📞 [APPEL] Hangup manuel');
    activeCalls.forEach((call) => call.disconnect());
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
    const call = incomingCall as any;
    if (!call) {
      console.warn('⚠️ Aucune connexion à répondre');
      return;
    }

    console.groupCollapsed('📞 [APPEL ENTRANT] Réponse');
    call.accept?.();
    setIncomingCall(null);
    isCallActiveRef.current = true;
    startCallTimer();
    setStatut('en_appel');
    setDepuisLe(new Date());
    console.log('✅ Appel accepté');
    console.groupEnd();
  }, [incomingCall, startCallTimer]);

  // Rejeter
  const reject = useCallback(() => {
    const call = incomingCall as any;
    if (!call) {
      console.warn('⚠️ Aucune connexion à rejeter');
      return;
    }

    call.reject?.();
    setIncomingCall(null);
    console.log('❌ Appel rejeté');
  }, [incomingCall]);

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
