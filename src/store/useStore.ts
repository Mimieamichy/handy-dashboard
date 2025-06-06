
import { create } from 'zustand';

export interface Product {
  id: string;
  name: string;
  stock: number;
  category: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  cashier: string;
  timestamp: Date;
}

export interface Cashier {
  id: string;
  name: string;
  password: string;
  createdAt: Date;
}

interface StoreState {
  // Auth
  currentRole: 'admin' | 'cashier';
  cashierName: string;
  setRole: (role: 'admin' | 'cashier') => void;
  setCashierName: (name: string) => void;
  
  // Cashiers
  cashiers: Cashier[];
  addCashier: (cashier: Omit<Cashier, 'id' | 'createdAt'>) => void;
  
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProductStock: (productId: string, newStock: number) => void;
  
  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateCartItem: (productId: string, updates: Partial<CartItem>) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  
  // Sales
  sales: Sale[];
  completeSale: (sale: Omit<Sale, 'id'>) => void;
  
  // Current sale for receipt
  currentSale: Sale | null;
  setCurrentSale: (sale: Sale | null) => void;
}

// Mock products data
const initialProducts: Product[] = [
  { id: '1', name: 'Laptop Computer', stock: 15, category: 'Electronics' },
  { id: '2', name: 'Wireless Mouse', stock: 50, category: 'Electronics' },
  { id: '3', name: 'Office Chair', stock: 8, category: 'Furniture' },
  { id: '4', name: 'Desk Lamp', stock: 25, category: 'Furniture' },
  { id: '5', name: 'Coffee Mug', stock: 100, category: 'Accessories' },
  { id: '6', name: 'Notebook', stock: 75, category: 'Stationery' },
  { id: '7', name: 'Pen Set', stock: 40, category: 'Stationery' },
  { id: '8', name: 'Monitor Stand', stock: 12, category: 'Electronics' },
];

// Mock sales data
const initialSales: Sale[] = [
  {
    id: '1',
    items: [
      { productId: '1', productName: 'Laptop Computer', price: 899.99, quantity: 1 },
      { productId: '2', productName: 'Wireless Mouse', price: 29.99, quantity: 2 }
    ],
    subtotal: 959.97,
    total: 1036.77,
    cashier: 'John Doe',
    timestamp: new Date(Date.now() - 86400000) // 1 day ago
  },
  {
    id: '2',
    items: [
      { productId: '3', productName: 'Office Chair', price: 199.99, quantity: 1 }
    ],
    subtotal: 199.99,
    total: 215.99,
    cashier: 'Jane Smith',
    timestamp: new Date(Date.now() - 43200000) // 12 hours ago
  }
];

// Initial cashiers data
const initialCashiers: Cashier[] = [
  {
    id: '1',
    name: 'John Doe',
    password: 'password123',
    createdAt: new Date(Date.now() - 86400000 * 7) // 7 days ago
  },
  {
    id: '2',
    name: 'Jane Smith',
    password: 'password456',
    createdAt: new Date(Date.now() - 86400000 * 3) // 3 days ago
  }
];

export const useStore = create<StoreState>((set, get) => ({
  // Auth
  currentRole: 'cashier',
  cashierName: 'John Doe',
  setRole: (role) => set({ currentRole: role }),
  setCashierName: (name) => set({ cashierName: name }),
  
  // Cashiers
  cashiers: initialCashiers,
  addCashier: (cashier) => set((state) => ({
    cashiers: [...state.cashiers, { 
      ...cashier, 
      id: Date.now().toString(),
      createdAt: new Date()
    }]
  })),
  
  // Products
  products: initialProducts,
  addProduct: (product) => set((state) => ({
    products: [...state.products, { ...product, id: Date.now().toString() }]
  })),
  updateProductStock: (productId, newStock) => set((state) => ({
    products: state.products.map(p => 
      p.id === productId ? { ...p, stock: newStock } : p
    )
  })),
  
  // Cart
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
  
  // Sales
  sales: initialSales,
  completeSale: (sale) => set((state) => ({
    sales: [...state.sales, { ...sale, id: Date.now().toString() }]
  })),
  
  // Current sale
  currentSale: null,
  setCurrentSale: (sale) => set({ currentSale: sale }),
}));
