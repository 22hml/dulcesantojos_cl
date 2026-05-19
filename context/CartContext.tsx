"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { Cart, CartItem, Product } from "@/types";

type AddedModal = {
  product: Product;
  qty: number;
};

type CartContextValue = {
  cart: Cart;
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, options?: { openDrawer?: boolean }) => void;
  removeItem: (productId: number) => void;
  setQty: (productId: number, qty: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addedModal: AddedModal | null;
  closeAddedModal: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({});
  const [isOpen, setIsOpen] = useState(false);
  const [addedModal, setAddedModal] = useState<AddedModal | null>(null);

  const addItem = useCallback(
    (product: Product, options?: { openDrawer?: boolean }) => {
      setCart((prev) => {
        const nextQty = (prev[product.id]?.qty ?? 0) + 1;
        if (nextQty > product.stock) return prev;

        if (options?.openDrawer === true) {
          setAddedModal(null);
          setIsOpen(true);
        } else {
          setAddedModal({ product, qty: nextQty });
        }

        return {
          ...prev,
          [product.id]: { ...product, qty: nextQty },
        };
      });
    },
    []
  );

  const removeItem = useCallback((productId: number) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }, []);

  const setQty = useCallback((productId: number, qty: number) => {
    setCart((prev) => {
      const item = prev[productId];
      if (!item) return prev;
      if (qty <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      if (qty > item.stock) return prev;
      return { ...prev, [productId]: { ...item, qty } };
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);
  const closeAddedModal = useCallback(() => setAddedModal(null), []);

  const itemCount = useMemo(
    () => Object.values(cart).reduce((s, i) => s + i.qty, 0),
    [cart]
  );

  const subtotal = useMemo(
    () => Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0),
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      setQty,
      clearCart,
      isOpen,
      openCart: () => {
        setAddedModal(null);
        setIsOpen(true);
      },
      closeCart: () => setIsOpen(false),
      addedModal,
      closeAddedModal,
    }),
    [
      cart,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      setQty,
      clearCart,
      isOpen,
      addedModal,
      closeAddedModal,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
