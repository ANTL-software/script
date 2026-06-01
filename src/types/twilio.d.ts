// Type definitions for @twilio/voice-sdk v2.x
// Documentation: https://www.twilio.com/docs/voice/sdks/javascript

declare module '@twilio/voice-sdk' {
  // ============================================
  // CONNECTION
  // ============================================
  export class Connection {
    sid: string;
    status: ConnectionStatus;
    parameters: {
      From: string;
      To: string;
      CallSid: string;
      [key: string]: string;
    };
    message: string;
    source: ConnectionSource;

    // Méthodes
    disconnect(): void;
    accept(options?: { mediaConstraints?: { audio: boolean } }): void;
    reject(): void;
    isMuted(): boolean;
    mute(): void;
    unmute(): void;

    // Event listeners
    on(event: ConnectionEvent, handler: (...args: any[]) => void): void;
    off(event: ConnectionEvent, handler: (...args: any[]) => void): void;
  }

  export type ConnectionStatus = 'pending' | 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'closed';
  export type ConnectionSource = 'inbound' | 'outbound';
  export type ConnectionEvent = 'accept' | 'disconnect' | 'error' | 'mute' | 'reject';

  // ============================================
  // DEVICE SINGLETON
  // ============================================
  // Device est exporté comme un objet singleton, pas une classe
  export interface Device {
    // État
    token: string;
    state: DeviceState;
    edges: Edge[];

    // Méthodes de configuration
    setup(token: string, options?: DeviceOptions): void;
    destroy(): void;
    updateToken(token: string): void;

    // Méthodes d'appel
    connect(options?: ConnectOptions): Connection;
    disconnectAll(): void;

    // Méthodes d'état
    activeConnections(): Connection[];
    incomingConnections(): Connection[];

    // Event listeners
    on(event: DeviceEvent, handler: (...args: any[]) => void): void;
    off(event: DeviceEvent, handler?: (...args: any[]) => void): void;
    removeAllListeners(event?: DeviceEvent): void;
  }

  export type DeviceState = 'busy' | 'idle' | 'offline' | 'ready';
  export type Edge = 'ashburn' | 'dublin' | 'frankfurt' | 'sydney' | 'singapore' | 'sao-paulo' | 'tokyo' | 'roaming';

  export type DeviceEvent =
    | 'registered'
    | 'unregistered'
    | 'connecting'
    | 'open'
    | 'close'
    | 'error'
    | 'incoming'
    | 'offline'
    | 'ready'
    | 'destroyed'
    | 'tokenWillExpire'
    | 'connect'
    | 'disconnect'
    | 'cancel';

  // ============================================
  // OPTIONS
  // ============================================
  export interface DeviceOptions {
    codecPreferences?: Codec[];
    debug?: boolean;
    logLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    maxCallSignalingBitsPerSecond?: number;
    maxAverageBitrate?: number;
    region?: string;
    edge?: Edge;
    iceServers?: RTCIceServer[];
    allowIncomingWhileBusy?: boolean;
    audioConstraints?: MediaTrackConstraints;
    enableIceRestart?: boolean;
    enableImprovedSignalingErrorPrecision?: boolean;
    forceAggressiveIceRestart?: boolean;
    insights?: boolean;
    customCallParameters?: Record<string, string>;
    rtcConfiguration?: RTCConfiguration;
    tokenRefresh?: (done: (newToken: string) => void) => void;
  }

  export interface ConnectOptions {
    params?: Record<string, string>;
    rtcConfiguration?: RTCConfiguration;
    rtcConstraints?: RTCOfferOptions;
    phoneNumber?: string;
  }

  export type Codec = 'opus' | 'PCMU' | 'PCMA';

  // ============================================
  // EXPORT PAR DÉFAUT
  // ============================================
  export const Device: Device;
  export default Device;
}
