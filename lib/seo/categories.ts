import type { Product } from "@/types";
import type { ShopMode } from "@/context/ShopModeContext";

export type CategorySlug =
  | "cajas-para-tortas"
  | "cintas-para-tortas"
  | "impresion-comestible"
  | "toppers"
  | "talleres"
  | "tortas";

export type CategoryPageView = {
  slug: CategorySlug;
  mode: ShopMode;
  title: string;
  description: string;
  h1: string;
  h1Em?: string;
  label: string;
  intro: string;
};

type CategoryPageConfig = CategoryPageView & {
  matchProduct: (product: Product) => boolean;
};

function norm(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function categoryIncludes(product: Product, ...needles: string[]) {
  const cat = norm(product.category || "");
  const name = norm(product.name || "");
  return needles.some((n) => cat.includes(norm(n)) || name.includes(norm(n)));
}

export const CATEGORY_PAGES: CategoryPageConfig[] = [
  {
    slug: "cajas-para-tortas",
    mode: "shop",
    label: "Dulces Antojos Shop",
    title: "Cajas para tortas por mayor en Santiago | Dulces Antojos",
    description:
      "Cajas para tortas premium en Santiago: cartón, visor y packs mayoristas. Despacho RM y regiones. Cotiza por WhatsApp.",
    h1: "CAJAS PARA TORTAS",
    h1Em: "por mayor",
    intro:
      "Cajas de cartón premium para pastelerías y reposteras en Santiago. Venta por unidad y al por mayor, con despacho en la Región Metropolitana y envíos a regiones.",
    matchProduct: (p) =>
      p.mode === "shop" &&
      (categoryIncludes(p, "carton", "cartón", "visor", "pack", "caja", "cajas") ||
        categoryIncludes(p, "caja feliz")),
  },
  {
    slug: "cintas-para-tortas",
    mode: "shop",
    label: "Dulces Antojos Shop",
    title: "Cintas para tortas en Santiago | Dulces Antojos Shop",
    description:
      "Cintas decorativas para tortas y repostería en Santiago. Compra online con Mercado Pago y despacho a domicilio.",
    h1: "CINTAS PARA TORTAS",
    h1Em: "decoración",
    intro:
      "Cintas y detalles para terminaciones de tortas y pasteles. Ideal para reposteras y pastelerías en Santiago que buscan un acabado prolijo.",
    matchProduct: (p) => p.mode === "shop" && categoryIncludes(p, "cinta", "cintas", "ribbon"),
  },
  {
    slug: "impresion-comestible",
    mode: "shop",
    label: "Dulces Antojos Shop",
    title: "Impresión comestible para tortas en Santiago | Dulces Antojos",
    description:
      "Impresión comestible en lámina de azúcar y arroz para tortas. Lista en 24 h. Despacho Santiago y regiones.",
    h1: "IMPRESIÓN COMESTIBLE",
    h1Em: "para tortas",
    intro:
      "Imprimimos tus diseños en lámina comestible de azúcar o arroz para tortas, cupcakes y galletas. Pedidos con anticipación para celebraciones en Santiago y todo Chile.",
    matchProduct: (p) =>
      p.mode === "shop" &&
      categoryIncludes(
        p,
        "impresion",
        "impresión",
        "comestible",
        "azucar",
        "azúcar",
        "arroz",
        "wafer"
      ),
  },
  {
    slug: "toppers",
    mode: "shop",
    label: "Dulces Antojos Shop",
    title: "Toppers para tortas en Santiago | Dulces Antojos",
    description:
      "Toppers y adornos para tortas personalizados. Compra en Dulces Antojos Shop con despacho en Santiago.",
    h1: "TOPPERS",
    h1Em: "para tortas",
    intro:
      "Toppers y adornos para dar el toque final a tus tortas. Encuentra opciones listas para usar o personalizar según tu celebración.",
    matchProduct: (p) => p.mode === "shop" && categoryIncludes(p, "topper", "toppers"),
  },
  {
    slug: "talleres",
    mode: "shop",
    label: "Dulces Antojos Shop",
    title: "Talleres de repostería online | Dulces Antojos",
    description:
      "Talleres y cursos de repostería online con Dulces Antojos. Aprende técnicas para tortas y decoración.",
    h1: "TALLERES",
    h1Em: "de repostería",
    intro:
      "Talleres y experiencias de repostería para aprender en casa. Revisa fechas, modalidad y materiales según cada curso.",
    matchProduct: (p) => p.mode === "shop" && categoryIncludes(p, "taller", "talleres", "curso"),
  },
  {
    slug: "tortas",
    mode: "pasteleria",
    label: "Pastelería",
    title: "Tortas a domicilio en Santiago | Dulces Antojos",
    description:
      "Tortas y postres artesanales con despacho en Santiago y regiones. Pide online y paga con Mercado Pago.",
    h1: "TORTAS",
    h1Em: "a domicilio",
    intro:
      "Tortas y postres para celebrar en casa u oficina. Despacho en Santiago y envíos a regiones según disponibilidad.",
    matchProduct: (p) =>
      p.mode === "pasteleria" &&
      categoryIncludes(p, "torta", "tortas", "cheesecake", "postre", "brownie"),
  },
];

const bySlug = new Map(CATEGORY_PAGES.map((c) => [c.slug, c]));

export function getCategoryPage(slug: string): CategoryPageConfig | undefined {
  return bySlug.get(slug as CategorySlug);
}

export function getCategoryPageView(slug: string): CategoryPageView | undefined {
  const page = getCategoryPage(slug);
  if (!page) return undefined;
  return {
    slug: page.slug,
    mode: page.mode,
    title: page.title,
    description: page.description,
    h1: page.h1,
    h1Em: page.h1Em,
    label: page.label,
    intro: page.intro,
  };
}

export function getAllCategorySlugs(): CategorySlug[] {
  return CATEGORY_PAGES.map((c) => c.slug);
}

/** Enlaza nombres de categoría del catálogo a una URL SEO cuando existe. */
export function getCategorySlugForLabel(label: string): CategorySlug | null {
  if (label === "Todos") return null;
  const n = norm(label);
  if (["carton", "cartón", "visor", "pack", "caja", "cajas"].some((x) => n.includes(norm(x)))) {
    return "cajas-para-tortas";
  }
  if (n.includes("cinta")) return "cintas-para-tortas";
  if (["impres", "comestible", "azucar", "azúcar", "arroz", "wafer"].some((x) => n.includes(norm(x)))) {
    return "impresion-comestible";
  }
  if (n.includes("topper")) return "toppers";
  if (n.includes("taller") || n.includes("curso")) return "talleres";
  if (["torta", "cheesecake", "brownie", "postre"].some((x) => n.includes(x))) {
    return "tortas";
  }
  return null;
}

export function filterProductsForCategory(
  products: Product[],
  config: CategoryPageConfig
): Product[] {
  return products.filter(config.matchProduct);
}

export function categorySlugsWithProducts(products: Product[]): CategorySlug[] {
  return CATEGORY_PAGES.filter(
    (page) => filterProductsForCategory(products, page).length > 0
  ).map((p) => p.slug);
}
