import { useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { UserAgent, Registerer, Inviter, SessionState, UserAgentState } from 'sip.js';
import type { Session, Invitation } from 'sip.js';
import { DialerContext } from './DialerContext';
import type { IncomingCall } from './DialerContext';
import { UserContext } from '../userContext/UserContext';
import { useContext } from 'react';
import { dialerService, appelService, closingService } from '../../API/services';
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

  const [statut, setStatut] = useState<StatutDialer>('hors_ligne');
  const [raisonPause, setRaisonPause] = useState<RaisonPause | null>(null);
  const [depuisLe, setDepuisLe] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [sipConnected, setSipConnected] = useState(false);
  const [sipReconnecting, setSipReconnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [prochainProspect, setProchainProspect] = useState<(Prospect & ProspectAssigne) | null>(null);
  const [currentCampagneId, setCurrentCampagneId] = useState<number | null>(null);
  const [currentAppelId, setCurrentAppelId] = useState<number | null>(null);
  const [currentIdProspection, setCurrentIdProspection] = useState<number | null>(null);
  const [currentOrigineAppel, setCurrentOrigineAppel] = useState<OrigineAppel | null>(null);

  const uaRef = useRef<UserAgent | null>(null);
  const registererRef = useRef<Registerer | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const incomingSessionRef = useRef<Invitation | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sipDomainRef = useRef<string>('');
  const isClosingRef = useRef<boolean>(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isCallActiveRef = useRef<boolean>(false);

  const startCallTimer = useCallback(() => {
    setCallDuration(0);
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

  // ─── Recovery : récupérer le statut backend au mount ───
  useEffect(() => {
    if (!isAuthenticated) return;

    const recoverStatus = async () => {
      try {
        const data = await dialerService.getStatut();
        setStatut(data.statut);
        setRaisonPause(data.raison_pause ?? null);
        if (data.debut_statut) {
          setDepuisLe(new Date(data.debut_statut));
        }
      } catch {
        // Silencieux — reste hors_ligne
      }
    };

    recoverStatus();
  }, [isAuthenticated]);

  // ─── Heartbeat : signal que l'agent est actif (toutes les 60s) ───
  useEffect(() => {
    if (!isAuthenticated || statut === 'hors_ligne') return;

    const sendHeartbeat = () => {
      dialerService.heartbeat().catch(() => {});
    };

    sendHeartbeat();
    const id = setInterval(sendHeartbeat, 60000);
    return () => clearInterval(id);
  }, [isAuthenticated, statut]);

  // ─── beforeunload : passage auto en hors_ligne si on ferme l'onglet ───
  useEffect(() => {
    if (!isAuthenticated) return;

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
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAuthenticated]);

  // ─── visibilitychange : rafraîchir le statut si on revient après longtemps ───
  useEffect(() => {
    if (!isAuthenticated) return;

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
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isAuthenticated]);

  // Fonction de reconnexion SIP automatique avec backoff exponentiel
  const reconnectSip = useCallback(async () => {
    const MAX_ATTEMPTS = 5;
    const BASE_DELAY = 1000;

    showToast('warning', 'Connexion SIP perdue — Tentative de reconnexion automatique...');

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const delay = Math.min(BASE_DELAY * Math.pow(2, attempt - 1), 30000);
      console.info(`[SIP] Tentative de reconnexion ${attempt}/${MAX_ATTEMPTS} dans ${delay}ms`);

      await new Promise(resolve => setTimeout(resolve, delay));

      try {
        if (uaRef.current && registererRef.current) {
          await uaRef.current.start();
          await registererRef.current.register();
          setSipConnected(true);
          setSipReconnecting(false);
          showToast('success', 'Connexion SIP rétablie');
          console.info('[SIP] ✅ Reconnexion réussie');
          return;
        }
      } catch (err) {
        console.error(`[SIP] ❌ Échec tentative ${attempt}:`, err);
      }
    }

    console.error('[SIP] ❌ Reconnexion impossible après 5 tentatives');
    setSipReconnecting(false);
    showToast('error', 'Impossible de reconnecter SIP — Passage en pause technique');
    setStatut('pause');
    setRaisonPause('technique');
    dialerService.changerStatut('pause', 'technique').catch(() => {});
  }, [showToast]);

  // Initialisation SIP uniquement quand l'utilisateur est authentifié
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const initSip = async () => {
      try {
        const creds = await dialerService.getSipCredentials();
        if (cancelled) return;

        sipDomainRef.current = creds.sip_domain;

        const username = creds.sip_uri.split('@')[0];
        const uri = UserAgent.makeURI(`sip:${creds.sip_uri}`);
        if (!uri) {
          console.error('[SIP] URI invalide:', creds.sip_uri);
          showToast('error', 'Configuration SIP invalide — Contactez le support technique', 8000);
          return;
        }

        const iceServers: RTCIceServer[] = [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ];
        const turnUrl = import.meta.env.VITE_TURN_URL;
        if (turnUrl) {
          iceServers.push({
            urls: turnUrl,
            username: import.meta.env.VITE_TURN_USERNAME,
            credential: import.meta.env.VITE_TURN_CREDENTIAL,
          });
        }

        const ua = new UserAgent({
          uri,
          transportOptions: { server: creds.ws_url },
          authorizationPassword: creds.sip_password,
          authorizationUsername: username,
          logLevel: 'error',
          sessionDescriptionHandlerFactoryOptions: {
            peerConnectionOptions: {
              rtcConfiguration: { iceServers },
            },
          },
          delegate: {
            onInvite: (invitation: Invitation) => {
              if (cancelled) return;
              const remoteId = invitation.remoteIdentity;
              setIncomingCall({
                from: remoteId.uri.user ?? remoteId.uri.toString(),
                displayName: remoteId.displayName || remoteId.uri.user || 'Inconnu',
              });
              incomingSessionRef.current = invitation;

              invitation.stateChange.addListener((state) => {
                if (state === SessionState.Terminated) {
                  console.info('[SIP] Appel entrant terminé → sync backend pause_apres_appel');
                  setIncomingCall(null);
                  incomingSessionRef.current = null;
                  stopCallTimer();
                  isCallActiveRef.current = false;
                  setStatut('pause_apres_appel');
                  setDepuisLe(new Date());
                  dialerService.changerStatut('pause_apres_appel').then(() => {
                    console.info('[SIP] ✅ Backend sync pause_apres_appel (entrant) OK');
                  }).catch(err => {
                    console.error('[SIP] ❌ Échec sync backend pause_apres_appel (entrant):', err);
                  });
                  sessionRef.current = null;
                  const audioEl = document.getElementById('remoteAudio') as HTMLAudioElement | null;
                  if (audioEl) audioEl.srcObject = null;
                }
              });
            },
          },
        });

        // Listener sur l'état du UserAgent pour détecter les déconnexions
        ua.stateChange.addListener((state: UserAgentState) => {
          if (cancelled) return;
          if (state === UserAgentState.Stopped) {
            setSipConnected(false);
            setSipReconnecting(true);
            showToast('warning', 'Connexion SIP interrompue — Reconnexion en cours...', 3000);
            console.warn('[SIP] UserAgent arrêté — tentative de reconnexion');
            // Lancer la reconnexion automatique
            reconnectSip().catch(err => {
              console.error('[SIP] Erreur lors de la reconnexion:', err);
            });
          } else if (state === UserAgentState.Started) {
            if (!sipConnected) {
              setSipConnected(true);
              setSipReconnecting(false);
              showToast('success', 'Connexion SIP rétablie');
              console.info('[SIP] UserAgent démarré avec succès');
            }
          }
        });

        const registerer = new Registerer(ua);

        let registrationTimeout: ReturnType<typeof setTimeout> | null = null;
        let registrationResolved = false;

        registerer.stateChange.addListener(async (state) => {
          if (cancelled) return;
          if (state === 'Registered' && !registrationResolved) {
            registrationResolved = true;
            if (registrationTimeout) clearTimeout(registrationTimeout);
            setSipConnected(true);
            console.info('[DIALER] SIP enregistré — en attente de passage manuel en disponible');
          } else if (state === 'Unregistered' || state === 'Terminated') {
            setSipConnected(false);
            setStatut('hors_ligne');
          }
        });

        // Timeout de 10 secondes pour la connexion SIP
        const registrationPromise = new Promise<void>((_resolve, reject) => {
          registrationTimeout = setTimeout(() => {
            if (!registrationResolved) {
              reject(new Error('Connexion SIP timeout (10s)'));
            }
          }, 10000);
        });

        try {
          await ua.start();
          await Promise.race([
            registerer.register(),
            registrationPromise
          ]);
        } catch (error) {
          if (registrationTimeout) clearTimeout(registrationTimeout);
          if (!cancelled) {
            const errorMsg = error instanceof Error && error.message.includes('timeout')
              ? 'Connexion SIP impossible — Vérifiez votre connexion internet'
              : 'Erreur lors de la connexion SIP';
            showToast('error', errorMsg, 7000);
            console.error('[DIALER] Erreur connexion SIP:', error);
            setSipConnected(false);
          }
          return;
        }

        uaRef.current = ua;
        registererRef.current = registerer;
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error('[SIP] Erreur initialisation:', errMsg);
        if (!cancelled) {
          showToast('error', 'Impossible d\'initialiser la téléphonie — Credentials SIP manquants ou invalides', 8000);
        }
      }
    };

    initSip();

    return () => {
      cancelled = true;
      stopCallTimer();
      isCallActiveRef.current = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      registererRef.current?.unregister().catch(() => {});
      uaRef.current?.stop().catch(() => {});
    };
  }, [isAuthenticated, stopCallTimer, showToast, reconnectSip, sipConnected]);

  const call = useCallback(async (phoneNumber: string, campagneId?: number, prospectId?: number) => {
    if (isMobilePhone(phoneNumber)) {
      console.error('[SIP] Appel bloqué : numéro mobile détecté', phoneNumber);
      return;
    }

    if (!uaRef.current || !sipConnected) {
      console.warn('[SIP] Non connecté, impossible d\'appeler');
      return;
    }

    // Guard : empêcher un appel concurrent
    if (isCallActiveRef.current) {
      console.warn('[SIP] Un appel est déjà en cours');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
      });
      mediaStreamRef.current = stream;

      setCurrentCampagneId(campagneId ?? null);
      isClosingRef.current = false;
      isCallActiveRef.current = true;

      // Créer l'appel en DB au ringing (AVANT le SIP invite)
      // Sauf si currentAppelId est déjà set (cas openProspectManual)
      if (!currentAppelId && campagneId && prospectId) {
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
          console.error('[Appel] Erreur création appel (ringing):', err);
        }
      }

      const e164 = formatPhoneE164(phoneNumber);
      const targetURI = UserAgent.makeURI(`sip:${e164}@${sipDomainRef.current}`);
      if (!targetURI) {
        console.error('[SIP] URI cible invalide:', e164);
        isCallActiveRef.current = false;
        return;
      }

      const inviter = new Inviter(uaRef.current, targetURI);

      inviter.stateChange.addListener((state) => {
        if (state === SessionState.Established) {
          const sdh = inviter.sessionDescriptionHandler;
          if (sdh && 'peerConnection' in sdh) {
            const pc = (sdh as { peerConnection: RTCPeerConnection }).peerConnection;
            pc.getReceivers().forEach(receiver => {
              if (receiver.track) {
                const stream = new MediaStream([receiver.track]);
                const audioEl = document.getElementById('remoteAudio') as HTMLAudioElement | null;
                if (audioEl) audioEl.srcObject = stream;
              }
            });

            // Surveillance de l'état ICE et de connexion
            let iceDisconnectedNotified = false;

            // Listener iceConnectionState
            pc.addEventListener('iceconnectionstatechange', () => {
              const iceState = pc.iceConnectionState;
              console.info(`[WebRTC] ICE connection state: ${iceState}`);

              if (iceState === 'failed' || iceState === 'disconnected') {
                if (!iceDisconnectedNotified) {
                  iceDisconnectedNotified = true;
                  showToast('warning', 'Problème de connexion audio détecté', 5000);
                  console.warn(`[WebRTC] ICE ${iceState} — Qualité audio compromise`);
                }
              } else if (iceState === 'connected' || iceState === 'completed') {
                iceDisconnectedNotified = false;
              }
            });

            // Listener connectionState avec hangup auto si failed
            pc.addEventListener('connectionstatechange', () => {
              const connState = pc.connectionState;
              console.info(`[WebRTC] Connection state: ${connState}`);

              if (connState === 'failed') {
                console.error('[WebRTC] Connection failed — Hangup auto dans 10s');
                showToast('error', 'Connexion perdue — Raccrochage automatique', 5000);

                // Hangup automatique après 10 secondes
                setTimeout(() => {
                  if (sessionRef.current === inviter && isCallActiveRef.current) {
                    console.warn('[WebRTC] Hangup auto après connection failed');
                    inviter.bye().catch(() => {});
                  }
                }, 10000);
              }
            });

            // Surveillance des statistiques WebRTC (paquets perdus, gigue, RTT)
            let highPacketLossCount = 0;
            const statsInterval = setInterval(async () => {
              if (!isCallActiveRef.current || sessionRef.current !== inviter) {
                clearInterval(statsInterval);
                return;
              }

              try {
                const stats = await pc.getStats();
                let packetsLost = 0;
                let packetsReceived = 0;
                let currentRoundTripTime = 0;
                let jitter = 0;

                stats.forEach(report => {
                  if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
                    packetsLost = report.packetsLost || 0;
                    packetsReceived = report.packetsReceived || 0;
                    jitter = report.jitter || 0;
                  }
                  if (report.type === 'remote-candidate') {
                    currentRoundTripTime = report.roundTripTime || 0;
                  }
                });

                const totalPackets = packetsLost + packetsReceived;
                const packetLossRatio = totalPackets > 0 ? packetsLost / totalPackets : 0;
                const packetLossPercent = packetLossRatio * 100;

                // Logger les stats périodiquement
                if (packetsReceived > 0) {
                  console.info(`[WebRTC] Stats - Perte: ${packetLossPercent.toFixed(2)}%, RTT: ${currentRoundTripTime}ms, Gigue: ${jitter}ms`);
                }

                // Alerte si perte de paquets > 5% pendant 10s consécutives
                if (packetLossPercent > 5 && totalPackets > 100) {
                  highPacketLossCount++;
                  if (highPacketLossCount >= 10) {
                    showToast('warning', 'Qualité audio dégradée — Perte de paquets élevée', 4000);
                    console.warn(`[WebRTC] Perte paquets élevée: ${packetLossPercent.toFixed(2)}%`);
                  }
                } else {
                  highPacketLossCount = 0;
                }

                // Envoyer les stats au backend (via POST /api/dialer/session)
                if (currentAppelId && totalPackets > 0) {
                  dialerService.updateSession({
                    duration_seconds: callDuration,
                    packets_lost: packetsLost,
                    packets_received: packetsReceived,
                    packet_loss_percent: packetLossPercent,
                    round_trip_time: currentRoundTripTime,
                    jitter: jitter,
                  }).catch(() => {
                    // Silencieux — ne pas bloquer l'appel si l'update échoue
                  });
                }
              } catch (error) {
                console.error('[WebRTC] Erreur getStats:', error);
              }
            }, 5000); // Toutes les 5 secondes

            // Nettoyer l'intervalle à la fin de l'appel
            const cleanupStats = () => {
              clearInterval(statsInterval);
            };

            inviter.stateChange.addListener((state) => {
              if (state === SessionState.Terminated) {
                cleanupStats();
              }
            });
          }
          setStatut('en_appel');
          setDepuisLe(new Date());
          startCallTimer();
        } else if (state === SessionState.Terminated) {
          console.info('[SIP] Appel terminé → sync backend pause_apres_appel');
          stopCallTimer();
          isCallActiveRef.current = false;
          setStatut('pause_apres_appel');
          setDepuisLe(new Date());
          dialerService.changerStatut('pause_apres_appel').then(() => {
            console.info('[SIP] ✅ Backend sync pause_apres_appel OK');
          }).catch(err => {
            console.error('[SIP] ❌ Échec sync backend pause_apres_appel:', err);
          });
          sessionRef.current = null;
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
          }
          const audioEl = document.getElementById('remoteAudio') as HTMLAudioElement | null;
          if (audioEl) audioEl.srcObject = null;
        }
      });

      await inviter.invite();
      sessionRef.current = inviter;
    } catch (err) {
      isCallActiveRef.current = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('[SIP] Erreur lors de l\'appel:', errorMsg);
      showToast('error', 'Échec de l\'appel — Vérifiez votre connexion téléphonique', 5000);
    }
  }, [sipConnected, startCallTimer, stopCallTimer, prochainProspect, currentAppelId]);

  const hangup = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.bye().catch(() => {
        // cancel() n'existe que sur Inviter (appels sortants pas encore établis)
        (sessionRef.current as Inviter | null)?.cancel().catch(() => {});
      });
    }
  }, []);

  const answer = useCallback(async () => {
    const invitation = incomingSessionRef.current;
    if (!invitation) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
      });
      mediaStreamRef.current = stream;
      isCallActiveRef.current = true;
      await invitation.accept();
      sessionRef.current = invitation;
      setIncomingCall(null);

      const sdh = invitation.sessionDescriptionHandler;
      if (sdh && 'peerConnection' in sdh) {
        const pc = (sdh as { peerConnection: RTCPeerConnection }).peerConnection;
        pc.getReceivers().forEach(receiver => {
          if (receiver.track) {
            const stream = new MediaStream([receiver.track]);
            const audioEl = document.getElementById('remoteAudio') as HTMLAudioElement | null;
            if (audioEl) { audioEl.srcObject = stream; audioEl.play().catch(() => {}); }
          }
        });
      }

      setStatut('en_appel');
      setDepuisLe(new Date());
      startCallTimer();
      // NOTE: pas de sync backend ici — l'appel entrant n'a pas de createAppel,
      // mais le SessionState.Terminated handler ci-dessous gère le pause_apres_appel
    } catch (err) {
      isCallActiveRef.current = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('[SIP] Erreur lors de la prise d\'appel:', errorMsg);
      showToast('error', 'Impossible de répondre — Vérifiez votre microphone et connexion', 5000);
    }
  }, [startCallTimer]);

  const reject = useCallback(() => {
    incomingSessionRef.current?.reject().catch(() => {});
    setIncomingCall(null);
    incomingSessionRef.current = null;
  }, []);

  const clearProchainProspect = useCallback(() => {
    setProchainProspect(null);
    setCurrentAppelId(null);
    setCurrentIdProspection(null);
    setCurrentOrigineAppel(null);
    isClosingRef.current = false;
  }, []);

  const changerStatut = useCallback(async (nouveauStatut: StatutDialer, raison?: RaisonPause) => {
    // Guard : ne pas passer disponible si un closing est en attente
    if (nouveauStatut === 'disponible' && closingService.hasPending()) {
      console.warn('[DIALER] Impossible de passer disponible : closing en attente');
      return;
    }

    // Guard : ne pas passer disponible si un appel est en cours
    if (nouveauStatut === 'disponible' && isCallActiveRef.current) {
      console.warn('[DIALER] Impossible de passer disponible : appel en cours');
      return;
    }

    // Guard : ne pas passer disponible si SIP n'est pas connecté
    if (nouveauStatut === 'disponible' && !sipConnected) {
      console.warn('[DIALER] Impossible de passer disponible : SIP non connecté');
      showToast('error', 'Connexion SIP non établie — Impossible de passer disponible', 5000);
      return;
    }

    // Mise à jour immédiate du state local (optimiste)
    setStatut(nouveauStatut);
    setRaisonPause(raison ?? null);
    setDepuisLe(new Date());
    setProchainProspect(null);

    setIsLoading(true);
    try {
      await dialerService.changerStatut(nouveauStatut, raison);

      // Quand l'agent se met en disponible, on lui prépare automatiquement le prochain prospect
      if (nouveauStatut === 'disponible') {
        const MAX_SKIPS = 10;
        for (let i = 0; i < MAX_SKIPS; i++) {
          try {
            const candidate = await dialerService.getNextProspect();
            if (candidate.telephone && isMobilePhone(candidate.telephone)) {
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
  }, []);

  const openProspectManual = useCallback(async (prospectId: number, origin: 'manuel' | 'rappel', prospectPhone?: string) => {
    if (prospectPhone && isMobilePhone(prospectPhone)) {
      console.error('[DIALER] Appel bloqué : numéro mobile détecté', prospectPhone);
      throw new Error('Impossible d\'appeler un numéro mobile');
    }

    try {
      // 1. Récupérer la 1re campagne active de l'agent
      const campagnes = await dialerService.getCampagnesAgent();
      if (!campagnes || campagnes.length === 0) {
        console.warn('[DIALER] Aucune campagne active');
        return;
      }
      const campagneId = campagnes[0].id_campagne;

      // 2. Status → appel_sortant (empêche auto-dequeue)
      setStatut('appel_sortant');
      setRaisonPause(null);
      setDepuisLe(new Date());
      setProchainProspect(null);
      await dialerService.changerStatut('appel_sortant');

      // 3. Créer l'appel en BDD
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

      // 4. Lancer l'appel SIP (même flow que auto-dequeue mais agent-choisi)
      if (prospectPhone) {
        await call(prospectPhone, campagneId, prospectId);
      }
    } catch (err) {
      console.error('[DIALER] Erreur openProspectManual:', err);
      throw err;
    }
  }, [call]);

  return (
    <DialerContext.Provider value={{
      statut,
      raisonPause,
      depuisLe,
      isLoading,
      sipConnected,
      sipReconnecting,
      callDuration,
      incomingCall,
      prochainProspect,
      currentCampagneId,
      currentAppelId,
      currentIdProspection,
      currentOrigineAppel,
      changerStatut,
      clearProchainProspect,
      call,
      hangup,
      answer,
      reject,
      openProspectManual,
    }}>
      {children}
    </DialerContext.Provider>
  );
};
