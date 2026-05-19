"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useShopMode, type ShopMode } from "@/context/ShopModeContext";
import { useTheme } from "@/context/ThemeContext";

const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER;

function ModeToggle({
  mode,
  onChange,
  className = "",
}: {
  mode: ShopMode;
  onChange: (m: ShopMode) => void;
  className?: string;
}) {
  return (
    <div
      className={`flex w-full items-stretch gap-1 rounded-md border border-theme bg-theme-card p-1 ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange("pasteleria")}
        className={`min-w-0 flex-1 rounded px-2 py-2 font-outfit text-[0.65rem] font-semibold uppercase leading-tight tracking-wide transition sm:px-3 sm:text-[0.72rem] ${
          mode === "pasteleria"
            ? "bg-gold text-black"
            : "bg-transparent text-theme-muted hover:text-theme"
        }`}
      >
        <span className="sm:hidden">🎂</span>
        <span className="hidden sm:inline">🎂 </span>
        Pastelería
      </button>
      <button
        type="button"
        onClick={() => onChange("shop")}
        className={`min-w-0 flex-1 rounded px-2 py-2 font-outfit text-[0.65rem] font-semibold uppercase leading-tight tracking-wide transition sm:px-3 sm:text-[0.72rem] ${
          mode === "shop"
            ? "bg-gold text-black"
            : "bg-transparent text-theme-muted hover:text-theme"
        }`}
      >
        <span className="sm:hidden">📦</span>
        <span className="hidden sm:inline">📦 </span>
        Shop
      </button>
    </div>
  );
}

export default function Navbar() {
  const { itemCount, openCart } = useCart();
  const { mode, setMode, scrollToCatalog } = useShopMode();
  const { theme, toggleTheme } = useTheme();

  function handleModeChange(next: ShopMode) {
    setMode(next);
    scrollToCatalog();
  }

  return (
    <header className="fixed top-0 z-[600] w-full border-b border-gold/10 bg-theme-nav backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:px-5 sm:py-0 sm:h-[68px]">
        <Link
          href="/"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="shrink-0 flex flex-col leading-none"
        >
          <span className="font-bebas text-lg tracking-widest text-theme sm:text-xl">
            DULCES
          </span>
          <span className="font-script -mt-0.5 text-xl leading-[0.9] text-gold sm:text-[1.45rem]">
            Antojos
          </span>
        </Link>

        <div className="hidden flex-1 justify-center px-4 md:flex md:max-w-md lg:max-w-lg">
          <ModeToggle mode={mode} onChange={handleModeChange} />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded border border-theme text-lg transition hover:border-gold"
            aria-label={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          {waNumber && (
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Hola! Quiero consultar sobre Dulces Antojos 🎂")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1 rounded border border-wa/30 px-2.5 py-2 font-outfit text-[0.7rem] font-semibold uppercase text-wa transition hover:border-wa hover:bg-wa/10 lg:flex"
            >
              WA
            </a>
          )}
          <button
            type="button"
            onClick={openCart}
            className="flex items-center gap-1.5 rounded bg-gold px-2.5 py-2 font-outfit text-[0.72rem] font-bold uppercase tracking-wide text-black transition hover:bg-gold-light sm:gap-2 sm:px-4 sm:text-[0.8rem]"
          >
            <span className="hidden xs:inline sm:inline">🛒</span>
            <span className="sm:hidden">🛒</span>
            <span className="hidden min-[380px]:inline">Carrito</span>
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black px-1 text-[0.65rem] font-bold text-gold">
              {itemCount}
            </span>
          </button>
        </div>
      </div>

      <div className="border-t border-theme px-3 pb-2 pt-2 md:hidden">
        <ModeToggle mode={mode} onChange={handleModeChange} />
      </div>
    </header>
  );
}
