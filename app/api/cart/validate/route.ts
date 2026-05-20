import { NextResponse } from "next/server";
import {
  buildStockValidation,
  formatStockIssuesMessage,
  type CartStockLine,
} from "@/lib/cart-stock";
import { serviceGetProductsByIds } from "@/lib/supabase-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const lines = (body.items ?? []) as CartStockLine[];

    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }

    const ids = lines.map((l) => l.id).filter((id) => Number.isInteger(id));
    const products = await serviceGetProductsByIds(ids);
    const result = buildStockValidation(lines, products);

    return NextResponse.json({
      ok: result.ok,
      issues: result.issues,
      message: formatStockIssuesMessage(result.issues),
      products: result.productsById,
    });
  } catch (err) {
    console.error("cart/validate:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al validar stock" },
      { status: 500 }
    );
  }
}
