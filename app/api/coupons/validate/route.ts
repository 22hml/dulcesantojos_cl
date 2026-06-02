import { NextResponse } from "next/server";
import { serviceRpc } from "@/lib/supabase-service";
import { isValidEmail } from "@/types/delivery";

type CouponValidation = {
  valid: boolean;
  reason: string | null;
  coupon_id: number | null;
  code: string | null;
  discount_pct: number | null;
  discount_amount: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      code?: string;
      email?: string;
      subtotal?: number;
    };
    const code = body.code?.trim() || "";
    const email = body.email?.trim() || "";
    const subtotal = Math.max(0, Math.round(Number(body.subtotal) || 0));

    if (!code) {
      return NextResponse.json({ error: "Ingresa un cupón" }, { status: 400 });
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Ingresa un correo válido para aplicar el cupón" },
        { status: 400 }
      );
    }
    if (subtotal <= 0) {
      return NextResponse.json(
        { error: "El carrito no tiene subtotal para aplicar descuento" },
        { status: 400 }
      );
    }

    const rows = await serviceRpc<CouponValidation[]>("validate_coupon_for_email", {
      p_code: code,
      p_email: email.toLowerCase(),
      p_subtotal: subtotal,
    });
    const coupon = rows[0];
    if (!coupon?.valid) {
      return NextResponse.json(
        { error: coupon?.reason || "Cupón inválido" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      code: coupon.code,
      discount_pct: coupon.discount_pct,
      discount_amount: coupon.discount_amount,
    });
  } catch (err) {
    console.error("coupons/validate:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo validar el cupón" },
      { status: 500 }
    );
  }
}
