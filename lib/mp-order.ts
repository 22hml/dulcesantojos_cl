import { fetchMpPayment } from "@/lib/mp-payment";
import { serviceRpc } from "@/lib/supabase-service";

/** Confirma pedido si el pago está approved (idempotente, estilo goncy). */
export async function confirmOrderFromPayment(
  paymentId: string
): Promise<{ ok: boolean; orderId?: number; skipped?: boolean }> {
  const payment = await fetchMpPayment(paymentId);
  if (!payment) return { ok: false };

  if (payment.status !== "approved") {
    return { ok: true, skipped: true };
  }

  const orderId = Number(payment.external_reference);
  if (!orderId || Number.isNaN(orderId)) {
    console.error("Pago sin external_reference válido", paymentId);
    return { ok: false };
  }

  try {
    await serviceRpc("mark_order_paid", {
      p_order_id: orderId,
      p_payment_id: String(paymentId),
    });
    return { ok: true, orderId };
  } catch (e) {
    console.error("mark_order_paid:", e);
    return { ok: false };
  }
}
