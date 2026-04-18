import { apiCalls } from '../APICalls';
import { throwIfApiError, extractPaginatedData } from '../apiHelpers';
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
    return throwIfApiError(response, 'Erreur lors de la création de la vente');
  }

  public async getVenteById(id: number): Promise<Vente> {
    const response = await apiCalls.get<Vente>(`/ventes/${id}`);
    return throwIfApiError(response, 'Erreur lors de la récupération de la vente');
  }

  public async getVentesByProspect(
    prospectId: number,
    params?: { page?: number; limit?: number }
  ): Promise<{ ventes: Vente[]; total: number; page: number; totalPages: number }> {
    const queryString = buildQueryString(params);
    const response = await apiCalls.get<Vente[]>(`/prospects/${prospectId}/ventes${queryString}`);

    const result = extractPaginatedData(response, (v: Vente) => v, 'Erreur lors de la récupération des ventes');
    return {
      ventes: result.items,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  public async getVentes(params?: {
    page?: number;
    limit?: number;
    statut?: string;
    campagne?: number;
  }): Promise<{ ventes: Vente[]; total: number; page: number; totalPages: number }> {
    const queryString = buildQueryString(params);
    const response = await apiCalls.get<Vente[]>(`/ventes${queryString}`);

    const result = extractPaginatedData(response, (v: Vente) => v, 'Erreur lors de la récupération des ventes');
    return {
      ventes: result.items,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  public async updateStatut(id: number, statut: string): Promise<Vente> {
    const response = await apiCalls.put<Vente>(`/ventes/${id}/statut`, { statut_vente: statut });
    return throwIfApiError(response, 'Erreur lors de la mise à jour du statut');
  }
}

export const venteService = VenteService.getInstance();
