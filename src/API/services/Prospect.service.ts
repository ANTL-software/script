import { apiCalls } from '../APICalls';
import { throwIfApiError, extractPaginatedData } from '../apiHelpers';
import { ProspectModel } from '../models';
import type { Prospect, UpdateProspectData } from '../../utils/types';
import { buildQueryString } from '../../utils/scripts/utils';

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
    const data = throwIfApiError(response, 'Erreur lors de la récupération du prospect');
    return ProspectModel.fromJSON(data);
  }

  public async getProspectByPhone(phone: string): Promise<ProspectModel> {
    const response = await apiCalls.get<Prospect>(`/prospects/telephone/${phone}`);
    const data = throwIfApiError(response, 'Prospect non trouvé');
    return ProspectModel.fromJSON(data);
  }

  public async getProspects(params?: {
    page?: number;
    limit?: number;
    statut?: string;
    type_prospect?: string;
    search?: string;
  }): Promise<{ prospects: ProspectModel[]; total: number; page: number; totalPages: number }> {
    const queryString = buildQueryString(params);
    const response = await apiCalls.get<{
      items: Prospect[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/prospects${queryString}`);

    const result = extractPaginatedData(response, ProspectModel.fromJSON, 'Erreur lors de la récupération des prospects');
    return {
      prospects: result.items,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  public async updateProspect(id: number, data: UpdateProspectData): Promise<ProspectModel> {
    const response = await apiCalls.put<Prospect>(`/prospects/${id}`, data);
    const updatedProspect = throwIfApiError(response, 'Erreur lors de la mise a jour du prospect');
    return ProspectModel.fromJSON(updatedProspect);
  }
}

export const prospectService = ProspectService.getInstance();
