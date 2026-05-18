"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useShopMode, type ShopMode } from "@/context/ShopModeContext";

const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER;

function ModeToggle({
  mode,
  onChange,
}: {
  mode: ShopMode;
  onChange: (m: ShopMode) => void;
}) {
  return (
    <div className="flex max-w-[45vw] items-center gap-[3px] rounded-md border border-border bg-card p-[3px] sm:max-w-none">
      <button
        type="button"
        onClick={() => onChange("pasteleria")}
        className={`rounded px-4 py-1.5 font-outfit text-[0.78rem] font-semibold uppercase tracking-wider transition ${
          mode === "pasteleria"
            ? "bg-gold text-black"
            : "bg-transparent text-gray hover:text-white"
        }`}
      >
        🎂 Pastelería
      </button>
      <button
        type="button"
        onClick={() => onChange("shop")}
        className={`rounded px-4 py-1.5 font-outfit text-[0.78rem] font-semibold uppercase tracking-wider transition ${
          mode === "shop"
            ? "bg-gold text-black"
            : "bg-transparent text-gray hover:text-white"
        }`}
      >
        📦 Shop Cajas
      </button>
    </div>
  );
}

export default function Navbar() {
  const { itemCount, openCart } = useCart();
  const { mode, setMode, scrollToCatalog } = useShopMode();

  function handleModeChange(next: ShopMode) {
    setMode(next);
    scrollToCatalog();
  }

  return (
    <header className="fixed top-0 z-[600] flex h-[68px] w-full items-center justify-between border-b border-gold/10 bg-black/[0.97] px-[5%] backdrop-blur-xl">
      <Link
        href="/"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="flex cursor-pointer flex-col leading-none"
      >
        <span className="font-bebas text-xl tracking-widest text-white">
          DULCES
        </span>
        <span className="font-script -mt-0.5 text-[1.45rem] leading-[0.9] text-gold">
          Antojos
        </span>
      </Link>

      <ModeToggle mode={mode} onChange={handleModeChange} />

      <div className="flex items-center gap-3 sm:gap-4">
        {waNumber && (
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Hola! Quiero consultar sobre Dulces Antojos 🎂")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded border border-wa/30 px-3.5 py-2 font-outfit text-[0.75rem] font-semibold uppercase tracking-wider text-wa transition hover:border-wa hover:bg-wa/10 sm:flex"
          >
            <WhatsAppIcon />
            WhatsApp
          </a>
        )}
        <button
          type="button"
          onClick={openCart}
          className="flex items-center gap-2 rounded bg-gold px-4 py-2 font-outfit text-[0.8rem] font-bold uppercase tracking-wider text-black transition hover:bg-gold-light sm:px-5"
        >
          🛒 Carrito
          <span className="flex h-[19px] w-[19px] items-center justify-center rounded-full bg-black text-[0.7rem] font-bold text-gold">
            {itemCount}
          </span>
        </button>
      </div>
    </header>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
