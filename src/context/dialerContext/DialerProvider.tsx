import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { DialerContext } from './DialerContext';
import type { IncomingCall } from './DialerContext';
import { UserContext } from '../userContext/UserContext';
import { useContext } from 'react';
import { loadAsteriskBrowserClient, dialerService, appelService, closingService, twilioService, telephonyService, rendezVousService, enregistrementService } from '../../API/services';
import type { AsteriskBrowserClient } from '../../API/services';
import type { Appel, AsteriskOutboundAuthorization, StatutDialer, RaisonPause, Prospect, ProspectAssigne, OrigineAppel, ActiveCallInsights, CallClassification, TelephonyConfiguration, TelephonyProvider } from '../../utils/types';
import { isProspectTestMode, shouldDisableLocalTwilio } from '../../utils/scripts/utils';
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

interface MediaStreamProvider {
  getLocalStream: () => MediaStream | null | undefined;
  getRemoteStream: () => MediaStream | null | undefined;
}

interface ActiveAsteriskCall {
  appelId: number;
  providerCallId: string;
  answered: boolean;
}

const getAsteriskOutboundAuthorization = (appel: Appel): AsteriskOutboundAuthorization | undefined => {
  if (!appel.provider_call_id || !appel.asterisk_outbound_ticket) return undefined;
  return {
    providerCallId: appel.provider_call_id,
    ticket: appel.asterisk_outbound_ticket,
  };
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
  const [telephonyProvider, setTelephonyProvider] = useState<TelephonyProvider>('twilio');
  const [telephonyConfigured, setTelephonyConfigured] = useState(false);
  const [sipConnected, setSipConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [lastSentDigits, setLastSentDigits] = useState('');
  const [hasActiveProviderCall, setHasActiveProviderCall] = useState(false);
  const [isCallConnected, setIsCallConnected] = useState(false);

  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [prochainProspect, setProchainProspect] = useState<(Prospect & ProspectAssigne) | null>(null);
  const [currentCampagneId, setCurrentCampagneId] = useState<number | null>(null);
  const [currentAppelId, setCurrentAppelId] = useState<number | null>(null);
  const [currentAppelProspectId, setCurrentAppelProspectId] = useState<number | null>(null);
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
  const asteriskClientRef = useRef<AsteriskBrowserClient | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const incomingCallRef = useRef<Call | null>(null);
  const isClosingRef = useRef<boolean>(false);
  const isCallActiveRef = useRef<boolean>(false);
  const callEndFinalizedRef = useRef<boolean>(true);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const hasCalledEstablishedRef = useRef<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);
  const isFetchingNextProspectRef = useRef<boolean>(false);
  const tokenRefreshPromiseRef = useRef<Promise<boolean> | null>(null);
  const recoveryPromiseRef = useRef<Promise<boolean> | null>(null);
  const isForceLogoutInProgressRef = useRef<boolean>(false);
  const activeTransportProviderRef = useRef<TelephonyProvider | null>(null);
  const pendingTransportProviderRef = useRef<TelephonyProvider | null>(null);
  const isSwitchingProviderRef = useRef(false);
  const telephonyDegradedRef = useRef(false);
  const telephonyConfigurationWarningRef = useRef(false);
  const hasInitializedTelephonyRef = useRef(false);
  const twilioMediaWarningsRef = useRef<Set<string>>(new Set());

  const currentAppelIdRef = useRef<number | null>(null);
  const activeAsteriskCallRef = useRef<ActiveAsteriskCall | null>(null);
  const currentOrigineAppelRef = useRef<OrigineAppel | null>(null);
  const callDurationRef = useRef<number>(0);
  const callAcceptedAtRef = useRef<number | null>(null);
  useEffect(() => {
    currentAppelIdRef.current = currentAppelId;
  }, [currentAppelId]);

  const updateCurrentAppelId = useCallback((idAppel: number | null, prospectId: number | null = null): void => {
    currentAppelIdRef.current = idAppel;
    setCurrentAppelId(idAppel);
    setCurrentAppelProspectId(idAppel === null ? null : prospectId);
  }, []);

  const reportTelephonyDegraded = useCallback((provider: TelephonyProvider, message?: string): void => {
    if (isSwitchingProviderRef.current || telephonyDegradedRef.current) return;
    telephonyDegradedRef.current = true;
    showToast(
      'warning',
      message || `Service téléphonique ${provider === 'asterisk' ? 'Asterisk' : 'Twilio'} dégradé — reconnexion en cours…`,
      10000,
    );
  }, [showToast]);

  const reportTelephonyRecovered = useCallback((provider: TelephonyProvider): void => {
    if (!telephonyDegradedRef.current) return;
    telephonyDegradedRef.current = false;
    showToast('info', `Service téléphonique ${provider === 'asterisk' ? 'Asterisk' : 'Twilio'} rétabli`, 5000);
  }, [showToast]);
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
    setHasActiveProviderCall(false);
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
    callEndFinalizedRef.current = false;
    activeCallRef.current = call;
    setHasActiveProviderCall(true);
  }, []);

  // Références pour le mixage et l'enregistrement audio WebRTC
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef<boolean>(false);

  // Débuter l'enregistrement
  const startRecording = useCallback((streamProvider: MediaStreamProvider) => {
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

      const localStream = streamProvider.getLocalStream() ?? null;
      const remoteStream = streamProvider.getRemoteStream() ?? null;

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
            let uploadEnabled = false;
            try {
              const configuration = await enregistrementService.getConfiguration();
              uploadEnabled = configuration.enabled;
            } catch (configurationError) {
              console.warn('[RECORDING] Upload annulé : configuration indisponible.', configurationError);
            }

            if (!uploadEnabled) {
              console.info('[RECORDING] Upload ignoré : enregistrements désactivés.');
            } else if (activeAppelId && recordedBlob.size > 1000) {
              try {
                const ext = getRecordingExtension(recordingMimeType);
                const filename = `recording_${activeAppelId}_${Date.now()}.${ext}`;
                const file = new File([recordedBlob], filename, { type: recordingMimeType });

                console.log(`[RECORDING] Upload de l'enregistrement pour l'appel #${activeAppelId}...`);
                await enregistrementService.uploadRecording(activeAppelId, file, callDurationRef.current);
                console.log(`[RECORDING] Enregistrement uploadé avec succès`);
              } catch (err) {
                console.error('[RECORDING] Échec de l\'upload:', err);
              }
            } else {
              console.warn('[RECORDING] Fichier trop petit ou ID appel manquant:', activeAppelId);
            }
            audioChunksRef.current = [];
            mediaRecorderRef.current = null;
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
  }, []);

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

  const finalizeLocalCallEnd = useCallback((source: string): boolean => {
    const isFirstFinalization = !callEndFinalizedRef.current;
    callEndFinalizedRef.current = true;

    console.info(`[DIALER] Fin d'appel locale (${source})`);
    stopRecording();
    stopCallTimer();
    isCallActiveRef.current = false;
    activeAsteriskCallRef.current = null;
    setIncomingCall(null);
    setStatut('pause_apres_appel');
    setDepuisLe(new Date());
    clearActiveCall();

    if (isFirstFinalization) {
      showToast('info', 'Appel terminé', 3000);
    }

    return isFirstFinalization;
  }, [clearActiveCall, showToast, stopCallTimer, stopRecording]);

  const synchronizeEndedDialerSession = useCallback((source: string): void => {
    void dialerService.changerStatut('pause_apres_appel').catch((error) => {
      console.error(`[DIALER] Erreur synchronisation statut (${source}):`, error);
    });
    void dialerService.endSession().catch((error) => {
      console.error(`[DIALER] Erreur fin de session (${source}):`, error);
    });
  }, []);

  const finishTwilioCall = useCallback((source: string, forceBackendSync = false): void => {
    if (callEndFinalizedRef.current && !forceBackendSync) {
      return;
    }

    const isFirstFinalization = finalizeLocalCallEnd(source);
    if (isFirstFinalization || forceBackendSync) {
      synchronizeEndedDialerSession(source);
    }
  }, [finalizeLocalCallEnd, synchronizeEndedDialerSession]);

  const startRecordingIfEnabled = useCallback((streamProvider: MediaStreamProvider) => {
    void enregistrementService.getConfiguration()
      .then((configuration) => {
        if (!configuration.enabled) {
          console.info('[RECORDING] Capture ignorée : enregistrements désactivés.');
          return;
        }

        if (isCallActiveRef.current) {
          startRecording(streamProvider);
        }
      })
      .catch((configurationError: unknown) => {
        console.warn('[RECORDING] Capture annulée : configuration indisponible.', configurationError);
      });
  }, [startRecording]);

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
      // Vérifier le kill switch serveur avant toute capture audio locale.
      const recordableCall = call as TwilioCallWithStreams;
      startRecordingIfEnabled({
        getLocalStream: () => recordableCall.getLocalStream?.(),
        getRemoteStream: () => recordableCall.getRemoteStream?.(),
      });
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
      twilioMediaWarningsRef.current.add(name);
      // Les notifications toast de qualité audio Twilio sont désactivées pour éviter les faux positifs en boucle.
    });

    call.on('warning-cleared', (name) => {
      console.info('[TWILIO] Alerte qualité résolue', {
        callSid: getTwilioCallSid(call),
        warning: name
      });
      twilioMediaWarningsRef.current.delete(name);
    });

    call.on('disconnect', () => {
      if (activeCallRef.current && activeCallRef.current !== call) {
        console.warn('[TWILIO] Fin tardive ignorée pour un ancien appel');
        return;
      }

      console.groupCollapsed('📞 [TWILIO] Appel déconnecté');
      finishTwilioCall('twilio_disconnect');
      console.groupEnd();
    });

    const handleAbort = (reason: string) => {
      console.log(`⚠️ [TWILIO] Appel ${reason}`);
      finishTwilioCall(`twilio_${reason}`);
    };

    call.on('error', (error) => {
      console.error('[TWILIO] Erreur sur l\'appel:', error);
      queueMicrotask(() => {
        if (call.status() === Call.State.Closed) {
          finishTwilioCall('twilio_call_error_closed');
        }
      });
    });
    call.on('reject', () => handleAbort('rejeté'));
    call.on('cancel', () => handleAbort('annulé'));
  }, [finishTwilioCall, showToast, startCallTimer, startRecordingIfEnabled]);

  const finishAsteriskCall = useCallback((state: 'ended' | 'failed' = 'ended', reason?: string, forceBackendSync = false) => {
    if (callEndFinalizedRef.current && !forceBackendSync) {
      return;
    }

    const activeAsteriskCall = activeAsteriskCallRef.current;
    const resolvedState = state === 'ended' && activeAsteriskCall && !activeAsteriskCall.answered
      ? 'failed'
      : state;
    finalizeLocalCallEnd(reason || `asterisk_${resolvedState}`);

    void (async () => {
      let telephonyStateSynchronized = false;
      if (activeAsteriskCall) {
        try {
          await appelService.updateTelephonyState(activeAsteriskCall.appelId, {
            state: resolvedState,
            provider_call_id: activeAsteriskCall.providerCallId,
            ...(reason ? { reason } : {}),
          });
          telephonyStateSynchronized = true;
        } catch (error) {
          console.error('[ASTERISK] Erreur synchronisation cycle appel:', error);
        }
      }

      if (!telephonyStateSynchronized) {
        await dialerService.changerStatut('pause_apres_appel').catch((error) => {
          console.error('[ASTERISK] Erreur synchronisation statut:', error);
        });
      }
      await dialerService.endSession().catch((error) => {
        console.error('[ASTERISK] Erreur fin de session:', error);
      });
    })();
  }, [finalizeLocalCallEnd]);

  const initializeAsteriskClient = useCallback(async () => {
    if (isInitializingRef.current || asteriskClientRef.current) {
      return;
    }

    const remoteAudio = remoteAudioRef.current;
    if (!remoteAudio) {
      throw new Error('Élément audio distant indisponible');
    }

    isInitializingRef.current = true;
    let client: AsteriskBrowserClient | null = null;

    try {
      const { AsteriskBrowserClient } = await loadAsteriskBrowserClient();
      client = new AsteriskBrowserClient();
      asteriskClientRef.current = client;
      const session = await telephonyService.getAsteriskSession();
      await client.connect(session, remoteAudio, {
        onRegistered: () => {
          console.info('[ASTERISK] Client SIP enregistré');
          setSipConnected(true);
          reportTelephonyRecovered('asterisk');
        },
        onUnregistered: () => {
          console.warn('[ASTERISK] Client SIP désenregistré');
          setSipConnected(false);
          reportTelephonyDegraded('asterisk');
        },
        onServerDisconnect: (error) => {
          console.error('[ASTERISK] Signalisation WSS déconnectée', error);
          setSipConnected(false);
          reportTelephonyDegraded('asterisk');
          if (isCallActiveRef.current) {
            finishAsteriskCall('failed', 'asterisk_wss_disconnected');
          }
        },
        onIncomingCall: () => {
          setIncomingCall({
            from: 'Appel entrant',
            displayName: 'Appel entrant Asterisk',
          });
          showToast('info', 'Appel entrant Asterisk', 10000);
        },
        onCallCreated: () => {
          setHasActiveProviderCall(true);
          const activeAsteriskCall = activeAsteriskCallRef.current;
          if (activeAsteriskCall) {
            void appelService.updateTelephonyState(activeAsteriskCall.appelId, {
              state: 'ringing',
              provider_call_id: activeAsteriskCall.providerCallId,
            }).catch((error) => {
              console.error('[ASTERISK] Erreur synchronisation sonnerie:', error);
            });
          }
        },
        onCallAnswered: () => {
          callEndFinalizedRef.current = false;
          isCallActiveRef.current = true;
          setHasActiveProviderCall(true);
          setIsCallConnected(true);
          setIncomingCall(null);
          setStatut('en_appel');
          setDepuisLe(new Date());
          startCallTimer();
          const activeAsteriskCall = activeAsteriskCallRef.current;
          if (activeAsteriskCall) {
            activeAsteriskCall.answered = true;
            void appelService.updateTelephonyState(activeAsteriskCall.appelId, {
              state: 'answered',
              provider_call_id: activeAsteriskCall.providerCallId,
            }).catch((error) => {
              console.error('[ASTERISK] Erreur synchronisation décroché:', error);
            });
          }
          const activeClient = asteriskClientRef.current;
          if (activeClient) {
            startRecordingIfEnabled({
              getLocalStream: () => activeClient.getLocalMediaStream(),
              getRemoteStream: () => activeClient.getRemoteMediaStream(),
            });
          }
        },
        onCallHangup: () => finishAsteriskCall('ended', 'asterisk_call_ended'),
      });
    } catch (error) {
      asteriskClientRef.current = null;
      setSipConnected(false);
      await client?.disconnect();
      throw error;
    } finally {
      isInitializingRef.current = false;
    }
  }, [finishAsteriskCall, reportTelephonyDegraded, reportTelephonyRecovered, showToast, startCallTimer, startRecordingIfEnabled]);


  const sendDigits = useCallback((digits: string) => {
    if (!digits || !/^[0-9*#w]+$/i.test(digits)) {
      return false;
    }

    if (!isCallActiveRef.current) {
      return false;
    }

    try {
      if (telephonyProvider === 'asterisk') {
        const client = asteriskClientRef.current;
        if (!client) {
          return false;
        }
        void client.sendDigits(digits).catch((error) => {
          console.error('[DTMF] Erreur envoi tonalités Asterisk:', error);
          showToast('error', 'Impossible d’envoyer la tonalité', 3000);
        });
      } else {
        const activeCall = activeCallRef.current;
        if (!activeCall) {
          return false;
        }
        activeCall.sendDigits(digits);
      }
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
  }, [scheduleDtmfReset, showToast, telephonyProvider]);

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
        reportTelephonyRecovered('twilio');
      });

      device.on('unregistered', () => {
        console.warn('⚠️ [TWILIO] Device unregistered');
        setSipConnected(false);
        reportTelephonyDegraded('twilio');
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
        reportTelephonyDegraded('twilio', `Service téléphonique Twilio dégradé : ${getErrorMessage(error)}`);
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
        const hadActiveCall = isCallActiveRef.current || activeCallRef.current !== null;
        console.error('💥 [TWILIO] Device destroyed - STACK TRACE:');
        console.error('💥 [TWILIO] isInitializingRef.current:', isInitializingRef.current);
        console.trace('[TWILIO] Appelé depuis:');
        setSipConnected(false);
        clearActiveCall();
        deviceRef.current = null;
        isInitializingRef.current = false;
        tokenRefreshPromiseRef.current = null;
        recoveryPromiseRef.current = null;
        if (hadActiveCall) {
          finishTwilioCall('twilio_device_destroyed');
        }
        reportTelephonyDegraded('twilio', 'Service téléphonique Twilio interrompu');
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
      setSipConnected(false);
      isInitializingRef.current = false;
      throw error;
    }
  }, [clearActiveCall, fetchTwilioToken, finishTwilioCall, forceLogoutForTwilioFailure, recoverDeviceRegistration, refreshDeviceToken, reportTelephonyDegraded, reportTelephonyRecovered, showToast]);

  const teardownTelephonyClients = useCallback(async (): Promise<void> => {
    const asteriskClient = asteriskClientRef.current;
    asteriskClientRef.current = null;
    if (asteriskClient) {
      await asteriskClient.disconnect();
    }

    const device = deviceRef.current;
    deviceRef.current = null;
    if (device) {
      device.removeAllListeners();
      device.destroy();
    }

    activeTransportProviderRef.current = null;
    tokenRefreshPromiseRef.current = null;
    recoveryPromiseRef.current = null;
    twilioMediaWarningsRef.current.clear();
    isInitializingRef.current = false;
    setSipConnected(false);
    clearActiveCall();
  }, [clearActiveCall]);

  const applyTelephonyConfiguration = useCallback(async (
    configuration: TelephonyConfiguration,
    announceSwitch = false,
  ): Promise<void> => {
    const activeProvider = activeTransportProviderRef.current;
    const providerChanged = activeProvider !== null && activeProvider !== configuration.provider;

    if (providerChanged && isCallActiveRef.current) {
      if (pendingTransportProviderRef.current !== configuration.provider) {
        pendingTransportProviderRef.current = configuration.provider;
        showToast(
          'info',
          `Bascule vers ${configuration.provider === 'asterisk' ? 'Asterisk' : 'Twilio'} en attente de la fin de l’appel`,
          8000,
        );
      }
      return;
    }

    pendingTransportProviderRef.current = null;
    setTelephonyProvider(configuration.provider);
    setTelephonyConfigured(configuration.configured);

    const matchingClientExists = configuration.provider === 'asterisk'
      ? Boolean(asteriskClientRef.current)
      : Boolean(deviceRef.current);
    if (activeProvider === configuration.provider && matchingClientExists) {
      return;
    }

    isSwitchingProviderRef.current = true;
    try {
      await teardownTelephonyClients();

      if (!configuration.configured || !configuration.browserClientAvailable) {
        if (!telephonyConfigurationWarningRef.current) {
          telephonyConfigurationWarningRef.current = true;
          showToast('error', `Configuration ${configuration.provider} incomplète`, 8000);
        }
        return;
      }

      activeTransportProviderRef.current = configuration.provider;
      if (configuration.provider === 'asterisk') {
        await initializeAsteriskClient();
      } else {
        await initializeTwilioDevice();
      }

      telephonyConfigurationWarningRef.current = false;
      if (announceSwitch && hasInitializedTelephonyRef.current) {
        showToast(
          'info',
          `Bascule téléphonie vers ${configuration.provider === 'asterisk' ? 'Asterisk' : 'Twilio'} prise en compte`,
          6000,
        );
      }
      hasInitializedTelephonyRef.current = true;
    } catch (error) {
      console.error(`[TELEPHONY] Échec initialisation ${configuration.provider}:`, error);
      activeTransportProviderRef.current = null;
      setSipConnected(false);
      telephonyDegradedRef.current = false;
      isSwitchingProviderRef.current = false;
      reportTelephonyDegraded(
        configuration.provider,
        `Service ${configuration.provider === 'asterisk' ? 'Asterisk' : 'Twilio'} indisponible : ${getErrorMessage(error)}`,
      );
    } finally {
      isSwitchingProviderRef.current = false;
    }
  }, [initializeAsteriskClient, initializeTwilioDevice, reportTelephonyDegraded, showToast, teardownTelephonyClients]);

  const initializeConfiguredTelephony = useCallback(async (announceSwitch = false) => {
    try {
      const configuration = await telephonyService.getConfiguration();
      telephonyConfigurationWarningRef.current = false;
      await applyTelephonyConfiguration(configuration, announceSwitch);
    } catch (error) {
      console.error('[TELEPHONY] Erreur chargement configuration:', error);
      setSipConnected(false);
      if (!telephonyConfigurationWarningRef.current) {
        telephonyConfigurationWarningRef.current = true;
        showToast('error', 'Impossible de charger la configuration téléphonie', 8000);
      }
    }
  }, [applyTelephonyConfiguration, showToast]);

  // ============================================================
  // INITIALISATION TWILIO (useEffect séparé pour éviter les re-créations)
  // ============================================================

  useEffect(() => {
    if (!isAuthenticated) {
      isSwitchingProviderRef.current = true;
      void teardownTelephonyClients().finally(() => {
        isSwitchingProviderRef.current = false;
      });
      setStatut('hors_ligne');
      setRaisonPause(null);
      setDepuisLe(new Date());
      setIncomingCall(null);
      setProchainProspect(null);
      setCurrentCampagneId(null);
      updateCurrentAppelId(null);
      setCurrentIdProspection(null);
      setCurrentOrigineAppel(null);
      setCurrentRendezVousSourceId(null);
      setTelephonyProvider('twilio');
      setTelephonyConfigured(false);
      pendingTransportProviderRef.current = null;
      telephonyDegradedRef.current = false;
      telephonyConfigurationWarningRef.current = false;
      hasInitializedTelephonyRef.current = false;
      return;
    }

    if (shouldDisableLocalTwilio()) {
      console.log('[TWILIO] Initialisation désactivée pour la fiche de formation');
      isSwitchingProviderRef.current = true;
      void teardownTelephonyClients().finally(() => {
        isSwitchingProviderRef.current = false;
      });
      setTelephonyProvider('twilio');
      setTelephonyConfigured(false);
      return;
    }

    console.log('[TELEPHONY] Initialisation du fournisseur configuré');
    void initializeConfiguredTelephony();
  }, [initializeConfiguredTelephony, isAuthenticated, teardownTelephonyClients, updateCurrentAppelId]);

  useEffect(() => {
    if (!isAuthenticated || shouldDisableLocalTwilio()) return;

    const synchronizeProvider = (): void => {
      void initializeConfiguredTelephony(true);
    };
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') synchronizeProvider();
    };

    const intervalId = window.setInterval(synchronizeProvider, 15000);
    window.addEventListener('focus', synchronizeProvider);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', synchronizeProvider);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [initializeConfiguredTelephony, isAuthenticated]);

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

    // La présence est pilotée par le heartbeat backend. Un déchargement d'onglet
    // ne doit jamais basculer hors ligne une autre instance Script encore active.

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
    options?: {
      skipCreateAppel?: boolean;
      dbAppelId?: number;
      origin?: OrigineAppel;
      asteriskAuthorization?: AsteriskOutboundAuthorization;
    }
  ) => {
    console.groupCollapsed(`📞 [APPEL] ${phoneNumber}`);
    console.log('Campagne:', campagneId, '| Prospect:', prospectId);

    const device = deviceRef.current;
    const asteriskClient = asteriskClientRef.current;
    const providerReady = telephonyProvider === 'asterisk'
      ? Boolean(asteriskClient?.isConnected())
      : Boolean(device && device.state === 'registered');

    if (!providerReady) {
      console.error(`❌ Impossible d'appeler — ${telephonyProvider} non prêt`);
      console.groupEnd();
      showToast('error', 'Téléphonie non prête - Veuillez réessayer', 5000);
      return;
    }

    if (isCallActiveRef.current) {
      console.warn('⚠️ Annulé — Appel déjà en cours');
      console.groupEnd();
      return;
    }

    let resolvedAppelId = options?.dbAppelId || null;
    let asteriskAuthorization = options?.asteriskAuthorization;

    try {
      setCurrentCampagneId(campagneId ?? null);
      isClosingRef.current = false;
      callEndFinalizedRef.current = false;
      isCallActiveRef.current = true;

      let effectiveOrigin: OrigineAppel = options?.origin || 'auto';

      // Créer l'appel en DB
      if (campagneId && prospectId && !options?.skipCreateAppel) {
        setCurrentOrigineAppel('auto');
        currentOrigineAppelRef.current = 'auto';
        effectiveOrigin = 'auto';
        const appel = await appelService.createAppel({
          id_prospect: prospectId,
          id_campagne: campagneId,
          statut_appel: 'en_cours',
          origine_appel: 'auto',
          telephony_provider: telephonyProvider,
          id_prospection: prochainProspect?.id_prospection ?? currentIdProspection ?? undefined,
        });
        updateCurrentAppelId(appel.id_appel, prospectId);
        setCurrentRendezVousSourceId(null);
        resolvedAppelId = appel.id_appel;
        asteriskAuthorization = getAsteriskOutboundAuthorization(appel);
      }

      // Formater le numéro
      const formattedNumber = formatPhoneE164(phoneNumber);
      console.log(`📤 [${telephonyProvider.toUpperCase()}] Appel vers:`, formattedNumber);
      setHasActiveProviderCall(true);
      setIsCallConnected(false);
      setStatut(effectiveOrigin === 'auto' ? 'qualification_en_cours' : 'appel_sortant');
      setDepuisLe(new Date());

      if (telephonyProvider === 'asterisk') {
        if (!asteriskClient) {
          throw new Error('Client Asterisk indisponible');
        }

        if (prospectId && campagneId) {
          await dialerService.startSession(prospectId, campagneId);
        }
        if (!resolvedAppelId) {
          throw new Error('Appel Asterisk non rattaché à la base de données');
        }

        if (!asteriskAuthorization) {
          throw new Error('Autorisation sortante Asterisk absente');
        }
        activeAsteriskCallRef.current = {
          appelId: resolvedAppelId,
          providerCallId: asteriskAuthorization.providerCallId,
          answered: false,
        };
        await asteriskClient.call(formattedNumber, {
          appelId: resolvedAppelId,
          providerCallId: asteriskAuthorization.providerCallId,
          ticket: asteriskAuthorization.ticket,
        });

        console.log('✅ [ASTERISK] Invitation SIP envoyée');
        console.groupEnd();
        return;
      }

      if (!device) {
        throw new Error('Device Twilio indisponible');
      }

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
      if (telephonyProvider === 'asterisk' && resolvedAppelId) {
        finishAsteriskCall('failed', 'asterisk_call_start_failed');
      } else {
        stopRecording();
        stopCallTimer();
        isCallActiveRef.current = false;
        clearActiveCall();
        if (resolvedAppelId) {
          setStatut('pause_apres_appel');
          setDepuisLe(new Date());
          void dialerService.changerStatut('pause_apres_appel').catch((statusError) => {
            console.error('[DIALER] Erreur synchronisation échec appel:', statusError);
          });
          void dialerService.endSession().catch((sessionError) => {
            console.error('[DIALER] Erreur fin de session après échec:', sessionError);
          });
        }
      }
      console.error('❌ [ERREUR] Appel:', err);
      console.groupEnd();
      showToast('error', 'Échec de l\'appel — Vérifiez votre connexion', 5000);
    }
  }, [clearActiveCall, currentIdProspection, finishAsteriskCall, prochainProspect, registerActiveCall, setupCallEvents, showToast, stopCallTimer, stopRecording, telephonyProvider, updateCurrentAppelId]);

  // Raccrocher
  const hangup = useCallback(() => {
    console.groupCollapsed('📞 [HANGUP] Raccrochage forcé');

    if (telephonyProvider === 'asterisk') {
      const client = asteriskClientRef.current;
      if (client) {
        void client.hangup().catch((error) => {
          console.error('[ASTERISK] Échec du raccrochage SIP:', error);
        });
      } else {
        console.warn('⚠️ [HANGUP] Client Asterisk indisponible, workflow terminé localement');
      }

      finishAsteriskCall('ended', 'asterisk_manual_hangup', true);
      console.groupEnd();
      return;
    }

    const device = deviceRef.current;
    const activeCall = activeCallRef.current;
    finishTwilioCall('twilio_manual_hangup', true);

    try {
      activeCall?.disconnect();
    } catch (error) {
      console.error('[HANGUP] Échec disconnect de l\'appel Twilio suivi:', error);
    }

    if (device) {
      console.log('[HANGUP] Device state:', device.state);
      console.log('[HANGUP] Appels actifs:', device.calls.length);
      try {
        device.disconnectAll();
      } catch (error) {
        console.error('[HANGUP] Échec disconnectAll Twilio:', error);
      }
    } else {
      console.warn('⚠️ [HANGUP] Device Twilio indisponible, workflow terminé localement');
    }

    console.log('✅ [HANGUP] Raccrochage forcé terminé');
    console.groupEnd();
  }, [finishAsteriskCall, finishTwilioCall, telephonyProvider]);

  // Répondre
  const answer = useCallback(() => {
    if (telephonyProvider === 'asterisk') {
      const client = asteriskClientRef.current;
      if (!client || !incomingCall) {
        console.warn('⚠️ Aucun appel Asterisk à répondre');
        return;
      }

      void client.answer().catch((error) => {
        console.error('[ASTERISK] Échec de la réponse:', error);
        finishAsteriskCall('failed', 'asterisk_answer_failed');
        showToast('error', 'Impossible de répondre à l’appel', 3000);
      });
      return;
    }

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
  }, [finishAsteriskCall, incomingCall, registerActiveCall, setupCallEvents, showToast, telephonyProvider]);

  // Rejeter
  const reject = useCallback(() => {
    if (telephonyProvider === 'asterisk') {
      const client = asteriskClientRef.current;
      if (!client || !incomingCall) {
        console.warn('⚠️ Aucun appel Asterisk à rejeter');
        return;
      }

      void client.decline().catch((error) => {
        console.error('[ASTERISK] Échec du rejet:', error);
      });
      setIncomingCall(null);
      return;
    }

    const call = incomingCallRef.current;
    if (!call) {
      console.warn('⚠️ Aucune connexion à rejeter');
      return;
    }

    call.reject();
    incomingCallRef.current = null;
    setIncomingCall(null);
    console.log('❌ Appel rejeté');
  }, [incomingCall, telephonyProvider]);

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
          updateCurrentAppelId(null);
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
  }, [prochainProspect, showToast, updateCurrentAppelId]);

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
      console.warn('[DIALER] Impossible de passer disponible : téléphonie non connectée');
      showToast('error', 'Téléphonie non connectée — Impossible de passer disponible', 5000);
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

      // Formater le numéro pour le transport téléphonique actif.
      const formattedNumber = prospectPhone ? formatPhoneE164(prospectPhone) : '';
      const appel = await appelService.createAppel({
        id_prospect: prospectId,
        id_campagne: campagneId,
        statut_appel: 'en_cours',
        origine_appel: origin,
        telephony_provider: telephonyProvider,
        numero_telephone: formattedNumber,
        id_rendez_vous_source: rendezVousSourceId,
      });

      updateCurrentAppelId(appel.id_appel, prospectId);
      setCurrentCampagneId(campagneId);
      setCurrentIdProspection(null);
      setCurrentOrigineAppel(origin);
      currentOrigineAppelRef.current = origin;
      setCurrentRendezVousSourceId(rendezVousSourceId ?? null);

      if (formattedNumber) {
        await call(formattedNumber, campagneId, prospectId, {
          skipCreateAppel: true,
          dbAppelId: appel.id_appel,
          origin,
          asteriskAuthorization: getAsteriskOutboundAuthorization(appel),
        });
      }
    } catch (err) {
      console.error('[DIALER] Erreur openProspectManual:', err);
      setStatut(previousStatut);
      setRaisonPause(previousRaisonPause);
      setDepuisLe(new Date());
      await dialerService.changerStatut(previousStatut, previousRaisonPause ?? undefined).catch(() => {});
      throw err;
    }
  }, [call, currentCampagneId, raisonPause, showToast, statut, telephonyProvider, updateCurrentAppelId]);

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
        telephony_provider: telephonyProvider,
        numero_telephone: formattedNumber,
        id_rendez_vous_source: rendezVousSourceId,
      });

      updateCurrentAppelId(appel.id_appel, prospectId);
      setCurrentCampagneId(targetCampagneId);
      setCurrentIdProspection(null);
      setCurrentOrigineAppel(origin);
      currentOrigineAppelRef.current = origin;
      setCurrentRendezVousSourceId(rendezVousSourceId ?? null);

      // Lancer l'appel Twilio avec le numéro formaté
      await call(formattedNumber, targetCampagneId, prospectId, {
        skipCreateAppel: true,
        dbAppelId: appel.id_appel,
        origin,
        asteriskAuthorization: getAsteriskOutboundAuthorization(appel),
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
  }, [call, currentCampagneId, raisonPause, showToast, statut, telephonyProvider, updateCurrentAppelId]);

  // Clear prochain prospect
  const clearProchainProspect = useCallback(() => {
    setProchainProspect(null);
    isClosingRef.current = false;
  }, []);

  useEffect(() => {
    if (telephonyProvider !== 'twilio' || !currentAppelId || !hasActiveProviderCall) {
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

        if (nextInsights.endReason) {
          finishTwilioCall('twilio_backend_terminal_state');
          return;
        }

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
  }, [currentAppelId, finishTwilioCall, hasActiveProviderCall, startCallTimer, stopCallTimer, telephonyProvider]);

  // Contexte à retourner
  return (
    <DialerContext.Provider value={{
      statut,
      raisonPause,
      depuisLe,
      isLoading,
      telephonyProvider,
      telephonyConfigured,
      sipConnected,
      canSendDigits: hasActiveProviderCall && isCallConnected && (statut === 'en_appel' || statut === 'svi_a_naviguer' || currentCallInsights.sviDetecte),
      callDuration,
      callDurationFormatted,
      incomingCall,
      prochainProspect,
      currentCampagneId,
      currentAppelId,
      currentAppelProspectId,
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
