import type { Product } from "@/types";

/** Productos con hero_sort 1–4, ordenados por casilla. */
export function pickHeroFeaturedProducts(products: Product[]): Product[] {
  return products
    .filter(
      (p) =>
        p.hero_sort != null && p.hero_sort >= 1 && p.hero_sort <= 4
    )
    .sort((a, b) => (a.hero_sort ?? 0) - (b.hero_sort ?? 0))
    .slice(0, 4);
}

/** Fallback: primeros 4 con imagen (comportamiento anterior). */
export function pickThumbnailProducts(products: Product[]): Product[] {
  const withImage = products.filter((p) => p.image_url);
  const pool = withImage.length >= 4 ? withImage : products;
  return pool.slice(0, 4);
}

export function pickHeroGridProducts(products: Product[]): Product[] {
  const featured = pickHeroFeaturedProducts(products);
  if (featured.length > 0) return featured;
  return pickThumbnailProducts(products);
}
