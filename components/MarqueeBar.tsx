const ITEMS = [
  "Tortas Artesanales",
  "Cheesecakes",
  "Brownies",
  "Cupcakes",
  "Postres",
  "Cajas Premium",
  "Packaging Repostería",
  "Venta por Mayor",
  "Despacho Santiago y regiones",
  "Mercado Pago",
];

export default function MarqueeBar() {
  const repeated = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];

  return (
    <div className="overflow-hidden bg-gold py-2.5">
      <div className="animate-marquee flex whitespace-nowrap">
        {repeated.map((text, i) => (
          <span
            key={`${text}-${i}`}
            className="px-8 font-bebas text-[0.95rem] tracking-[0.18em] text-black"
          >
            ✦ {text}
          </span>
        ))}
      </div>
    </div>
  );
}
