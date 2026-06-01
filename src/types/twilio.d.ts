// Type definitions for @twilio/voice-sdk v2.x
// Documentation: https://www.twilio.com/docs/voice/sdks/javascript

declare module '@twilio/voice-sdk' {
  // ============================================
  // CONNECTION
  // ============================================
  class Connection {
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

  type ConnectionStatus = 'pending' | 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'closed';
  type ConnectionSource = 'inbound' | 'outbound';
  type ConnectionEvent = 'accept' | 'disconnect' | 'error' | 'mute' | 'reject';

  // ============================================
  // DEVICE SINGLETON
  // ============================================
  // Device est un singleton, pas une classe à instancier
  // On l'utilise directement : Device.setup(), Device.on(), etc.
  interface DeviceSingleton {
    // État (propriétés statiques)
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

  type DeviceState = 'busy' | 'idle' | 'offline' | 'ready';
  type Edge = 'ashburn' | 'dublin' | 'frankfurt' | 'sydney' | 'singapore' | 'sao-paulo' | 'tokyo' | 'roaming';

  type DeviceEvent =
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
  interface DeviceOptions {
    // Configuration générale
    codecPreferences?: Codec[];
    debug?: boolean;
    logLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    maxCallSignalingBitsPerSecond?: number;
    maxAverageBitrate?: number;
    region?: string;
    edge?: Edge;
    iceServers?: RTCIceServer[];

    // Audio
    allowIncomingWhileBusy?: boolean;
    audioConstraints?: MediaTrackConstraints;
    enableIceRestart?: boolean;
    enableImprovedSignalingErrorPrecision?: boolean;
    forceAggressiveIceRestart?: boolean;

    // Insights (monitoring)
    insights?: boolean;

    // Divers
    customCallParameters?: Record<string, string>;
    rtcConfiguration?: RTCConfiguration;

    // Fonctions de rappel
    tokenRefresh?: (done: (newToken: string) => void) => void;
  }

  interface ConnectOptions {
    params?: Record<string, string>;
    rtcConfiguration?: RTCConfiguration;
    rtcConstraints?: RTCOfferOptions;

    // Pour les appels sortants
    phoneNumber?: string;
  }

  type Codec = 'opus' | 'PCMU' | 'PCMA';

  // ============================================
  // EXPORTS
  // ============================================
  // Device est exporté comme un singleton, pas comme une classe
  const Device: DeviceSingleton;
  export { Device, Connection };
  export type { ConnectionStatus, ConnectionSource, ConnectionEvent, DeviceState, Edge, DeviceEvent, DeviceOptions, ConnectOptions, Codec, DeviceSingleton };
  export default Device;
}
