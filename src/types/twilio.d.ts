// Type definitions for @twilio/voice-sdk
// Note: This is a simplified type definition for Twilio.Device
// The actual SDK doesn't provide TypeScript types, so we declare them manually

declare module '@twilio/voice-sdk' {
  interface TwilioConnection {
    sid: string;
    parameters: {
      From: string;
      To: string;
      CallSid: string;
    };
    disconnect(): void;
    accept(): void;
    reject(): void;
    status(): string;
  }

  interface Device {
    setup(token: string, options?: any): void;
    connect(options: { phoneNumber: string }): TwilioConnection | null;
    activeConnections(): TwilioConnection[];
    incomingConnections(): TwilioConnection[];
    status(): string;
    destroy(): void;
    on(event: string, handler: (...args: any[]) => void): void;
    off(event: string, handler: (...args: any[]) => void): void;
  }

  export const Device: Device;
}
