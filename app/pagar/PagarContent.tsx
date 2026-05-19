"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import MpWalletCheckout from "@/components/MpWalletCheckout";

const useSandbox =
  process.env.NEXT_PUBLIC_MP_USE_SANDBOX === "true" ||
  process.env.NEXT_PUBLIC_MP_USE_SANDBOX === "1";

export default function PagarContent() {
  const params = useSearchParams();
  const prefId = params.get("pref_id")?.trim();
  const checkoutUrl = params.get("url")?.trim();

  // Producción con URL directa: redirigir al init_point sin pasar por Wallet
  useEffect(() => {
    if (!useSandbox && checkoutUrl) {
      window.location.replace(checkoutUrl);
    }
  }, [checkoutUrl]);

  if (!prefId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-theme px-4 text-center">
        <p className="font-outfit text-theme">Enlace de pago inválido.</p>
        <Link href="/" className="text-gold underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  if (!useSandbox && checkoutUrl) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-theme px-4 text-center">
        <p className="font-outfit text-theme-muted">
          Redirigiendo a Mercado Pago…
        </p>
        <a href={checkoutUrl} className="text-gold underline">
          Si no avanza, haz clic aquí
        </a>
      </div>
    );
  }

  const mpLink = useSandbox
    ? `https://sandbox.mercadopago.cl/checkout/v1/redirect?pref_id=${encodeURIComponent(prefId)}`
    : `https://www.mercadopago.cl/checkout/v1/redirect?pref_id=${encodeURIComponent(prefId)}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-theme px-4 py-12">
      <h1 className="font-bebas text-3xl tracking-wide text-theme">
        Finalizar pago
      </h1>
      <p className="mt-2 max-w-lg text-center font-outfit text-sm text-theme-muted">
        {useSandbox ? (
          <>
            Modo prueba: usa incógnito y una cuenta comprador de prueba en
            Mercado Pago.
          </>
        ) : (
          <>Pago seguro con Mercado Pago.</>
        )}
      </p>

      <div className="mt-8 w-full max-w-md">
        <MpWalletCheckout preferenceId={prefId} />
      </div>

      <p className="mt-6 font-outfit text-xs text-theme-muted">
        Si el botón no carga,{" "}
        <a
          href={mpLink}
          className="text-gold underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          abrir checkout en Mercado Pago
        </a>
        .
      </p>

      <Link
        href="/"
        className="mt-8 font-outfit text-sm text-theme-muted underline hover:text-gold"
      >
        Cancelar y volver
      </Link>
    </div>
  );
}
