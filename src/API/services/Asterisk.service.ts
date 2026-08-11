import { Web } from 'sip.js';
import type { AsteriskTelephonySession } from '../../utils/types';

export interface AsteriskBrowserClientCallbacks {
  onRegistered: () => void;
  onUnregistered: () => void;
  onServerDisconnect: (error?: Error) => void;
  onIncomingCall: () => void;
  onCallCreated: () => void;
  onCallAnswered: () => void;
  onCallHangup: () => void;
}

const normalizeDestination = (phoneNumber: string, domain: string): string => {
  const normalized = phoneNumber.replace(/[\s().-]/g, '');

  if (!/^\+?\d{3,20}$/.test(normalized)) {
    throw new Error('Numéro de téléphone invalide');
  }

  return `sip:${normalized}@${domain}`;
};

export class AsteriskBrowserClient {
  private simpleUser: Web.SimpleUser | null = null;
  private session: AsteriskTelephonySession | null = null;

  public async connect(
    session: AsteriskTelephonySession,
    remoteAudio: HTMLAudioElement,
    callbacks: AsteriskBrowserClientCallbacks
  ): Promise<void> {
    if (this.simpleUser) {
      return;
    }

    const peerConnectionConfiguration: RTCConfiguration = {
      iceServers: session.iceServers.map((iceServer) => ({
        urls: iceServer.urls,
        ...(iceServer.username ? { username: iceServer.username } : {}),
        ...(iceServer.credential ? { credential: iceServer.credential } : {}),
      })),
    };

    const options: Web.SimpleUserOptions = {
      aor: session.sip.uri,
      delegate: {
        onRegistered: callbacks.onRegistered,
        onUnregistered: callbacks.onUnregistered,
        onServerDisconnect: callbacks.onServerDisconnect,
        onCallReceived: callbacks.onIncomingCall,
        onCallCreated: callbacks.onCallCreated,
        onCallAnswered: callbacks.onCallAnswered,
        onCallHangup: callbacks.onCallHangup,
      },
      media: {
        constraints: { audio: true, video: false },
        remote: { audio: remoteAudio },
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 4,
      sendDTMFUsingSessionDescriptionHandler: true,
      userAgentOptions: {
        authorizationUsername: session.sip.authorizationUsername,
        authorizationPassword: session.sip.authorizationPassword,
        logBuiltinEnabled: import.meta.env.DEV,
        logConfiguration: false,
        sessionDescriptionHandlerFactoryOptions: {
          peerConnectionConfiguration,
        },
        userAgentString: 'ANTL-Script-Asterisk',
      },
    };

    const simpleUser = new Web.SimpleUser(session.sip.webSocketUrl, options);
    this.simpleUser = simpleUser;
    this.session = session;

    try {
      await simpleUser.connect();
      await simpleUser.register();
    } catch (error) {
      this.simpleUser = null;
      this.session = null;
      await simpleUser.disconnect().catch(() => undefined);
      throw error;
    }
  }

  public isConnected(): boolean {
    return this.simpleUser?.isConnected() ?? false;
  }

  public async call(phoneNumber: string): Promise<void> {
    if (!this.simpleUser || !this.session || !this.simpleUser.isConnected()) {
      throw new Error('Client Asterisk non connecté');
    }

    await this.simpleUser.call(normalizeDestination(phoneNumber, this.session.sip.domain), {
      earlyMedia: true,
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
      },
    });
  }

  public async sendDigits(digits: string): Promise<void> {
    if (!this.simpleUser) {
      throw new Error('Aucun appel Asterisk actif');
    }

    for (const digit of digits) {
      await this.simpleUser.sendDTMF(digit);
    }
  }

  public async hangup(): Promise<void> {
    await this.simpleUser?.hangup();
  }

  public async answer(): Promise<void> {
    if (!this.simpleUser) {
      throw new Error('Aucun appel Asterisk entrant');
    }
    await this.simpleUser.answer();
  }

  public async decline(): Promise<void> {
    if (!this.simpleUser) {
      throw new Error('Aucun appel Asterisk entrant');
    }
    await this.simpleUser.decline();
  }

  public getLocalMediaStream(): MediaStream | undefined {
    return this.simpleUser?.localMediaStream;
  }

  public getRemoteMediaStream(): MediaStream | undefined {
    return this.simpleUser?.remoteMediaStream;
  }

  public async disconnect(): Promise<void> {
    const simpleUser = this.simpleUser;
    this.simpleUser = null;
    this.session = null;

    if (!simpleUser) {
      return;
    }

    await simpleUser.hangup().catch(() => undefined);
    await simpleUser.unregister().catch(() => undefined);
    await simpleUser.disconnect().catch(() => undefined);
  }
}
