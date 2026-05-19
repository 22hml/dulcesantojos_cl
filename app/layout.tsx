import type { Metadata } from "next";
import { CartProvider } from "@/context/CartContext";
import { ShopModeProvider } from "@/context/ShopModeContext";
import { ThemeProvider } from "@/context/ThemeContext";
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
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <body className="font-outfit antialiased bg-theme-base text-theme">
        <ThemeProvider>
          <ShopModeProvider>
            <CartProvider>{children}</CartProvider>
          </ShopModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
