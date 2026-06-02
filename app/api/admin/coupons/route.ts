import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";

function normalizeCode(value: unknown): string {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function normalizeDiscountPct(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 99) return null;
  return n;
}

function normalizePositiveInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

function normalizeDate(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function GET() {
  if (!isAdminSession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const [{ data: coupons, error }, { data: redemptions, error: rError }] =
    await Promise.all([
      supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      supabase.from("coupon_redemptions").select("coupon_id,status"),
    ]);

  if (error || rError) {
    return NextResponse.json(
      { error: error?.message || rError?.message || "No se pudo leer cupones" },
      { status: 500 }
    );
  }

  const counts = new Map<number, { redeemed_count: number; reserved_count: number }>();
  for (const raw of redemptions ?? []) {
    const row = raw as { coupon_id: number; status: string };
    const current = counts.get(row.coupon_id) ?? {
      redeemed_count: 0,
      reserved_count: 0,
    };
    if (row.status === "redeemed") current.redeemed_count += 1;
    if (row.status === "reserved") current.reserved_count += 1;
    counts.set(row.coupon_id, current);
  }

  return NextResponse.json(
    (coupons ?? []).map((coupon) => ({
      ...coupon,
      redeemed_count: counts.get(coupon.id)?.redeemed_count ?? 0,
      reserved_count: counts.get(coupon.id)?.reserved_count ?? 0,
    }))
  );
}

export async function POST(req: Request) {
  if (!isAdminSession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const code = normalizeCode(body.code);
  const discountPct = normalizeDiscountPct(body.discount_pct);
  if (!code || !discountPct) {
    return NextResponse.json(
      { error: "Código o porcentaje inválido" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("coupons")
    .insert({
      code,
      active: body.active !== false,
      discount_pct: discountPct,
      max_uses: normalizePositiveInt(body.max_uses),
      max_uses_per_email: normalizePositiveInt(body.max_uses_per_email) ?? 1,
      starts_at: normalizeDate(body.starts_at),
      expires_at: normalizeDate(body.expires_at),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  if (!isAdminSession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id, ...body } = await req.json();
  if (!Number.isInteger(Number(id))) {
    return NextResponse.json({ error: "Cupón inválido" }, { status: 400 });
  }

  const fields: Record<string, unknown> = {};
  if ("code" in body) {
    const code = normalizeCode(body.code);
    if (!code) return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    fields.code = code;
  }
  if ("active" in body) fields.active = body.active !== false;
  if ("discount_pct" in body) {
    const discountPct = normalizeDiscountPct(body.discount_pct);
    if (!discountPct) {
      return NextResponse.json({ error: "Porcentaje inválido" }, { status: 400 });
    }
    fields.discount_pct = discountPct;
  }
  if ("max_uses" in body) fields.max_uses = normalizePositiveInt(body.max_uses);
  if ("max_uses_per_email" in body) {
    fields.max_uses_per_email = normalizePositiveInt(body.max_uses_per_email) ?? 1;
  }
  if ("starts_at" in body) fields.starts_at = normalizeDate(body.starts_at);
  if ("expires_at" in body) fields.expires_at = normalizeDate(body.expires_at);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("coupons")
    .update(fields)
    .eq("id", Number(id))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
