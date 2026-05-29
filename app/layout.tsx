import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { CartProvider } from "@/context/CartContext";
import { ShopModeProvider } from "@/context/ShopModeContext";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dulces Antojos - Pastelería & Shop | Santiago, Chile",
  description:
    "Tu celebración merece lo mejor. Pastelería con despacho en Santiago y regiones. Cajas de torta premium para reposteras. Paga con Mercado Pago.",
  keywords: [
    "pasteleria santiago",
    "tortas santiago",
    "cheesecake",
    "cajas torta",
    "reposteria chile",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/logo.png",
  },
  openGraph: {
    title: "Dulces Antojos",
    description: "Pastelería desde 2015. Despacho en Santiago y regiones.",
    url: "https://dulcesantojos.cl",
    siteName: "Dulces Antojos",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: "/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "Dulces Antojos — Pastelería desde 2015",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dulces Antojos",
    description: "Pastelería desde 2015. Despacho en Santiago y regiones.",
    images: ["/og-image.jpeg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <body className="font-outfit antialiased bg-theme-base text-theme">
        <ThemeProvider>
          <ShopModeProvider>
            <CartProvider>{children}</CartProvider>
          </ShopModeProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
