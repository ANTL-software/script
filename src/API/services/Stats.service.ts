import { apiCalls } from '../APICalls.ts';
import { throwIfApiError } from '../apiHelpers.ts';
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

  public async getMyStatsDuJour(campagneId?: number): Promise<StatsDuJour> {
    const query = campagneId ? `?campagne=${campagneId}` : '';
    const response = await apiCalls.get<StatsDuJour>(`/employes/me/stats${query}`);
    return throwIfApiError(response, 'Erreur lors de la récupération des stats');
  }
}

export const statsService = StatsService.getInstance();
