"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DEMO_PRODUCTS } from "@/lib/demo-products";
import { useShopMode } from "@/context/ShopModeContext";
import type { Product } from "@/types";
import type { ShopMode } from "@/context/ShopModeContext";
import ProductCard from "./ProductCard";

const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER;

export default function Catalog() {
  const { mode } = useShopMode();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("Todos");
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setProducts(DEMO_PRODUCTS);
        setDemoMode(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("category")
        .order("name");

      if (error || !data?.length) {
        setProducts(DEMO_PRODUCTS);
        setDemoMode(true);
      } else {
        setProducts(data as Product[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    setFilter("Todos");
  }, [mode]);

  const modeProducts = useMemo(
    () => products.filter((p) => p.mode === mode),
    [products, mode]
  );

  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(
        modeProducts
          .map((p) => p.category)
          .filter((c): c is string => Boolean(c))
      )
    );
    return ["Todos", ...cats];
  }, [modeProducts]);

  const filtered =
    filter === "Todos"
      ? modeProducts
      : modeProducts.filter((p) => p.category === filter);

  const header = getSectionHeader(mode);

  return (
    <section id="catalogo" className="bg-black px-[5%] py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-2 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gold">
            {header.label}
          </p>
          <h2 className="font-bebas text-[clamp(2rem,4vw,3.2rem)] leading-none tracking-wide text-white">
            {header.title}{" "}
            <em className="font-script text-[0.85em] not-italic text-gold">
              {header.em}
            </em>
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`rounded-sm border px-4 py-2 font-outfit text-[0.75rem] uppercase tracking-wider transition ${
                filter === cat
                  ? "border-gold bg-gold font-semibold text-black"
                  : "border-border bg-transparent text-gray hover:border-gold hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {mode === "shop" && (
        <div className="mb-10 flex items-center gap-4 rounded border border-gold/15 bg-card p-5 text-[0.85rem] leading-relaxed text-gray">
          <span className="shrink-0 text-2xl">📦</span>
          <p>
            <strong className="text-white">Venta por unidad y al por mayor.</strong>{" "}
            Todas nuestras cajas son de calidad premium para pastelerías y
            reposteras. ¿Necesitas un volumen especial?{" "}
            {waNumber && (
              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Hola! Quiero cotizar cajas al por mayor 🎂")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                Cotiza por WhatsApp
              </a>
            )}
          </p>
        </div>
      )}

      {demoMode && (
        <p className="mb-6 rounded border border-gold/20 bg-card px-4 py-2 text-center text-sm text-gold">
          Modo demo: configura Supabase en .env.local para ver productos reales
        </p>
      )}

      {loading ? (
        <p className="py-20 text-center text-gray">Cargando productos…</p>
      ) : filtered.length === 0 ? (
        <p className="py-20 text-center text-gray">
          No hay productos en esta sección aún.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-px border border-border bg-border">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

function getSectionHeader(mode: ShopMode) {
  if (mode === "shop") {
    return {
      label: "Dulces Antojos Shop",
      title: "CAJAS",
      em: "Premium",
    };
  }
  return {
    label: "Pastelería artesanal",
    title: "TORTAS &",
    em: "Postres",
  };
}
