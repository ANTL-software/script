import { useState, useCallback, useMemo } from 'react';
import { ProspectContext } from './ProspectContext';
import { prospectService, appelService, venteService } from '../../API/services';
import { getTypeFiche } from '../../utils/scripts/utils';
import type { Prospect, Appel, Vente, CreateVenteData, TypeFiche, Pagination } from '../../utils/types';

interface ProspectProviderProps {
  children: React.ReactNode;
}

const APPELS_LIMIT = 20;

export const ProspectProvider = ({ children }: ProspectProviderProps) => {
  // Prospect state
  const [currentProspect, setCurrentProspect] = useState<Prospect | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Appels state
  const [appels, setAppels] = useState<Appel[]>([]);
  const [appelsLoading, setAppelsLoading] = useState<boolean>(false);
  const [appelsError, setAppelsError] = useState<string | null>(null);
  const [appelsPagination, setAppelsPagination] = useState<Pagination>({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  // Ventes state
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [ventesLoading, setVentesLoading] = useState<boolean>(false);
  const [ventesError, setVentesError] = useState<string | null>(null);

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
    setAppels([]);
    setVentes([]);
    setError(null);
    setAppelsError(null);
    setVentesError(null);
    setAppelsPagination({ page: 1, totalPages: 1, total: 0 });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Appels actions
  const loadAppels = useCallback(async (page: number = 1) => {
    if (!currentProspect) {
      console.warn('[PROSPECT] Aucun prospect actif, impossible de charger les appels');
      return;
    }

    setAppelsLoading(true);
    setAppelsError(null);

    try {
      const response = await appelService.getAppelsByProspect(
        currentProspect.id_prospect,
        { page, limit: APPELS_LIMIT }
      );
      setAppels(response.appels);
      setAppelsPagination({
        page: response.page,
        totalPages: response.totalPages,
        total: response.total,
      });
      console.log(`[PROSPECT] ${response.total} appels charges`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des appels';
      setAppelsError(errorMessage);
      console.error('[PROSPECT] Erreur chargement appels:', errorMessage);
    } finally {
      setAppelsLoading(false);
    }
  }, [currentProspect]);

  const updateAppelNotes = useCallback(async (appelId: number, notes: string) => {
    setAppelsError(null);
    try {
      await appelService.updateAppel(appelId, { notes });
      // Recharger les appels apres modification
      await loadAppels(appelsPagination.page);
      console.log(`[PROSPECT] Notes de l'appel ${appelId} mises a jour`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise a jour des notes';
      setAppelsError(errorMessage);
      console.error('[PROSPECT] Erreur mise a jour notes:', errorMessage);
      throw err;
    }
  }, [loadAppels, appelsPagination.page]);

  const clearAppelsError = useCallback(() => {
    setAppelsError(null);
  }, []);

  // Ventes actions
  const loadVentes = useCallback(async () => {
    if (!currentProspect) {
      console.warn('[PROSPECT] Aucun prospect actif, impossible de charger les ventes');
      return;
    }

    setVentesLoading(true);
    setVentesError(null);

    try {
      const response = await venteService.getVentesByProspect(currentProspect.id_prospect);
      setVentes(response.ventes);
      console.log(`[PROSPECT] ${response.ventes.length} ventes chargees`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des ventes';
      setVentesError(errorMessage);
      console.error('[PROSPECT] Erreur chargement ventes:', errorMessage);
    } finally {
      setVentesLoading(false);
    }
  }, [currentProspect]);

  const createVente = useCallback(async (data: CreateVenteData): Promise<Vente> => {
    setVentesError(null);
    try {
      const vente = await venteService.createVente(data);
      // Recharger les ventes apres creation
      await loadVentes();
      console.log(`[PROSPECT] Vente ${vente.id_vente} creee`);
      return vente;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la creation de la vente';
      setVentesError(errorMessage);
      console.error('[PROSPECT] Erreur creation vente:', errorMessage);
      throw err;
    }
  }, [loadVentes]);

  const clearVentesError = useCallback(() => {
    setVentesError(null);
  }, []);

  const value = {
    // Prospect
    currentProspect,
    isLoading,
    error,

    // Appels
    appels,
    appelsLoading,
    appelsError,
    appelsPagination,

    // Ventes
    ventes,
    ventesLoading,
    ventesError,

    // Prospect actions
    loadProspect,
    loadProspectByPhone,
    clearProspect,
    clearError,

    // Appels actions
    loadAppels,
    updateAppelNotes,
    clearAppelsError,

    // Ventes actions
    loadVentes,
    createVente,
    clearVentesError,

    // Computed properties
    fullName,
    typeFiche,
  };

  return <ProspectContext.Provider value={value}>{children}</ProspectContext.Provider>;
};
