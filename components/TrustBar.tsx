const ITEMS = [
  { icon: "🎂", label: "+8000 pedidos hechos" },
  { icon: "🏆", label: "+10 años de experiencia" },
  { icon: "🚚", label: "Despacho a regiones" },
  { icon: "🔒", label: "Pago seguro" },
];

export default function TrustBar() {
  return (
    <section
      className="border-y border-gold/10 bg-theme-elevated px-4 py-8 sm:px-6"
      aria-label="Señales de confianza"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-0">
        {ITEMS.map((item, i) => (
          <div
            key={item.label}
            className={`flex flex-col items-center text-center ${
              i < ITEMS.length - 1
                ? "sm:border-r sm:border-gold/15"
                : ""
            }`}
          >
            <span className="mb-2 text-3xl text-gold sm:text-[2rem]" aria-hidden>
              {item.icon}
            </span>
            <p className="max-w-[140px] text-[0.72rem] font-medium leading-snug text-theme sm:text-[0.78rem]">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
