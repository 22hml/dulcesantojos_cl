import OrderWhatsAppPrompt from "@/components/OrderWhatsAppPrompt";
import { buildOrderWhatsAppUrl } from "@/lib/order-whatsapp";
import { serviceGetOrder } from "@/lib/supabase-service";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: {
    external_reference?: string;
    payment_id?: string;
    status?: string;
  };
};

export default async function PedidoSuccessPage({ searchParams }: Props) {
  const orderIdStr = searchParams.external_reference;
  const paymentId = searchParams.payment_id;

  let whatsappUrl: string | null = null;

  if (orderIdStr) {
    const id = parseInt(orderIdStr, 10);
    if (!Number.isNaN(id)) {
      try {
        const order = await serviceGetOrder(id);
        if (order) {
          const items = Array.isArray(order.items) ? order.items : [];
          whatsappUrl = buildOrderWhatsAppUrl(
            { ...order, id: order.id, items },
            { mercadoPago: true, paymentId }
          );
        }
      } catch (e) {
        console.error("pedido/success:", e);
      }
    }
  }

  return (
    <OrderWhatsAppPrompt
      variant="success"
      whatsappUrl={whatsappUrl}
      orderId={orderIdStr}
      paymentId={paymentId}
    />
  );
}
