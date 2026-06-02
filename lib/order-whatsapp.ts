import { formatCLP } from "@/lib/format";
import type { DeliveryType } from "@/types/delivery";

/** Emojis como escapes Unicode (evita corrupción de encoding en build/Windows). */
const E = {
  cake: "\u{1F382}",
  check: "\u{2705}",
  pending: "\u{23F3}",
  card: "\u{1F4B3}",
  delivery: "\u{1F6F5}",
  store: "\u{1F3EA}",
  pin: "\u{1F4CD}",
  person: "\u{1F464}",
  phone: "\u{1F4F1}",
  note: "\u{1F4DD}",
  email: "\u{1F4E7}",
  package: "\u{1F4E6}",
  bullet: "\u2022",
} as const;

export type OrderWhatsAppInput = {
  id?: number;
  delivery_type: DeliveryType;
  address: string | null;
  comuna?: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email?: string | null;
  observaciones?: string | null;
  subtotal: number;
  delivery_cost: number;
  total: number;
  coupon_code?: string | null;
  coupon_discount?: number | null;
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
      `${E.bullet} ${i.name} x${i.qty} - ${formatCLP(i.price)} c/u = ${formatCLP(i.price * i.qty)}`
  );
  const itemsSubtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
  const couponDiscount = order.coupon_discount ?? 0;

  const entregaLine =
    order.delivery_type === "despacho"
      ? `${E.delivery} *Despacho* a ${order.comuna || "(comuna)"}`
      : order.delivery_type === "region"
        ? `${E.package} *Envio a region* — BlueExpress (cobro a destino)`
        : `${E.store} *Retiro* en tienda`;

  const addressLine =
    (order.delivery_type === "despacho" || order.delivery_type === "region") &&
    order.address
      ? `${E.pin} *Direccion:* ${order.address}`
      : null;

  const despachoLine =
    order.delivery_type === "despacho"
      ? `${E.delivery} *Costo despacho (${order.comuna || "-"}):* ${formatCLP(order.delivery_cost)}`
      : order.delivery_type === "region"
        ? `${E.package} *Envio:* Cobro a destino (BlueExpress, no incluido en total)`
        : `${E.delivery} *Despacho:* Gratis (retiro)`;

  let header = `${E.cake} *Hola Dulces Antojos!* Quiero hacer un pedido:`;
  if (opts?.mercadoPago && order.id) {
    header = `${E.cake} *Hola Dulces Antojos!*\n${E.check} *Pedido pagado con Mercado Pago* - #${order.id}`;
    if (opts.paymentId) {
      header += `\n${E.card} *ID pago MP:* ${opts.paymentId}`;
    }
  } else if (opts?.pagoPendiente && order.id) {
    header = `${E.cake} *Hola Dulces Antojos!*\n${E.pending} *Pago Mercado Pago en proceso* - pedido #${order.id}`;
  } else if (order.id) {
    header = `${E.cake} *Hola Dulces Antojos!* Pedido #${order.id}:`;
  }

  const parts = [
    header,
    "",
    "*Productos:*",
    ...productLines,
    "",
    `*Subtotal productos:* ${formatCLP(
      couponDiscount > 0 ? itemsSubtotal : order.subtotal
    )}`,
    couponDiscount > 0 && order.coupon_code
      ? `*Cupón ${order.coupon_code}:* -${formatCLP(couponDiscount)}`
      : null,
    couponDiscount > 0
      ? `*Subtotal con descuento:* ${formatCLP(order.subtotal)}`
      : null,
    despachoLine,
    `*TOTAL:* ${formatCLP(order.total)}`,
    "",
    entregaLine,
    addressLine,
    order.customer_name?.trim()
      ? `${E.person} *Nombre:* ${order.customer_name.trim()}`
      : null,
    order.customer_phone?.trim()
      ? `${E.phone} *Telefono:* ${order.customer_phone.trim()}`
      : null,
    order.customer_email?.trim()
      ? `${E.email} *Correo:* ${order.customer_email.trim()}`
      : null,
    order.observaciones?.trim()
      ? `${E.note} *Observaciones:* ${order.observaciones.trim()}`
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
