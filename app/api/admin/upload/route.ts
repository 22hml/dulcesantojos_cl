import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  if (!isAdminSession()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No hay archivo" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from("products")
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message +
          ". Crea el bucket público 'products' en Supabase Storage.",
      },
      { status: 500 }
    );
  }

  const { data } = supabase.storage.from("products").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}
