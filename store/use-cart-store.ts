import { create } from 'zustand';
import type { MenuItem } from '@/data/menu';

export interface CartItem extends MenuItem {
  quantity: number;
  selectedSauce?: string;
  cartItemId?: string;
}

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  addItem: (item: MenuItem, selectedSauce?: string) => void;
  addMultipleItems: (items: MenuItem[], mainItemSauce?: string) => void;
  removeItem: (idOrCartItemId: string) => void;
  updateQuantity: (idOrCartItemId: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  total: () => number;
  itemCount: () => number;
}

function getItemKey(item: MenuItem, selectedSauce?: string): string {
  const sauce = selectedSauce || (item as CartItem).selectedSauce;
  return sauce ? `${item.id}-${sauce}` : item.id;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isDrawerOpen: false,

  addItem: (item, selectedSauce) =>
    set((state) => {
      const sauce = selectedSauce || (item as CartItem).selectedSauce;
      const key = getItemKey(item, sauce);
      const existing = state.items.find(
        (i) => (i.cartItemId || i.id) === key
      );

      if (existing) {
        return {
          items: state.items.map((i) =>
            (i.cartItemId || i.id) === key
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }

      return {
        items: [
          ...state.items,
          { ...item, quantity: 1, selectedSauce: sauce, cartItemId: key },
        ],
      };
    }),

  addMultipleItems: (itemsToAdd, mainItemSauce) =>
    set((state) => {
      const updated = [...state.items];
      for (let index = 0; index < itemsToAdd.length; index++) {
        const item = itemsToAdd[index];
        // Atribui o molho ao item principal (primeiro item) se fornecido
        const sauce = (item as CartItem).selectedSauce || (index === 0 ? mainItemSauce : undefined);
        const key = getItemKey(item, sauce);
        const idx = updated.findIndex(
          (i) => (i.cartItemId || i.id) === key
        );

        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            quantity: updated[idx].quantity + 1,
          };
        } else {
          updated.push({
            ...item,
            quantity: 1,
            selectedSauce: sauce,
            cartItemId: key,
          });
        }
      }
      return { items: updated };
    }),

  removeItem: (idOrCartItemId) =>
    set((state) => ({
      items: state.items.filter(
        (i) => (i.cartItemId || i.id) !== idOrCartItemId && i.id !== idOrCartItemId
      ),
    })),

  updateQuantity: (idOrCartItemId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return {
          items: state.items.filter(
            (i) => (i.cartItemId || i.id) !== idOrCartItemId
          ),
        };
      }
      return {
        items: state.items.map((i) =>
          (i.cartItemId || i.id) === idOrCartItemId
            ? { ...i, quantity }
            : i
        ),
      };
    }),

  clearCart: () => set({ items: [] }),

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),

  total: () =>
    get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  itemCount: () =>
    get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
