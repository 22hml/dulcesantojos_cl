import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET() {
  if (!isAdminSession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("*")
    .order("comuna");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  if (!isAdminSession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("delivery_zones")
    .insert({
      comuna: body.comuna,
      region: body.region || "Región Metropolitana",
      delivery_cost: Number(body.delivery_cost),
      active: body.active !== false,
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
  const { id, ...fields } = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("delivery_zones")
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
  const { error } = await supabase
    .from("delivery_zones")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
