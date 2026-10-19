import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import CartLayer from "@/components/CartLayer";
import CategoryCatalogSection from "@/components/CategoryCatalogSection";
import JsonLd from "@/components/JsonLd";
import { getHomeData } from "@/lib/home-data";
import {
  filterProductsForCategory,
  getAllCategorySlugs,
  getCategoryPage,
  getCategoryPageView,
} from "@/lib/seo/categories";
import { buildProductJsonLd } from "@/lib/seo/product-jsonld";

type Props = {
  params: { categorySlug: string };
};

export function generateStaticParams() {
  return getAllCategorySlugs().map((categorySlug) => ({ categorySlug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const config = getCategoryPage(params.categorySlug);
  if (!config) return {};

  return {
    title: config.title,
    description: config.description,
    alternates: { canonical: `/${config.slug}` },
    openGraph: {
      title: config.title,
      description: config.description,
      url: `/${config.slug}`,
    },
  };
}

export const revalidate = 120;

export default async function CategoryPage({ params }: Props) {
  const config = getCategoryPage(params.categorySlug);
  const view = getCategoryPageView(params.categorySlug);
  if (!config || !view) notFound();

  const { products, demoMode } = await getHomeData();
  const categoryProducts = filterProductsForCategory(products, config);
  const path = `/${view.slug}`;

  const productLd = categoryProducts.map((p) => buildProductJsonLd(p, path));

  return (
    <>
      {productLd.length > 0 && (
        <JsonLd data={productLd.length === 1 ? productLd[0] : productLd} />
      )}
      <Navbar />
      <main>
        <CategoryCatalogSection
          config={view}
          products={categoryProducts}
          demoMode={demoMode}
        />
      </main>
      <SiteFooter />
      <CartLayer />
    </>
  );
}
