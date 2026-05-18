import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.type !== "payment" || !body.data?.id) {
      return new Response("OK", { status: 200 });
    }

    const paymentId = body.data.id;
    const res = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    if (!res.ok) {
      return new Response("OK", { status: 200 });
    }

    const payment = await res.json();

    if (payment.status === "approved" && payment.external_reference) {
      const supabase = createAdminClient();
      await supabase
        .from("orders")
        .update({
          status: "paid",
          mp_payment_id: String(paymentId),
        })
        .eq("id", Number(payment.external_reference))
        .eq("status", "pending");
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("OK", { status: 200 });
  }
}
