import { apiCalls } from '../APICalls';
import { throwIfApiError } from '../apiHelpers';
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
    const response = await apiCalls.get<CategorieProduit[]>('/categories');
    return throwIfApiError(response, 'Erreur lors de la récupération des catégories');
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
    return throwIfApiError(response, 'Erreur lors de la récupération de l\'arbre des catégories');
  }

  public async getCategorieById(id: number): Promise<CategorieProduit> {
    const response = await apiCalls.get<CategorieProduit>(`/categories/${id}`);
    return throwIfApiError(response, 'Erreur lors de la récupération de la catégorie');
  }

  public async getCategoryPath(id: number): Promise<{ path: CategorieProduit[]; pathString: string }> {
    const response = await apiCalls.get<CategoriePathResponse>(`/categories/${id}/path`);
    return throwIfApiError(response, 'Erreur lors de la récupération du chemin de la catégorie');
  }
}

export const categorieService = CategorieService.getInstance();
