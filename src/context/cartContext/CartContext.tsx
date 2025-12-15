import { createContext } from 'react';
import type { CartItem, Produit } from '../../utils/types';

export interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;

  addItem: (produit: Produit, quantite?: number, remise?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantite: number) => void;
  updateRemise: (productId: number, remise: number) => void;
  clearCart: () => void;
  getItem: (productId: number) => CartItem | undefined;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);
