import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { DEMO_PRODUCTS } from "@/lib/demo-products";
import { resolveHeroGrid } from "@/lib/hero-slots";
import type { Product } from "@/types";
import type { HeroGridItem, HeroSlot } from "@/types/hero";

type HomeData = {
  products: Product[];
  heroItems: HeroGridItem[];
  demoMode: boolean;
};

async function loadHomeData(): Promise<HomeData> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      products: DEMO_PRODUCTS,
      heroItems: resolveHeroGrid(null, DEMO_PRODUCTS),
      demoMode: true,
    };
  }

  const supabase = createClient(url, key);
  const [productsRes, slotsRes] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("category")
      .order("name"),
    supabase.from("hero_slots").select("*").order("slot"),
  ]);

  const products =
    productsRes.error || !productsRes.data?.length
      ? DEMO_PRODUCTS
      : (productsRes.data as Product[]);
  const slots = slotsRes.error ? null : ((slotsRes.data as HeroSlot[]) ?? null);

  return {
    products,
    heroItems: resolveHeroGrid(slots, products),
    demoMode: Boolean(productsRes.error || !productsRes.data?.length),
  };
}

export const getHomeData = unstable_cache(loadHomeData, ["home-data"], {
  revalidate: 120,
  tags: ["home-data"],
});
