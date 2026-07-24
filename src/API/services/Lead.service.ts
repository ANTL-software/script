import { apiCalls } from '../APICalls.ts';
import { throwIfApiError } from '../apiHelpers.ts';
import type { CreateLeadData, LeadClient } from '../../utils/types';

export class LeadService {
  private static instance: LeadService;

  private constructor() {}

  public static getInstance(): LeadService {
    if (!LeadService.instance) {
      LeadService.instance = new LeadService();
    }
    return LeadService.instance;
  }

  public async createLead(data: CreateLeadData): Promise<LeadClient> {
    const response = await apiCalls.post<LeadClient>('/leads', data);
    return throwIfApiError(response, 'Erreur lors de la creation du rendez-vous client');
  }

  public async getUnavailableTimeSlots(campagneId: number, dateRdv: string): Promise<string[]> {
    const query = new URLSearchParams({
      campagne: String(campagneId),
      date: dateRdv,
    });
    const response = await apiCalls.get<string[]>(`/leads/availability?${query.toString()}`);
    return throwIfApiError(response, 'Erreur lors de la recuperation des disponibilites');
  }

  public async getLeadById(id: number): Promise<LeadClient> {
    const response = await apiCalls.get<LeadClient>(`/leads/${id}`);
    return throwIfApiError(response, 'Erreur lors de la recuperation du rendez-vous client');
  }

  public async getLeadsByProspect(prospectId: number, campagneId?: number): Promise<LeadClient[]> {
    const query = campagneId ? `?campagne=${campagneId}` : '';
    const response = await apiCalls.get<LeadClient[]>(`/leads/prospect/${prospectId}${query}`);
    return throwIfApiError(response, 'Erreur lors de la recuperation des rendez-vous client');
  }
}

export const leadService = LeadService.getInstance();
