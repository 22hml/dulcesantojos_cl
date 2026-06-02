import { fetchMpPayment } from "@/lib/mp-payment";
import { sendOrderPaidEmails } from "@/lib/order-email";
import { serviceGetOrder, serviceRpc } from "@/lib/supabase-service";

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

  let wasAlreadyPaid = false;
  try {
    const currentOrder = await serviceGetOrder(orderId);
    wasAlreadyPaid = currentOrder?.status === "paid";
  } catch (e) {
    console.warn("No se pudo leer estado previo del pedido:", e);
  }

  try {
    const markResult = await serviceRpc<boolean | null>("mark_order_paid", {
      p_order_id: orderId,
      p_payment_id: String(paymentId),
    });
    await serviceRpc<boolean>("redeem_coupon_for_order", {
      p_order_id: orderId,
    });

    const shouldSendEmails = markResult === true || (!markResult && !wasAlreadyPaid);
    if (shouldSendEmails) {
      try {
        const paidOrder = await serviceGetOrder(orderId);
        if (paidOrder?.status === "paid") {
          await sendOrderPaidEmails(paidOrder, String(paymentId));
        }
      } catch (emailError) {
        console.error("No se pudieron enviar correos del pedido:", emailError);
      }
    }

    return { ok: true, orderId };
  } catch (e) {
    console.error("mark_order_paid:", e);
    return { ok: false };
  }
}
