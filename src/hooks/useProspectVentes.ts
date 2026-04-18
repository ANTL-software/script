import { useState, useCallback } from 'react';
import { venteService } from '../API/services';
import type { Vente, CreateVenteData } from '../utils/types';

export function useProspectVentes(prospectId: number | null) {
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!prospectId) {
      console.warn('[PROSPECT] Aucun prospect actif, impossible de charger les ventes');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await venteService.getVentesByProspect(prospectId);
      setVentes(response.ventes);
      console.log(`[PROSPECT] ${response.ventes.length} ventes chargees`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des ventes';
      setError(errorMessage);
      console.error('[PROSPECT] Erreur chargement ventes:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [prospectId]);

  const create = useCallback(async (data: CreateVenteData): Promise<Vente> => {
    setError(null);
    try {
      const vente = await venteService.createVente(data);
      await load();
      console.log(`[PROSPECT] Vente ${vente.id_vente} creee`);
      return vente;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la creation de la vente';
      setError(errorMessage);
      console.error('[PROSPECT] Erreur creation vente:', errorMessage);
      throw err;
    }
  }, [load]);

  const clearError = useCallback(() => setError(null), []);

  const reset = useCallback(() => {
    setVentes([]);
    setError(null);
  }, []);

  return { ventes, loading, error, load, create, clearError, reset };
}
