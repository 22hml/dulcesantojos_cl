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

/** Valor de data.id en la URL tal como lo firma Mercado Pago (query `data.id`). */
export function getMpWebhookDataIdFromUrl(req: Request): string | null {
  const url = new URL(req.url);
  const raw =
    url.searchParams.get("data.id") ?? url.searchParams.get("data_id");
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}

/** Manifest HMAC según documentación oficial de Mercado Pago. */
export function buildMpWebhookManifest(
  dataId: string | null,
  requestId: string | null,
  ts: string
): string {
  let manifest = "";
  if (dataId) {
    manifest += `id:${dataId.toLowerCase()};`;
  }
  if (requestId) {
    manifest += `request-id:${requestId};`;
  }
  manifest += `ts:${ts};`;
  return manifest;
}

/** Valida x-signature de Mercado Pago (opcional si hay MP_WEBHOOK_SECRET). */
export function verifyMpWebhookSignature(req: Request): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET?.trim();
  if (!secret) return true;

  const xSignature = req.headers.get("x-signature")?.trim();
  if (!xSignature) return false;

  const xRequestId = req.headers.get("x-request-id")?.trim() || null;

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const eq = p.indexOf("=");
      if (eq === -1) return [p.trim(), ""];
      return [p.slice(0, eq).trim(), p.slice(eq + 1).trim()];
    })
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const dataId = getMpWebhookDataIdFromUrl(req);
  const manifest = buildMpWebhookManifest(dataId, xRequestId, ts);
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
  const queryDataId = getMpWebhookDataIdFromUrl(req);
  const legacyId = url.searchParams.get("id");

  const queryId = queryDataId || legacyId;

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

  if (
    body?.action?.startsWith("payment.") &&
    body.data?.id != null
  ) {
    return String(body.data.id);
  }

  return null;
}
