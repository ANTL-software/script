import { useState, useCallback, useMemo } from 'react';
import { CartContext } from './CartContext';
import type { CartItem, Produit, CampaignPanier } from '../../utils/types';
import { calculateLineTotal } from '../../utils/scripts/utils';

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + calculateLineTotal(item.prix_unitaire, item.quantite, item.remise), 0);
  }, [items]);

  const itemCount = useMemo(() => {
    return items.reduce((count, item) => count + item.quantite, 0);
  }, [items]);

  const addItem = useCallback((produit: Produit, quantite: number = 1, remise: number = 0, panierSource: CampaignPanier | null = null) => {
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((item) => item.produit.id_produit === produit.id_produit);
      const nextPanierIds = panierSource ? [panierSource.id_panier] : [];
      const nextPanierLabels = panierSource ? [panierSource.label] : [];

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        const currentItem = updatedItems[existingItemIndex];
        const mergedPanierIds = Array.from(new Set([...(currentItem.panier_source_ids || []), ...nextPanierIds]));
        const mergedPanierLabels = Array.from(new Set([...(currentItem.panier_source_labels || []), ...nextPanierLabels]));
        updatedItems[existingItemIndex] = {
          ...currentItem,
          quantite: currentItem.quantite + quantite,
          panier_source_ids: mergedPanierIds.length > 0 ? mergedPanierIds : undefined,
          panier_source_labels: mergedPanierLabels.length > 0 ? mergedPanierLabels : undefined,
        };
        console.log(`[CART] Quantité mise à jour pour ${produit.nom_produit}: ${updatedItems[existingItemIndex].quantite}`);
        return updatedItems;
      }

      // Priorité: tarif campagne > prix produit
      const tarifPrix = produit.tarif?.prix_unitaire;
      const produitPrix = produit.prix_unitaire;
      const rawPrix = tarifPrix ?? produitPrix;
      const prixUnitaire = typeof rawPrix === 'number'
        ? rawPrix
        : (typeof rawPrix === 'string' ? parseFloat(rawPrix) : 0);

      const tarifPromo = produit.tarif?.prix_promo;
      const produitPromo = produit.prix_promo;
      const rawPromo = tarifPromo ?? produitPromo;
      const prixPromo = rawPromo
        ? (typeof rawPromo === 'number' ? rawPromo : parseFloat(String(rawPromo)))
        : null;

      const prixFinal = (prixPromo !== null && prixPromo > 0) ? prixPromo : prixUnitaire;

      const newItem: CartItem = {
        produit,
        quantite,
        prix_unitaire: prixFinal,
        remise,
        panier_source_ids: nextPanierIds.length > 0 ? nextPanierIds : undefined,
        panier_source_labels: nextPanierLabels.length > 0 ? nextPanierLabels : undefined,
      };
      console.log(`[CART] Ajout produit: ${produit.nom_produit} x${quantite}`);
      return [...prevItems, newItem];
    });
  }, []);

  const addPanier = useCallback((panier: CampaignPanier) => {
    setItems((prevItems) => {
      const syntheticProductId = -panier.id_panier;
      const existingItemIndex = prevItems.findIndex((item) => item.item_type === 'panier' && item.id_panier_line === panier.id_panier);

      if (existingItemIndex > -1) {
        const nextItems = [...prevItems];
        const currentItem = nextItems[existingItemIndex];
        nextItems[existingItemIndex] = {
          ...currentItem,
          quantite: currentItem.quantite + 1,
          panier_produits: panier.produits,
        };
        console.log(`[CART] Quantité panier mise à jour pour ${panier.label}: ${nextItems[existingItemIndex].quantite}`);
        return nextItems;
      }

      const syntheticProduit: Produit = {
        id_produit: syntheticProductId,
        nom_produit: panier.label,
        actif: true,
        created_at: '',
        updated_at: '',
      };

      const nextItems = [
        ...prevItems,
        {
          item_type: 'panier' as const,
          produit: syntheticProduit,
          quantite: 1,
          prix_unitaire: panier.prix_ht ?? 0,
          remise: 0,
          id_panier_line: panier.id_panier,
          panier_label: panier.label,
          panier_produits: panier.produits,
        }
      ];

      console.log(`[CART] Ajout panier: ${panier.label}`);
      return nextItems;
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prevItems) => {
      const itemToRemove = prevItems.find((item) => item.produit.id_produit === productId);
      if (itemToRemove) {
        console.log(`[CART] Suppression produit: ${itemToRemove.produit.nom_produit}`);
      }
      return prevItems.filter((item) => item.produit.id_produit !== productId);
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantite: number) => {
    if (quantite <= 0) {
      removeItem(productId);
      return;
    }

    setItems((prevItems) => {
      const updatedItems = prevItems.map((item) => {
        if (item.produit.id_produit === productId) {
          console.log(`[CART] Mise à jour quantité ${item.produit.nom_produit}: ${quantite}`);
          return { ...item, quantite };
        }
        return item;
      });
      return updatedItems;
    });
  }, [removeItem]);

  const updateRemise = useCallback((productId: number, remise: number) => {
    setItems((prevItems) => {
      const updatedItems = prevItems.map((item) => {
        if (item.produit.id_produit === productId) {
          console.log(`[CART] Mise à jour remise ${item.produit.nom_produit}: ${remise}€`);
          return { ...item, remise };
        }
        return item;
      });
      return updatedItems;
    });
  }, []);

  const clearCart = useCallback(() => {
    console.log('[CART] Panier vidé');
    setItems([]);
  }, []);

  const getItem = useCallback((productId: number) => {
    return items.find((item) => item.produit.id_produit === productId);
  }, [items]);

  const value = {
    items,
    total,
    itemCount,
    addItem,
    addPanier,
    removeItem,
    updateQuantity,
    updateRemise,
    clearCart,
    getItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
