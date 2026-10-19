export const SITE_URL = "https://dulcesantojos.cl";

export const BUSINESS = {
  name: "Dulces Antojos",
  telephone: "+56948493088",
  foundingDate: "2015",
  priceRange: "$$",
  paymentAccepted: "Mercado Pago",
  instagram: [
    "https://www.instagram.com/dulcesantojos_cl",
    "https://www.instagram.com/dulcesantojosshop",
  ],
  address: {
    addressLocality: "Santiago",
    addressRegion: "Región Metropolitana",
    addressCountry: "CL",
  },
  areaServed: "Chile",
  image: `${SITE_URL}/og-image.jpeg`,
};

export function buildBakeryJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: BUSINESS.name,
    url: SITE_URL,
    image: BUSINESS.image,
    telephone: BUSINESS.telephone,
    foundingDate: BUSINESS.foundingDate,
    priceRange: BUSINESS.priceRange,
    address: {
      "@type": "PostalAddress",
      ...BUSINESS.address,
    },
    areaServed: BUSINESS.areaServed,
    paymentAccepted: BUSINESS.paymentAccepted,
    sameAs: BUSINESS.instagram,
  };
}
