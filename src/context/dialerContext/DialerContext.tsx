import { createContext } from 'react';
import type { StatutDialer, RaisonPause, Prospect, ProspectAssigne } from '../../utils/types';

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
  prochainProspect: (Prospect & ProspectAssigne) | null;
  currentCampagneId: number | null;
  currentAppelId: number | null;
  currentIdProspection: number | null;
  changerStatut: (statut: StatutDialer, raison?: RaisonPause) => Promise<void>;
  clearProchainProspect: () => void;
  call: (phoneNumber: string, campagneId?: number, prospectId?: number) => Promise<void>;
  hangup: () => void;
  answer: () => Promise<void>;
  reject: () => void;
}

export const DialerContext = createContext<DialerContextType | undefined>(undefined);
