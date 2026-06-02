import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET() {
  if (!isAdminSession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("mode")
    .order("category")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  revalidateTag("home-data");
  return NextResponse.json(data);
}

function normalizeHeroSort(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 4) return null;
  return n;
}

function normalizeDiscountPct(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 99) return null;
  return n;
}

async function clearHeroSortSlot(
  supabase: ReturnType<typeof createAdminClient>,
  slot: number,
  exceptId?: number
) {
  let q = supabase.from("products").update({ hero_sort: null }).eq("hero_sort", slot);
  if (exceptId != null) q = q.neq("id", exceptId);
  await q;
}

export async function POST(req: Request) {
  if (!isAdminSession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const heroSort = normalizeHeroSort(body.hero_sort);
  const supabase = createAdminClient();
  if (heroSort != null) await clearHeroSortSlot(supabase, heroSort);
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: body.name,
      description: body.description || null,
      price: Number(body.price),
      unit: body.unit || "unidad",
      stock: Number(body.stock) || 0,
      category: body.category || null,
      mode: body.mode || "pasteleria",
      highlight: body.highlight || null,
      discount_pct: normalizeDiscountPct(body.discount_pct),
      image_url: body.image_url || null,
      hero_sort: heroSort,
      active: body.active !== false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  revalidateTag("home-data");
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  if (!isAdminSession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id, ...rawFields } = await req.json();
  const supabase = createAdminClient();
  const fields = { ...rawFields } as Record<string, unknown>;

  if ("hero_sort" in fields) {
    fields.hero_sort = normalizeHeroSort(fields.hero_sort);
    if (fields.hero_sort != null) {
      await clearHeroSortSlot(supabase, fields.hero_sort as number, id);
    }
  }
  if ("discount_pct" in fields) {
    fields.discount_pct = normalizeDiscountPct(fields.discount_pct);
  }

  const { data, error } = await supabase
    .from("products")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  if (!isAdminSession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await req.json();
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  revalidateTag("home-data");
  return NextResponse.json({ ok: true });
}
