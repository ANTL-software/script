import { apiCalls } from '../APICalls';
import type { Vente, CreateVenteData } from '../../utils/types';
import { buildQueryString } from '../../utils/scripts/utils';

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
    const response = await apiCalls.post<Vente>('/ventes', data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la création de la vente');
    }
    return response.data;
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
      items: Vente[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/prospects/${prospectId}/ventes${queryString}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération des ventes');
    }

    return {
      ventes: response.data.items,
      total: response.data.pagination.total,
      page: response.data.pagination.page,
      totalPages: response.data.pagination.totalPages,
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
      items: Vente[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/ventes${queryString}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération des ventes');
    }

    return {
      ventes: response.data.items,
      total: response.data.pagination.total,
      page: response.data.pagination.page,
      totalPages: response.data.pagination.totalPages,
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
