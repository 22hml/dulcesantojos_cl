"use client";

import { useShopMode } from "@/context/ShopModeContext";

export default function HeroSplit() {
  const { setMode, scrollToCatalog } = useShopMode();

  function goPasteleria() {
    setMode("pasteleria");
    scrollToCatalog();
  }

  function goShop() {
    setMode("shop");
    scrollToCatalog();
  }

  return (
    <section className="grid min-h-[calc(100vh-7rem)] grid-cols-1 border-b border-border pt-[7.5rem] md:min-h-screen md:pt-[68px] lg:grid-cols-2">
      <div
        role="button"
        tabIndex={0}
        onClick={goPasteleria}
        onKeyDown={(e) => e.key === "Enter" && goPasteleria()}
        className="group relative flex cursor-pointer flex-col justify-center overflow-hidden border-b border-border px-[8%] py-16 transition-colors hover:bg-white/[0.015] lg:border-b-0 lg:border-r"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_50%,rgba(232,168,32,0.07)_0%,transparent_70%)]" />
        <span className="relative z-[1] mb-8 inline-flex w-fit items-center gap-2 rounded-sm border border-gold/25 px-4 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-gold">
          Pastelería · Desde 2015
        </span>
        <span className="relative z-[1] mb-6 text-[5rem]">🎂</span>
        <div className="relative z-[1] mb-5">
          <span className="font-bebas block text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.9] tracking-wide text-white">
            DULCES
          </span>
          <span className="font-script block text-[clamp(2rem,4vw,3.5rem)] text-gold">
            Antojos
          </span>
        </div>
        <p className="relative z-[1] mb-8 max-w-[380px] text-[0.9rem] font-light leading-relaxed text-gray">
          Tortas, cheesecakes y postres artesanales preparados con amor. Despacho
          en Santiago o retiro en tienda.
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goPasteleria();
          }}
          className="relative z-[1] w-fit rounded bg-gold px-8 py-3.5 font-outfit text-[0.82rem] font-bold uppercase tracking-widest text-black transition hover:-translate-y-0.5 hover:bg-gold-light"
        >
          Ver tortas y postres →
        </button>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={goShop}
        onKeyDown={(e) => e.key === "Enter" && goShop()}
        className="group relative flex cursor-pointer flex-col justify-center overflow-hidden px-[8%] py-16 transition-colors hover:bg-white/[0.015]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_70%_50%,rgba(232,168,32,0.05)_0%,transparent_70%)]" />
        <span className="relative z-[1] mb-8 inline-flex w-fit items-center gap-2 rounded-sm border border-gold/25 px-4 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-gold">
          Shop · Packaging Artesanal
        </span>
        <span className="relative z-[1] mb-6 text-[5rem]">📦</span>
        <div className="relative z-[1] mb-5">
          <span className="font-bebas block text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.9] tracking-wide text-white">
            SHOP
          </span>
          <span className="font-script block text-[clamp(2rem,4vw,3.5rem)] text-gold">
            Cajas
          </span>
        </div>
        <p className="relative z-[1] mb-8 max-w-[380px] text-[0.9rem] font-light leading-relaxed text-gray">
          Cajas de torta premium para reposteras y pastelerías. Diferentes
          tamaños y estilos. Venta por unidad y mayor.
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goShop();
          }}
          className="relative z-[1] w-fit rounded border border-gold/35 bg-transparent px-8 py-3.5 font-outfit text-[0.82rem] font-bold uppercase tracking-widest text-gold transition hover:-translate-y-0.5 hover:bg-gold/10"
        >
          Ver cajas →
        </button>
      </div>
    </section>
  );
}
