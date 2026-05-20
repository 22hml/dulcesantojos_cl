import type { Order, OrderStatus } from "@/types";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  preparing: "Preparando",
  sent: "Enviado",
  done: "Listo",
};

export const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  paid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  preparing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  sent: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  done: "bg-gold/20 text-gold border-gold/40",
};

export function isOrderToday(createdAt: string): boolean {
  const d = new Date(createdAt);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function countPaidUnprocessed(orders: Order[]): number {
  return orders.filter((o) => o.status === "paid").length;
}
