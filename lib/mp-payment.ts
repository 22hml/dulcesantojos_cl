import { createHmac, timingSafeEqual } from "crypto";

export type MpPayment = {
  id: number;
  status: string;
  external_reference?: string;
  metadata?: Record<string, unknown>;
};

export async function fetchMpPayment(
  paymentId: string
): Promise<MpPayment | null> {
  const token = process.env.MP_ACCESS_TOKEN?.trim();
  if (!token) {
    console.error("MP_ACCESS_TOKEN no configurado");
    return null;
  }

  const res = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    console.error("fetchMpPayment", res.status, paymentId);
    return null;
  }

  return res.json() as Promise<MpPayment>;
}

/** Valida x-signature de Mercado Pago (opcional si hay MP_WEBHOOK_SECRET). */
export function verifyMpWebhookSignature(
  req: Request,
  dataId: string
): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET?.trim();
  if (!secret) return true;

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  if (!xSignature || !xRequestId) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v?.trim() ?? ""];
    })
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function extractPaymentIdFromWebhook(
  req: Request,
  body?: { type?: string; data?: { id?: string | number }; action?: string }
): string | null {
  const url = new URL(req.url);
  const topic = url.searchParams.get("topic") || url.searchParams.get("type");
  const queryId = url.searchParams.get("id") || url.searchParams.get("data.id");

  if (queryId) {
    if (
      topic &&
      topic !== "payment" &&
      !topic.startsWith("payment")
    ) {
      return null;
    }
    return String(queryId);
  }

  if (body?.type === "payment" && body.data?.id != null) {
    return String(body.data.id);
  }

  if (body?.action === "payment.updated" && body.data?.id != null) {
    return String(body.data.id);
  }

  return null;
}
