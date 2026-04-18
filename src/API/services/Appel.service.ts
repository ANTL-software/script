import { apiCalls } from '../APICalls';
import { throwIfApiError, extractPaginatedData } from '../apiHelpers';
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
    return throwIfApiError(response, 'Erreur lors de la création de l\'appel');
  }

  public async getAppelById(id: number): Promise<Appel> {
    const response = await apiCalls.get<Appel>(`/appels/${id}`);
    return throwIfApiError(response, 'Erreur lors de la récupération de l\'appel');
  }

  public async getAppelsByProspect(
    prospectId: number,
    params?: { page?: number; limit?: number }
  ): Promise<{ appels: Appel[]; total: number; page: number; totalPages: number }> {
    const queryString = buildQueryString(params);
    const response = await apiCalls.get<Appel[]>(`/prospects/${prospectId}/appels${queryString}`);

    const result = extractPaginatedData(response, (a: Appel) => a, 'Erreur lors de la récupération des appels');
    return {
      appels: result.items,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  public async updateAppel(id: number, data: UpdateAppelData): Promise<Appel> {
    const response = await apiCalls.put<Appel>(`/appels/${id}`, data);
    return throwIfApiError(response, 'Erreur lors de la mise à jour de l\'appel');
  }

  public async terminerAppel(id: number, data: TerminerAppelData): Promise<Appel> {
    const response = await apiCalls.patch<Appel>(`/appels/${id}/terminer`, data);
    return throwIfApiError(response, 'Erreur lors de la terminaison de l\'appel');
  }
}

export const appelService = AppelService.getInstance();
