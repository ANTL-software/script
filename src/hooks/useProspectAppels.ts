import { useState, useCallback } from 'react';
import { appelService } from '../API/services';
import type { Appel, Pagination } from '../utils/types';

const APPELS_LIMIT = 20;

export function useProspectAppels(prospectId: number | null) {
  const [appels, setAppels] = useState<Appel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const load = useCallback(async (page: number = 1) => {
    if (!prospectId) {
      console.warn('[PROSPECT] Aucun prospect actif, impossible de charger les appels');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await appelService.getAppelsByProspect(prospectId, { page, limit: APPELS_LIMIT });
      setAppels(response.appels);
      setPagination({
        page: response.page,
        totalPages: response.totalPages,
        total: response.total,
      });
      console.log(`[PROSPECT] ${response.total} appels charges`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des appels';
      setError(errorMessage);
      console.error('[PROSPECT] Erreur chargement appels:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [prospectId]);

  const updateNotes = useCallback(async (appelId: number, notes: string) => {
    setError(null);
    try {
      await appelService.updateAppel(appelId, { notes });
      await load(pagination.page);
      console.log(`[PROSPECT] Notes de l'appel ${appelId} mises a jour`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise a jour des notes';
      setError(errorMessage);
      console.error('[PROSPECT] Erreur mise a jour notes:', errorMessage);
      throw err;
    }
  }, [load, pagination.page]);

  const clearError = useCallback(() => setError(null), []);

  const reset = useCallback(() => {
    setAppels([]);
    setError(null);
    setPagination({ page: 1, totalPages: 1, total: 0 });
  }, []);

  return { appels, loading, error, pagination, load, updateNotes, clearError, reset };
}
