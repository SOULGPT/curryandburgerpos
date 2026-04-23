import { create } from 'zustand';

export interface MenuItem {
  id: string;
  category: string;
  name: string;
  emoji: string | null;
  price: number;
  badge: 'NEW' | 'CHEF' | 'HOT' | null;
  available: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  tableId: number | null;
  serviceType: 'tavolo' | 'asporto';
  setTableId: (id: number | null) => void;
  setServiceType: (type: 'tavolo' | 'asporto') => void;
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  tableId: null,
  serviceType: 'tavolo',
  
  setTableId: (id) => set({ tableId: id }),
  setServiceType: (type) => set({ serviceType: type }),
  
  addItem: (item) => {
    const { items } = get();
    const existing = items.find((i) => i.id === item.id);
    if (existing) {
      set({ items: items.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) });
    } else {
      set({ items: [...items, { ...item, quantity: 1 }] });
    }
  },
  
  removeItem: (itemId) => {
    set({ items: get().items.filter((i) => i.id !== itemId) });
  },
  
  updateQuantity: (itemId, delta) => {
    set({
      items: get().items.map((i) => {
        if (i.id === itemId) {
          const newQ = Math.max(0, i.quantity + delta);
          return { ...i, quantity: newQ };
        }
        return i;
      }).filter((i) => i.quantity > 0)
    });
  },
  
  clearCart: () => set({ items: [], tableId: null, serviceType: 'tavolo' }),
  
  getCartTotal: () => {
    return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}));
