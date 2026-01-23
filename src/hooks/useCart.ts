import { CartContext } from '../context/cartContext';
import type { CartContextType } from '../context/cartContext';
import { createContextHook } from './createContextHook';

export const useCart = createContextHook<CartContextType>(
  CartContext,
  'useCart',
  'CartProvider'
);
