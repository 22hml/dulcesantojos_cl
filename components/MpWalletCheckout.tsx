"use client";

import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { useEffect, useState } from "react";

const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.trim() || "";

type Props = {
  preferenceId: string;
};

export default function MpWalletCheckout({ preferenceId }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!publicKey) return;
    initMercadoPago(publicKey, { locale: "es-CL" });
    setReady(true);
  }, []);

  if (!publicKey) {
    return (
      <p className="font-outfit text-sm text-red-400">
        Falta <code className="text-gold">NEXT_PUBLIC_MP_PUBLIC_KEY</code> en
        .env.local (misma app: Public Key de producción en Mercado Pago).
      </p>
    );
  }

  if (!ready) {
    return (
      <p className="font-outfit text-sm text-theme-muted">
        Cargando botón de Mercado Pago…
      </p>
    );
  }

  return (
    <div className="mp-wallet-wrap min-h-[48px] w-full max-w-md">
      <Wallet initialization={{ preferenceId }} />
    </div>
  );
}
