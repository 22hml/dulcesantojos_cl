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
  /** 1–4 = casilla en el hero del inicio; null = no destacado */
  hero_sort?: number | null;
  active: boolean;
};

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
  items: { id: number; name: string; qty: number; price: number }[];
  created_at: string;
};
