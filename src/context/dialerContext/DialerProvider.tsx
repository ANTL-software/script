import { useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { UserAgent, Registerer, Inviter, SessionState } from 'sip.js';
import type { Session, Invitation } from 'sip.js';
import { DialerContext } from './DialerContext';
import type { IncomingCall } from './DialerContext';
import { UserContext } from '../userContext/UserContext';
import { useContext } from 'react';
import { dialerService } from '../../API/services';
import type { StatutDialer, RaisonPause } from '../../utils/types';
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

  const uaRef = useRef<UserAgent | null>(null);
  const registererRef = useRef<Registerer | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const incomingSessionRef = useRef<Invitation | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sipDomainRef = useRef<string>('');

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

        const ua = new UserAgent({
          uri,
          transportOptions: { server: creds.ws_url },
          authorizationPassword: creds.sip_password,
          authorizationUsername: username,
          logLevel: 'error',
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
                  setIncomingCall(null);
                  incomingSessionRef.current = null;
                  stopCallTimer();
                  setStatut('apres_appel');
                  setDepuisLe(new Date());
                  sessionRef.current = null;
                  const audioEl = document.getElementById('remoteAudio') as HTMLAudioElement | null;
                  if (audioEl) audioEl.srcObject = null;
                }
              });
            },
          },
        });

        const registerer = new Registerer(ua);

        registerer.stateChange.addListener((state) => {
          if (cancelled) return;
          if (state === 'Registered') {
            setSipConnected(true);
            setStatut('disponible');
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
        // Pas connecté ou pas de credentials configurés — mode dégradé silencieux
        console.info('[SIP] Non initialisé (non authentifié ou credentials manquants)');
      }
    };

    initSip();

    return () => {
      cancelled = true;
      stopCallTimer();
      registererRef.current?.unregister().catch(() => {});
      uaRef.current?.stop().catch(() => {});
    };
  }, [isAuthenticated, stopCallTimer]);

  const call = useCallback(async (phoneNumber: string) => {
    if (!uaRef.current || !sipConnected) {
      console.warn('[SIP] Non connecté, impossible d\'appeler');
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const e164 = formatPhoneE164(phoneNumber);
      const targetURI = UserAgent.makeURI(`sip:${e164}@${sipDomainRef.current}`);
      if (!targetURI) {
        console.error('[SIP] URI cible invalide:', e164);
        return;
      }

      const inviter = new Inviter(uaRef.current, targetURI);

      inviter.stateChange.addListener((state) => {
        if (state === SessionState.Established) {
          // Attacher le flux audio distant à l'élément <audio>
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
          stopCallTimer();
          setStatut('apres_appel');
          setDepuisLe(new Date());
          sessionRef.current = null;
          const audioEl = document.getElementById('remoteAudio') as HTMLAudioElement | null;
          if (audioEl) audioEl.srcObject = null;
        }
      });

      await inviter.invite();
      sessionRef.current = inviter;
    } catch (err) {
      console.error('[SIP] Erreur lors de l\'appel:', err);
    }
  }, [sipConnected, startCallTimer, stopCallTimer]);

  const hangup = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.bye().catch(() => {
        sessionRef.current?.cancel().catch(() => {});
      });
    }
  }, []);

  const answer = useCallback(async () => {
    const invitation = incomingSessionRef.current;
    if (!invitation) return;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await invitation.accept();
      sessionRef.current = invitation;
      setIncomingCall(null);

      // Attacher le flux audio distant
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
    } catch (err) {
      console.error('[SIP] Erreur lors de la prise d\'appel:', err);
    }
  }, [startCallTimer]);

  const reject = useCallback(() => {
    incomingSessionRef.current?.reject().catch(() => {});
    setIncomingCall(null);
    incomingSessionRef.current = null;
  }, []);

  const changerStatut = useCallback(async (nouveauStatut: StatutDialer, raison?: RaisonPause) => {
    setIsLoading(true);
    try {
      await dialerService.changerStatut(nouveauStatut, raison);
      setStatut(nouveauStatut);
      setRaisonPause(raison ?? null);
      setDepuisLe(new Date());
    } catch (error) {
      console.warn('[Dialer] Endpoint non disponible, mise à jour locale uniquement', error);
      setStatut(nouveauStatut);
      setRaisonPause(raison ?? null);
      setDepuisLe(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <DialerContext.Provider value={{
      statut,
      raisonPause,
      depuisLe,
      isLoading,
      sipConnected,
      callDuration,
      incomingCall,
      changerStatut,
      call,
      hangup,
      answer,
      reject,
    }}>
      {children}
    </DialerContext.Provider>
  );
};
