type MpItem = {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
};

type CreatePreferenceInput = {
  orderId: number;
  items: MpItem[];
  backBase: string;
  useSandbox: boolean;
};

export type MpPreferenceResponse = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
  message?: string;
  error?: string;
  cause?: Array<{ code?: string; description?: string }>;
};

import { validateMpCredentialPair } from "@/lib/mp-credentials";

export function validateMpToken(): string {
  validateMpCredentialPair();
  const token = process.env.MP_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "Falta MP_ACCESS_TOKEN en .env.local (Credenciales de producción en mercadopago.cl)"
    );
  }
  if (token.startsWith("eyJ")) {
    throw new Error(
      "MP_ACCESS_TOKEN parece una clave de Supabase (JWT). Debe ser el Access Token de Mercado Pago (APP_USR-...)."
    );
  }
  if (token.length < 50) {
    throw new Error(
      `MP_ACCESS_TOKEN está incompleto (${token.length} caracteres). Copia el token completo desde Tus integraciones → Credenciales de producción.`
    );
  }
  return token;
}

export function formatMpError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const e = err as {
      message?: string;
      error?: string;
      cause?: Array<{ description?: string; code?: string }>;
    };
    if (e.cause?.length) {
      return e.cause
        .map((c) => c.description || c.code)
        .filter(Boolean)
        .join(" · ");
    }
    if (e.message) return e.message;
    if (e.error) return e.error;
    return JSON.stringify(err);
  }
  return "Error desconocido de Mercado Pago";
}

export async function createMercadoPagoPreference(
  input: CreatePreferenceInput
): Promise<MpPreferenceResponse> {
  const token = validateMpToken();
  const backBase = input.backBase.replace(/\/$/, "");
  const isLocalBack = backBase.includes("localhost") || backBase.includes("127.0.0.1");

  const body: Record<string, unknown> = {
    external_reference: String(input.orderId),
    items: input.items.map((i) => ({
      id: String(i.id),
      title: i.title.slice(0, 256),
      quantity: Math.max(1, Math.floor(i.quantity)),
      unit_price: Math.round(i.unit_price),
      currency_id: i.currency_id || "CLP",
    })),
    back_urls: {
      success: `${backBase}/pedido/success`,
      failure: `${backBase}/pedido/failure`,
      pending: `${backBase}/pedido/pending`,
    },
  };

  // Producción o dominio público: webhook + retorno automático
  if (!input.useSandbox || !isLocalBack) {
    body.auto_return = "approved";
    body.notification_url = `${backBase}/api/webhook`;
  }

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as MpPreferenceResponse;

  if (!res.ok) {
    const detail =
      data.cause?.map((c) => c.description).filter(Boolean).join(" · ") ||
      data.message ||
      data.error ||
      `HTTP ${res.status}`;
    throw new Error(detail);
  }

  if (!data.id) {
    throw new Error("Mercado Pago no devolvió id de preferencia");
  }

  return data;
}
