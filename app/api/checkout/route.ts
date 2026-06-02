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

type CouponReservation = {
  valid: boolean;
  reason: string | null;
  redemption_id: number | null;
  coupon_id: number | null;
  code: string | null;
  discount_pct: number | null;
  discount_amount: number;
};

export async function POST(req: Request) {
  let step = "inicio";
  let reservedCouponRedemptionId: number | null = null;

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
      couponCode,
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
      couponCode?: string;
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

    const subtotalBeforeCoupon = items.reduce(
      (s, i) => s + getDiscountedPrice(i) * i.qty,
      0
    );
    let couponId: number | null = null;
    let normalizedCouponCode: string | null = null;
    let couponDiscount = 0;

    if (couponCode?.trim()) {
      const rows = await serviceRpc<CouponReservation[]>(
        "reserve_coupon_for_checkout",
        {
          p_code: couponCode.trim(),
          p_email: normalizedCustomerEmail.toLowerCase(),
          p_subtotal: subtotalBeforeCoupon,
        }
      );
      const coupon = rows[0];
      if (!coupon?.valid) {
        return NextResponse.json(
          { error: coupon?.reason || "Cupón inválido" },
          { status: 400 }
        );
      }
      if (!coupon.redemption_id || !coupon.coupon_id || !coupon.code) {
        return NextResponse.json(
          { error: "No se pudo reservar el cupón" },
          { status: 500 }
        );
      }

      reservedCouponRedemptionId = coupon.redemption_id;
      couponId = coupon.coupon_id;
      normalizedCouponCode = coupon.code;
      couponDiscount = Math.min(subtotalBeforeCoupon, coupon.discount_amount);
    }

    const subtotal = Math.max(0, subtotalBeforeCoupon - couponDiscount);
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
        p_coupon_id: couponId,
        p_coupon_code: normalizedCouponCode,
        p_coupon_discount: couponDiscount,
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
        coupon_id: couponId,
        coupon_code: normalizedCouponCode,
        coupon_discount: couponDiscount,
      });
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "No se pudo crear el pedido en Supabase." },
        { status: 500 }
      );
    }

    if (reservedCouponRedemptionId) {
      const attached = await serviceRpc<boolean>("attach_coupon_redemption", {
        p_redemption_id: reservedCouponRedemptionId,
        p_order_id: orderId,
      });
      if (!attached) {
        throw new Error("No se pudo asociar el cupón al pedido");
      }
    }

    step = "mercado-pago";
    const mpProductItems =
      couponDiscount > 0
        ? [
            {
              id: "products",
              title: normalizedCouponCode
                ? `Pedido Dulces Antojos (cupón ${normalizedCouponCode})`
                : "Pedido Dulces Antojos",
              quantity: 1,
              unit_price: Number(subtotal),
              currency_id: "CLP",
            },
          ]
        : items.map((i) => ({
            id: String(i.id),
            title: i.name,
            quantity: i.qty,
            unit_price: Number(getDiscountedPrice(i)),
            currency_id: "CLP",
          }));
    const mpItems = [
      ...mpProductItems,
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
    if (reservedCouponRedemptionId) {
      try {
        await serviceRpc<boolean>("release_coupon_redemption", {
          p_redemption_id: reservedCouponRedemptionId,
        });
      } catch (releaseErr) {
        console.warn("No se pudo liberar reserva de cupón:", releaseErr);
      }
    }

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
