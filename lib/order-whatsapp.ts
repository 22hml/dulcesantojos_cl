import { formatCLP } from "@/lib/format";

export type OrderWhatsAppInput = {
  id?: number;
  delivery_type: "despacho" | "retiro";
  address: string | null;
  comuna?: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  observaciones?: string | null;
  subtotal: number;
  delivery_cost: number;
  total: number;
  items: { name: string; qty: number; price: number }[];
};

export type OrderWhatsAppOptions = {
  mercadoPago?: boolean;
  paymentId?: string;
  pagoPendiente?: boolean;
};

export function buildOrderWhatsAppMessage(
  order: OrderWhatsAppInput,
  opts?: OrderWhatsAppOptions
): string {
  const productLines = order.items.map(
    (i) =>
      `• ${i.name} ×${i.qty} — ${formatCLP(i.price)} c/u = ${formatCLP(i.price * i.qty)}`
  );

  const entregaLine =
    order.delivery_type === "despacho"
      ? `🛵 *Despacho* a ${order.comuna || "(comuna)"}`
      : "🏪 *Retiro* en tienda";

  const addressLine =
    order.delivery_type === "despacho" && order.address
      ? `📍 *Dirección:* ${order.address}`
      : null;

  const despachoLine =
    order.delivery_type === "despacho"
      ? `🛵 *Costo despacho (${order.comuna || "—"}):* ${formatCLP(order.delivery_cost)}`
      : "🛵 *Despacho:* Gratis (retiro)";

  let header = "🎂 *Hola Dulces Antojos!* Quiero hacer un pedido:";
  if (opts?.mercadoPago && order.id) {
    header = `🎂 *Hola Dulces Antojos!*\n✅ *Pedido pagado con Mercado Pago* — #${order.id}`;
    if (opts.paymentId) {
      header += `\n💳 *ID pago MP:* ${opts.paymentId}`;
    }
  } else if (opts?.pagoPendiente && order.id) {
    header = `🎂 *Hola Dulces Antojos!*\n⏳ *Pago Mercado Pago en proceso* — pedido #${order.id}`;
  } else if (order.id) {
    header = `🎂 *Hola Dulces Antojos!* Pedido #${order.id}:`;
  }

  const parts = [
    header,
    "",
    "*Productos:*",
    ...productLines,
    "",
    `*Subtotal productos:* ${formatCLP(order.subtotal)}`,
    despachoLine,
    `*TOTAL:* ${formatCLP(order.total)}`,
    "",
    entregaLine,
    addressLine,
    order.customer_name?.trim()
      ? `👤 *Nombre:* ${order.customer_name.trim()}`
      : null,
    order.customer_phone?.trim()
      ? `📱 *Teléfono:* ${order.customer_phone.trim()}`
      : null,
    order.observaciones?.trim()
      ? `📝 *Observaciones:* ${order.observaciones.trim()}`
      : null,
    "",
    opts?.mercadoPago || opts?.pagoPendiente
      ? "_Por favor confirma mi pedido para coordinar la entrega o el retiro._"
      : null,
  ].filter(Boolean);

  return parts.join("\n");
}

export function buildOrderWhatsAppUrl(
  order: OrderWhatsAppInput,
  opts?: OrderWhatsAppOptions
): string | null {
  const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER?.replace(/\D/g, "");
  if (!waNumber || order.items.length === 0) return null;
  const text = buildOrderWhatsAppMessage(order, opts);
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
}
