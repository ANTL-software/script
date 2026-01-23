import { CampaignContext } from '../context/campaignContext';
import type { CampaignContextType } from '../context/campaignContext';
import { createContextHook } from './createContextHook';

export const useCampaign = createContextHook<CampaignContextType>(
  CampaignContext,
  'useCampaign',
  'CampaignProvider'
);
