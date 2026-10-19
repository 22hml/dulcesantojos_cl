import type { MetadataRoute } from "next";
import { getHomeData } from "@/lib/home-data";
import { getAllCategorySlugs, categorySlugsWithProducts } from "@/lib/seo/categories";
import { SITE_URL } from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products } = await getHomeData();
  const activeSlugs = categorySlugsWithProducts(products);
  const allSlugs = getAllCategorySlugs();

  const categoryEntries = allSlugs.map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: activeSlugs.includes(slug) ? 0.8 : 0.5,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...categoryEntries,
  ];
}
