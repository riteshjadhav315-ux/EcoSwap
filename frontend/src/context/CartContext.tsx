import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product } from '../types';
import { useAuth } from './AuthContext';
import * as cartService from '../services/cartService';

interface CartItem extends cartService.CartItem {}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  total: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    setLoading(true);
    try {
      const items = await cartService.getCart();
      setCartItems(items);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (product: Product) => {
    if (!user) return;
    try {
      const newItem = await cartService.addToCart({
        productId: product.id,
        productTitle: product.title,
        productPrice: product.price,
        productImageUrl: product.imageUrl || product.images?.[0] || ""
      });
      
      setCartItems(prev => {
        const exists = prev.find(item => item.productId === product.id);
        if (exists) {
          return prev.map(item => item.productId === product.id ? newItem : item);
        }
        return [newItem, ...prev];
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      await cartService.removeFromCart(cartItemId);
      setCartItems((prev) => prev.filter((item) => item._id !== cartItemId));
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      const updatedItem = await cartService.updateCartQuantity(cartItemId, 1);
      setCartItems(prev => prev.map(item => item._id === cartItemId ? updatedItem : item));
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      setCartItems([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const total = cartItems.reduce((sum, item) => sum + (item.productPrice * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, fetchCart, total, loading }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
