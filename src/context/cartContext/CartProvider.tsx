import { useState, useCallback, useMemo } from 'react';
import { CartContext } from './CartContext';
import type { CartItem, Produit } from '../../utils/types';

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const calculateItemTotal = (item: CartItem): number => {
    const subtotal = item.prix_unitaire * item.quantite;
    return subtotal - item.remise;
  };

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  }, [items]);

  const itemCount = useMemo(() => {
    return items.reduce((count, item) => count + item.quantite, 0);
  }, [items]);

  const addItem = useCallback((produit: Produit, quantite: number = 1, remise: number = 0) => {
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((item) => item.produit.id_produit === produit.id_produit);

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantite += quantite;
        console.log(`[CART] Quantité mise à jour pour ${produit.nom_produit}: ${updatedItems[existingItemIndex].quantite}`);
        return updatedItems;
      }

      const newItem: CartItem = {
        produit,
        quantite,
        prix_unitaire: produit.prix_base,
        remise,
      };
      console.log(`[CART] Ajout produit: ${produit.nom_produit} x${quantite}`);
      return [...prevItems, newItem];
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
    removeItem,
    updateQuantity,
    updateRemise,
    clearCart,
    getItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
