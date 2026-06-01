import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import JsSIP from 'jssip';
import type { UA } from 'jssip/lib/UA';
import type { RTCSession } from 'jssip/lib/RTCSession';
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

// Types pour JsSIP
type JsSIPSession = RTCSession;
type JsSIPUA = UA;

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

  const uaRef = useRef<JsSIPUA | null>(null);
  const sessionRef = useRef<JsSIPSession | null>(null);
  const incomingSessionRef = useRef<JsSIPSession | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sipDomainRef = useRef<string>('');
  const isClosingRef = useRef<boolean>(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isCallActiveRef = useRef<boolean>(false);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const hasCalledEstablishedRef = useRef<boolean>(false);

  // 🎯 Vérification de l'élément audio au montage
  useEffect(() => {
    console.log('🎵 [AUDIO] Initialisation élément audio...');
    if (!remoteAudioRef.current) {
      console.warn('⚠️ [AUDIO] remoteAudioRef.current est null au montage');
    } else {
      console.log('✅ [AUDIO] Élément audio prêt:', remoteAudioRef.current.id);
      // S'assurer que l'audio n'est pas muted (Firefox)
      remoteAudioRef.current.muted = false;
    }
  }, []);

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

  // ─── Charger la première campagne active de l'agent ───
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadAgentCampaign = async () => {
      try {
        const campagnes = await dialerService.getCampagnesAgent();
        if (campagnes && campagnes.length > 0) {
          const premiereCampagne = campagnes[0];
          console.log(`[DIALER] Campagne active chargée: ${premiereCampagne.id_campagne} - ${premiereCampagne.nom_campagne}`);
          setCurrentCampagneId(premiereCampagne.id_campagne);
        } else {
          console.warn('[DIALER] Aucune campagne active trouvée pour cet agent');
        }
      } catch (err) {
        console.error('[DIALER] Erreur lors du chargement des campagnes:', err);
      }
    };

    loadAgentCampaign();
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

  // ─── Fonction de reconnexion SIP automatique avec backoff exponentiel ───
  const reconnectSip = useCallback(async () => {
    const MAX_ATTEMPTS = 5;
    const BASE_DELAY = 1000;

    showToast('warning', 'Connexion SIP perdue — Tentative de reconnexion automatique...');

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const delay = Math.min(BASE_DELAY * Math.pow(2, attempt - 1), 30000);
      console.info(`[JsSIP] Tentative de reconnexion ${attempt}/${MAX_ATTEMPTS} dans ${delay}ms`);

      await new Promise(resolve => setTimeout(resolve, delay));

      try {
        const ua = uaRef.current;
        if (ua && !ua.isConnected()) {
          ua.start();
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Timeout'));
            }, 5000);
            let resolved = false;
            const onReg = () => {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                resolve();
              }
            };
            ua.on('registered', onReg);
          });
          setSipConnected(true);
          setSipReconnecting(false);
          showToast('success', 'Connexion SIP rétablie');
          console.info('[JsSIP] ✅ Reconnexion réussie');
          return;
        } else if (ua && ua.isConnected()) {
          setSipConnected(true);
          setSipReconnecting(false);
          showToast('success', 'Connexion SIP rétablie');
          return;
        }
      } catch (err) {
        console.error(`[JsSIP] ❌ Échec tentative ${attempt}:`, err);
      }
    }

    console.error('[JsSIP] ❌ Reconnexion impossible après 5 tentatives');
    setSipReconnecting(false);
    showToast('error', 'Impossible de reconnecter SIP — Passage en pause technique');
    setStatut('pause');
    setRaisonPause('technique');
    dialerService.changerStatut('pause', 'technique').catch(() => {});
  }, [showToast]);

  // ─── Initialisation SIP uniquement quand l'utilisateur est authentifié ───
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const initSip = async () => {
      console.groupCollapsed('🔐 [JsSIP] Initialisation');
      try {
        const creds = await dialerService.getSipCredentials();
        if (cancelled) {
          console.warn('❌ Annulé (composant démonté)');
          console.groupEnd();
          return;
        }

        console.log('✅ Credentials:', {
          domain: creds.sip_domain,
          uri: creds.sip_uri,
          ws: creds.ws_url
        });
        sipDomainRef.current = creds.sip_domain;

        const username = creds.sip_uri.split('@')[0];
        const domain = creds.sip_domain;

        // Configuration ICE avec STUN/TURN pour Twilio (prioritaire) puis SignalWire
        // Utilise les STUN de Twilio et Google pour une meilleure compatibilité
        const iceServers: RTCIceServer[] = [
          {
            urls: [
              'stun:global.stun.twilio.com:3478', // Twilio STUN (prioritaire)
              'stun:stun.l.google.com:19302',
              'stun:stun1.l.google.com:19302',
              'stun:stun2.l.google.com:19302',
              'stun:stun.signalwire.com:3478', // SignalWire STUN (fallback)
            ],
          },
        ];

        // Ajouter TURN seulement si configuré (via variables d'environnement)
        // Pour Twilio, configurez VITE_TURN_URL=turn:votre-domain.sip.us1.twilio.com:3478
        const turnUrl = import.meta.env.VITE_TURN_URL;
        const turnUsername = import.meta.env.VITE_TURN_USERNAME || import.meta.env.VITE_TWILIO_SIP_USER;
        const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL || import.meta.env.VITE_TWILIO_SIP_PASSWORD;

        if (turnUrl && turnUsername && turnCredential) {
          iceServers.push({
            urls: turnUrl.split(',').map((u: string) => u.trim()),
            username: turnUsername,
            credential: turnCredential,
          });
          console.log('🧊 [ICE] TURN configuré');
        } else {
          console.warn('⚠️ [ICE] Pas de TURN configuré - Les appels pourraient échouer derrière NAT');
        }

        console.log('🧊 ICE Servers:', iceServers);

        console.log("DEBUG SIP CONFIG:", {
          uri: `sip:${username}@${domain}`,
          password: creds.sip_password,
          ws_servers: creds.ws_url,
        });

        // Création du UserAgent JsSIP
        // Pour Twilio, le realm doit correspondre au domaine SIP
        // Pour SignalWire/Asterisk, utiliser le realm configuré
        const sipRealm = import.meta.env.VITE_SIP_REALM || domain || "api.antl.fr";
        
        const socket = new JsSIP.WebSocketInterface(creds.ws_url);
        const ua = new JsSIP.UA({
          uri: `sip:${username}@${domain}`,
          password: creds.sip_password,
          sockets: [socket],
          register: true,
          session_timers: false,
          authorization_user: username, // Force l'ID de connexion
          realm: sipRealm, // Realm dynamique (Twilio: domaine SIP, Asterisk: api.antl.fr)
          use_tls: true, // Puisque tu es en wss://
        } as any);

        // Stocker la config RTC pour l'utiliser dans les appels
        (ua as any).rtcConfig = {
          iceServers,
          iceTransportPolicy: 'all' as RTCIceTransportPolicy,
        };

        // Gestionnaire d'appels entrants
        ua.on('newRTCSession', (data: any) => {
          if (cancelled) return;

          if (data.originator === 'remote' && data.session) {
            const session = data.session;
            const remoteId = session.remote_identity;
            const from = remoteId.uri.user || remoteId.uri.toString();
            const displayName = remoteId.display_name || remoteId.uri.user || 'Inconnu';

            console.groupCollapsed('📞 [APPEL ENTRANT]');
            console.log(`De: ${displayName} (${from})`);
            console.groupEnd();

            setIncomingCall({
              from,
              displayName,
            });
            incomingSessionRef.current = session;

            // Gestion des événements de session entrante
            session.on('ended', () => {
              console.groupCollapsed('📞 [APPEL ENTRANT] Terminé');
              setIncomingCall(null);
              incomingSessionRef.current = null;
              stopCallTimer();
              isCallActiveRef.current = false;
              setStatut('pause_apres_appel');
              setDepuisLe(new Date());
              dialerService.changerStatut('pause_apres_appel').then(() => {
                console.log('✅ Backend sync OK');
              }).catch(err => {
                console.error('❌ Backend sync échoué:', err);
              });
              sessionRef.current = null;
              if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
              dialerService.endSession().catch(() => {});
              console.groupEnd();
            });

            session.on('failed', (err: any) => {
              console.error('❌ [APPEL ENTRANT] Échoué:', err);
              setIncomingCall(null);
              incomingSessionRef.current = null;
            });
          }
        });

        // Gestionnaire de connexion
        ua.on('connected', () => {
          if (cancelled) return;
          console.log('✅ [JsSIP] WebSocket connecté');
        });

        ua.on('disconnected', () => {
          if (cancelled) return;
          console.warn('⚠️ [JsSIP] WebSocket déconnecté');
          setSipConnected(false);
          setSipReconnecting(true);
          showToast('warning', 'Connexion SIP perdue — Reconnexion...', 3000);
          reconnectSip().catch(err => {
            console.error('❌ Reconnexion échouée:', err);
          });
        });

        ua.on('registered', () => {
          if (cancelled) return;
          console.log('✅ [JsSIP] Enregistré');
          setSipConnected(true);
          setSipReconnecting(false);
        });

        ua.on('registrationFailed', (err: any) => {
          if (cancelled) return;
          console.error('❌ [JsSIP] Enregistrement échoué:', err);
          setSipConnected(false);
        });

        ua.on('unregistered', () => {
          if (cancelled) return;
          console.warn('⚠️ [JsSIP] Non enregistré');
          setSipConnected(false);
        });

        // Démarrage du UserAgent
        console.groupCollapsed('🚀 [JsSIP] UserAgent');
        ua.start();
        console.log('✅ Démarrage en cours...');
        console.groupEnd();

        // Attendre l'enregistrement (avec timeout)
        const registrationPromise = new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            if (!ua.isRegistered()) {
              reject(new Error('Connexion SIP timeout (10s)'));
            }
          }, 10000);

          let resolved = false;
          let rejected = false;

          const onRegistered = () => {
            if (!resolved && !rejected) {
              resolved = true;
              clearTimeout(timeout);
              resolve();
            }
          };

          const onRegistrationFailed = (err: any) => {
            if (!resolved && !rejected) {
              rejected = true;
              clearTimeout(timeout);
              reject(err);
            }
          };

          ua.on('registered', onRegistered);
          ua.on('registrationFailed', onRegistrationFailed);
        });

        try {
          await registrationPromise;
          console.log('✅ [JsSIP] Enregistré avec succès');
          setSipConnected(true);
          console.groupEnd();
        } catch (error) {
          if (!cancelled) {
            const errorMsg = error instanceof Error && error.message.includes('timeout')
              ? 'Connexion SIP impossible — Vérifiez votre connexion internet'
              : 'Erreur lors de la connexion SIP';
            showToast('error', errorMsg, 7000);
            console.error('[DIALER] ❌ Erreur connexion SIP:', error);
            setSipConnected(false);
          }
          return;
        }

        uaRef.current = ua;
        console.log('✅ Initialisation terminée');
        console.groupEnd();
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error('❌ Erreur initialisation:', errMsg);
        console.groupEnd();
        if (!cancelled) {
          showToast('error', 'Impossible d\'initialiser la téléphonie', 8000);
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
      const ua = uaRef.current;
      if (ua) {
        ua.unregister();
        ua.stop();
      }
    };
  }, [isAuthenticated, stopCallTimer, showToast, reconnectSip]);

  // ─── Appel sortant ───
  const call = useCallback(async (phoneNumber: string, campagneId?: number, prospectId?: number) => {
    console.groupCollapsed(`📞 [APPEL] ${phoneNumber}`);
    console.log('Campagne:', campagneId, '| Prospect:', prospectId);
    console.log('SIP Connecté:', sipConnected ? '🟢' : '🔴');

    if (!uaRef.current || !sipConnected) {
      console.error('❌ Impossible d\'appeler — SIP non connecté');
      console.groupEnd();
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

      // Créer l'appel en DB au ringing
      if (!currentAppelId && campagneId && prospectId) {
        setCurrentOrigineAppel('auto');
        console.groupCollapsed('📝 [DB] Création appel');
        try {
          const appel = await appelService.createAppel({
            id_prospect: prospectId,
            id_campagne: campagneId,
            statut_appel: 'en_cours',
            origine_appel: 'auto',
            id_prospection: prochainProspect?.id_prospection,
          });
          console.log(`✅ ID: ${appel.id_appel}`);
          setCurrentAppelId(appel.id_appel);
        } catch (err) {
          console.error('❌ Erreur:', err);
        }
        console.groupEnd();
      }

      const e164 = formatPhoneE164(phoneNumber);
      const targetURI = `sip:${e164}@${sipDomainRef.current}`;

      console.groupCollapsed('📤 [JsSIP] APPEL SORTANT');
      console.log(`Vers: ${targetURI}`);

      // Récupérer la config RTC stockée dans l'UA
      const rtcConfig = (uaRef.current as any).rtcConfig || {
        iceServers: [
          {
            urls: [
              'stun:global.stun.twilio.com:3478', // Twilio STUN (prioritaire)
              'stun:stun.l.google.com:19302',
              'stun:stun1.l.google.com:19302',
              'stun:stun2.l.google.com:19302',
              'stun:stun.signalwire.com:3478',
            ],
          },
        ],
        iceTransportPolicy: 'all',
      };

      // Gestionnaires d'événements pour l'appel sortant
      const eventHandlers = {
        progress: () => {
          console.log('🔄 [APPEL] En cours...');
        },

        confirmed: (data: any) => {
          console.groupCollapsed('✅ [APPEL] Établi');

          const session = data.session;
          if (session && session.connection) {
            const pc = session.connection;

            // Vérification finale : tenter de récupérer les tracks si aucun événement track n'a été reçu
            const receivers = pc.getReceivers();
            console.log(`🎵 [CONFIRMED] ${receivers.length} réceveurs à l'établissement`);
            receivers.forEach((receiver: any) => {
              if (receiver.track) {
                console.log('🎵 [RECEIVER] Track au confirmed:', receiver.track.kind, receiver.track.id);
                const stream = new MediaStream([receiver.track]);
                if (remoteAudioRef.current) {
                  remoteAudioRef.current.srcObject = stream;
                  remoteAudioRef.current.play()
                    .then(() => console.log('✅ [AUDIO] play() OK (confirmed)'))
                    .catch((err) => {
                      console.error('❌ [AUDIO] Erreur play():', err.name, err.message);
                    });
                }
              }
            });

            // Surveillance ICE
            pc.addEventListener('iceconnectionstatechange', () => {
              const iceState = pc.iceConnectionState;
              console.log(`🧊 [ICE] State: ${iceState}`);
            });

            // Notification et session backend
            if (!hasCalledEstablishedRef.current && prospectId && campagneId) {
              hasCalledEstablishedRef.current = true;
              showToast('success', 'Appel établi', 3000);
              dialerService.startSession(prospectId, campagneId).catch(err => {
                console.error('[Session] Erreur startSession:', err);
              });
            }
          }

          setStatut('en_appel');
          setDepuisLe(new Date());
          startCallTimer();
          console.groupEnd();
        },

        ended: (data: any) => {
          console.groupCollapsed('📞 [APPEL] Terminé');
          console.log('Cause:', data.cause || 'Normal');
          stopCallTimer();
          isCallActiveRef.current = false;
          setStatut('pause_apres_appel');
          setDepuisLe(new Date());
          dialerService.changerStatut('pause_apres_appel').then(() => {
            console.log('✅ Backend sync OK');
          }).catch(err => {
            console.error('❌ Backend sync échoué:', err);
          });
          sessionRef.current = null;
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
          }
          if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
          dialerService.endSession().catch(() => {});
          console.groupEnd();
          console.groupEnd();
        },

        failed: (data: any) => {
          console.groupCollapsed('❌ [APPEL] Échoué');
          console.error('Cause:', data.cause || 'Inconnu');
          stopCallTimer();
          isCallActiveRef.current = false;
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
          }
          console.groupEnd();
          console.groupEnd();

          showToast('error', 'Échec de l\'appel — Vérifiez votre connexion', 5000);
        },
      };

      // Lancer l'appel avec JsSIP
      try {
        const session = uaRef.current!.call(targetURI, {
          eventHandlers,
          mediaConstraints: {
            audio: true,
            video: false,
          },
          pcConfig: rtcConfig,
        });

        if (session) {
          sessionRef.current = session;
          console.log('✅ [JsSIP] Appel lancé');

          // 🎯 Écouter l'événement 'track' dès la création de la session
          // IMPORTANT : doit être fait AVANT que la connexion ne soit établie
          if (session.connection) {
            session.connection.addEventListener('track', (e: RTCTrackEvent) => {
              console.log('🎵 [TRACK] Nouvelle piste reçue (early):', e.track.kind, e.track.id);
              if (e.track.kind === 'audio' && remoteAudioRef.current) {
                const stream = new MediaStream([e.track]);
                remoteAudioRef.current.srcObject = stream;
                remoteAudioRef.current.play()
                  .then(() => console.log('✅ [AUDIO] play() OK (early)'))
                  .catch((err) => {
                    console.error('❌ [AUDIO] Erreur play():', err.name, err.message);
                  });
              }
            });
          }

          // Attendre un peu que la connexion RTCPeerConnection soit créée
          setTimeout(() => {
            if (session.connection && remoteAudioRef.current) {
              console.log('🎵 [TRACK] Vérification réceveurs après délai...');
              const receivers = session.connection.getReceivers();
              console.log(`🎵 [TRACK] ${receivers.length} réceveurs trouvés`);
              receivers.forEach((receiver: any) => {
                if (receiver.track) {
                  console.log('🎵 [RECEIVER] Track:', receiver.track.kind, receiver.track.id);
                  const stream = new MediaStream([receiver.track]);
                  remoteAudioRef.current!.srcObject = stream;
                  remoteAudioRef.current!.play()
                    .then(() => console.log('✅ [AUDIO] play() OK (receiver delayed)'))
                    .catch((err) => {
                      console.error('❌ [AUDIO] Erreur play():', err.name, err.message);
                    });
                }
              });
            }
          }, 100);
        } else {
          throw new Error('Session non créée');
        }
      } catch (inviteError) {
        console.error('❌ [JsSIP] Erreur lancement appel:', inviteError);
        throw inviteError;
      }
    } catch (err) {
      isCallActiveRef.current = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }

      console.groupCollapsed('❌ [ERREUR] Appel');
      console.error('Type:', err instanceof Error ? err.constructor.name : typeof err);
      console.error('Message:', err instanceof Error ? err.message : String(err));
      if (err instanceof Error && err.stack) {
        console.error('Stack:', err.stack);
      }
      console.groupEnd();
      console.groupEnd();

      showToast('error', 'Échec de l\'appel — Vérifiez votre connexion', 5000);
    }
  }, [sipConnected, startCallTimer, stopCallTimer, prochainProspect, currentAppelId, callDuration, showToast]);

  // ─── Hangup ───
  const hangup = useCallback(() => {
    if (sessionRef.current) {
      console.groupCollapsed('📞 [APPEL] Hangup manuel');
      sessionRef.current.terminate();
      console.log('✅ BYE envoyé');
      console.groupEnd();
    }
  }, []);

  // ─── Répondre à un appel entrant ───
  const answer = useCallback(async () => {
    const session = incomingSessionRef.current;
    if (!session) {
      console.warn('⚠️ Aucune invitation à répondre');
      return;
    }

    console.groupCollapsed('📞 [APPEL ENTRANT] Réponse');
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
      console.log('✅ Microphone OK');
      mediaStreamRef.current = stream;
      isCallActiveRef.current = true;

      // Répondre à l'appel
      session.answer({
        mediaConstraints: {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
          video: false,
        },
      });

      console.log('✅ Invitation acceptée');
      sessionRef.current = session;
      setIncomingCall(null);

      // 🎯 Écouter l'événement 'track' dès la réponse (AVANT l'établissement)
      if (session.connection) {
        session.connection.addEventListener('track', (e: RTCTrackEvent) => {
          console.log('🎵 [TRACK ENTRANT] Nouvelle piste (early):', e.track.kind, e.track.id);
          if (e.track.kind === 'audio' && remoteAudioRef.current) {
            const stream = new MediaStream([e.track]);
            remoteAudioRef.current.srcObject = stream;
            remoteAudioRef.current.play()
              .then(() => console.log('✅ [AUDIO ENTRANT] play() OK (early)'))
              .catch((err) => {
                console.error('❌ [AUDIO ENTRANT] Erreur play():', err.name, err.message);
              });
          }
        });
      }

      // Attendre un peu que la session soit établie
      setTimeout(() => {
        if (session.connection) {
          const pc = session.connection;

          // Vérification des réceveurs avec logs
          const receivers = pc.getReceivers();
          console.log(`🎵 [TRACK ENTRANT] ${receivers.length} réceveurs trouvés`);
          receivers.forEach((receiver: any) => {
            if (receiver.track) {
              console.log('🎵 [RECEIVER ENTRANT] Track:', receiver.track.kind, receiver.track.id);
              const stream = new MediaStream([receiver.track]);
              if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = stream;
                remoteAudioRef.current.play()
                  .then(() => console.log('✅ [AUDIO ENTRANT] play() OK (receiver)'))
                  .catch((err) => {
                    console.error('❌ [AUDIO ENTRANT] Erreur play():', err.name, err.message);
                  });
              }
            }
          });
        }

        setStatut('en_appel');
        setDepuisLe(new Date());
        startCallTimer();
        console.groupEnd();
      }, 100);
    } catch (err) {
      isCallActiveRef.current = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }

      console.groupCollapsed('❌ [ERREUR] Réponse appel entrant');
      console.error('Message:', err instanceof Error ? err.message : String(err));
      console.groupEnd();
      console.groupEnd();

      showToast('error', 'Impossible de répondre', 5000);
    }
  }, [startCallTimer, showToast]);

  // ─── Rejeter un appel entrant ───
  const reject = useCallback(() => {
    incomingSessionRef.current?.terminate();
    setIncomingCall(null);
    incomingSessionRef.current = null;
  }, []);

  // ─── Nettoyer le prochain prospect ───
  const clearProchainProspect = useCallback(() => {
    setProchainProspect(null);
    setCurrentAppelId(null);
    setCurrentIdProspection(null);
    setCurrentOrigineAppel(null);
    isClosingRef.current = false;
  }, []);

  // ─── Changer de statut ───
  const changerStatut = useCallback(async (nouveauStatut: StatutDialer, raison?: RaisonPause) => {
    // Guard clauses
    if (nouveauStatut === 'disponible' && closingService.hasPending()) {
      console.warn('[DIALER] Impossible de passer disponible : closing en attente');
      return;
    }

    if (nouveauStatut === 'disponible' && isCallActiveRef.current) {
      console.warn('[DIALER] Impossible de passer disponible : appel en cours');
      return;
    }

    if (nouveauStatut === 'disponible' && !sipConnected) {
      console.warn('[DIALER] Impossible de passer disponible : SIP non connecté');
      showToast('error', 'Connexion SIP non établie — Impossible de passer disponible', 5000);
      return;
    }

    // Mise à jour immédiate du state local
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

  // ─── Ouvrir un prospect manuellement ───
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

  return (
    <DialerContext.Provider value={{
      statut,
      raisonPause,
      depuisLe,
      isLoading,
      sipConnected,
      sipReconnecting,
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
