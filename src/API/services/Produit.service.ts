import { apiCalls } from '../APICalls';
import { throwIfApiError, extractPaginatedData } from '../apiHelpers';
import { ProduitModel } from '../models';
import type { Produit, CategorieProduit, ProduitsGroupedData } from '../../utils/types';
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
    const data = throwIfApiError(response, 'Erreur lors de la récupération du produit');
    return ProduitModel.fromJSON(data);
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
    const response = await apiCalls.get<Produit[]>(`/produits${queryString}`);

    const result = extractPaginatedData(response, ProduitModel.fromJSON, 'Erreur lors de la récupération des produits');
    return {
      produits: result.items,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  public async getProduitsGrouped(params?: {
    actif?: boolean;
    campagne?: number;
  }): Promise<{ categories: CategorieProduit[]; totalProducts: number }> {
    const queryString = buildQueryString({ grouped: true, ...params });
    const response = await apiCalls.get<ProduitsGroupedData>(`/produits${queryString}`);
    const data = throwIfApiError(response, 'Erreur lors de la recuperation des produits groupes');

    return {
      categories: data.categories,
      totalProducts: data.categories.reduce((sum, cat) => sum + (cat.produits?.length ?? 0), 0),
    };
  }

  public async getProduitsByCampaign(campaignId: number, params?: {
    page?: number;
    limit?: number;
  }): Promise<{ produits: ProduitModel[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const queryString = buildQueryString(params);
    const response = await apiCalls.get<Produit[]>(`/campagnes/${campaignId}/produits${queryString}`);

    const result = extractPaginatedData(response, ProduitModel.fromJSON, 'Erreur lors de la récupération des produits');
    return {
      produits: result.items,
      pagination: {
        page: result.page,
        limit: response.pagination?.limit ?? 20,
        total: result.total,
        totalPages: result.totalPages,
      }
    };
  }
}

export const produitService = ProduitService.getInstance();
