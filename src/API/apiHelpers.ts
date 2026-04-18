import type { ApiResponse } from '../utils/types';

/**
 * Valide une reponse API et retourne les donnees typees
 * @throws Error si la reponse n'est pas un succes ou si les donnees sont manquantes
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
 * Extrait et normalise les donnees paginees d'une reponse API
 *
 * Le backend paginated() retourne :
 * { success, data: T[], pagination: { page, limit, total, totalPages } }
 */
export function extractPaginatedData<T, R>(
  response: ApiResponse<T[]>,
  transformer: (item: T) => R,
  defaultErrorMessage: string = 'Erreur lors de la récupération des données'
): { items: R[]; total: number; page: number; totalPages: number } {
  const data = throwIfApiError(response, defaultErrorMessage);
  const items = Array.isArray(data) ? data : [];
  const pagination = response.pagination || { total: items.length, page: 1, limit: 20, totalPages: 1 };

  return {
    items: items.map(transformer),
    total: pagination.total,
    page: pagination.page,
    totalPages: pagination.totalPages,
  };
}
