import { createContext } from 'react';
import type { StatutDialer, RaisonPause } from '../../utils/types';

export interface IncomingCall {
  from: string;
  displayName: string;
}

export interface DialerContextType {
  statut: StatutDialer;
  raisonPause: RaisonPause | null;
  depuisLe: Date;
  isLoading: boolean;
  sipConnected: boolean;
  callDuration: number;
  incomingCall: IncomingCall | null;
  changerStatut: (statut: StatutDialer, raison?: RaisonPause) => Promise<void>;
  call: (phoneNumber: string) => Promise<void>;
  hangup: () => void;
  answer: () => Promise<void>;
  reject: () => void;
}

export const DialerContext = createContext<DialerContextType | undefined>(undefined);
