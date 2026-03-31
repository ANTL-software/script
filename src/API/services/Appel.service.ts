import { apiCalls } from '../APICalls';
import type { Appel, CreateAppelData, TerminerAppelData, UpdateAppelData } from '../../utils/types';
import { buildQueryString } from '../../utils/scripts/utils';

export class AppelService {
  private static instance: AppelService;

  private constructor() {}

  public static getInstance(): AppelService {
    if (!AppelService.instance) {
      AppelService.instance = new AppelService();
    }
    return AppelService.instance;
  }

  public async createAppel(data: CreateAppelData): Promise<Appel> {
    const response = await apiCalls.post<Appel>('/appels', data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la création de l\'appel');
    }
    return response.data;
  }

  public async getAppelById(id: number): Promise<Appel> {
    const response = await apiCalls.get<Appel>(`/appels/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération de l\'appel');
    }
    return response.data;
  }

  public async getAppelsByProspect(
    prospectId: number,
    params?: { page?: number; limit?: number }
  ): Promise<{ appels: Appel[]; total: number; page: number; totalPages: number }> {
    const queryString = buildQueryString(params);
    const response = await apiCalls.get<{
      items?: Appel[];
      pagination?: { total: number; page: number; limit: number; totalPages: number };
    } | Appel[]>(`/prospects/${prospectId}/appels${queryString}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération des appels');
    }

    // Si la réponse est un array simple (pas de pagination)
    if (Array.isArray(response.data)) {
      return {
        appels: response.data,
        total: response.data.length,
        page: 1,
        totalPages: 1,
      };
    }

    // Si la réponse a une structure avec items et pagination
    const items = response.data.items || [];
    const pagination = response.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };

    return {
      appels: items,
      total: pagination.total,
      page: pagination.page,
      totalPages: pagination.totalPages,
    };
  }

  public async updateAppel(id: number, data: UpdateAppelData): Promise<Appel> {
    const response = await apiCalls.put<Appel>(`/appels/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la mise à jour de l\'appel');
    }
    return response.data;
  }

  public async terminerAppel(id: number, data: TerminerAppelData): Promise<Appel> {
    const response = await apiCalls.patch<Appel>(`/appels/${id}/terminer`, data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la terminaison de l\'appel');
    }
    return response.data;
  }
}

export const appelService = AppelService.getInstance();
