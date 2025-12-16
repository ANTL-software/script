import { useState, useCallback } from 'react';
import { CampaignContext } from './CampaignContext';
import type { Campaign, Produit, CategorieProduit } from '../../utils/types';
import { campaignService, produitService } from '../../API/services';

interface CampaignProviderProps {
  children: React.ReactNode;
}

export const CampaignProvider = ({ children }: CampaignProviderProps) => {
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<CategorieProduit[]>([]);
  const [produitsLoading, setProduitsLoading] = useState<boolean>(false);
  const [produitsError, setProduitsError] = useState<string | null>(null);

  const loadCampaign = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log(`[CAMPAIGN] Chargement campagne ID: ${id}`);
      const campaignModel = await campaignService.getCampaignById(id);
      setCurrentCampaign(campaignModel.toJSON());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de la campagne';
      setError(errorMessage);
      console.error('[CAMPAIGN] Erreur chargement:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadProduits = useCallback(async () => {
    if (!currentCampaign) {
      console.warn('[CAMPAIGN] Aucune campagne active, impossible de charger les produits');
      return;
    }

    setProduitsLoading(true);
    setProduitsError(null);

    try {
      console.log(`[CAMPAIGN] Chargement produits campagne ID: ${currentCampaign.id_campagne}`);
      const result = await produitService.getProduitsByCampaign(currentCampaign.id_campagne);
      const produitsData = result.produits.map((model) => model.toJSON());
      setProduits(produitsData);

      // Extraire les catégories uniques
      const uniqueCategories: CategorieProduit[] = Array.from(
        new Map(
          produitsData
            .filter((p) => p.Categorie)
            .map((p) => [p.Categorie!.id_categorie, p.Categorie!])
        ).values()
      );
      setCategories(uniqueCategories);
      console.log(`[CAMPAIGN] ${produitsData.length} produits chargés, ${uniqueCategories.length} catégories`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des produits';
      setProduitsError(errorMessage);
      console.error('[CAMPAIGN] Erreur chargement produits:', errorMessage);
    } finally {
      setProduitsLoading(false);
    }
  }, [currentCampaign]);

  const clearCampaign = useCallback(() => {
    setCurrentCampaign(null);
    setProduits([]);
    setCategories([]);
    setError(null);
    setProduitsError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearProduitsError = useCallback(() => {
    setProduitsError(null);
  }, []);

  const value = {
    currentCampaign,
    isLoading,
    error,
    produits,
    categories,
    produitsLoading,
    produitsError,
    loadCampaign,
    loadProduits,
    clearCampaign,
    clearError,
    clearProduitsError,
  };

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
};
