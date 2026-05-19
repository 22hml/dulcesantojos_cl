import { readFileSync } from "fs";

const prefId = process.argv[2];
const env = readFileSync(".env.local", "utf8");
const token = env.match(/^MP_ACCESS_TOKEN=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");
if (!token) {
  console.error("Falta MP_ACCESS_TOKEN");
  process.exit(1);
}

const create = !prefId;
let id = prefId;

if (create) {
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
        success: "http://localhost:3000/pedido/success",
        failure: "http://localhost:3000/pedido/failure",
        pending: "http://localhost:3000/pedido/pending",
      },
    }),
  });
  const data = await res.json();
  console.log("CREATE", res.status);
  id = data.id;
  console.log("id:", id);
  console.log("init_point:", data.init_point);
  console.log("sandbox_init_point:", data.sandbox_init_point);
  console.log("warnings:", JSON.stringify(data.warnings, null, 2));
}

const get = await fetch(
  `https://api.mercadopago.com/checkout/preferences/${id}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const pref = await get.json();
console.log("\nGET", get.status);
console.log(JSON.stringify(pref, null, 2));
