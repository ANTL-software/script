import { apiCalls } from '../APICalls';
import type { Appel, CreateAppelData, UpdateAppelData } from '../../utils/types';
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
      items: Appel[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/prospects/${prospectId}/appels${queryString}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération des appels');
    }

    return {
      appels: response.data.items,
      total: response.data.pagination.total,
      page: response.data.pagination.page,
      totalPages: response.data.pagination.totalPages,
    };
  }

  public async updateAppel(id: number, data: UpdateAppelData): Promise<Appel> {
    const response = await apiCalls.put<Appel>(`/appels/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la mise à jour de l\'appel');
    }
    return response.data;
  }

  public async terminerAppel(id: number): Promise<Appel> {
    const response = await apiCalls.patch<Appel>(`/appels/${id}/terminer`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la terminaison de l\'appel');
    }
    return response.data;
  }
}

export const appelService = AppelService.getInstance();
