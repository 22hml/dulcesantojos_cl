import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { mergeHeroSlots } from "@/lib/hero-slots";
import { createAdminClient } from "@/lib/supabase-admin";
import type { HeroSlot, HeroSlotKind } from "@/types/hero";

function parseSlot(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 4) return null;
  return n;
}

function parseKind(value: unknown): HeroSlotKind | null {
  if (value === "empty" || value === "product" || value === "custom") return value;
  return null;
}

async function clearHeroSortForSlot(
  supabase: ReturnType<typeof createAdminClient>,
  slot: number
) {
  await supabase.from("products").update({ hero_sort: null }).eq("hero_sort", slot);
}

export async function GET() {
  if (!isAdminSession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("hero_slots").select("*").order("slot");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(mergeHeroSlots((data ?? []) as HeroSlot[]));
}

export async function PUT(req: Request) {
  if (!isAdminSession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const slot = parseSlot(body.slot);
  const kind = parseKind(body.kind);
  if (slot == null || !kind) {
    return NextResponse.json({ error: "Casilla o tipo inválido" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (kind === "product") {
    const productId = Number(body.product_id);
    if (!Number.isInteger(productId)) {
      return NextResponse.json({ error: "Producto inválido" }, { status: 400 });
    }

    const { data: product, error: pErr } = await supabase
      .from("products")
      .select("id, name, image_url")
      .eq("id", productId)
      .single();

    if (pErr || !product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    await clearHeroSortForSlot(supabase, slot);
    await supabase
      .from("products")
      .update({ hero_sort: null })
      .eq("hero_sort", slot)
      .neq("id", productId);

    const { error } = await supabase.from("hero_slots").upsert({
      slot,
      kind: "product",
      product_id: productId,
      image_url: product.image_url,
      caption: product.name,
      alt_text: product.name,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("products").update({ hero_sort: slot }).eq("id", productId);
    return NextResponse.json({ ok: true, slot, kind: "product" });
  }

  if (kind === "custom") {
    const imageUrl = String(body.image_url || "").trim();
    if (!imageUrl) {
      return NextResponse.json({ error: "Sube una imagen primero" }, { status: 400 });
    }

    const caption = body.caption ? String(body.caption).trim() : null;
    const altText = body.alt_text
      ? String(body.alt_text).trim()
      : caption || "Dulces Antojos";

    await clearHeroSortForSlot(supabase, slot);

    const { error } = await supabase.from("hero_slots").upsert({
      slot,
      kind: "custom",
      product_id: null,
      image_url: imageUrl,
      caption,
      alt_text: altText,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, slot, kind: "custom" });
  }

  await clearHeroSortForSlot(supabase, slot);

  const { error } = await supabase.from("hero_slots").upsert({
    slot,
    kind: "empty",
    product_id: null,
    image_url: null,
    caption: null,
    alt_text: null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, slot, kind: "empty" });
}
