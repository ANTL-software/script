import { apiCalls } from '../APICalls';
import { CampaignModel } from '../models/Campaign.model';
import type { Campaign } from '../../utils/types';

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
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération de la campagne');
    }
    return CampaignModel.fromJSON(response.data);
  }

  public async getCampaigns(params?: {
    page?: number;
    limit?: number;
    actif?: boolean;
  }): Promise<{ campaigns: CampaignModel[]; total: number; page: number; totalPages: number }> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const response = await apiCalls.get<{
      items: Campaign[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/campagnes${queryString}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération des campagnes');
    }

    return {
      campaigns: response.data.items.map(CampaignModel.fromJSON),
      total: response.data.pagination.total,
      page: response.data.pagination.page,
      totalPages: response.data.pagination.totalPages,
    };
  }
}

export const campaignService = CampaignService.getInstance();
