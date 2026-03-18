import { apiCalls } from '../APICalls';
import type { StatsDuJour } from '../../utils/types';

export class StatsService {
  private static instance: StatsService;

  private constructor() {}

  public static getInstance(): StatsService {
    if (!StatsService.instance) {
      StatsService.instance = new StatsService();
    }
    return StatsService.instance;
  }

  public async getMyStatsDuJour(): Promise<StatsDuJour> {
    const response = await apiCalls.get<StatsDuJour>('/employes/me/stats');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération des stats');
    }
    return response.data;
  }
}

export const statsService = StatsService.getInstance();
