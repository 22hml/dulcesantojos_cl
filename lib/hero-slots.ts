import { pickHeroGridProducts } from "@/lib/hero-products";
import type { HeroGridItem, HeroSlot } from "@/types/hero";
import type { Product } from "@/types";

export function resolveHeroGrid(
  slots: HeroSlot[] | null | undefined,
  products: Product[]
): HeroGridItem[] {
  const rows = slots ?? [];
  const configured = rows.filter((s) => s.kind !== "empty");

  if (configured.length === 0) {
    return pickHeroGridProducts(products).map((p) => ({
      key: `product-fallback-${p.id}`,
      imageUrl: p.image_url,
      alt: p.name,
      caption: p.name,
    }));
  }

  const items: HeroGridItem[] = [];
  for (let n = 1; n <= 4; n++) {
    const row = rows.find((s) => s.slot === n);
    if (!row || row.kind === "empty") {
      items.push({
        key: `empty-${n}`,
        imageUrl: null,
        alt: "",
        isEmpty: true,
      });
      continue;
    }

    if (row.kind === "custom" && row.image_url) {
      items.push({
        key: `custom-${n}`,
        imageUrl: row.image_url,
        alt: row.alt_text?.trim() || row.caption?.trim() || "Dulces Antojos",
        caption: row.caption,
      });
      continue;
    }

    if (row.kind === "product" && row.product_id) {
      const p = products.find((x) => x.id === row.product_id);
      items.push({
        key: `product-${row.product_id}`,
        imageUrl: p?.image_url ?? row.image_url,
        alt: p?.name ?? row.caption ?? "Producto",
        caption: p?.name ?? row.caption,
      });
      continue;
    }

    items.push({
      key: `empty-${n}`,
      imageUrl: null,
      alt: "",
      isEmpty: true,
    });
  }

  return items;
}

export function emptyHeroSlots(): HeroSlot[] {
  return [1, 2, 3, 4].map((slot) => ({
    slot,
    kind: "empty" as const,
    product_id: null,
    image_url: null,
    caption: null,
    alt_text: null,
  }));
}

export function mergeHeroSlots(rows: HeroSlot[]): HeroSlot[] {
  const base = emptyHeroSlots();
  for (const row of rows) {
    const i = base.findIndex((s) => s.slot === row.slot);
    if (i >= 0) base[i] = row;
  }
  return base;
}
