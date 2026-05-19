import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.+)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
};

const token = get("MP_ACCESS_TOKEN");
if (!token) {
  console.error("Falta MP_ACCESS_TOKEN");
  process.exit(1);
}

const body = {
  items: [
    {
      id: "test",
      title: "Test Dulces Antojos",
      quantity: 1,
      unit_price: 1000,
      currency_id: "CLP",
    },
  ],
  back_urls: {
    success: "http://localhost:3000/pedido/success",
    failure: "http://localhost:3000/pedido/failure",
    pending: "http://localhost:3000/pedido/pending",
  },
};

const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(body),
});

const data = await res.json();
console.log("HTTP", res.status);
if (!res.ok) {
  console.log("Error:", JSON.stringify(data, null, 2));
} else {
  console.log("OK preference id:", data.id);
  console.log("sandbox_init_point:", data.sandbox_init_point ? "sí" : "no");
}
