export type HeroSlotKind = "empty" | "product" | "custom";

export type HeroSlot = {
  slot: number;
  kind: HeroSlotKind;
  product_id: number | null;
  image_url: string | null;
  caption: string | null;
  alt_text: string | null;
  updated_at?: string;
};

export type HeroGridItem = {
  key: string;
  imageUrl: string | null;
  alt: string;
  caption?: string | null;
  isEmpty?: boolean;
};
