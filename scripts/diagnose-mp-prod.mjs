import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.+)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
};

const token = get("MP_ACCESS_TOKEN");
const pub = get("NEXT_PUBLIC_MP_PUBLIC_KEY");
const prefId =
  process.argv[2] || "3034480589-b6a1f5a6-45da-4edf-91d7-8cc9a079f2d7";

console.log("=== Credenciales ===");
console.log("MP_ACCESS_TOKEN:", token ? `${token.slice(0, 15)}... len=${token.length}` : "FALTA");
console.log("PUBLIC_KEY:", pub ? `${pub.slice(0, 15)}... len=${pub.length}` : "FALTA");
console.log("MP_USE_SANDBOX:", get("MP_USE_SANDBOX") || "(no definido = producción)");
console.log("APP_URL:", get("NEXT_PUBLIC_APP_URL"));

if (token && pub && token === pub) {
  console.log("⚠️  Token y Public Key son IGUALES — probable error de copia");
}
if (token && pub && token.slice(0, 20) === pub.slice(0, 20)) {
  console.log("⚠️  Token y Public Key parecen el mismo tipo de credencial");
}

console.log("\n=== Preferencia ===");
const pr = await fetch(
  `https://api.mercadopago.com/checkout/preferences/${prefId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const pref = await pr.json();
console.log("GET preference:", pr.status);
if (pr.ok) {
  console.log("site_id:", pref.site_id);
  console.log("collector_id:", pref.collector_id);
  console.log("init_point:", pref.init_point);
  console.log("sandbox_init_point:", pref.sandbox_init_point || "(ninguno)");
  console.log("back_urls:", JSON.stringify(pref.back_urls));
  console.log("notification_url:", pref.notification_url);
  console.log("items:", pref.items);
} else {
  console.log(JSON.stringify(pref, null, 2));
}

console.log("\n=== Cuenta (users/me) ===");
const me = await fetch("https://api.mercadopago.com/users/me", {
  headers: { Authorization: `Bearer ${token}` },
});
const user = await me.json();
console.log("status:", me.status);
if (me.ok) {
  console.log("user_id:", user.id);
  console.log("site_id:", user.site_id);
  console.log("nickname:", user.nickname);
  console.log("status:", user.status);
} else {
  console.log(user);
}

console.log("\n=== Crear preferencia de prueba (producción) ===");
const create = await fetch("https://api.mercadopago.com/checkout/preferences", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    items: [
      {
        id: "test",
        title: "Diagnóstico Dulces Antojos",
        quantity: 1,
        unit_price: 1000,
        currency_id: "CLP",
      },
    ],
    back_urls: {
      success: `${get("NEXT_PUBLIC_APP_URL")}/pedido/success`,
      failure: `${get("NEXT_PUBLIC_APP_URL")}/pedido/failure`,
      pending: `${get("NEXT_PUBLIC_APP_URL")}/pedido/pending`,
    },
    auto_return: "approved",
    notification_url: `${get("NEXT_PUBLIC_APP_URL")}/api/webhook`,
  }),
});
const created = await create.json();
console.log("CREATE:", create.status);
if (create.ok) {
  console.log("id:", created.id);
  console.log("init_point:", created.init_point);
  console.log("Tiene sandbox_init_point:", !!created.sandbox_init_point);
  if (created.sandbox_init_point) {
    console.log(
      "⚠️  La API devolvió sandbox_init_point — el Access Token podría ser de PRUEBA, no producción"
    );
  }
} else {
  console.log(JSON.stringify(created, null, 2));
}
