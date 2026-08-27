import { useState, useCallback, useEffect, useContext, useRef } from 'react';
import { CampaignContext } from './CampaignContext';
import type { Campaign, Produit, CategorieProduit, CampaignPanier } from '../../utils/types';
import { campaignService, produitService } from '../../API/services';
import { UserContext } from '../userContext/UserContext';

interface CampaignProviderProps {
  children: React.ReactNode;
}

export const CampaignProvider = ({ children }: CampaignProviderProps) => {
  const userContext = useContext(UserContext);
  const isAuthenticated = userContext?.isAuthenticated ?? false;

  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<CategorieProduit[]>([]);
  const [categoriesTree, setCategoriesTree] = useState<CategorieProduit[]>([]);
  const [produitsLoading, setProduitsLoading] = useState<boolean>(false);
  const [produitsError, setProduitsError] = useState<string | null>(null);
  const [paniers, setPaniers] = useState<CampaignPanier[]>([]);
  const [paniersLoading, setPaniersLoading] = useState<boolean>(false);
  const [paniersError, setPaniersError] = useState<string | null>(null);
  const campaignRequestIdRef = useRef(0);

  const resetCampaignCollections = useCallback(() => {
    setProduits([]);
    setCategories([]);
    setCategoriesTree([]);
    setPaniers([]);
    setProduitsError(null);
    setPaniersError(null);
  }, []);

  const loadCampaign = useCallback(async (id: number) => {
    const requestId = campaignRequestIdRef.current + 1;
    campaignRequestIdRef.current = requestId;

    setIsLoading(true);
    setError(null);
    resetCampaignCollections();

    try {
      console.log(`[CAMPAIGN] Chargement campagne ID: ${id}`);
      const campaignModel = await campaignService.getCampaignById(id);
      if (campaignRequestIdRef.current !== requestId) {
        return;
      }
      setCurrentCampaign(campaignModel.toJSON());
    } catch (err) {
      if (campaignRequestIdRef.current !== requestId) {
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de la campagne';
      setError(errorMessage);
      console.error('[CAMPAIGN] Erreur chargement:', errorMessage);
    } finally {
      if (campaignRequestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [resetCampaignCollections]);

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
            .filter((p) => p.categorie)
            .map((p) => [p.categorie!.id_categorie, p.categorie!])
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

  const loadProduitsGrouped = useCallback(async () => {
    if (!currentCampaign) {
      console.warn('[CAMPAIGN] Aucune campagne active, impossible de charger les produits groupés');
      return;
    }

    setProduitsLoading(true);
    setProduitsError(null);

    try {
      console.log(`[CAMPAIGN] Chargement produits groupés campagne ID: ${currentCampaign.id_campagne}`);
      const result = await produitService.getProduitsGrouped({ actif: true, campagne: currentCampaign.id_campagne });

      setCategoriesTree(result.categories);

      const allProduits: Produit[] = [];
      const extractProducts = (cats: CategorieProduit[]) => {
        cats.forEach(cat => {
          if (cat.produits) {
            allProduits.push(...cat.produits);
          }
          if (cat.sousCategories) {
            extractProducts(cat.sousCategories);
          }
        });
      };
      extractProducts(result.categories);

      setProduits(allProduits);

      const uniqueCategories: CategorieProduit[] = [];
      const flattenCategories = (cats: CategorieProduit[]) => {
        cats.forEach(cat => {
          uniqueCategories.push({
            id_categorie: cat.id_categorie,
            nom_categorie: cat.nom_categorie,
            description: cat.description,
            id_parent: cat.id_parent,
            niveau: cat.niveau
          });
          if (cat.sousCategories) {
            flattenCategories(cat.sousCategories);
          }
        });
      };
      flattenCategories(result.categories);
      setCategories(uniqueCategories);

      console.log(`[CAMPAIGN] ${allProduits.length} produits groupés chargés, ${result.categories.length} catégories racines`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des produits groupés';
      setProduitsError(errorMessage);
      console.error('[CAMPAIGN] Erreur chargement produits groupés:', errorMessage);
    } finally {
      setProduitsLoading(false);
    }
  }, [currentCampaign]);

  const loadPaniers = useCallback(async () => {
    if (!currentCampaign) {
      console.warn('[CAMPAIGN] Aucune campagne active, impossible de charger les paniers');
      return;
    }

    setPaniersLoading(true);
    setPaniersError(null);

    try {
      console.log(`[CAMPAIGN] Chargement paniers campagne ID: ${currentCampaign.id_campagne}`);
      const data = await campaignService.getPaniers(currentCampaign.id_campagne);
      setPaniers(data);
      console.log(`[CAMPAIGN] ${data.length} paniers chargés`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des paniers';
      setPaniersError(errorMessage);
      console.error('[CAMPAIGN] Erreur chargement paniers:', errorMessage);
    } finally {
      setPaniersLoading(false);
    }
  }, [currentCampaign]);

  // Charger automatiquement les produits quand la campagne est définie
  useEffect(() => {
    if (currentCampaign) {
      loadProduitsGrouped();
      loadPaniers();
    }
  }, [currentCampaign, loadProduitsGrouped, loadPaniers]);

  const clearCampaign = useCallback(() => {
    campaignRequestIdRef.current += 1;
    setCurrentCampaign(null);
    resetCampaignCollections();
    setError(null);
    setIsLoading(false);
  }, [resetCampaignCollections]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearCampaign();
    }
  }, [clearCampaign, isAuthenticated]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearProduitsError = useCallback(() => {
    setProduitsError(null);
  }, []);

  const clearPaniersError = useCallback(() => {
    setPaniersError(null);
  }, []);

  const extractAllProductsFromTree = useCallback((categories: CategorieProduit[]): Produit[] => {
    const result: Produit[] = [];
    const traverse = (cats: CategorieProduit[]) => {
      for (const cat of cats) {
        if (cat.produits && cat.produits.length > 0) {
          result.push(...cat.produits);
        }
        if (cat.sousCategories && cat.sousCategories.length > 0) {
          traverse(cat.sousCategories);
        }
      }
    };
    traverse(categories);
    return result;
  }, []);

  const searchProduits = useCallback((searchTerm: string, minChars = 3): Produit[] => {
    // Utiliser produits, ou extraire de categoriesTree si produits est vide
    const allProducts = produits.length > 0 ? produits : extractAllProductsFromTree(categoriesTree);

    if (searchTerm.length < minChars) {
      return allProducts;
    }

    const search = searchTerm.toLowerCase().trim();
    return allProducts.filter(
      (p) =>
        p.nom_produit.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search) ||
        p.code_produit?.toLowerCase().includes(search) ||
        p.code_produit_origine?.toLowerCase().includes(search) ||
        p.typeProduit?.libelle_type?.toLowerCase().includes(search)
    );
  }, [produits, categoriesTree, extractAllProductsFromTree]);

  const value = {
    currentCampaign,
    isLoading,
    error,
    produits,
    categories,
    categoriesTree,
    produitsLoading,
    produitsError,
    paniers,
    paniersLoading,
    paniersError,
    loadCampaign,
    loadProduits,
    loadProduitsGrouped,
    loadPaniers,
    searchProduits,
    clearCampaign,
    clearError,
    clearProduitsError,
    clearPaniersError,
  };

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
};
