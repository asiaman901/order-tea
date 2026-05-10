import { create } from 'zustand';

export type SugarLevel = '常規' | '少糖' | '半糖' | '微糖' | '無糖' | '固定甜度';
export type IceLevel = '常規' | '少冰' | '微冰' | '去冰' | '完全去冰' | '熱飲';
export type SizeOptions = 'L' | 'Bottle';

export interface CartItem {
  id: string; // unique ID for cart item
  productId: string;
  name: string;
  size: SizeOptions;
  sugar: SugarLevel;
  ice: IceLevel;
  price: number;
  quantity: number;
  toppings: string[];
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) => set((state) => {
    // Check if exactly same item configuration exists
    const existingIndex = state.items.findIndex(i => 
      i.productId === item.productId &&
      i.size === item.size &&
      i.sugar === item.sugar &&
      i.ice === item.ice &&
      JSON.stringify(i.toppings.sort()) === JSON.stringify(item.toppings.sort())
    );

    if (existingIndex >= 0) {
      const newItems = [...state.items];
      newItems[existingIndex].quantity += item.quantity;
      return { items: newItems };
    }
    return { items: [...state.items, item] };
  }),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
  updateQuantity: (id, quantity) => set((state) => ({
    items: state.items.map(i => i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i)
  })),
  clearCart: () => set({ items: [] }),
  getCartTotal: () => {
    return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}));
