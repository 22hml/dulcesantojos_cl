import type { Metadata } from "next";
import { CartProvider } from "@/context/CartContext";
import { ShopModeProvider } from "@/context/ShopModeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dulces Antojos — Pastelería & Shop",
  description:
    "Tortas, cheesecakes, postres y cajas premium para reposteras. Despacho en Santiago.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-outfit antialiased bg-black text-white">
        <ShopModeProvider>
          <CartProvider>{children}</CartProvider>
        </ShopModeProvider>
      </body>
    </html>
  );
}
