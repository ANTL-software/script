import { useState, useCallback } from 'react';
import { CampaignContext } from './CampaignContext';
import type { Campaign } from '../../utils/types';

interface CampaignProviderProps {
  children: React.ReactNode;
}

export const CampaignProvider = ({ children }: CampaignProviderProps) => {
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadCampaign = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log(`[CAMPAIGN] Chargement campagne ID: ${id}`);
      setCurrentCampaign(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de la campagne';
      setError(errorMessage);
      console.error('[CAMPAIGN] Erreur chargement:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCampaign = useCallback(() => {
    setCurrentCampaign(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    currentCampaign,
    isLoading,
    error,
    loadCampaign,
    clearCampaign,
    clearError,
  };

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
};
