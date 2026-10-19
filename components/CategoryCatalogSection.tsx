"use client";

import { useEffect } from "react";
import { useShopMode } from "@/context/ShopModeContext";
import type { Product } from "@/types";
import type { CategoryPageView } from "@/lib/seo/categories";
import ProductCard from "./ProductCard";

type Props = {
  config: CategoryPageView;
  products: Product[];
  demoMode?: boolean;
};

export default function CategoryCatalogSection({
  config,
  products,
  demoMode = false,
}: Props) {
  const { setMode } = useShopMode();

  useEffect(() => {
    setMode(config.mode);
  }, [config.mode, setMode]);

  return (
    <section className="bg-theme-base px-[4%] py-12 sm:px-[5%] sm:py-20">
      <div className="mb-8 max-w-3xl">
        <p className="mb-2 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gold">
          {config.label}
        </p>
        <h1 className="font-bebas text-[clamp(2rem,4vw,3.2rem)] leading-none tracking-wide text-theme">
          {config.h1}{" "}
          {config.h1Em && (
            <em className="font-script text-[0.85em] not-italic text-gold">
              {config.h1Em}
            </em>
          )}
        </h1>
        <p className="mt-4 text-[0.9rem] leading-relaxed text-gray">{config.intro}</p>
      </div>

      {demoMode && (
        <p className="mb-6 rounded border border-gold/20 bg-card px-4 py-2 text-center text-sm text-gold">
          Modo demo: configura Supabase en .env.local para ver productos reales
        </p>
      )}

      {products.length === 0 ? (
        <p className="py-16 text-center text-gray">
          Pronto tendremos productos en esta categoría. Mientras tanto,{" "}
          <a href="/#catalogo" className="text-gold hover:underline">
            revisa el catálogo completo
          </a>{" "}
          o escríbenos por WhatsApp.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-px border border-border bg-border">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
