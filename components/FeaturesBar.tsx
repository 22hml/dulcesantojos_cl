const FEATURES = [
  {
    icon: "🛵",
    title: "Despacho a domicilio",
    desc: "Santiago mismo día. Costo fijo $2.990",
  },
  {
    icon: "🏪",
    title: "Retiro en tienda",
    desc: "Sin costo. Coordina por WhatsApp",
  },
  {
    icon: "💳",
    title: "Mercado Pago",
    desc: "Tarjeta, débito o transferencia",
  },
  {
    icon: "📦",
    title: "Venta al por mayor",
    desc: "Descuentos especiales para reposteras",
  },
];

export default function FeaturesBar() {
  return (
    <div className="grid grid-cols-1 border-y border-border sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map((f, i) => (
        <div
          key={f.title}
          className={`flex items-start gap-4 border-border p-7 transition-colors hover:bg-card ${
            i < FEATURES.length - 1 ? "border-b sm:border-b-0 sm:border-r" : ""
          } ${i === 1 ? "lg:border-r" : ""}`}
        >
          <span className="shrink-0 text-[1.7rem]">{f.icon}</span>
          <div>
            <h4 className="mb-1 text-[0.82rem] font-semibold tracking-wide text-theme">
              {f.title}
            </h4>
            <p className="text-[0.76rem] font-light leading-snug text-theme-muted">
              {f.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
