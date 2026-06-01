import React, { createContext, useContext, useState, useCallback } from "react";
import { Product, BuqueExtras, extrasTotal } from "../data/products";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
  extras?: BuqueExtras;   // only present for buquês
}

interface CartContextValue {
  items: CartItem[];
  totalCount: number;
  totalPrice: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  // For regular products (arranjos, chocolates)
  addItem: (product: Product) => void;
  // For buquês — always adds as a new line (each buquê+extras combo is its own entry)
  addBuque: (product: Product, extras: BuqueExtras) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, qty: number) => void;
  clearCart: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const openCart  = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id && !i.extras);
      if (idx !== -1) {
        return prev.map((i, n) => n === idx ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const addBuque = useCallback((product: Product, extras: BuqueExtras) => {
    setItems((prev) => [...prev, { product, quantity: 1, extras }]);
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index: number, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    } else {
      setItems((prev) =>
        prev.map((item, i) => i === index ? { ...item, quantity: qty } : item)
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => {
    const base = i.product.price * i.quantity;
    const extra = i.extras ? extrasTotal(i.extras) * i.quantity : 0;
    return sum + base + extra;
  }, 0);

  return (
    <CartContext.Provider value={{
      items, totalCount, totalPrice,
      isOpen, openCart, closeCart,
      addItem, addBuque, removeItem, updateQuantity, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
