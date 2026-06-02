export type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  stock: number;
  category: string | null;
  mode: string;
  image_url: string | null;
  highlight: string | null;
  discount_pct?: number | null;
  /** 1–4 = casilla en el hero del inicio; null = no destacado */
  hero_sort?: number | null;
  active: boolean;
};

export function getDiscountedPrice(
  product: Pick<Product, "price" | "discount_pct">
): number {
  if (!product.discount_pct) return product.price;
  return Math.round(product.price * (1 - product.discount_pct / 100));
}

export type CartItem = Product & { qty: number };

export type Cart = Record<number, CartItem>;

export type { DeliveryType } from "@/types/delivery";

export type OrderStatus =
  | "pending"
  | "paid"
  | "preparing"
  | "sent"
  | "done";

export type DeliveryZone = {
  id: number;
  comuna: string;
  region?: string;
  delivery_cost: number;
};

export type Coupon = {
  id: number;
  code: string;
  active: boolean;
  discount_pct: number;
  max_uses: number | null;
  max_uses_per_email: number;
  starts_at?: string | null;
  expires_at?: string | null;
  last_sent_at?: string | null;
  last_sent_to?: string | null;
  created_at?: string;
  updated_at?: string;
  redeemed_count?: number;
  reserved_count?: number;
};

export type Order = {
  id: number;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  status: OrderStatus;
  delivery_type: "despacho" | "retiro" | "region";
  address: string | null;
  comuna?: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email?: string | null;
  observaciones?: string | null;
  subtotal: number;
  delivery_cost: number;
  total: number;
  coupon_id?: number | null;
  coupon_code?: string | null;
  coupon_discount?: number | null;
  items: { id: number; name: string; qty: number; price: number }[];
  created_at: string;
};
