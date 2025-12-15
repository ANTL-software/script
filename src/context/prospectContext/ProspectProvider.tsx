import { useState, useCallback } from 'react';
import { ProspectContext } from './ProspectContext';
import { prospectService } from '../../API/services';
import type { Prospect } from '../../utils/types';

interface ProspectProviderProps {
  children: React.ReactNode;
}

export const ProspectProvider = ({ children }: ProspectProviderProps) => {
  const [currentProspect, setCurrentProspect] = useState<Prospect | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadProspect = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const prospectModel = await prospectService.getProspectById(id);
      setCurrentProspect(prospectModel.toJSON());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du prospect';
      setError(errorMessage);
      console.error('[PROSPECT] Erreur chargement:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadProspectByPhone = useCallback(async (phone: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const prospectModel = await prospectService.getProspectByPhone(phone);
      setCurrentProspect(prospectModel.toJSON());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Prospect non trouvé';
      setError(errorMessage);
      console.error('[PROSPECT] Erreur recherche par téléphone:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearProspect = useCallback(() => {
    setCurrentProspect(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    currentProspect,
    isLoading,
    error,
    loadProspect,
    loadProspectByPhone,
    clearProspect,
    clearError,
  };

  return <ProspectContext.Provider value={value}>{children}</ProspectContext.Provider>;
};
