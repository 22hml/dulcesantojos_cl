import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.+)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
};

function mpAppId(credential) {
  const parts = credential.trim().split("-");
  if (parts[0] !== "APP_USR" || !parts[1]) return null;
  return parts[1];
}

const token = get("MP_ACCESS_TOKEN");
const pub = get("NEXT_PUBLIC_MP_PUBLIC_KEY");
const prefId =
  process.argv[2] || "3034480589-b6a1f5a6-45da-4edf-91d7-8cc9a079f2d7";

const tokenApp = token ? mpAppId(token) : null;
const pubApp = pub ? mpAppId(pub) : null;

console.log("=== Credenciales ===");
console.log(
  "MP_ACCESS_TOKEN:",
  token ? `${token.slice(0, 15)}... len=${token.length}` : "FALTA"
);
console.log(
  "PUBLIC_KEY:",
  pub ? `${pub.slice(0, 15)}... len=${pub.length}` : "FALTA"
);
console.log("ID aplicación (token):", tokenApp || "no detectado");
console.log("ID aplicación (public key):", pubApp || "no detectado");
console.log("MP_USE_SANDBOX:", get("MP_USE_SANDBOX") || "(no definido = producción)");
console.log("APP_URL:", get("NEXT_PUBLIC_APP_URL"));

console.log("\n=== Diagnóstico ===");
let ok = true;

if (tokenApp && pubApp && tokenApp !== pubApp) {
  console.log(
    "❌ CRÍTICO: Token y Public Key son de APPS DISTINTAS.",
    `\n   Token → app ${tokenApp}`,
    `\n   Public Key → app ${pubApp}`,
    "\n   → Pantalla en blanco en checkout. Copia AMBAS credenciales",
    "\n     desde la MISMA aplicación en mercadopago.cl/developers/panel/app",
    "\n     → Credenciales de producción (misma pestaña)."
  );
  ok = false;
} else if (tokenApp && pubApp) {
  console.log("✅ Token y Public Key son de la misma aplicación:", tokenApp);
}

if (pub && pub.length < 40) {
  console.log("❌ Public Key muy corta — puede estar incompleta");
  ok = false;
}

if (token && pub && token === pub) {
  console.log("❌ Token y Public Key son el mismo valor — copiaste mal");
  ok = false;
}

console.log("\n=== Preferencia ===");
const pr = await fetch(
  `https://api.mercadopago.com/checkout/preferences/${prefId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const pref = await pr.json();
console.log("GET preference:", pr.status);
if (pr.ok) {
  console.log("collector_id:", pref.collector_id);
  console.log("init_point:", pref.init_point);
  console.log("back_urls OK:", !!pref.back_urls?.success);
} else {
  console.log(JSON.stringify(pref, null, 2));
  ok = false;
}

console.log("\n=== Cuenta vendedor ===");
const me = await fetch("https://api.mercadopago.com/users/me", {
  headers: { Authorization: `Bearer ${token}` },
});
const user = await me.json();
if (me.ok) {
  console.log("user_id:", user.id, "| site:", user.site_id);
  if (user.status?.confirmed_email === false) {
    console.log(
      "⚠️  Email no confirmado en Mercado Pago — confirma tu correo en mercadopago.cl"
    );
  }
  if (user.status?.site_status !== "active") {
    console.log("⚠️  Cuenta site_status:", user.status?.site_status);
  }
} else {
  console.log("users/me error:", user);
}

console.log("\n=== Crear preferencia nueva ===");
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
  console.log("Prueba abrir en navegador:\n ", created.init_point);
  if (created.sandbox_init_point) {
    console.log(
      "(Info: sandbox_init_point también existe; en Chile a veces aparece",
      "incluso con token de producción — no es el problema principal.)"
    );
  }
} else {
  console.log(JSON.stringify(created, null, 2));
  ok = false;
}

console.log(
  ok
    ? "\n✅ Revisa cuenta/email y prueba el init_point en incógnito."
    : "\n❌ Corrige lo marcado arriba, reinicia npm run dev y vuelve a probar."
);
