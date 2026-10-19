import { getDiscountedPrice, type Product } from "@/types";
import { SITE_URL } from "@/lib/seo/site";

export function buildProductJsonLd(product: Product, path: string) {
  const price = getDiscountedPrice(product);
  const url = `${SITE_URL}${path}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: product.image_url ? [product.image_url] : undefined,
    url,
    offers: {
      "@type": "Offer",
      price: price,
      priceCurrency: "CLP",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url,
    },
  };
}
