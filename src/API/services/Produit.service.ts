import { apiCalls } from '../APICalls';
import { ProduitModel } from '../models/Produit.model';
import type { Produit } from '../../utils/types';

export class ProduitService {
  private static instance: ProduitService;

  private constructor() {}

  public static getInstance(): ProduitService {
    if (!ProduitService.instance) {
      ProduitService.instance = new ProduitService();
    }
    return ProduitService.instance;
  }

  public async getProduitById(id: number): Promise<ProduitModel> {
    const response = await apiCalls.get<Produit>(`/produits/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération du produit');
    }
    return ProduitModel.fromJSON(response.data);
  }

  public async getProduits(params?: {
    page?: number;
    limit?: number;
    categorie?: number;
    actif?: boolean;
    search?: string;
  }): Promise<{ produits: ProduitModel[]; total: number; page: number; totalPages: number }> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const response = await apiCalls.get<{
      items: Produit[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/produits${queryString}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération des produits');
    }

    return {
      produits: response.data.items.map(ProduitModel.fromJSON),
      total: response.data.pagination.total,
      page: response.data.pagination.page,
      totalPages: response.data.pagination.totalPages,
    };
  }

  public async getProduitsByCampaign(campaignId: number): Promise<ProduitModel[]> {
    const response = await apiCalls.get<Produit[]>(`/campagnes/${campaignId}/produits`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération des produits');
    }
    return response.data.map(ProduitModel.fromJSON);
  }
}

export const produitService = ProduitService.getInstance();
