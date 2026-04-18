import { useState, useCallback, useMemo } from 'react';
import { ProspectContext } from './ProspectContext';
import { prospectService } from '../../API/services';
import { getTypeFiche } from '../../utils/scripts/utils';
import { useProspectAppels } from '../../hooks/useProspectAppels';
import { useProspectVentes } from '../../hooks/useProspectVentes';
import type { Prospect, TypeFiche, UpdateProspectData } from '../../utils/types';

interface ProspectProviderProps {
  children: React.ReactNode;
}

export const ProspectProvider = ({ children }: ProspectProviderProps) => {
  // Prospect state
  const [currentProspect, setCurrentProspect] = useState<Prospect | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sous-hooks spécialisés
  const prospectId = currentProspect?.id_prospect ?? null;
  const appelsHook = useProspectAppels(prospectId);
  const ventesHook = useProspectVentes(prospectId);

  // Computed properties
  const fullName = useMemo(() => {
    if (!currentProspect) return '';
    if (currentProspect.type_prospect === 'Entreprise' && currentProspect.raison_sociale) {
      return currentProspect.raison_sociale;
    }
    return currentProspect.prenom
      ? `${currentProspect.prenom} ${currentProspect.nom}`
      : currentProspect.nom;
  }, [currentProspect]);

  const typeFiche = useMemo((): TypeFiche => {
    if (!currentProspect) return 'jamais_appele';
    return getTypeFiche(currentProspect.statut);
  }, [currentProspect]);

  // Prospect actions
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
      const errorMessage = err instanceof Error ? err.message : 'Prospect non trouve';
      setError(errorMessage);
      console.error('[PROSPECT] Erreur recherche par telephone:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearProspect = useCallback(() => {
    setCurrentProspect(null);
    setError(null);
    appelsHook.reset();
    ventesHook.reset();
  }, [appelsHook, ventesHook]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateProspect = useCallback(async (data: UpdateProspectData) => {
    if (!currentProspect) {
      console.warn('[PROSPECT] Aucun prospect actif, impossible de mettre a jour');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const prospectModel = await prospectService.updateProspect(currentProspect.id_prospect, data);
      setCurrentProspect(prospectModel.toJSON());
      console.log(`[PROSPECT] Prospect ${currentProspect.id_prospect} mis a jour`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise a jour du prospect';
      setError(errorMessage);
      console.error('[PROSPECT] Erreur mise a jour:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentProspect]);

  const value = {
    // Prospect
    currentProspect,
    isLoading,
    error,

    // Appels (delegué au hook)
    appels: appelsHook.appels,
    appelsLoading: appelsHook.loading,
    appelsError: appelsHook.error,
    appelsPagination: appelsHook.pagination,

    // Ventes (delegué au hook)
    ventes: ventesHook.ventes,
    ventesLoading: ventesHook.loading,
    ventesError: ventesHook.error,

    // Prospect actions
    loadProspect,
    loadProspectByPhone,
    updateProspect,
    clearProspect,
    clearError,

    // Appels actions
    loadAppels: appelsHook.load,
    updateAppelNotes: appelsHook.updateNotes,
    clearAppelsError: appelsHook.clearError,

    // Ventes actions
    loadVentes: ventesHook.load,
    createVente: ventesHook.create,
    clearVentesError: ventesHook.clearError,

    // Computed properties
    fullName,
    typeFiche,
  };

  return <ProspectContext.Provider value={value}>{children}</ProspectContext.Provider>;
};
