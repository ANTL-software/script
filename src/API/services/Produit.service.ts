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
    const response = await apiCalls.get<{
      items: Produit[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/produits${queryString}`);

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
      totalProducts: data.count?.totalProducts ?? 0,
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

    const data = throwIfApiError(response, 'Erreur lors de la récupération des produits');

    return {
      produits: data.produits.map(ProduitModel.fromJSON),
      pagination: data.pagination
    };
  }
}

export const produitService = ProduitService.getInstance();
