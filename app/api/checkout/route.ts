import { NextResponse } from "next/server";
import {
  createMercadoPagoPreference,
  formatMpError,
} from "@/lib/mercadopago-preference";
import {
  pickMpCheckoutUrl,
  resolveMpBackBase,
  shouldUseMpSandbox,
} from "@/lib/mp-checkout-url";
import {
  buildStockValidation,
  formatStockIssuesMessage,
} from "@/lib/cart-stock";
import {
  serviceGetProductsByIds,
  serviceInsertOrder,
  serviceRpc,
  serviceUpdateOrder,
} from "@/lib/supabase-service";
import { isValidEmail } from "@/types/delivery";
import { getDiscountedPrice, type CartItem } from "@/types";
import type { DeliveryType } from "@/types/delivery";

export async function POST(req: Request) {
  let step = "inicio";

  try {
    const body = await req.json();
    const {
      cart,
      deliveryType,
      address,
      comuna,
      customerName,
      customerPhone,
      customerEmail,
      observaciones,
      deliveryCost: clientDeliveryCost,
      clientOrigin,
    } = body as {
      cart: Record<string, CartItem>;
      deliveryType: DeliveryType;
      address?: string;
      comuna?: string;
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      observaciones?: string;
      deliveryCost?: number;
      clientOrigin?: string;
    };

    const items = Object.values(cart) as CartItem[];
    if (items.length === 0) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }

    if (!customerName?.trim()) {
      return NextResponse.json(
        { error: "Ingresa tu nombre para el pedido" },
        { status: 400 }
      );
    }

    if (!customerPhone?.trim()) {
      return NextResponse.json(
        { error: "Ingresa tu teléfono para coordinar el pedido" },
        { status: 400 }
      );
    }

    const normalizedCustomerEmail = customerEmail?.trim() || "";
    if (!normalizedCustomerEmail || !isValidEmail(normalizedCustomerEmail)) {
      return NextResponse.json(
        { error: "Ingresa un correo electrónico válido" },
        { status: 400 }
      );
    }

    const dbProducts = await serviceGetProductsByIds(items.map((i) => i.id));
    const stockCheck = buildStockValidation(
      items.map((i) => ({ id: i.id, qty: i.qty, name: i.name })),
      dbProducts
    );
    if (!stockCheck.ok) {
      return NextResponse.json(
        {
          error: formatStockIssuesMessage(stockCheck.issues),
          stockIssues: stockCheck.issues,
          products: stockCheck.productsById,
        },
        { status: 409 }
      );
    }

    const dbProductById = new Map(dbProducts.map((p) => [p.id, p]));
    for (const item of items) {
      const liveProduct = dbProductById.get(item.id);
      if (!liveProduct) continue;
      item.name = liveProduct.name;
      item.price = liveProduct.price;
      item.discount_pct = liveProduct.discount_pct;
    }

    let deliveryCost = 0;
    let fullAddress: string | null = address || null;

    if (deliveryType === "despacho") {
      if (!comuna?.trim() || !address?.trim()) {
        return NextResponse.json(
          { error: "Selecciona comuna e ingresa la dirección" },
          { status: 400 }
        );
      }

      step = "tarifa-comuna";
      try {
        const zones = await serviceRpc<{ delivery_cost: number }[]>(
          "get_delivery_cost",
          { p_comuna: comuna.trim() }
        );
        const cost = Array.isArray(zones) ? zones[0]?.delivery_cost : null;
        if (typeof cost === "number") deliveryCost = cost;
      } catch {
        /* usa fallback */
      }

      if (!deliveryCost) {
        deliveryCost =
          typeof clientDeliveryCost === "number" ? clientDeliveryCost : 2990;
      }
      fullAddress = `${address.trim()}, ${comuna.trim()}`;
    } else if (deliveryType === "region") {
      if (!address?.trim()) {
        return NextResponse.json(
          { error: "Ingresa la dirección completa de envío" },
          { status: 400 }
        );
      }
      fullAddress = address.trim();
      deliveryCost = 0;
    }

    const subtotal = items.reduce(
      (s, i) => s + getDiscountedPrice(i) * i.qty,
      0
    );
    const total = subtotal + deliveryCost;
    const useSandbox = shouldUseMpSandbox();
    const backBase = resolveMpBackBase(req, clientOrigin, useSandbox);

    const orderItems = items.map((i) => ({
      id: i.id,
      name: i.name,
      qty: i.qty,
      price: getDiscountedPrice(i),
    }));

    step = "crear-pedido";
    let orderId: number | null = null;

    try {
      orderId = await serviceRpc<number>("create_order_for_checkout", {
        p_delivery_type: deliveryType,
        p_address: fullAddress,
        p_comuna: deliveryType === "despacho" ? comuna?.trim() : null,
        p_customer_name: customerName.trim(),
        p_customer_phone: customerPhone.trim(),
        p_subtotal: subtotal,
        p_delivery_cost: deliveryCost,
        p_total: total,
        p_items: orderItems,
        p_observaciones: observaciones?.trim() || null,
        p_customer_email: normalizedCustomerEmail,
      });
    } catch (rpcErr) {
      console.warn("RPC create_order falló, insert directo:", rpcErr);
      orderId = await serviceInsertOrder({
        status: "pending",
        delivery_type: deliveryType,
        address: fullAddress,
        comuna: deliveryType === "despacho" ? comuna?.trim() : null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: normalizedCustomerEmail,
        observaciones: observaciones?.trim() || null,
        subtotal,
        delivery_cost: deliveryCost,
        total,
        items: orderItems,
      });
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "No se pudo crear el pedido en Supabase." },
        { status: 500 }
      );
    }

    step = "mercado-pago";
    const mpItems = [
      ...items.map((i) => ({
        id: String(i.id),
        title: i.name,
        quantity: i.qty,
        unit_price: Number(getDiscountedPrice(i)),
        currency_id: "CLP",
      })),
      ...(deliveryCost > 0
        ? [
            {
              id: "delivery",
              title: comuna ? `Despacho ${comuna}` : "Despacho a domicilio",
              quantity: 1,
              unit_price: Number(deliveryCost),
              currency_id: "CLP",
            },
          ]
        : []),
    ];

    const preference = await createMercadoPagoPreference({
      orderId,
      items: mpItems,
      backBase,
      useSandbox,
    });

    step = "guardar-preferencia";
    try {
      await serviceUpdateOrder(orderId, {
        mp_preference_id: preference.id,
      });
    } catch (e) {
      console.warn("No se guardó mp_preference_id (el pago igual funciona):", e);
    }

    const checkoutUrl = pickMpCheckoutUrl(preference, useSandbox);

    if (!checkoutUrl) {
      throw new Error(
        "Mercado Pago no devolvió URL de pago. Revisa que MP_ACCESS_TOKEN sea de prueba (Credenciales de prueba)."
      );
    }

    return NextResponse.json({
      order_id: orderId,
      preference_id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      checkout_url: checkoutUrl,
      use_sandbox: useSandbox,
    });
  } catch (err) {
    console.error(`checkout [${step}]:`, err);

    const message = formatMpError(err);

    if (step === "mercado-pago") {
      return NextResponse.json(
        {
          error: `Mercado Pago: ${message}`,
          hint: "Verifica MP_ACCESS_TOKEN (Credenciales de prueba, empieza con APP_USR-). El pedido ya puede estar en Supabase → orders.",
          step,
        },
        { status: 500 }
      );
    }

    if (step === "crear-pedido") {
      return NextResponse.json(
        {
          error: `Supabase: ${message}`,
          step,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message, step }, { status: 500 });
  }
}
