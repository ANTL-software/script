import { apiCalls } from '../APICalls';
import type { Vente, CreateVenteData, ApiError } from '../../utils/types';
import { buildQueryString } from '../../utils/scripts/utils';

// Type guard for ApiError
function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'message' in error;
}

export class VenteService {
  private static instance: VenteService;

  private constructor() {}

  public static getInstance(): VenteService {
    if (!VenteService.instance) {
      VenteService.instance = new VenteService();
    }
    return VenteService.instance;
  }

  public async createVente(data: CreateVenteData): Promise<Vente> {
    try {
      const response = await apiCalls.post<Vente>('/ventes', data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Erreur lors de la création de la vente');
      }
      return response.data;
    } catch (err) {
      // Extraire le message d'erreur de ApiError ou Error
      const errorMessage = isApiError(err) ? err.message : (err instanceof Error ? err.message : 'Erreur lors de la création de la vente');
      throw new Error(errorMessage);
    }
  }

  public async getVenteById(id: number): Promise<Vente> {
    const response = await apiCalls.get<Vente>(`/ventes/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération de la vente');
    }
    return response.data;
  }

  public async getVentesByProspect(
    prospectId: number,
    params?: { page?: number; limit?: number }
  ): Promise<{ ventes: Vente[]; total: number; page: number; totalPages: number }> {
    const queryString = buildQueryString(params);
    const response = await apiCalls.get<{
      items?: Vente[];
      pagination?: { total: number; page: number; limit: number; totalPages: number };
    } | Vente[]>(`/ventes/prospect/${prospectId}/ventes${queryString}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération des ventes');
    }

    // Si la réponse est un array simple (pas de pagination)
    if (Array.isArray(response.data)) {
      return {
        ventes: response.data,
        total: response.data.length,
        page: 1,
        totalPages: 1,
      };
    }

    // Si la réponse a une structure avec items et pagination
    const items = response.data.items || [];
    const pagination = response.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };

    return {
      ventes: items,
      total: pagination.total,
      page: pagination.page,
      totalPages: pagination.totalPages,
    };
  }

  public async getVentes(params?: {
    page?: number;
    limit?: number;
    statut?: string;
    campagne?: number;
  }): Promise<{ ventes: Vente[]; total: number; page: number; totalPages: number }> {
    const queryString = buildQueryString(params);
    const response = await apiCalls.get<{
      items?: Vente[];
      pagination?: { total: number; page: number; limit: number; totalPages: number };
    } | Vente[]>(`/ventes${queryString}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération des ventes');
    }

    // Si la réponse est un array simple (pas de pagination)
    if (Array.isArray(response.data)) {
      return {
        ventes: response.data,
        total: response.data.length,
        page: 1,
        totalPages: 1,
      };
    }

    // Si la réponse a une structure avec items et pagination
    const items = response.data.items || [];
    const pagination = response.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };

    return {
      ventes: items,
      total: pagination.total,
      page: pagination.page,
      totalPages: pagination.totalPages,
    };
  }

  public async updateStatut(id: number, statut: string): Promise<Vente> {
    const response = await apiCalls.put<Vente>(`/ventes/${id}/statut`, { statut });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la mise à jour du statut');
    }
    return response.data;
  }
}

export const venteService = VenteService.getInstance();
