import { createContext } from 'react';
import type { Campaign, Produit, CategorieProduit } from '../../utils/types';

export interface CampaignContextType {
  currentCampaign: Campaign | null;
  isLoading: boolean;
  error: string | null;

  produits: Produit[];
  categories: CategorieProduit[];
  produitsLoading: boolean;
  produitsError: string | null;

  loadCampaign: (id: number) => Promise<void>;
  loadProduits: () => Promise<void>;
  clearCampaign: () => void;
  clearError: () => void;
  clearProduitsError: () => void;
}

export const CampaignContext = createContext<CampaignContextType | undefined>(undefined);
