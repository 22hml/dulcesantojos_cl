import Link from "next/link";

type Props = {
  searchParams: {
    external_reference?: string;
    payment_id?: string;
    status?: string;
  };
};

export default function PedidoSuccessPage({ searchParams }: Props) {
  const orderId = searchParams.external_reference;
  const paymentId = searchParams.payment_id;

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
      {orderId && (
        <p className="mt-4 font-outfit text-sm text-gray">
          Pedido #{orderId}
          {paymentId ? ` · Pago ${paymentId}` : ""}
        </p>
      )}
      <p className="mt-2 font-outfit text-xs text-gray/80">
        Si el estado tarda unos segundos en actualizarse en el panel, es normal:
        Mercado Pago confirma por webhook.
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
