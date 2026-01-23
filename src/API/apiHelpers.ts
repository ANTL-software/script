import type { ApiResponse } from '../utils/types';

/**
 * Valide une réponse API et retourne les données typées
 * @throws Error si la réponse n'est pas un succès ou si les données sont manquantes
 */
export function throwIfApiError<T>(
  response: ApiResponse<T>,
  defaultErrorMessage: string = 'Une erreur est survenue'
): T {
  if (!response.success || !response.data) {
    throw new Error(response.message || defaultErrorMessage);
  }
  return response.data;
}

/**
 * Interface standard pour les réponses paginées
 */
export interface PaginatedApiData<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Extrait et normalise les données paginées d'une réponse API
 */
export function extractPaginatedData<T, R>(
  response: ApiResponse<PaginatedApiData<T>>,
  transformer: (item: T) => R,
  defaultErrorMessage: string = 'Erreur lors de la récupération des données'
): { items: R[]; total: number; page: number; totalPages: number } {
  const data = throwIfApiError(response, defaultErrorMessage);

  return {
    items: data.items.map(transformer),
    total: data.pagination.total,
    page: data.pagination.page,
    totalPages: data.pagination.totalPages,
  };
}
