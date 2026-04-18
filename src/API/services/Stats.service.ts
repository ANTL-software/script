import { apiCalls } from '../APICalls';
import { throwIfApiError } from '../apiHelpers';
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
    return throwIfApiError(response, 'Erreur lors de la récupération des stats');
  }
}

export const statsService = StatsService.getInstance();
