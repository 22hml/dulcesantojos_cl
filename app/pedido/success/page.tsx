import Link from "next/link";

export default function PedidoSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center">
      <span className="text-6xl">✅</span>
      <h1 className="mt-4 font-bebas text-4xl tracking-wide text-white">
        ¡PAGO RECIBIDO!
      </h1>
      <p className="mt-2 max-w-md text-gray">
        Gracias por tu pedido. Te contactaremos por WhatsApp para coordinar la
        entrega o el retiro.
      </p>
      <Link
        href="/"
        className="mt-8 rounded bg-gold px-8 py-3 font-outfit text-sm font-bold uppercase tracking-widest text-black hover:bg-gold-light"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
