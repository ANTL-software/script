import { apiCalls } from '../APICalls';
import { ProduitModel } from '../models/Produit.model';
import type { Produit, CategorieProduit, ProduitsGroupedResponse } from '../../utils/types';
import { buildQueryString } from '../../utils/scripts/utils';

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
    grouped?: boolean;
  }): Promise<{ produits: ProduitModel[]; total: number; page: number; totalPages: number }> {
    const queryString = buildQueryString(params);
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

  public async getProduitsGrouped(params?: {
    actif?: boolean;
  }): Promise<{ categories: CategorieProduit[]; totalProducts: number }> {
    const queryParams = new URLSearchParams();
    queryParams.append('grouped', 'true');
    if (params?.actif !== undefined) {
      queryParams.append('actif', String(params.actif));
    }

    const queryString = `?${queryParams.toString()}`;
    const response = await apiCalls.get<ProduitsGroupedResponse>(`/produits${queryString}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération des produits groupés');
    }

    return {
      categories: response.data.categories,
      totalProducts: response.count.totalProducts,
    };
  }

  public async getProduitsByCampaign(campaignId: number, params?: {
    page?: number;
    limit?: number;
  }): Promise<{ produits: ProduitModel[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const queryString = buildQueryString(params);
    const response = await apiCalls.get<{
      produits: Produit[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/campagnes/${campaignId}/produits${queryString}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération des produits');
    }

    return {
      produits: response.data.produits.map(ProduitModel.fromJSON),
      pagination: response.data.pagination
    };
  }
}

export const produitService = ProduitService.getInstance();
