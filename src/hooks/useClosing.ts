import { useCallback } from 'react';
import { closingService, type PendingClosing } from '../API/services';

/**
 * Hook pour la gestion du closing obligatoire
 * Encapsule le ClosingService pour respecter la convention services > hooks > components
 */
export function useClosing() {
  /**
   * Verifie s'il y a un closing en attente
   */
  const hasPending = useCallback((): boolean => {
    return closingService.hasPending();
  }, []);

  /**
   * Recupere le closing en attente
   */
  const getPending = useCallback((): PendingClosing | null => {
    return closingService.getPending();
  }, []);

  /**
   * Sauvegarde un closing en attente
   */
  const savePending = useCallback((data: Omit<PendingClosing, 'timestamp'>): void => {
    closingService.savePending(data);
  }, []);

  /**
   * Supprime le closing en attente
   */
  const clearPending = useCallback((): void => {
    closingService.clearPending();
  }, []);

  return {
    hasPending,
    getPending,
    savePending,
    clearPending,
  };
}
