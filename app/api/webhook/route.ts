import {
  confirmOrderFromPayment,
} from "@/lib/mp-order";
import {
  extractPaymentIdFromWebhook,
  verifyMpWebhookSignature,
} from "@/lib/mp-payment";
import { serviceGetOrderByPaymentId } from "@/lib/supabase-service";

async function handleNotification(req: Request): Promise<Response> {
  let body: { type?: string; data?: { id?: string | number }; action?: string } =
    {};

  if (req.method === "POST") {
    try {
      body = await req.json();
    } catch {
      return new Response("OK", { status: 200 });
    }
  }

  const paymentId = extractPaymentIdFromWebhook(req, body);
  if (!paymentId) {
    return new Response("OK", { status: 200 });
  }

  if (!verifyMpWebhookSignature(req, paymentId)) {
    const paidOrder = await serviceGetOrderByPaymentId(paymentId);
    if (paidOrder?.status === "paid") {
      console.warn("Webhook MP: firma inválida duplicada ignorada", paymentId);
      return new Response("OK", { status: 200 });
    }

    console.error("Webhook MP: firma inválida", paymentId);
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await confirmOrderFromPayment(paymentId);
  if (result.ok && result.orderId) {
    console.log("Pedido pagado:", result.orderId, "pago:", paymentId);
  }

  return new Response("OK", { status: 200 });
}

export async function GET(req: Request) {
  return handleNotification(req);
}

export async function POST(req: Request) {
  return handleNotification(req);
}
