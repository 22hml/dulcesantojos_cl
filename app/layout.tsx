import type { Metadata } from "next";
import { Bebas_Neue, Dancing_Script, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CartProvider } from "@/context/CartContext";
import { ShopModeProvider } from "@/context/ShopModeContext";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dulcesantojos.cl"),
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
    icon: [{ url: "/logo.png", type: "image/png", sizes: "512x512" }],
    apple: "/apple-touch-icon.png",
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
    <html
      lang="es"
      data-theme="dark"
      className={`${outfit.variable} ${bebasNeue.variable} ${dancingScript.variable}`}
      suppressHydrationWarning
    >
      <body className="font-outfit antialiased bg-theme-base text-theme">
        <ThemeProvider>
          <ShopModeProvider>
            <CartProvider>{children}</CartProvider>
          </ShopModeProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
