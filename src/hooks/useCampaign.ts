import { useContext } from 'react';
import { CampaignContext } from '../context/campaignContext';
import type { CampaignContextType } from '../context/campaignContext';

export const useCampaign = (): CampaignContextType => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};
