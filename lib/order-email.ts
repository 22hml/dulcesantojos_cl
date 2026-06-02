import { readFile } from "fs/promises";
import path from "path";
import { formatCLP } from "@/lib/format";
import { isValidEmail } from "@/types/delivery";

type EmailOrderItem = {
  id?: number;
  name: string;
  qty: number;
  price: number;
};

export type PaidOrderEmailData = {
  id: number;
  delivery_type: "despacho" | "retiro" | "region";
  address: string | null;
  comuna: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  observaciones: string | null;
  subtotal: number;
  delivery_cost: number;
  total: number;
  coupon_code?: string | null;
  coupon_discount?: number | null;
  items: EmailOrderItem[];
  created_at?: string;
};

const ADMIN_ORDER_EMAIL =
  process.env.ADMIN_ORDER_EMAIL?.trim() || "pedidosdulcesantojos@hotmail.com";

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Dulces Antojos <pedidos@dulcesantojos.cl>";

  return { apiKey, from };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const templateCache = new Map<string, string>();

async function loadTemplate(fileName: string): Promise<string> {
  const cached = templateCache.get(fileName);
  if (cached) return cached;

  const template = await readFile(path.join(process.cwd(), fileName), "utf8");
  templateCache.set(fileName, template);
  return template;
}

function lineItemsText(order: PaidOrderEmailData): string {
  return order.items
    .map(
      (item) =>
        `- ${item.qty} x ${item.name}: ${formatCLP(item.price * item.qty)}`
    )
    .join("\n");
}

function itemsSubtotal(order: PaidOrderEmailData): number {
  return order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function deliveryLine(order: PaidOrderEmailData): string {
  if (order.delivery_type === "region") {
    return "Envío a región: cobro a destino por BlueExpress";
  }

  if (order.delivery_type === "despacho") {
    return `Despacho${order.comuna ? ` (${order.comuna})` : ""}: ${formatCLP(
      order.delivery_cost
    )}`;
  }

  return "Retiro: gratis";
}

function getOrderDate(order: PaidOrderEmailData): Date {
  const date = order.created_at ? new Date(order.created_at) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function getRawPhone(phone: string | null): string {
  return phone?.replace(/\D/g, "") || "";
}

function formatOrderDate(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  }).format(date);
}

function formatOrderTime(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Santiago",
  }).format(date);
}

type TemplateItem = EmailOrderItem & {
  price_fmt: string;
  subtotal_fmt: string;
};

type TemplateContext = Record<string, string | boolean | TemplateItem[]>;

function buildTemplateContext(
  order: PaidOrderEmailData,
  paymentId: string
): TemplateContext {
  const date = getOrderDate(order);
  const customerName = order.customer_name?.trim() || "Cliente";
  const customerPhone = order.customer_phone?.trim() || "";
  const isDelivery = order.delivery_type !== "retiro";
  const deliveryCommune =
    order.delivery_type === "region"
      ? "Región"
      : order.comuna?.trim() || "Retiro";
  const deliveryCost =
    order.delivery_type === "region"
      ? "Cobro a destino"
      : order.delivery_type === "despacho"
        ? formatCLP(order.delivery_cost)
        : "Gratis";
  const couponDiscount = order.coupon_discount ?? 0;

  return {
    order_id: String(order.id),
    order_date: formatOrderDate(date),
    order_time: formatOrderTime(date),
    customer_name: customerName,
    customer_name_encoded: encodeURIComponent(customerName),
    customer_phone: customerPhone || "Sin teléfono",
    customer_phone_raw: getRawPhone(customerPhone),
    address: order.address?.trim() || "Por coordinar",
    delivery_commune: deliveryCommune,
    delivery_cost: deliveryCost,
    subtotal: formatCLP(order.subtotal),
    products_subtotal: formatCLP(
      couponDiscount > 0 ? itemsSubtotal(order) : order.subtotal
    ),
    has_coupon: couponDiscount > 0,
    coupon_code: order.coupon_code || "",
    coupon_discount: formatCLP(couponDiscount),
    total: formatCLP(order.total),
    mp_payment_id: paymentId,
    is_despacho: isDelivery,
    items: order.items.map((item) => ({
      ...item,
      name: item.name,
      price_fmt: formatCLP(item.price),
      subtotal_fmt: formatCLP(item.price * item.qty),
    })),
  };
}

