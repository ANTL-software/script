import { useState, useCallback } from 'react';
import { leadService } from '../API/services';
import type { LeadClient } from '../utils/types';

export function useProspectRendezVous(prospectId: number | null, campagneId: number | null) {
  const [rendezVous, setRendezVous] = useState<LeadClient[]>([]);
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
      const response = await leadService.getLeadsByProspect(prospectId, campagneId);
      setRendezVous(response);
      console.log(`[PROSPECT] ${response.length} rendez-vous client charges`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des rendez-vous client';
      setError(errorMessage);
      console.error('[PROSPECT] Erreur chargement rendez-vous client:', errorMessage);
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
