import { apiCalls } from '../APICalls';
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
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la creation du rendez-vous');
    }
    return response.data;
  }

  public async getRendezVousById(id: number): Promise<RendezVous> {
    const response = await apiCalls.get<RendezVous>(`/rendez-vous/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la recuperation du rendez-vous');
    }
    return response.data;
  }

  public async getRendezVousByAgent(agentId: number): Promise<RendezVous[]> {
    const response = await apiCalls.get<RendezVous[]>(`/rendez-vous/agent/${agentId}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la recuperation des rendez-vous');
    }
    return response.data;
  }

  public async getRendezVousByProspect(prospectId: number): Promise<RendezVous[]> {
    const response = await apiCalls.get<RendezVous[]>(`/rendez-vous/prospect/${prospectId}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la recuperation des rendez-vous');
    }
    return response.data;
  }

  public async getRendezVousToday(): Promise<RendezVous[]> {
    const response = await apiCalls.get<RendezVous[]>('/rendez-vous/today');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la recuperation des rendez-vous du jour');
    }
    return response.data;
  }

  public async updateRendezVous(id: number, data: UpdateRendezVousData): Promise<RendezVous> {
    const response = await apiCalls.put<RendezVous>(`/rendez-vous/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la mise a jour du rendez-vous');
    }
    return response.data;
  }

  public async updateStatut(id: number, statut: RendezVousStatut): Promise<RendezVous> {
    const response = await apiCalls.patch<RendezVous>(`/rendez-vous/${id}/statut`, { statut });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la mise a jour du statut');
    }
    return response.data;
  }

  public async deleteRendezVous(id: number): Promise<void> {
    const response = await apiCalls.delete(`/rendez-vous/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la suppression du rendez-vous');
    }
  }
}

export const rendezVousService = RendezVousService.getInstance();
