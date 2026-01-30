import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_PRODUCT_IMAGE } from '../constants';
import type { Product } from '../types';

export type CartItem = {
  productId: string;
  name: string;
  price: string;
  image: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};

const STORAGE_KEY = 'xzone_cart_v1';

const CartContext = createContext<CartContextValue | null>(null);

const toMoneyNumber = (value: string | undefined): number => {
  if (!value) return 0;
  if (value === 'price_on_request') return 0;
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const clampQty = (qty: number) => {
  if (!Number.isFinite(qty)) return 1;
  return Math.max(1, Math.min(999, Math.floor(qty)));
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((x) => x && typeof x === 'object')
        .map((x) => ({
          productId: String((x as any).productId ?? ''),
          name: String((x as any).name ?? ''),
          price: String((x as any).price ?? ''),
          image: String((x as any).image ?? DEFAULT_PRODUCT_IMAGE),
          quantity: clampQty(Number((x as any).quantity ?? 1)),
        }))
        .filter((x) => x.productId && x.name);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    if (!product?.id) return;
    if (!product.price || product.price === 'price_on_request') return;

    const qty = clampQty(quantity);

    setItems((prev) => {
      const existing = prev.find((x) => x.productId === product.id);
      if (!existing) {
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: product.price ?? '0',
            image: product.image || DEFAULT_PRODUCT_IMAGE,
            quantity: qty,
          },
        ];
      }

      return prev.map((x) => (x.productId === product.id ? { ...x, quantity: clampQty(x.quantity + qty) } : x));
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((x) => x.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const qty = clampQty(quantity);
    setItems((prev) => prev.map((x) => (x.productId === productId ? { ...x, quantity: qty } : x)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const itemCount = useMemo(() => items.reduce((sum, x) => sum + x.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, x) => sum + toMoneyNumber(x.price) * x.quantity, 0), [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      setQuantity,
      clear,
    }),
    [items, itemCount, subtotal, addItem, removeItem, setQuantity, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
