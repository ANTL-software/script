import { useState, useCallback } from 'react';
import { rendezVousService } from '../API/services';
import type { RendezVous } from '../utils/types';

export function useProspectRendezVous(prospectId: number | null, campagneId: number | null) {
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!prospectId || !campagneId) {
      setRendezVous([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await rendezVousService.getRendezVousByProspect(prospectId, campagneId);
      setRendezVous(response);
      console.log(`[PROSPECT] ${response.length} rendez-vous charges`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des rendez-vous';
      setError(errorMessage);
      console.error('[PROSPECT] Erreur chargement rendez-vous:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [campagneId, prospectId]);

  const clearError = useCallback(() => setError(null), []);

  const reset = useCallback(() => {
    setRendezVous([]);
    setError(null);
  }, []);

  return { rendezVous, loading, error, load, clearError, reset };
}
