"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useCart } from "@/context/CartContext";

type Props = {
  variant: "success" | "pending";
  whatsappUrl: string | null;
  orderId?: string;
  paymentId?: string;
};

export default function OrderWhatsAppPrompt({
  variant,
  whatsappUrl: initialUrl,
  orderId,
  paymentId,
}: Props) {
  const [whatsappUrl, setWhatsappUrl] = useState(initialUrl);
  const [sentHint, setSentHint] = useState(false);
  const { clearCart } = useCart();

  useEffect(() => {
    if (variant === "success") {
      clearCart();
      try {
        sessionStorage.removeItem("dulcesantojos_mp_wa_url");
      } catch {
        /* ignore */
      }
    }
  }, [variant, clearCart]);

  useEffect(() => {
    if (initialUrl) return;
    try {
      const raw = sessionStorage.getItem("dulcesantojos_mp_wa_url");
      if (raw) setWhatsappUrl(raw);
    } catch {
      /* ignore */
    }
  }, [initialUrl]);

  const isSuccess = variant === "success";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-theme-base px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border-2 border-[#25D366]/40 bg-theme-elevated p-6 shadow-lg sm:p-8">
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="rounded-full bg-[#25D366]/15 px-3 py-1 font-outfit text-xs font-semibold uppercase tracking-wider text-[#25D366]">
              Paso obligatorio
            </span>
          </div>

          <div className="text-center">
            <span className="text-5xl">{isSuccess ? "✅" : "⏳"}</span>
            <h1 className="mt-3 font-bebas text-3xl tracking-wide text-theme sm:text-4xl">
              {isSuccess ? "¡PAGO RECIBIDO!" : "PAGO EN PROCESO"}
            </h1>
            {orderId && (
              <p className="mt-2 font-outfit text-sm text-gray">
                Pedido #{orderId}
                {paymentId ? ` · Pago ${paymentId}` : ""}
              </p>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 p-4 text-left">
            <p className="font-outfit text-sm font-semibold text-theme">
              {isSuccess
                ? "Confirma tu pedido por WhatsApp"
                : "Envía tu pedido por WhatsApp ahora"}
            </p>
            <p className="mt-2 font-outfit text-sm leading-relaxed text-gray">
              {isSuccess
                ? "Para coordinar la entrega o el retiro debes enviarnos el pedido por WhatsApp. Toca el botón, revisa el mensaje y pulsa Enviar."
                : "Mientras se confirma el pago, envíanos el detalle del pedido por WhatsApp para no perder tu compra."}
            </p>
          </div>

          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setSentHint(true)}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-[#25D366] px-6 py-4 font-outfit text-base font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#20bd5a] active:scale-[0.98]"
            >
              <WhatsAppIcon size={26} className="text-white" />
              Enviar pedido por WhatsApp
            </a>
          ) : (
            <p className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-outfit text-sm text-amber-800">
              No pudimos cargar el mensaje automático. Escríbenos por WhatsApp con tu
              número de pedido{orderId ? ` #${orderId}` : ""}.
            </p>
          )}

          {sentHint && (
            <p className="mt-3 text-center font-outfit text-xs text-[#25D366]">
              ¿Ya enviaste el mensaje? ¡Gracias! Te contactaremos pronto.
            </p>
          )}

          <p className="mt-4 text-center font-outfit text-xs text-gray/70">
            El mensaje ya incluye tus productos, dirección y total pagado.
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 block text-center font-outfit text-sm text-gray underline-offset-2 hover:text-theme hover:underline"
        >
          Volver al inicio
        </Link>

        {isSuccess && (
          <p className="mt-3 text-center font-outfit text-xs text-gray/60">
            El estado del pago puede tardar unos segundos en actualizarse en nuestro
            panel.
          </p>
        )}
      </div>
    </div>
  );
}