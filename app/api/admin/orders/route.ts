import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET() {
  if (!isAdminSession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  if (!isAdminSession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id, status } = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
