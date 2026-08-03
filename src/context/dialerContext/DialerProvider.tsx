import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { DialerContext } from './DialerContext';
import type { IncomingCall } from './DialerContext';
import { UserContext } from '../userContext/UserContext';
import { useContext } from 'react';
import { dialerService, appelService, closingService, twilioService, rendezVousService, enregistrementService, csrfService } from '../../API/services';
import type { StatutDialer, RaisonPause, Prospect, ProspectAssigne, OrigineAppel, ActiveCallInsights, CallClassification } from '../../utils/types';
import { getApiBaseUrl, isProspectTestMode, shouldDisableLocalTwilio } from '../../utils/scripts/utils';
import { formatPhoneE164, isMobilePhone } from '../../utils/scripts/formatters';
import { pickDialerBootstrapCampaign, pickRuntimeCampaign, resolveManualCallOrigin } from '../../utils/scripts/runtimeCampaign';
import { useToast } from '../../hooks';

interface DialerProviderProps {
  children: ReactNode;
}

type TwilioCallWithStreams = Call & {
  getLocalStream?: () => MediaStream | null;
  getRemoteStream?: () => MediaStream | null;
  sid?: string;
};

type AudioContextWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const getTwilioCallSid = (call: Call): string | undefined => {
  const recordableCall = call as TwilioCallWithStreams;
  return call.parameters.CallSid || recordableCall.sid;
};

const getRecordingExtension = (mimeType: string): string => {
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
};

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Erreur inconnue';
};

const getTwilioEdgeConfiguration = (): string | string[] | undefined => {
  const configuredEdges = (import.meta.env.VITE_TWILIO_EDGE || '')
    .split(',')
    .map((edge: string) => edge.trim())
    .filter(Boolean);

  if (configuredEdges.length === 0) return undefined;
  return configuredEdges.length === 1 ? configuredEdges[0] : configuredEdges;
};

