import { useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { UserAgent, Registerer, Inviter, SessionState } from 'sip.js';
import type { Session, Invitation } from 'sip.js';
import { DialerContext } from './DialerContext';
import type { IncomingCall } from './DialerContext';
import { UserContext } from '../userContext/UserContext';
import { useContext } from 'react';
import { dialerService, appelService, closingService } from '../../API/services';
import type { StatutDialer, RaisonPause, Prospect, ProspectAssigne, OrigineAppel } from '../../utils/types';
import { formatPhoneE164 } from '../../utils/scripts/formatters';

interface DialerProviderProps {
  children: ReactNode;
}

export const DialerProvider = ({ children }: DialerProviderProps) => {
  const userContext = useContext(UserContext);
  const isAuthenticated = userContext?.isAuthenticated ?? false;

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

        const registerer = new Registerer(ua);

        registerer.stateChange.addListener(async (state) => {
          if (cancelled) return;
          if (state === 'Registered') {
            setSipConnected(true);
            console.info('[DIALER] SIP enregistré — en attente de passage manuel en disponible');
          } else if (state === 'Unregistered' || state === 'Terminated') {
            setSipConnected(false);
            setStatut('hors_ligne');
          }
        });

        await ua.start();
        await registerer.register();

        uaRef.current = ua;
        registererRef.current = registerer;
      } catch {
        console.info('[SIP] Non initialisé (non authentifié ou credentials manquants)');
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
  }, [isAuthenticated, stopCallTimer]);

  const call = useCallback(async (phoneNumber: string, campagneId?: number, prospectId?: number) => {
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      console.error('[SIP] Erreur lors de l\'appel:', err);
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      console.error('[SIP] Erreur lors de la prise d\'appel:', err);
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
        try {
          const prospect = await dialerService.getNextProspect();
          setProchainProspect(prospect);
        } catch {
          // Pool vide — silencieux
        }
      }
    } catch (error) {
      console.warn('[Dialer] Échec synchro backend, statut local appliqué', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openProspectManual = useCallback(async (prospectId: number, origin: 'manuel' | 'rappel', prospectPhone?: string) => {
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
