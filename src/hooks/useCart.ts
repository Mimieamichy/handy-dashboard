
import { create } from 'zustand';

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

interface CartState {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateCartItem: (productId: string, updates: Partial<CartItem>) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

export const useCart = create<CartState>((set) => ({
  cart: [],
  addToCart: (item) => set((state) => {
    const existingItem = state.cart.find(i => i.productId === item.productId);
    if (existingItem) {
      return {
        cart: state.cart.map(i => 
          i.productId === item.productId 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      };
    }
    return { cart: [...state.cart, item] };
  }),
  updateCartItem: (productId, updates) => set((state) => ({
    cart: state.cart.map(item => 
      item.productId === productId ? { ...item, ...updates } : item
    )
  })),
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(item => item.productId !== productId)
  })),
  clearCart: () => set({ cart: [] }),
}));
