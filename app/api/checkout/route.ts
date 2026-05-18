import { NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { getMercadoPagoConfig } from "@/lib/mercadopago";
import { createAdminClient } from "@/lib/supabase-admin";
import type { CartItem } from "@/types";

const DELIVERY_COST = 2990;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      cart,
      deliveryType,
      address,
      customerName,
      customerPhone,
    } = body as {
      cart: Record<string, CartItem>;
      deliveryType: "despacho" | "retiro";
      address?: string;
      customerName?: string;
      customerPhone: string;
    };

    const items = Object.values(cart) as CartItem[];
    if (items.length === 0) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }

    for (const item of items) {
      if (item.qty > item.stock) {
        return NextResponse.json(
          { error: `Sin stock suficiente para ${item.name}` },
          { status: 400 }
        );
      }
    }

    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const deliveryCost = deliveryType === "despacho" ? DELIVERY_COST : 0;
    const total = subtotal + deliveryCost;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const supabase = createAdminClient();
    const orderItems = items.map((i) => ({
      id: i.id,
      name: i.name,
      qty: i.qty,
      price: i.price,
    }));

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        status: "pending",
        delivery_type: deliveryType,
        address: address || null,
        customer_name: customerName || null,
        customer_phone: customerPhone,
        subtotal,
        delivery_cost: deliveryCost,
        total,
        items: orderItems,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error(orderError);
      return NextResponse.json(
        { error: "No se pudo crear el pedido" },
        { status: 500 }
      );
    }

    const mp = getMercadoPagoConfig();
    const preference = await new Preference(mp).create({
      body: {
        external_reference: String(order.id),
        items: [
          ...items.map((i) => ({
            id: String(i.id),
            title: i.name,
            quantity: i.qty,
            unit_price: i.price,
            currency_id: "CLP",
          })),
          ...(deliveryCost > 0
            ? [
                {
                  id: "delivery",
                  title: "Despacho a domicilio",
                  quantity: 1,
                  unit_price: deliveryCost,
                  currency_id: "CLP",
                },
              ]
            : []),
        ],
        back_urls: {
          success: `${appUrl}/pedido/success`,
          failure: `${appUrl}/pedido/failure`,
          pending: `${appUrl}/pedido/pending`,
        },
        auto_return: "approved",
        notification_url: `${appUrl}/api/webhook`,
      },
    });

    await supabase
      .from("orders")
      .update({ mp_preference_id: preference.id })
      .eq("id", order.id);

    return NextResponse.json({
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error al procesar el checkout" },
      { status: 500 }
    );
  }
}
