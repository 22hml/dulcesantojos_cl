import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const token = env.match(/^MP_ACCESS_TOKEN=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");

async function create(extra = {}) {
  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      items: [
        {
          id: "1",
          title: "Torta prueba",
          quantity: 1,
          unit_price: 15000,
          currency_id: "CLP",
        },
      ],
      back_urls: {
        success: "https://dulcesantojos.cl/pedido/success",
        failure: "https://dulcesantojos.cl/pedido/failure",
        pending: "https://dulcesantojos.cl/pedido/pending",
      },
      ...extra,
    }),
  });
  const data = await res.json();
  const get = await fetch(
    `https://api.mercadopago.com/checkout/preferences/${data.id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const pref = await get.json();
  return { data, pref };
}

const a = await create();
console.log("default excluded:", a.pref.payment_methods);

const b = await create({
  payment_methods: {
    excluded_payment_methods: [],
    excluded_payment_types: [],
    installments: 12,
  },
});
console.log("explicit empty excluded:", b.pref.payment_methods);
console.log("sandbox:", b.data.sandbox_init_point);
