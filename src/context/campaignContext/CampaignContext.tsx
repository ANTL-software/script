import { createContext } from 'react';
import type { Campaign } from '../../utils/types';

export interface CampaignContextType {
  currentCampaign: Campaign | null;
  isLoading: boolean;
  error: string | null;

  loadCampaign: (id: number) => Promise<void>;
  clearCampaign: () => void;
  clearError: () => void;
}

export const CampaignContext = createContext<CampaignContextType | undefined>(undefined);
