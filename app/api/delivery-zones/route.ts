import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json([]);
  }

  const supabase = createClient(url, key, {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("id, comuna, region, delivery_cost")
    .eq("active", true)
    .order("comuna");

  if (error) {
    console.error(error);
    return NextResponse.json([]);
  }

  return NextResponse.json(data ?? [], {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