function renderEachBlocks(template: string, context: TemplateContext): string {
  return template.replace(
    /{{#each\s+items}}([\s\S]*?){{\/each}}/g,
    (_match, itemTemplate: string) => {
      const items = context.items;
      if (!Array.isArray(items)) return "";

      return items
        .map((item) =>
          itemTemplate.replace(
            /{{this\.([a-zA-Z0-9_]+)}}/g,
            (_itemMatch, key: keyof TemplateItem) =>
              escapeHtml(String(item[key] ?? ""))
          )
        )
        .join("");
    }
  );
}

function renderIfBlocks(template: string, context: TemplateContext): string {
  return template.replace(
    /{{#if\s+([a-zA-Z0-9_]+)}}([\s\S]*?)(?:{{else}}([\s\S]*?))?{{\/if}}/g,
    (_match, key: string, truthyBlock: string, falsyBlock = "") =>
      context[key] ? truthyBlock : falsyBlock
  );
}

function renderVariables(template: string, context: TemplateContext): string {
  return template.replace(/{{([a-zA-Z0-9_]+)}}/g, (_match, key: string) => {
    const value = context[key];
    if (typeof value === "string") return escapeHtml(value);
    if (typeof value === "boolean") return String(value);
    return "";
  });
}

function renderTemplate(template: string, context: TemplateContext): string {
  const withItems = renderEachBlocks(template, context);
  const withConditionals = renderIfBlocks(withItems, context);
  return renderVariables(withConditionals, context);
}

async function buildAdminEmail(order: PaidOrderEmailData, paymentId: string) {
  const text = [
    `Nuevo pedido pagado #${order.id}`,
    "",
    `Pago Mercado Pago: ${paymentId}`,
    `Cliente: ${order.customer_name || "Sin nombre"}`,
    `Teléfono: ${order.customer_phone || "Sin teléfono"}`,
    `Correo: ${order.customer_email || "Sin correo"}`,
    order.address ? `Dirección: ${order.address}` : null,
    order.observaciones ? `Observaciones: ${order.observaciones}` : null,
    "",
    "Detalle:",
    lineItemsText(order),
    "",
    `Subtotal productos: ${formatCLP(
      order.coupon_discount ? itemsSubtotal(order) : order.subtotal
    )}`,
    order.coupon_discount && order.coupon_code
      ? `Cupón ${order.coupon_code}: -${formatCLP(order.coupon_discount)}`
      : null,
    deliveryLine(order),
    `Total pagado: ${formatCLP(order.total)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const template = await loadTemplate("email-admin.html");
  const html = renderTemplate(template, buildTemplateContext(order, paymentId));

  return {
    subject: `Nuevo pedido pagado #${order.id} - ${formatCLP(order.total)}`,
    text,
    html,
  };
}

async function buildCustomerEmail(order: PaidOrderEmailData, paymentId: string) {
  const name = order.customer_name?.trim() || "Cliente";
  const text = [
    `${name}, recibimos el pago de tu pedido #${order.id}.`,
    "",
    "Detalle de tu compra:",
    lineItemsText(order),
    "",
    `Subtotal productos: ${formatCLP(
      order.coupon_discount ? itemsSubtotal(order) : order.subtotal
    )}`,
    order.coupon_discount && order.coupon_code
      ? `Cupón ${order.coupon_code}: -${formatCLP(order.coupon_discount)}`
      : null,
    deliveryLine(order),
    `Total pagado: ${formatCLP(order.total)}`,
    "",
    order.address ? `Dirección: ${order.address}` : null,
    order.observaciones ? `Observaciones: ${order.observaciones}` : null,
    "",
    "Te contactaremos por WhatsApp para coordinar los últimos detalles.",
  ]
    .filter(Boolean)
    .join("\n");

  const template = await loadTemplate("email-cliente.html");
  const html = renderTemplate(template, buildTemplateContext(order, paymentId));

  return {
    subject: `Detalle de tu compra #${order.id} - Dulces Antojos`,
    text,
    html,
  };
}

async function sendResendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const { apiKey, from } = getResendConfig();

  if (!apiKey) {
    console.warn("RESEND_API_KEY no configurada; correo no enviado.");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend falló (${res.status}): ${detail}`);
  }
}

export async function sendOrderPaidEmails(
  order: PaidOrderEmailData,
  paymentId: string
) {
  const adminEmail = await buildAdminEmail(order, paymentId);
  await sendResendEmail({ to: ADMIN_ORDER_EMAIL, ...adminEmail });

  const customerEmail = order.customer_email?.trim();
  if (!customerEmail || !isValidEmail(customerEmail)) {
    console.warn("Pedido pagado sin correo de cliente válido:", order.id);
    return;
  }

  const customerMessage = await buildCustomerEmail(order, paymentId);
  await sendResendEmail({ to: customerEmail, ...customerMessage });
}

export async function sendCouponEmail({
  to,
  couponCode,
  discountPct,
  expiresAt,
  storeUrl,
  recipientName,
  senderName,
  senderMessage,
}: {
  to: string;
  couponCode: string;
  discountPct: number;
  expiresAt?: string | null;
  storeUrl: string;
  recipientName?: string | null;
  senderName?: string | null;
  senderMessage?: string | null;
}) {
  if (!isValidEmail(to)) {
    throw new Error("Correo destinatario inválido");
  }

  const expiresLabel = expiresAt
    ? new Intl.DateTimeFormat("es-CL", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "America/Santiago",
      }).format(new Date(expiresAt))
    : "Sin fecha de vencimiento";
  const safeRecipientName = recipientName?.trim() || "Cliente";
  const safeSenderName = senderName?.trim() || "Dulces Antojos";
  const safeSenderMessage =
    senderMessage?.trim() ||
    "Esperamos que disfrutes este regalo dulce preparado especialmente para ti.";
  const discountValue = `${discountPct}% OFF`;
  const discountDescription = "en tu próxima compra";

  const template = await loadTemplate("email-cupon.html");
  const html = renderTemplate(template, {
    recipient_name: safeRecipientName,
    coupon_code: couponCode,
    discount_value: discountValue,
    discount_description: discountDescription,
    expiry_date: expiresLabel,
    sender_message: safeSenderMessage,
    sender_name: safeSenderName,
    discount_pct: `${discountPct}%`,
    expires_at: expiresLabel,
    store_url: storeUrl,
  });
  const text = [
    "Tienes un cupón de descuento en Dulces Antojos.",
    "",
    `Para: ${safeRecipientName}`,
    `Cupón: ${couponCode}`,
    `Descuento: ${discountValue} ${discountDescription}`,
    `Vigencia: ${expiresLabel}`,
    `Mensaje: ${safeSenderMessage}`,
    "",
    `Usalo en: ${storeUrl}`,
  ].join("\n");

  await sendResendEmail({
    to,
    subject: `Tu cupón ${couponCode} - Dulces Antojos`,
    text,
    html,
  });
}
