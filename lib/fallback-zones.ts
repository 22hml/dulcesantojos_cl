import type { DeliveryZone } from "@/types";
import { CART_DELIVERY_ZONES } from "@/lib/cart-delivery-zones";

/** Respaldo si la tabla delivery_zones aún no existe (ordenado A–Z) */
export const FALLBACK_DELIVERY_ZONES: DeliveryZone[] = [...CART_DELIVERY_ZONES]
  .sort((a, b) => a.comuna.localeCompare(b.comuna, "es", { sensitivity: "base" }))
  .map((z, i) => ({ id: i + 1, comuna: z.comuna, delivery_cost: z.delivery_cost }));
