export type TelephonyProvider = 'twilio' | 'asterisk';

export type TelephonyTransportKind = 'twilio-sdk' | 'sip-wss';

export interface TelephonyTransportConfiguration {
  kind: TelephonyTransportKind;
  webSocketUrl: string | null;
  sipDomain: string | null;
}

export interface TelephonyCapabilities {
  outboundCalls: boolean;
  incomingCalls: boolean;
  supervisorWhisper: boolean;
  answeringMachineDetection: boolean;
  recording: boolean;
}

export interface TelephonyConfiguration {
  provider: TelephonyProvider;
  configured: boolean;
  browserClientAvailable: boolean;
  transport: TelephonyTransportConfiguration;
  capabilities: TelephonyCapabilities;
}

export interface AsteriskIceServer {
  urls: string[];
  username?: string;
  credential?: string;
}

export interface AsteriskSipSession {
  uri: string;
  authorizationUsername: string;
  authorizationPassword: string;
  webSocketUrl: string;
  domain: string;
}

export interface AsteriskTelephonySession {
  provider: 'asterisk';
  sip: AsteriskSipSession;
  iceServers: AsteriskIceServer[];
  expiresAt: string;
}
