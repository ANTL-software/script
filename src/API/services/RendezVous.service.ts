import { apiCalls } from '../APICalls';
import { throwIfApiError } from '../apiHelpers';
import type { RendezVous, CreateRendezVousData, UpdateRendezVousData, RendezVousStatut } from '../../utils/types';

export class RendezVousService {
  private static instance: RendezVousService;

  private constructor() {}

  public static getInstance(): RendezVousService {
    if (!RendezVousService.instance) {
      RendezVousService.instance = new RendezVousService();
    }
    return RendezVousService.instance;
  }

  public async createRendezVous(data: CreateRendezVousData): Promise<RendezVous> {
    const response = await apiCalls.post<RendezVous>('/rendez-vous', data);
    return throwIfApiError(response, 'Erreur lors de la creation du rendez-vous');
  }

  public async getRendezVousById(id: number): Promise<RendezVous> {
    const response = await apiCalls.get<RendezVous>(`/rendez-vous/${id}`);
    return throwIfApiError(response, 'Erreur lors de la recuperation du rendez-vous');
  }

  public async getRendezVousByAgent(agentId: number): Promise<RendezVous[]> {
    const response = await apiCalls.get<RendezVous[]>(`/rendez-vous/agent/${agentId}`);
    return throwIfApiError(response, 'Erreur lors de la recuperation des rendez-vous');
  }

  public async getRendezVousByProspect(prospectId: number): Promise<RendezVous[]> {
    const response = await apiCalls.get<RendezVous[]>(`/rendez-vous/prospect/${prospectId}`);
    return throwIfApiError(response, 'Erreur lors de la recuperation des rendez-vous');
  }

  public async getRendezVousToday(agentId?: number): Promise<RendezVous[]> {
    const query = agentId ? `?agent=${agentId}` : '';
    const response = await apiCalls.get<RendezVous[]>(`/rendez-vous/today${query}`);
    return throwIfApiError(response, 'Erreur lors de la recuperation des rendez-vous du jour');
  }

  public async updateRendezVous(id: number, data: UpdateRendezVousData): Promise<RendezVous> {
    const response = await apiCalls.put<RendezVous>(`/rendez-vous/${id}`, data);
    return throwIfApiError(response, 'Erreur lors de la mise a jour du rendez-vous');
  }

  public async updateStatut(id: number, statut: RendezVousStatut): Promise<RendezVous> {
    const response = await apiCalls.patch<RendezVous>(`/rendez-vous/${id}/statut`, { statut });
    return throwIfApiError(response, 'Erreur lors de la mise a jour du statut');
  }

  public async deleteRendezVous(id: number): Promise<void> {
    const response = await apiCalls.delete(`/rendez-vous/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la suppression du rendez-vous');
    }
  }
}

export const rendezVousService = RendezVousService.getInstance();
