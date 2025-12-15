import { createContext } from 'react';
import type { Prospect } from '../../utils/types';

export interface ProspectContextType {
  currentProspect: Prospect | null;
  isLoading: boolean;
  error: string | null;

  loadProspect: (id: number) => Promise<void>;
  loadProspectByPhone: (phone: string) => Promise<void>;
  clearProspect: () => void;
  clearError: () => void;
}

export const ProspectContext = createContext<ProspectContextType | undefined>(undefined);
