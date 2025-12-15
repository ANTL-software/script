import { apiCalls } from '../APICalls';
import { ProspectModel } from '../models/Prospect.model';
import type { Prospect } from '../../utils/types';

export class ProspectService {
  private static instance: ProspectService;

  private constructor() {}

  public static getInstance(): ProspectService {
    if (!ProspectService.instance) {
      ProspectService.instance = new ProspectService();
    }
    return ProspectService.instance;
  }

  public async getProspectById(id: number): Promise<ProspectModel> {
    const response = await apiCalls.get<Prospect>(`/prospects/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération du prospect');
    }
    return ProspectModel.fromJSON(response.data);
  }

  public async getProspectByPhone(phone: string): Promise<ProspectModel> {
    const response = await apiCalls.get<Prospect>(`/prospects/telephone/${phone}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Prospect non trouvé');
    }
    return ProspectModel.fromJSON(response.data);
  }

  public async getProspects(params?: {
    page?: number;
    limit?: number;
    statut?: string;
    type_prospect?: string;
    search?: string;
  }): Promise<{ prospects: ProspectModel[]; total: number; page: number; totalPages: number }> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const response = await apiCalls.get<{
      items: Prospect[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/prospects${queryString}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération des prospects');
    }

    return {
      prospects: response.data.items.map(ProspectModel.fromJSON),
      total: response.data.pagination.total,
      page: response.data.pagination.page,
      totalPages: response.data.pagination.totalPages,
    };
  }
}

export const prospectService = ProspectService.getInstance();
