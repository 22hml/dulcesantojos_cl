const STEPS = [
  {
    num: "01",
    title: "Elige tus productos",
    desc: "Navega el catálogo de tortas, postres o cajas shop.",
  },
  {
    num: "02",
    title: "Despacho o retiro",
    desc: "Selecciona cómo recibir y paga con Mercado Pago.",
  },
  {
    num: "03",
    title: "Recibe tu pedido",
    desc: "Te avisamos cuando esté listo para despacho o retiro en tienda.",
  },
];

export default function HowItWorks() {
  return (
    <section className="border-t border-border bg-theme-base px-[4%] py-16 sm:px-[5%] sm:py-20">
      <div className="mx-auto max-w-5xl">
        <p className="mb-2 text-center text-[0.68rem] font-medium uppercase tracking-[0.2em] text-gold">
          Cómo funciona
        </p>
        <h2 className="mb-12 text-center font-bebas text-4xl tracking-wide text-theme sm:text-5xl">
          Pedir es simple
        </h2>
        <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step) => (
            <div key={step.num} className="text-center sm:text-left">
              <span className="font-bebas block text-[4rem] leading-none text-gold">
                {step.num}
              </span>
              <h3 className="mt-2 font-bebas text-xl tracking-wide text-theme">
                {step.title}
              </h3>
              <p className="mt-2 text-sm font-light leading-relaxed text-theme-muted">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
