import type { Product } from "@/types";

export function getProductEmoji(product: Product): string {
  const cat = (product.category || "").toLowerCase();

  if (product.mode === "shop") {
    if (cat.includes("visor")) return "🪟";
    if (cat.includes("acetato")) return "🔲";
    if (cat.includes("pack")) return "📦";
    return "⬛";
  }

  if (cat.includes("torta")) return "🎂";
  if (cat.includes("cheesecake")) return "🍓";
  if (cat.includes("brownie")) return "🍫";
  if (cat.includes("cupcake")) return "🧁";
  if (cat.includes("postre") || cat.includes("pie")) return "🍋";
  return "🍰";
}

export function getStockStatus(stock: number): {
  label: string;
  className: string;
} {
  if (stock === 0) {
    return { label: "Sin stock", className: "bg-white/5 text-gray border border-border" };
  }
  if (stock <= 5) {
    return {
      label: `Últimas ${stock}`,
      className: "bg-red-500/10 text-[#E07070] border border-red-500/25",
    };
  }
  return {
    label: "Disponible",
    className: "bg-gold/10 text-gold border border-gold/25",
  };
}
