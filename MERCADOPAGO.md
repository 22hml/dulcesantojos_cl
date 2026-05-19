# Mercado Pago — Dulces Antojos

Integración **Checkout Pro** al estilo [goncy/next-mercadopago](https://github.com/goncy/next-mercadopago): preferencia → `init_point` → webhook confirma el pago.

## Flujo

1. Cliente paga en el carrito → `POST /api/checkout`
2. Se crea pedido `pending` en Supabase
3. Se crea preferencia MP y se redirige a **`init_point`** (Mercado Pago)
4. MP notifica → `GET|POST /api/webhook`
5. El servidor consulta el pago en la API de MP y marca el pedido `paid`

## Variables en Vercel

```env
MP_ACCESS_TOKEN=              # Access Token · Credenciales de producción
NEXT_PUBLIC_MP_PUBLIC_KEY=    # Public Key (misma app; no es igual al token)
MP_USE_SANDBOX=false
NEXT_PUBLIC_MP_USE_SANDBOX=false
NEXT_PUBLIC_APP_URL=https://dulcesantojos.cl
MP_WEBHOOK_SECRET=            # Opcional: clave de Webhooks en el panel MP
```

## Panel Mercado Pago (obligatorio)

1. [Tus integraciones](https://www.mercadopago.cl/developers/panel/app) → tu app → **Webhooks**
2. URL producción: `https://dulcesantojos.cl/api/webhook`
3. Eventos: **Pagos** (`payment`)
4. Copia la **clave secreta** → `MP_WEBHOOK_SECRET` en Vercel → Redeploy

La preferencia también envía `notification_url` a esa misma ruta.

## Supabase

Ejecuta si no lo hiciste:

- `supabase/mark-order-paid-idempotent.sql` — evita duplicar pagos

## Probar en producción

1. Compra de prueba pequeña en https://dulcesantojos.cl
2. Debes ir a `www.mercadopago.cl/checkout/...?pref_id=...`
3. Tras pagar → `/pedido/success`
4. En Supabase → `orders` → `status = paid` y `mp_payment_id` lleno
5. En Vercel → Logs → busca `Pedido pagado:`

## Diagnóstico local

```bash
node scripts/diagnose-mp-prod.mjs
```

## Modo prueba (sandbox)

```env
MP_USE_SANDBOX=true
NEXT_PUBLIC_MP_USE_SANDBOX=true
```

Usa credenciales de **prueba** y cuenta comprador de prueba en [Cuentas de prueba](https://www.mercadopago.cl/developers/panel/test-users).
