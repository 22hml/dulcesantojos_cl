"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type ShopMode = "pasteleria" | "shop";

type ShopModeContextValue = {
  mode: ShopMode;
  setMode: (mode: ShopMode) => void;
  scrollToCatalog: () => void;
};

const ShopModeContext = createContext<ShopModeContextValue | null>(null);

export function ShopModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ShopMode>("shop");

  const setMode = useCallback((next: ShopMode) => {
    setModeState(next);
  }, []);

  const scrollToCatalog = useCallback(() => {
    document.getElementById("catalogo")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const value = useMemo(
    () => ({ mode, setMode, scrollToCatalog }),
    [mode, setMode, scrollToCatalog]
  );

  return (
    <ShopModeContext.Provider value={value}>{children}</ShopModeContext.Provider>
  );
}

export function useShopMode() {
  const ctx = useContext(ShopModeContext);
  if (!ctx) {
    throw new Error("useShopMode debe usarse dentro de ShopModeProvider");
  }
  return ctx;
}