export const DialerProvider = ({ children }: DialerProviderProps) => {
  const userContext = useContext(UserContext);
  const isAuthenticated = userContext?.isAuthenticated ?? false;
  const logout = userContext?.logout;
  const { showToast } = useToast();

  // État Dialer (compatible avec l'existant)
  const [statut, setStatut] = useState<StatutDialer>('hors_ligne');
  const [raisonPause, setRaisonPause] = useState<RaisonPause | null>(null);
  const [depuisLe, setDepuisLe] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [sipConnected, setSipConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [lastSentDigits, setLastSentDigits] = useState('');
  const [hasActiveTwilioCall, setHasActiveTwilioCall] = useState(false);
  const [isCallConnected, setIsCallConnected] = useState(false);

  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [prochainProspect, setProchainProspect] = useState<(Prospect & ProspectAssigne) | null>(null);
  const [currentCampagneId, setCurrentCampagneId] = useState<number | null>(null);
  const [currentAppelId, setCurrentAppelId] = useState<number | null>(null);
  const [currentIdProspection, setCurrentIdProspection] = useState<number | null>(null);
  const [currentOrigineAppel, setCurrentOrigineAppel] = useState<OrigineAppel | null>(null);
  const [currentRendezVousSourceId, setCurrentRendezVousSourceId] = useState<number | null>(null);
  const [currentCallInsights, setCurrentCallInsights] = useState<ActiveCallInsights>({
    answeredBy: null,
    classification: null,
    amdStatus: null,
    sviDetecte: false,
    bridgedToAgentAt: null,
    endedBySystem: false,
    endReason: null
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dtmfResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingStartIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const incomingCallRef = useRef<Call | null>(null);
  const isClosingRef = useRef<boolean>(false);
  const isCallActiveRef = useRef<boolean>(false);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const hasCalledEstablishedRef = useRef<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);
  const isFetchingNextProspectRef = useRef<boolean>(false);
  const tokenRefreshPromiseRef = useRef<Promise<boolean> | null>(null);
  const recoveryPromiseRef = useRef<Promise<boolean> | null>(null);
  const isForceLogoutInProgressRef = useRef<boolean>(false);

  const currentAppelIdRef = useRef<number | null>(null);
  const currentOrigineAppelRef = useRef<OrigineAppel | null>(null);
  const callDurationRef = useRef<number>(0);
  const callAcceptedAtRef = useRef<number | null>(null);
  useEffect(() => {
    currentAppelIdRef.current = currentAppelId;
  }, [currentAppelId]);
  useEffect(() => {
    currentOrigineAppelRef.current = currentOrigineAppel;
  }, [currentOrigineAppel]);
  useEffect(() => {
    callDurationRef.current = callDuration;
  }, [callDuration]);

  // Formatage de la durée d'appel en MM:SS
  const callDurationFormatted = useMemo(() => {
    const minutes = Math.floor(callDuration / 60);
    const seconds = callDuration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [callDuration]);

  const startCallTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const acceptedAt = Date.now();
    callAcceptedAtRef.current = acceptedAt;
    callDurationRef.current = 0;
    setCallDuration(0);
    hasCalledEstablishedRef.current = false;
    timerRef.current = setInterval(() => {
      const nextDuration = Math.max(0, Math.floor((Date.now() - acceptedAt) / 1000));
      callDurationRef.current = nextDuration;
      setCallDuration(nextDuration);
    }, 1000);
  }, []);

  const stopCallTimer = useCallback(() => {
    let finalDuration = callDurationRef.current;

    if (callAcceptedAtRef.current) {
      finalDuration = Math.max(
        finalDuration,
        Math.max(0, Math.floor((Date.now() - callAcceptedAtRef.current) / 1000))
      );
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    callDurationRef.current = finalDuration;
    setCallDuration(finalDuration);
  }, []);

  const scheduleDtmfReset = useCallback(() => {
    if (dtmfResetTimeoutRef.current) {
      clearTimeout(dtmfResetTimeoutRef.current);
    }

    dtmfResetTimeoutRef.current = setTimeout(() => {
      setLastSentDigits('');
      dtmfResetTimeoutRef.current = null;
    }, 4000);
  }, []);

  const clearActiveCall = useCallback(() => {
    activeCallRef.current = null;
    incomingCallRef.current = null;
    callAcceptedAtRef.current = null;
    setHasActiveTwilioCall(false);
    setIsCallConnected(false);
    setLastSentDigits('');

    if (dtmfResetTimeoutRef.current) {
      clearTimeout(dtmfResetTimeoutRef.current);
      dtmfResetTimeoutRef.current = null;
    }

    setCurrentCallInsights({
      answeredBy: null,
      classification: null,
      amdStatus: null,
      sviDetecte: false,
      bridgedToAgentAt: null,
      endedBySystem: false,
      endReason: null
    });
  }, []);

  const registerActiveCall = useCallback((call: Call) => {
    activeCallRef.current = call;
    setHasActiveTwilioCall(true);
  }, []);

  // Références pour le mixage et l'enregistrement audio WebRTC
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef<boolean>(false);

  // Débuter l'enregistrement
  const startRecording = useCallback((call: Call) => {
    if (isRecordingRef.current) {
      console.warn('[RECORDING] Un enregistrement est déjà en cours.');
      return;
    }

    if (recordingStartIntervalRef.current) {
      clearInterval(recordingStartIntervalRef.current);
      recordingStartIntervalRef.current = null;
    }

    let retries = 0;
    const maxRetries = 15; // 3 secondes (15 * 200ms)
    recordingStartIntervalRef.current = setInterval(() => {
      if (!isCallActiveRef.current) {
        if (recordingStartIntervalRef.current) {
          clearInterval(recordingStartIntervalRef.current);
          recordingStartIntervalRef.current = null;
        }
        return;
      }

      const recordableCall = call as TwilioCallWithStreams;
      const localStream = recordableCall.getLocalStream?.() ?? null;
      const remoteStream = recordableCall.getRemoteStream?.() ?? null;

      if (localStream && remoteStream) {
        if (recordingStartIntervalRef.current) {
          clearInterval(recordingStartIntervalRef.current);
          recordingStartIntervalRef.current = null;
        }
        try {
          console.log('[RECORDING] Flux WebRTC détectés. Lancement du mixage audio...');

          const audioWindow = window as AudioContextWindow;
          const AudioContextClass = window.AudioContext || audioWindow.webkitAudioContext;
          if (!AudioContextClass) {
            throw new Error('AudioContext indisponible dans ce navigateur');
          }
          const audioContext = new AudioContextClass();
          audioContextRef.current = audioContext;

          const localSource = audioContext.createMediaStreamSource(localStream);
          const remoteSource = audioContext.createMediaStreamSource(remoteStream);
          const destination = audioContext.createMediaStreamDestination();

          localSource.connect(destination);
          remoteSource.connect(destination);

          const mixedStream = destination.stream;

          let mimeType = 'audio/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/ogg';
          if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = ''; // défaut navigateur

          const recorder = mimeType
            ? new MediaRecorder(mixedStream, { mimeType })
            : new MediaRecorder(mixedStream);

          mediaRecorderRef.current = recorder;
          audioChunksRef.current = [];
          isRecordingRef.current = true;

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };

          recorder.onstop = async () => {
            console.log('[RECORDING] Enregistrement arrêté. Préparation de l\'envoi...');
            const recordingMimeType = recorder.mimeType || 'audio/webm';
            const recordedBlob = new Blob(audioChunksRef.current, { type: recordingMimeType });

            if (audioContextRef.current) {
              audioContextRef.current.close().catch(err => console.error('[RECORDING] Erreur fermeture AudioContext:', err));
              audioContextRef.current = null;
            }

            const activeAppelId = currentAppelIdRef.current;
            if (activeAppelId && recordedBlob.size > 1000) {
              try {
                const ext = getRecordingExtension(recordingMimeType);
                const filename = `recording_${activeAppelId}_${Date.now()}.${ext}`;
                const file = new File([recordedBlob], filename, { type: recordingMimeType });

                console.log(`[RECORDING] Upload de l'enregistrement pour l'appel #${activeAppelId}...`);
                await enregistrementService.uploadRecording(activeAppelId, file, callDurationRef.current);
                console.log(`[RECORDING] Enregistrement uploadé avec succès`);
                showToast('success', 'Enregistrement de l\'appel sauvegardé', 3000);
              } catch (err) {
                console.error('[RECORDING] Échec de l\'upload:', err);
                showToast('error', 'Échec de la sauvegarde de l\'enregistrement', 5000);
              }
            } else {
              console.warn('[RECORDING] Fichier trop petit ou ID appel manquant:', activeAppelId);
            }
            isRecordingRef.current = false;
          };

          recorder.start(1000);
          console.log('[RECORDING] Enregistrement démarré.');
        } catch (err) {
          console.error('[RECORDING] Erreur d\'initialisation du mixage:', err);
          isRecordingRef.current = false;
        }
      } else {
        retries++;
        if (retries >= maxRetries) {
          if (recordingStartIntervalRef.current) {
            clearInterval(recordingStartIntervalRef.current);
            recordingStartIntervalRef.current = null;
          }
          console.warn('[RECORDING] Annulé : flux WebRTC audio non disponibles après 3s');
        }
      }
    }, 200);
  }, [showToast]);

  // Arrêter l'enregistrement
  const stopRecording = useCallback(() => {
    if (recordingStartIntervalRef.current) {
      clearInterval(recordingStartIntervalRef.current);
      recordingStartIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('[RECORDING] Arrêt de l\'enregistrement demandé...');
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Configuration commune des événements d'un appel (appel entrant ou sortant)
  const setupCallEvents = useCallback((call: Call, effectiveOrigin: OrigineAppel, resolvedAppelId: number | null) => {
    const associerCallSid = () => {
      const callSid = getTwilioCallSid(call);
      const activeAppelId = resolvedAppelId || currentAppelIdRef.current;
      console.log(`[TWILIO] Connexion établie. CallSid: ${callSid}, activeAppelId: ${activeAppelId}`);
      if (activeAppelId && callSid) {
        appelService.updateCallSid(activeAppelId, callSid).then(() => {
          console.log(`[TWILIO] CallSid ${callSid} associé`);
        }).catch((err) => {
          console.error('❌ [TWILIO] Erreur association CallSid:', err);
        });
      }
    };

    call.on('ringing', associerCallSid);

    call.on('accept', () => {
      associerCallSid();
      setIsCallConnected(true);
      if (!timerRef.current) {
        startCallTimer();
      }
      if (effectiveOrigin === 'manuel' || effectiveOrigin === 'rappel' || !resolvedAppelId) {
        setStatut('en_appel');
      }
      // Démarrer l'enregistrement de l'appel dès qu'il est connecté
      startRecording(call);
    });

    // Ces événements ne modifient pas le cycle de vie de l'appel : ils rendent
    // simplement visible une perte de média WebRTC et sa récupération éventuelle.
    call.on('reconnecting', (error) => {
      console.warn('[TWILIO] Reconnexion média en cours', {
        callSid: getTwilioCallSid(call),
        code: error.code,
        message: error.message
      });
      showToast('warning', 'Connexion téléphonique instable — reconnexion en cours…', 10000);
    });

    call.on('reconnected', () => {
      console.info('[TWILIO] Média reconnecté', { callSid: getTwilioCallSid(call) });
      showToast('info', 'Connexion téléphonique rétablie', 4000);
    });

    call.on('warning', (name, data) => {
      console.warn('[TWILIO] Alerte qualité appel', {
        callSid: getTwilioCallSid(call),
        warning: name,
        data
      });
    });

    call.on('warning-cleared', (name) => {
      console.info('[TWILIO] Alerte qualité résolue', {
        callSid: getTwilioCallSid(call),
        warning: name
      });
    });

    call.on('disconnect', () => {
      stopRecording();

      if (!isCallActiveRef.current) {
        console.warn('⚠️ [TWILIO] disconnect ignoré car aucun appel actif');
        return;
      }

      console.groupCollapsed('📞 [TWILIO] Appel déconnecté');

      stopCallTimer();
      isCallActiveRef.current = false;
      setStatut('pause_apres_appel');
      setDepuisLe(new Date());
      clearActiveCall();

      dialerService.changerStatut('pause_apres_appel').catch((err) => {
        console.error('❌ Erreur synchro statut:', err);
      });
      dialerService.endSession().catch((err) => {
        console.error('❌ Erreur endSession:', err);
      });

      console.groupEnd();
      showToast('info', 'Appel terminé', 3000);
    });

    const handleAbort = (reason: string) => {
      console.log(`⚠️ [TWILIO] Appel ${reason}`);

      stopRecording();
      stopCallTimer();
      isCallActiveRef.current = false;
      setStatut('pause_apres_appel');
      setDepuisLe(new Date());

      dialerService.changerStatut('pause_apres_appel').catch((err) => {
        console.error('❌ Erreur synchro statut:', err);
      });
      dialerService.endSession().catch((err) => {
        console.error('❌ Erreur endSession:', err);
      });
      clearActiveCall();
    };

    call.on('reject', () => handleAbort('rejeté'));
    call.on('cancel', () => handleAbort('annulé'));
  }, [clearActiveCall, startCallTimer, stopCallTimer, startRecording, stopRecording, showToast]);


  const sendDigits = useCallback((digits: string) => {
    if (!digits || !/^[0-9*#w]+$/i.test(digits)) {
      return false;
    }

    const activeCall = activeCallRef.current;
    if (!activeCall || !isCallActiveRef.current) {
      return false;
    }

    try {
      activeCall.sendDigits(digits);
      setLastSentDigits((prev) => {
        const next = `${prev}${digits}`.slice(-24);
        return next;
      });
      scheduleDtmfReset();
      return true;
    } catch (error) {
      console.error('[DTMF] Erreur envoi tonalites:', error);
      showToast('error', 'Impossible d’envoyer la tonalité', 3000);
      return false;
    }
  }, [scheduleDtmfReset, showToast]);

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

  const forceLogoutForTwilioFailure = useCallback(async (reason: string) => {
    if (isForceLogoutInProgressRef.current) {
      return;
    }

    isForceLogoutInProgressRef.current = true;
    console.error(`[TWILIO] Session irrécupérable (${reason}) - déconnexion forcée`);

    try {
      await dialerService.changerStatut('hors_ligne').catch(() => {});
      showToast('error', 'La connexion téléphonique a expiré. Merci de vous reconnecter.', 8000);
      await logout?.();
    } catch (error) {
      console.error('[TWILIO] Erreur lors de la déconnexion forcée:', error);
    } finally {
      isForceLogoutInProgressRef.current = false;
    }
  }, [logout, showToast]);

  const refreshDeviceToken = useCallback(async (device: Device, source: string): Promise<boolean> => {
    if (tokenRefreshPromiseRef.current) {
      return tokenRefreshPromiseRef.current;
    }

    tokenRefreshPromiseRef.current = (async () => {
      try {
        console.log(`[TWILIO] Rafraîchissement du token (${source})...`);
        const tokenData = await twilioService.refreshAccessToken();

        if (!tokenData.accessToken) {
          throw new Error('Token Twilio vide');
        }

        await device.updateToken(tokenData.accessToken);
        console.log(`[TWILIO] Token rafraîchi (${source})`);
        return true;
      } catch (error) {
        console.error(`[TWILIO] Échec du rafraîchissement du token (${source}):`, error);
        return false;
      } finally {
        tokenRefreshPromiseRef.current = null;
      }
    })();

    return tokenRefreshPromiseRef.current;
  }, []);

  const recoverDeviceRegistration = useCallback(async (device: Device, source: string): Promise<boolean> => {
    if (recoveryPromiseRef.current) {
      return recoveryPromiseRef.current;
    }

    recoveryPromiseRef.current = (async () => {
      const refreshed = await refreshDeviceToken(device, source);
      if (!refreshed) {
        await forceLogoutForTwilioFailure(`${source}:token-refresh-failed`);
        return false;
      }

      try {
        if (device.state !== 'registered' && device.state !== 'registering') {
          console.log(`[TWILIO] Tentative de reconnexion (${source})...`);
          await device.register();
        }

        return true;
      } catch (error) {
        console.error(`[TWILIO] Échec de reconnexion (${source}):`, error);
        await forceLogoutForTwilioFailure(`${source}:register-failed`);
        return false;
      } finally {
        recoveryPromiseRef.current = null;
      }
    })();

    return recoveryPromiseRef.current;
  }, [forceLogoutForTwilioFailure, refreshDeviceToken]);

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

      // Préserve le comportement d'edge par défaut (roaming) tant qu'aucun edge
      // n'est explicitement configuré. La reconnexion de signalisation est, elle,
      // activée pour permettre au SDK de récupérer une perte réseau brève en appel.
      const configuredEdge = getTwilioEdgeConfiguration();
      const deviceOptions = {
        appName: import.meta.env.VITE_APP_NAME || 'ANTL Script Vendeur',
        appVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
        maxCallSignalingTimeoutMs: 30000,
        ...(configuredEdge ? { edge: configuredEdge } : {})
      };

      console.log('[TWILIO] 📍 STEP 3.5: Création Device avec token (longueur:', accessToken.length, ')');
      console.log('[TWILIO] Edge:', configuredEdge || 'roaming (défaut)', '| reconnexion signalisation: 30s');
      const device = new Device(accessToken, deviceOptions);
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
        void recoverDeviceRegistration(device, 'unregistered');
      });

      device.on('registering', () => {
        console.log('🔄 [TWILIO] Device registering...');
      });

      // Tracer TOUS les changements d'état pour le debug
      device.on('stateChanged', (state: unknown) => {
        console.log('🔄 [TWILIO] État Device changé:', state);
      });

      device.on('error', (error: unknown) => {
        console.error('❌ [TWILIO] Erreur Device:', error);
        setSipConnected(false);
        showToast('error', 'Erreur Twilio: ' + getErrorMessage(error), 5000);
      });

      device.on('tokenWillExpire', () => {
        console.warn('⚠️ [TWILIO] Token va expirer');
        void refreshDeviceToken(device, 'tokenWillExpire').then((refreshed) => {
          if (!refreshed) {
            void forceLogoutForTwilioFailure('tokenWillExpire');
          }
        });
      });

      device.on('incoming', (call: Call) => {
        console.groupCollapsed('📞 [TWILIO] Appel entrant');
        console.log('From:', call.parameters.From);
        console.log('Call SID:', call.parameters.CallSid);
        incomingCallRef.current = call;
        setIncomingCall({
          from: call.parameters.From,
          displayName: call.parameters.From
        });
        console.groupEnd();
        showToast('info', `Appel entrant de: ${call.parameters.From}`, 10000);
      });

      device.on('cancel', (call: Call) => {
        console.log('⚠️ [TWILIO] Appel annulé:', call.parameters.CallSid);
        setIncomingCall((prev) => (prev?.from === call.parameters.From ? null : prev));
        if (incomingCallRef.current?.parameters.CallSid === call.parameters.CallSid) {
          incomingCallRef.current = null;
        }
        showToast('warning', 'Appel annulé', 3000);
      });

      device.on('destroyed', () => {
        console.error('💥 [TWILIO] Device destroyed - STACK TRACE:');
        console.error('💥 [TWILIO] isInitializingRef.current:', isInitializingRef.current);
        console.trace('[TWILIO] Appelé depuis:');
        setSipConnected(false);
        clearActiveCall();
        deviceRef.current = null;
        isInitializingRef.current = false;
        tokenRefreshPromiseRef.current = null;
        recoveryPromiseRef.current = null;
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
  }, [clearActiveCall, fetchTwilioToken, forceLogoutForTwilioFailure, recoverDeviceRegistration, refreshDeviceToken, showToast]);

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
      clearActiveCall();
      setStatut('hors_ligne');
      setRaisonPause(null);
      setDepuisLe(new Date());
      setIncomingCall(null);
      setProchainProspect(null);
      setCurrentCampagneId(null);
      setCurrentAppelId(null);
      setCurrentIdProspection(null);
      setCurrentOrigineAppel(null);
      setCurrentRendezVousSourceId(null);
      return;
    }

    if (shouldDisableLocalTwilio()) {
      console.log('[TWILIO] Initialisation désactivée pour la fiche de formation');
      setSipConnected(false);
      return;
    }

    // Initialiser Twilio SEULEMENT si pas déjà initialisé
    console.log('[TWILIO] useEffect - isAuthenticated:', isAuthenticated, ', deviceRef.current:', deviceRef.current);
    initializeTwilioDevice();
  }, [clearActiveCall, initializeTwilioDevice, isAuthenticated]);

  // ============================================================
  // INITIALISATION AU MONTAGE (sans Twilio)
  // ============================================================

  const resolveRuntimeCampaign = useCallback(async () => {
    const status = await dialerService.getStatut();
    setStatut(status.statut);
    setRaisonPause(status.raison_pause ?? null);
    if (status.debut_statut) {
      setDepuisLe(new Date(status.debut_statut));
    }

    if (isProspectTestMode()) {
      setCurrentCampagneId(status.id_campagne_active ?? null);
      return;
    }

    const campagnes = await dialerService.getCampagnesAgent();
    const runtimeCampaign = pickDialerBootstrapCampaign(campagnes, status.id_campagne_active, currentCampagneId);

    if (runtimeCampaign) {
      if (!runtimeCampaign.is_active_runtime && campagnes.length === 1) {
        const runtimeStatus = await dialerService.setCampagneActive(runtimeCampaign.id_campagne);
        setCurrentCampagneId(runtimeStatus.id_campagne_active ?? runtimeCampaign.id_campagne);
      } else {
        setCurrentCampagneId(runtimeCampaign.id_campagne);
      }
      return;
    }

    setCurrentCampagneId(status.id_campagne_active ?? null);
  }, [currentCampagneId]);

  useEffect(() => {
    if (!isAuthenticated) return;

    resolveRuntimeCampaign().catch((err) => {
      console.error('[DIALER] Erreur chargement campagnes:', err);
    });

    // Heartbeat
    const sendHeartbeat = () => {
      dialerService.heartbeat().catch(() => {});
    };
    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 60000);

    // Beforeunload
    const handleBeforeUnload = () => {
      const baseUrl = getApiBaseUrl();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...csrfService.getCachedHeaders(),
      };
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
  }, [isAuthenticated, resolveRuntimeCampaign]);

  // ============================================================
  // FONCTIONS D'APPEL
  // ============================================================

  // Appel sortant
  const call = useCallback(async (
    phoneNumber: string,
    campagneId?: number,
    prospectId?: number,
    options?: { skipCreateAppel?: boolean; dbAppelId?: number; origin?: OrigineAppel }
  ) => {
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

      let resolvedAppelId = options?.dbAppelId || null;
      let effectiveOrigin: OrigineAppel = options?.origin || 'auto';

      // Créer l'appel en DB
      if (campagneId && prospectId && !options?.skipCreateAppel) {
        setCurrentOrigineAppel('auto');
        currentOrigineAppelRef.current = 'auto';
        effectiveOrigin = 'auto';
        try {
          const appel = await appelService.createAppel({
            id_prospect: prospectId,
            id_campagne: campagneId,
            statut_appel: 'en_cours',
            origine_appel: 'auto',
            id_prospection: prochainProspect?.id_prospection ?? currentIdProspection ?? undefined,
          });
          setCurrentAppelId(appel.id_appel);
          setCurrentRendezVousSourceId(null);
          resolvedAppelId = appel.id_appel;
        } catch (err) {
          console.error('❌ Erreur création appel:', err);
        }
      }

      // Formater le numéro
      const formattedNumber = formatPhoneE164(phoneNumber);
      console.log('📤 [TWILIO] Appel vers:', formattedNumber);

      // Passer l'appel via Twilio (SDK v2.x - Promise)
      const connectParams: Record<string, string> = { To: formattedNumber };
      if (resolvedAppelId) {
        connectParams.appelId = String(resolvedAppelId);
      }
      const call = await device.connect({ params: connectParams });

      if (!call) {
        throw new Error('device.connect() a retourné null');
      }

      registerActiveCall(call);
      isCallActiveRef.current = true;
      setIsCallConnected(false);
      setStatut(effectiveOrigin === 'auto' ? 'qualification_en_cours' : 'appel_sortant');
      setDepuisLe(new Date());

      // Configurer le cycle de vie de l'appel sortant
      setupCallEvents(call, effectiveOrigin, resolvedAppelId);

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
      clearActiveCall();
      console.error('❌ [ERREUR] Appel:', err);
      console.groupEnd();
      showToast('error', 'Échec de l\'appel — Vérifiez votre connexion', 5000);
    }
  }, [clearActiveCall, currentIdProspection, prochainProspect, registerActiveCall, setupCallEvents, showToast]);

  // Raccrocher
  const hangup = useCallback(() => {
    const device = deviceRef.current;
    if (!device) {
      console.warn('⚠️ [HANGUP] Aucun device disponible');
      return;
    }

    // Vérifier si un appel est en cours
    if (!isCallActiveRef.current) {
      console.warn('⚠️ [HANGUP] Aucun appel actif à raccrocher');
      return;
    }

    console.groupCollapsed('📞 [HANGUP] Hangup manuel');
    console.log('[HANGUP] Device state:', device.state);
    console.log('[HANGUP] Appels actifs:', device.calls.length);

    // Utiliser device.disconnectAll() pour couper tous les appels
    // Cette méthode est plus fiable que d'itérer sur device.calls
    stopRecording();
    device.disconnectAll();

    // Nettoyer l'état local
    stopCallTimer();
    isCallActiveRef.current = false;
    setStatut('pause_apres_appel');
    setDepuisLe(new Date());
    clearActiveCall();

    // Synchroniser avec le backend
    dialerService.changerStatut('pause_apres_appel').catch((err) => {
      console.error('[HANGUP] Erreur synchro backend statut:', err);
    });
    dialerService.endSession().catch((err) => {
      console.error('[HANGUP] Erreur endSession:', err);
    });

    console.log('✅ [HANGUP] Hangup terminé');
    console.groupEnd();
  }, [clearActiveCall, stopCallTimer, stopRecording]);

  // Répondre
  const answer = useCallback(() => {
    const call = incomingCallRef.current;
    if (!call) {
      console.warn('⚠️ Aucune connexion à répondre');
      return;
    }

    console.groupCollapsed('📞 [APPEL ENTRANT] Réponse');
    registerActiveCall(call);

    // Configurer le cycle de vie de l'appel entrant (déconnexion, enregistrement)
    setupCallEvents(call, 'auto', null);

    call.accept();
    setIncomingCall(null);
    isCallActiveRef.current = true;
    setIsCallConnected(true);
    setStatut('en_appel');
    setDepuisLe(new Date());
    console.log('✅ Appel accepté');
    console.groupEnd();
  }, [registerActiveCall, setupCallEvents]);

  // Rejeter
  const reject = useCallback(() => {
    const call = incomingCallRef.current;
    if (!call) {
      console.warn('⚠️ Aucune connexion à rejeter');
      return;
    }

    call.reject();
    incomingCallRef.current = null;
    setIncomingCall(null);
    console.log('❌ Appel rejeté');
  }, []);

  const requestNextProspect = useCallback(async (options?: { showEmptyToast?: boolean }) => {
      if (isFetchingNextProspectRef.current || isCallActiveRef.current || prochainProspect) {
        return false;
      }

    isFetchingNextProspectRef.current = true;
    try {
      const MAX_SKIPS = 10;

      for (let i = 0; i < MAX_SKIPS; i++) {
        try {
          const candidate = await dialerService.getNextProspect();
          if (candidate.telephone && isMobilePhone(candidate.telephone) && !candidate.autoriser_mobile) {
            console.warn(`[DIALER] Prospect #${candidate.id_prospect} skip (mobile ${candidate.telephone})`);
            if (candidate.id_prospection) {
              dialerService.markMobile(candidate.id_prospection).catch(() => {});
            }
            continue;
          }

          setProchainProspect(candidate);
          setCurrentAppelId(null);
          setCurrentCampagneId(candidate.id_campagne_assignee ?? null);
          setCurrentIdProspection(candidate.id_prospection ?? null);
          setCurrentOrigineAppel(candidate.distribution_mode === 'rappel' ? 'rappel' : null);
          setCurrentRendezVousSourceId(candidate.id_rendez_vous_source ?? null);
          setCurrentCallInsights({
            answeredBy: null,
            classification: null,
            amdStatus: null,
            sviDetecte: false,
            bridgedToAgentAt: null,
            endedBySystem: false,
            endReason: null
          });
          return true;
        } catch (err) {
          console.warn('[DIALER] Erreur lors de la récupération du prospect ou file vide', err);
          if (options?.showEmptyToast) {
            showToast('error', 'Plus de prospect disponible', 5000);
          }
          return false;
        }
      }

      if (options?.showEmptyToast) {
        showToast('error', 'Plus de prospect disponible', 5000);
      }
      return false;
    } finally {
      isFetchingNextProspectRef.current = false;
    }
  }, [prochainProspect, showToast]);

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
        await requestNextProspect({ showEmptyToast: false });
      }
    } catch (error) {
      console.warn('[Dialer] Échec synchro backend, statut local appliqué', error);
    } finally {
      setIsLoading(false);
    }
  }, [requestNextProspect, showToast, sipConnected]);

  // Ouvrir un prospect manuellement
  const openProspectManual = useCallback(async (prospectId: number, origin: 'manuel' | 'rappel', prospectPhone?: string, rendezVousSourceId?: number) => {
    if (closingService.hasPending()) {
      showToast('error', "Veuillez d'abord enregistrer le résultat de l'appel en cours.", 5000);
      return;
    }
    const previousStatut = statut;
    const previousRaisonPause = raisonPause;
    try {
      const campagnes = await dialerService.getCampagnesAgent();
      const campagne = pickRuntimeCampaign(campagnes, currentCampagneId, currentCampagneId);
      if (!campagne) {
        console.warn('[DIALER] Aucune campagne active');
        return;
      }
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

      // Formater le numéro pour l'appel Twilio
      const formattedNumber = prospectPhone ? formatPhoneE164(prospectPhone) : '';
      const appel = await appelService.createAppel({
        id_prospect: prospectId,
        id_campagne: campagneId,
        statut_appel: 'en_cours',
        origine_appel: origin,
        numero_telephone: formattedNumber,
        id_rendez_vous_source: rendezVousSourceId,
      });

      setCurrentAppelId(appel.id_appel);
      setCurrentCampagneId(campagneId);
      setCurrentIdProspection(null);
      setCurrentOrigineAppel(origin);
      currentOrigineAppelRef.current = origin;
      setCurrentRendezVousSourceId(rendezVousSourceId ?? null);

      if (formattedNumber) {
        await call(formattedNumber, campagneId, prospectId, { skipCreateAppel: true, dbAppelId: appel.id_appel, origin });
      }
    } catch (err) {
      console.error('[DIALER] Erreur openProspectManual:', err);
      setStatut(previousStatut);
      setRaisonPause(previousRaisonPause);
      setDepuisLe(new Date());
      await dialerService.changerStatut(previousStatut, previousRaisonPause ?? undefined).catch(() => {});
      throw err;
    }
  }, [call, currentCampagneId, raisonPause, showToast, statut]);

  // Appel manuel depuis la fiche prospect (boutons d'appel)
  const callFromManual = useCallback(async (
    phoneNumber: string,
    prospectId: number,
    campagneId?: number,
    rendezVousSourceId?: number
  ) => {
    if (closingService.hasPending()) {
      showToast('error', "Veuillez d'abord enregistrer le résultat de l'appel en cours.", 5000);
      return;
    }
    const previousStatut = statut;
    const previousRaisonPause = raisonPause;
    console.groupCollapsed(`📞 [APPEL MANUEL] ${phoneNumber}`);
    const origin = resolveManualCallOrigin(rendezVousSourceId);

    // Récupérer la campagne active si non fournie
    let targetCampagneId = campagneId;
    if (!targetCampagneId && rendezVousSourceId) {
      try {
        const rendezVous = await rendezVousService.getRendezVousById(rendezVousSourceId);
        targetCampagneId = rendezVous.id_campagne;
      } catch (err) {
        console.error('[APPEL MANUEL] Erreur récupération rendez-vous source:', err);
        showToast('error', 'Impossible de récupérer la campagne du rendez-vous', 5000);
        console.groupEnd();
        throw err;
      }
    }
    if (!targetCampagneId) {
      try {
        const campagnes = await dialerService.getCampagnesAgent();
        const campagneActive = pickRuntimeCampaign(campagnes, currentCampagneId, currentCampagneId);
        if (!campagneActive) {
          throw new Error('Aucune campagne active');
        }
        targetCampagneId = campagneActive.id_campagne;
      } catch (err) {
        console.error('[APPEL MANUEL] Erreur récupération campagnes:', err);
        showToast('error', 'Impossible de récupérer les campagnes actives', 5000);
        console.groupEnd();
        throw err;
      }
    }

    try {
      // Passer en statut "appel sortant"
      setStatut('appel_sortant');
      setRaisonPause(null);
      setDepuisLe(new Date());
      setProchainProspect(null);
      await dialerService.changerStatut('appel_sortant');

      // Créer l'appel en DB avec origine='manuel' et numéro formaté
      const formattedNumber = formatPhoneE164(phoneNumber);
      const appel = await appelService.createAppel({
        id_prospect: prospectId,
        id_campagne: targetCampagneId,
        statut_appel: 'en_cours',
        origine_appel: origin,
        numero_telephone: formattedNumber,
        id_rendez_vous_source: rendezVousSourceId,
      });

      setCurrentAppelId(appel.id_appel);
      setCurrentCampagneId(targetCampagneId);
      setCurrentIdProspection(null);
      setCurrentOrigineAppel(origin);
      currentOrigineAppelRef.current = origin;
      setCurrentRendezVousSourceId(rendezVousSourceId ?? null);

      // Lancer l'appel Twilio avec le numéro formaté
      await call(formattedNumber, targetCampagneId, prospectId, {
        skipCreateAppel: true,
        dbAppelId: appel.id_appel,
        origin
      });

      console.log('✅ [APPEL MANUEL] Appel lancé avec succès');
    } catch (err) {
      console.error('[APPEL MANUEL] Erreur:', err);
      setStatut(previousStatut);
      setRaisonPause(previousRaisonPause);
      setDepuisLe(new Date());
      await dialerService.changerStatut(previousStatut, previousRaisonPause ?? undefined).catch(() => {});
      throw err;
    } finally {
      console.groupEnd();
    }
  }, [call, currentCampagneId, raisonPause, showToast, statut]);

  // Clear prochain prospect
  const clearProchainProspect = useCallback(() => {
    setProchainProspect(null);
    isClosingRef.current = false;
  }, []);

  useEffect(() => {
    if (!currentAppelId || !hasActiveTwilioCall) {
      return;
    }

    let cancelled = false;

    const applyClassification = (classification: CallClassification | null, insights: ActiveCallInsights) => {
      if (classification === 'humain_detecte') {
        setStatut('en_appel');
        if (!timerRef.current) {
          startCallTimer();
        }
        return;
      }

      if (classification === 'svi_detecte') {
        setStatut('svi_a_naviguer');
        return;
      }

      if (classification === 'qualification_en_cours' || classification === 'unknown_a_traiter') {
        setStatut('qualification_en_cours');
        return;
      }

      if ((classification === 'messagerie_detectee' || classification === 'fax_detecte' || classification === 'automate_filtre') && insights.endedBySystem) {
        stopCallTimer();
        setStatut('pause_apres_appel');
      }
    };

    const pollInsights = async () => {
      try {
        const appel = await appelService.getAppelById(currentAppelId);
        if (cancelled) {
          return;
        }

        const nextInsights: ActiveCallInsights = {
          answeredBy: appel.answered_by ?? null,
          classification: appel.call_classification ?? null,
          amdStatus: appel.amd_status ?? null,
          sviDetecte: Boolean(appel.svi_detecte),
          bridgedToAgentAt: appel.bridged_to_agent_at ?? null,
          endedBySystem: Boolean(appel.ended_by_system),
          endReason: appel.end_reason ?? null
        };

        setCurrentCallInsights(nextInsights);
        applyClassification(nextInsights.classification, nextInsights);
      } catch (error) {
        console.warn('[DIALER] Impossible de synchroniser les insights AMD', error);
      }
    };

    void pollInsights();
    const intervalId = window.setInterval(() => {
      void pollInsights();
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [currentAppelId, hasActiveTwilioCall, startCallTimer, stopCallTimer]);

  // Contexte à retourner
  return (
    <DialerContext.Provider value={{
      statut,
      raisonPause,
      depuisLe,
      isLoading,
      sipConnected,
      canSendDigits: hasActiveTwilioCall && isCallConnected && (statut === 'en_appel' || statut === 'svi_a_naviguer' || currentCallInsights.sviDetecte),
      callDuration,
      callDurationFormatted,
      incomingCall,
      prochainProspect,
      currentCampagneId,
      currentAppelId,
      currentIdProspection,
      currentOrigineAppel,
      currentRendezVousSourceId,
      currentCallInsights,
      lastSentDigits,
      remoteAudioRef,
      changerStatut,
      requestNextProspect,
      clearProchainProspect,
      call,
      sendDigits,
      hangup,
      answer,
      reject,
      openProspectManual,
      callFromManual,
    }}>
      {children}
      <audio ref={remoteAudioRef} id="remoteAudio" autoPlay playsInline muted={false} />
    </DialerContext.Provider>
  );
};
