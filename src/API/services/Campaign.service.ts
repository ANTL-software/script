import { apiCalls } from '../APICalls';
import { throwIfApiError, extractPaginatedData } from '../apiHelpers';
import { CampaignModel } from '../models';
import type { Campaign, PlanAppelEtape, Objection } from '../../utils/types';
import { buildQueryString } from '../../utils/scripts/utils';

export class CampaignService {
  private static instance: CampaignService;

  private constructor() {}

  public static getInstance(): CampaignService {
    if (!CampaignService.instance) {
      CampaignService.instance = new CampaignService();
    }
    return CampaignService.instance;
  }

  public async getCampaignById(id: number): Promise<CampaignModel> {
    const response = await apiCalls.get<Campaign>(`/campagnes/${id}`);
    const data = throwIfApiError(response, 'Erreur lors de la récupération de la campagne');
    return CampaignModel.fromJSON(data);
  }

  public async getCampaigns(params?: {
    page?: number;
    limit?: number;
    actif?: boolean;
  }): Promise<{ campaigns: CampaignModel[]; total: number; page: number; totalPages: number }> {
    const queryString = buildQueryString(params);
    const response = await apiCalls.get<{
      items: Campaign[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/campagnes${queryString}`);

    const result = extractPaginatedData(response, CampaignModel.fromJSON, 'Erreur lors de la récupération des campagnes');
    return {
      campaigns: result.items,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  public async getPlanAppel(campagneId: number): Promise<PlanAppelEtape[]> {
    const response = await apiCalls.get<PlanAppelEtape[]>(`/campagnes/${campagneId}/plan-appel`);
    const data = throwIfApiError(response, 'Erreur lors de la recuperation du plan d\'appel');
    return data;
  }

  public async getObjections(campagneId: number): Promise<Objection[]> {
    const response = await apiCalls.get<Objection[]>(`/campagnes/${campagneId}/objections`);
    const data = throwIfApiError(response, 'Erreur lors de la recuperation des objections');
    return data;
  }
}

export const campaignService = CampaignService.getInstance();
