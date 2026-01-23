import { useContext, type Context } from 'react';

/**
 * Factory pour créer des hooks de contexte avec validation automatique
 * @param ContextObject - Le contexte React
 * @param hookName - Le nom du hook (pour le message d'erreur)
 * @param providerName - Le nom du provider (pour le message d'erreur)
 * @returns Un hook typé qui valide et retourne le contexte
 */
export function createContextHook<T>(
  ContextObject: Context<T | undefined>,
  hookName: string,
  providerName: string
): () => T {
  return function useContextHook(): T {
    const context = useContext(ContextObject);
    if (context === undefined) {
      throw new Error(`${hookName} must be used within a ${providerName}`);
    }
    return context;
  };
}
