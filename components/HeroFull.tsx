"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useShopMode } from "@/context/ShopModeContext";
import { supabase } from "@/lib/supabase";
import { DEMO_PRODUCTS } from "@/lib/demo-products";
import { isSupabaseStorageUrl } from "@/lib/image-optimization";
import { resolveHeroGrid } from "@/lib/hero-slots";
import type { HeroGridItem, HeroSlot } from "@/types/hero";
import type { Product } from "@/types";

const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER;

const STATS = [
  "+8000 pedidos",
  "Desde 2015",
  "Despacho Santiago y regiones",
  "Mercado Pago",
];

const PLACEHOLDER_ITEMS: HeroGridItem[] = [1, 2, 3, 4].map((n) => ({
  key: `placeholder-${n}`,
  imageUrl: null,
  alt: "",
  isEmpty: true,
}));

export default function HeroFull() {
  const { scrollToCatalog } = useShopMode();
  const [heroBg, setHeroBg] = useState(false);
  const [gridItems, setGridItems] = useState<HeroGridItem[]>(PLACEHOLDER_ITEMS);

  useEffect(() => {
    const img = new window.Image();
    img.src = "/hero-bg.jpg";
    img.onload = () => setHeroBg(true);
  }, []);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setGridItems(resolveHeroGrid(null, DEMO_PRODUCTS));
        return;
      }

      const [slotsRes, productsRes] = await Promise.all([
        supabase.from("hero_slots").select("*").order("slot"),
        supabase.from("products").select("*").eq("active", true).order("id"),
      ]);

      const products = (productsRes.data as Product[])?.length
        ? (productsRes.data as Product[])
        : DEMO_PRODUCTS;
      const slots = (slotsRes.data as HeroSlot[]) ?? null;

      setGridItems(resolveHeroGrid(slots, products));
    }
    load();
  }, []);

  const backgroundStyle = useMemo(() => {
    if (heroBg) {
      return {
        backgroundColor: "#0d0d0d",
        backgroundImage: `linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.88)), url(/hero-bg.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      } as const;
    }
    return {
      backgroundColor: "#0d0d0d",
      backgroundImage:
        "radial-gradient(ellipse at 30% 50%, rgba(232,168,32,0.08), transparent 70%)",
    } as const;
  }, [heroBg]);

  const slots = useMemo(() => {
    const items = [...gridItems];
    while (items.length < 4) {
      items.push({
        key: `pad-${items.length}`,
        imageUrl: null,
        alt: "",
        isEmpty: true,
      });
    }
    return items.slice(0, 4);
  }, [gridItems]);

  return (
    <section
      className="relative border-b border-border pb-8 pt-[7.5rem] sm:pb-10 md:pt-[7.25rem] lg:flex lg:max-h-[85vh] lg:min-h-0 lg:items-start lg:overflow-hidden lg:pb-2 lg:pt-[68px]"
      style={backgroundStyle}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-[5%] py-5 sm:gap-6 sm:py-8 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10 lg:py-8">
        <div className="min-w-0">
          <span className="mb-3 inline-flex rounded-sm border border-gold/25 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-gold sm:mb-4 sm:px-4 sm:py-1.5 sm:text-[0.68rem]">
            Pastelería · Desde 2015
          </span>
          <h1 className="mb-3 sm:mb-4">
            <span className="font-bebas block text-[clamp(2.75rem,11vw,7rem)] leading-[0.9] tracking-wide text-white sm:leading-[0.88]">
              DULCES
            </span>
            <span className="font-script block text-[clamp(2.25rem,8vw,5.5rem)] leading-none text-gold">
              Antojos
            </span>
          </h1>
          <p className="mb-4 max-w-md text-[0.85rem] font-light leading-relaxed text-white/70 sm:mb-5 sm:text-[0.9rem]">
            Tu celebración merece lo mejor. Pastelería con despacho en Santiago y regiones.
            Cajas de torta premium para reposteras. Paga con Mercado Pago.
          </p>
          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={scrollToCatalog}
              className="rounded bg-gold px-6 py-3 font-outfit text-[0.8rem] font-bold uppercase tracking-widest text-black transition hover:bg-gold-light sm:px-8 sm:py-3.5 sm:text-[0.85rem]"
            >
              Ver catálogo
            </button>
            {waNumber && (
              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Hola! Quiero consultar sobre Dulces Antojos 🎂")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-wa/50 bg-transparent px-6 py-3 font-outfit text-[0.8rem] font-bold uppercase tracking-widest text-wa transition hover:border-wa hover:bg-wa/10 sm:px-8 sm:py-3.5 sm:text-[0.85rem]"
              >
                WhatsApp
              </a>
            )}
          </div>
          <p className="mt-4 hidden flex-wrap items-center gap-x-2 gap-y-1 text-[0.72rem] font-medium text-white/55 lg:flex">
            {STATS.map((stat, i) => (
              <span key={stat} className="inline-flex items-center gap-2">
                {i > 0 && <span className="text-gold/35">·</span>}
                {stat}
              </span>
            ))}
          </p>
        </div>

        <div className="mx-auto w-full max-w-[min(100%,22rem)] shrink-0 sm:max-w-md lg:max-w-none lg:mx-0">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {slots.map((item) => (
              <HeroCell key={item.key} item={item} />
            ))}
          </div>
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[0.68rem] font-medium text-white/55 lg:hidden">
            {STATS.map((stat, i) => (
              <span key={stat} className="inline-flex items-center gap-2">
                {i > 0 && <span className="text-gold/35">·</span>}
                {stat}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}

function HeroCell({ item }: { item: HeroGridItem }) {
  const placeholder = !item.imageUrl;

  return (
    <div
      className={`group relative aspect-square overflow-hidden rounded-lg border ${
        placeholder
          ? "border-gold/25 bg-gradient-to-br from-gold/10 to-transparent"
          : "border-white/10"
      }`}
    >
      {item.imageUrl ? (
        <>
          <Image
            src={item.imageUrl}
            alt={item.alt}
            fill
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            sizes="(max-width: 1024px) 45vw, 200px"
            unoptimized={isSupabaseStorageUrl(item.imageUrl)}
          />
          {item.caption && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-2 pt-6">
              <p className="text-center text-[0.6rem] font-medium uppercase tracking-wider text-white/90">
                {item.caption}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
          <span className="text-3xl opacity-60">🎂</span>
          {item.isEmpty && (
            <span className="text-[0.6rem] uppercase tracking-wider text-gold/70">
              Próximamente
            </span>
          )}
        </div>
      )}
    </div>
  );
}
