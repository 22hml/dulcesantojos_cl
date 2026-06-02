import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { sendCouponEmail } from "@/lib/order-email";
import { createAdminClient } from "@/lib/supabase-admin";
import { isValidEmail } from "@/types/delivery";

export async function POST(req: Request) {
  if (!isAdminSession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    couponId?: number;
    email?: string;
    storeUrl?: string;
    recipientName?: string;
    senderName?: string;
    senderMessage?: string;
  };
  const couponId = Number(body.couponId);
  const email = body.email?.trim() || "";
  if (!Number.isInteger(couponId) || couponId <= 0) {
    return NextResponse.json({ error: "Cupón inválido" }, { status: 400 });
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("id", couponId)
    .single();

  if (error || !coupon) {
    return NextResponse.json(
      { error: error?.message || "Cupón no encontrado" },
      { status: 404 }
    );
  }

  const storeUrl =
    body.storeUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    new URL(req.url).origin.replace(/\/api\/admin\/coupons\/send$/, "");

  await sendCouponEmail({
    to: email,
    couponCode: coupon.code,
    discountPct: coupon.discount_pct,
    expiresAt: coupon.expires_at,
    storeUrl,
    recipientName: body.recipientName,
    senderName: body.senderName,
    senderMessage: body.senderMessage,
  });

  await supabase
    .from("coupons")
    .update({ last_sent_at: new Date().toISOString(), last_sent_to: email })
    .eq("id", couponId);

  return NextResponse.json({ ok: true });
}
