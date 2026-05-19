import type { DeliveryZone } from "@/types";

/** Respaldo si la tabla delivery_zones aún no existe */
export const FALLBACK_DELIVERY_ZONES: DeliveryZone[] = [
  { id: 1, comuna: "Santiago", delivery_cost: 2990 },
  { id: 2, comuna: "Providencia", delivery_cost: 2990 },
  { id: 3, comuna: "Ñuñoa", delivery_cost: 2990 },
  { id: 4, comuna: "Las Condes", delivery_cost: 3490 },
  { id: 5, comuna: "Vitacura", delivery_cost: 3490 },
  { id: 6, comuna: "La Florida", delivery_cost: 3490 },
  { id: 7, comuna: "Maipú", delivery_cost: 3990 },
  { id: 8, comuna: "Puente Alto", delivery_cost: 4490 },
];
