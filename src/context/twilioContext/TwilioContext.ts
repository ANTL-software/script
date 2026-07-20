import { createContext } from 'react';
import type { Call } from '@twilio/voice-sdk';

export interface TwilioContextType {
  isTwilioReady: boolean;
  twilioConnected: boolean;
  callDuration: number;
  callDurationFormatted: string;
  isCallActive: boolean;
  activeCallSid: string | null;
  incomingCall: Call | null;
  initializeTwilio: () => Promise<void>;
  call: (phoneNumber: string) => Promise<string | null>;
  hangup: () => void;
  answer: () => void;
  reject: () => void;
  cleanup: () => Promise<void>;
}

export const TwilioContext = createContext<TwilioContextType | null>(null);
