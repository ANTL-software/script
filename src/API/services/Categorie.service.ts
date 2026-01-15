import { apiCalls } from '../APICalls';
import type {
  CategorieProduit,
  CategorieTreeResponse,
  CategoriePathResponse
} from '../../utils/types';

export class CategorieService {
  private static instance: CategorieService;

  private constructor() {}

  public static getInstance(): CategorieService {
    if (!CategorieService.instance) {
      CategorieService.instance = new CategorieService();
    }
    return CategorieService.instance;
  }

  public async getCategories(): Promise<CategorieProduit[]> {
    const response = await apiCalls.get<{
      data: CategorieProduit[];
      count: number;
    }>('/categories');

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération des catégories');
    }

    return response.data.data;
  }

  public async getCategoriesTree(params?: {
    includeProducts?: boolean;
    includeInactive?: boolean;
  }): Promise<CategorieProduit[]> {
    const queryParams = new URLSearchParams();
    if (params?.includeProducts) {
      queryParams.append('includeProducts', 'true');
    }
    if (params?.includeInactive) {
      queryParams.append('includeInactive', 'true');
    }

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await apiCalls.get<CategorieTreeResponse>(`/categories/tree${queryString}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération de l\'arbre des catégories');
    }

    return response.data.data;
  }

  public async getCategorieById(id: number): Promise<CategorieProduit> {
    const response = await apiCalls.get<{
      data: CategorieProduit;
    }>(`/categories/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération de la catégorie');
    }

    return response.data.data;
  }

  public async getCategoryPath(id: number): Promise<{ path: CategorieProduit[]; pathString: string }> {
    const response = await apiCalls.get<CategoriePathResponse>(`/categories/${id}/path`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Erreur lors de la récupération du chemin de la catégorie');
    }

    return response.data.data;
  }
}

export const categorieService = CategorieService.getInstance();
