import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "../lib/api";
import { normalizeProductMedia } from "../lib/media";

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("wa-cart");
    if (!saved) return [];

    try {
      const parsed = JSON.parse(saved) as CartItem[];
      return Array.isArray(parsed)
        ? parsed.map((item) => ({
            ...item,
            product: normalizeProductMedia(item.product)
          }))
        : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("wa-cart", JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
    return {
      items,
      count,
      subtotal,
      addItem(product, quantity = 1) {
        setItems((current) => {
          const existing = current.find((item) => item.product.id === product.id);
          const nextQty = Math.min((existing?.quantity ?? 0) + quantity, product.stock_quantity);
          if (existing) return current.map((item) => (item.product.id === product.id ? { ...item, quantity: nextQty } : item));
          return [...current, { product: normalizeProductMedia(product), quantity: Math.min(quantity, product.stock_quantity) }];
        });
      },
      updateQuantity(productId, quantity) {
        setItems((current) => current.map((item) => (item.product.id === productId ? { ...item, quantity: Math.max(1, Math.min(quantity, item.product.stock_quantity)) } : item)));
      },
      removeItem(productId) {
        setItems((current) => current.filter((item) => item.product.id !== productId));
      },
      clearCart() {
        setItems([]);
      }
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
