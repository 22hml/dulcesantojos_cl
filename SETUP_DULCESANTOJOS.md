# 🎂 Dulces Antojos — Guía de Setup Completo

## Stack
- **Next.js 14** (App Router) — frontend + API routes
- **Supabase** — base de datos PostgreSQL + Storage para imágenes
- **Mercado Pago** — Checkout Pro (pagos)
- **Vercel** — deploy + dominio
- **Tailwind CSS** — estilos

---

## PASO 1 — Crear el proyecto

```bash
npx create-next-app@latest dulcesantojos --typescript --tailwind --app
cd dulcesantojos
npm install @supabase/supabase-js mercadopago
```

---

## PASO 2 — Estructura de carpetas

```
dulcesantojos/
├── app/
│   ├── page.tsx              ← Landing + catálogo
│   ├── layout.tsx
│   ├── admin/
│   │   └── page.tsx          ← Panel admin (tú manejas stock)
│   └── api/
│       ├── checkout/
│       │   └── route.ts      ← Crea preferencia en MP
│       └── webhook/
│           └── route.ts      ← MP notifica pago exitoso
├── components/
│   ├── Navbar.tsx
│   ├── ProductCard.tsx
│   ├── CartDrawer.tsx
│   └── HeroSplit.tsx
├── lib/
│   ├── supabase.ts           ← Cliente Supabase
│   └── mercadopago.ts        ← Cliente MP
└── .env.local                ← Variables de entorno
```

---

## PASO 3 — Supabase: crear las tablas

En supabase.com → SQL Editor → pegar esto:

```sql
-- Productos (pastelería)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,       -- en pesos CLP, sin decimales
  unit TEXT DEFAULT 'unidad',   -- 'caja', 'caja x6', etc.
  stock INTEGER DEFAULT 0,
  category TEXT,                -- 'Tortas', 'Cheesecake', etc.
  mode TEXT DEFAULT 'pasteleria', -- 'pasteleria' o 'shop'
  image_url TEXT,
  highlight TEXT,               -- 'Más pedida', 'Nuevo', null
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  mp_preference_id TEXT,        -- ID de Mercado Pago
  mp_payment_id TEXT,           -- se llena al pagar
  status TEXT DEFAULT 'pending', -- pending | paid | preparing | sent | done
  delivery_type TEXT,            -- 'despacho' | 'retiro'
  address TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  subtotal INTEGER,
  delivery_cost INTEGER DEFAULT 0,
  total INTEGER,
  items JSONB,                  -- snapshot del carrito
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bajar stock al pagar (trigger automático)
CREATE OR REPLACE FUNCTION decrease_stock()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      UPDATE products
      SET stock = stock - (item->>'qty')::int
      WHERE id = (item->>'id')::int;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_paid
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION decrease_stock();

-- Habilitar Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Productos son públicos (lectura)
CREATE POLICY "productos publicos" ON products
  FOR SELECT USING (active = true);

-- Pedidos: solo el service role puede escribir
CREATE POLICY "orders insert" ON orders
  FOR INSERT WITH CHECK (true);
```

---

## PASO 4 — Variables de entorno (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://XXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJXXXX...
SUPABASE_SERVICE_ROLE_KEY=eyJXXXX...   # solo backend, nunca al frontend

# Mercado Pago
MP_ACCESS_TOKEN=APP_USR-XXXX...        # de tu cuenta MP Chile
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-XXXX...

# App
NEXT_PUBLIC_APP_URL=https://dulcesantojos.cl
NEXT_PUBLIC_WA_NUMBER=56912345678
```

---

## PASO 5 — Código clave: API Checkout

```typescript
// app/api/checkout/route.ts
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  const { cart, deliveryType, address, customerPhone } = await req.json();

  const items = Object.values(cart) as any[];
  const subtotal = items.reduce((s: number, i: any) => s + i.price * i.qty, 0);
  const deliveryCost = deliveryType === 'despacho' ? 2990 : 0;
  const total = subtotal + deliveryCost;

  // Crear preferencia en Mercado Pago
  const preference = await new Preference(mp).create({
    body: {
      items: [
        ...items.map((i: any) => ({
          title: i.name,
          quantity: i.qty,
          unit_price: i.price,
          currency_id: 'CLP',
        })),
        ...(deliveryCost > 0 ? [{
          title: 'Despacho a domicilio',
          quantity: 1,
          unit_price: deliveryCost,
          currency_id: 'CLP',
        }] : []),
      ],
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/pedido/success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/pedido/failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/pedido/pending`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook`,
    },
  });

  // Guardar pedido en Supabase (status: pending)
  await supabase.from('orders').insert({
    mp_preference_id: preference.id,
    status: 'pending',
    delivery_type: deliveryType,
    address,
    customer_phone: customerPhone,
    subtotal,
    delivery_cost: deliveryCost,
    total,
    items: items.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
  });

  return Response.json({ init_point: preference.init_point });
}
```

---

## PASO 6 — Webhook Mercado Pago

```typescript
// app/api/webhook/route.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  const body = await req.json();

  if (body.type === 'payment') {
    const paymentId = body.data.id;

    // Verificar pago con la API de MP
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    const payment = await res.json();

    if (payment.status === 'approved') {
      // Actualizar pedido → el trigger de Supabase baja el stock automáticamente
      await supabase
        .from('orders')
        .update({ status: 'paid', mp_payment_id: String(paymentId) })
        .eq('mp_preference_id', payment.external_reference);
    }
  }

  return new Response('OK', { status: 200 });
}
```

---

## PASO 7 — Panel Admin (manejo de stock)

```
/admin → página protegida con password básico o Supabase Auth
  - Ver todos los productos con stock actual
  - Editar precio, stock, descripción
  - Subir foto a Supabase Storage
  - Ver pedidos del día con estado
  - Cambiar estado: pending → preparing → sent → done
```

---

## PASO 8 — Deploy en Vercel

```bash
# 1. Subir a GitHub
git init && git add . && git commit -m "init"
gh repo create dulcesantojos --private --push

# 2. Conectar en vercel.com
# New Project → importar repo GitHub → agregar variables .env.local

# 3. Conectar dominio
# Vercel Dashboard → Domains → dulcesantojos.cl
# En tu registrador DNS:
#   Tipo A → 76.76.19.19
#   o CNAME www → cname.vercel-dns.com
```

---

## Resumen de costos

| Servicio | Costo |
|---|---|
| Vercel | **GRATIS** (plan hobby) |
| Supabase | **GRATIS** (plan free, 500MB) |
| Mercado Pago | **3.49% + IVA** por transacción exitosa |
| Dominio dulcesantojos.cl | Ya lo tienes ✓ |
| **Total fijo mensual** | **$0** |

---

## Lo que hay que hacer en Cursor

1. Crear el proyecto con el comando del Paso 1
2. Abrir la carpeta en Cursor
3. Pedirle al AI de Cursor: *"Convierte este HTML en componentes Next.js con Tailwind manteniendo el diseño exacto"* y pegarle el HTML
4. Crear las API routes del Paso 5 y 6
5. Agregar las variables .env.local
6. `npm run dev` → corre en localhost:3000

---

## ¿Tienes cuenta en Mercado Pago Chile?

Si no, créala en mercadopago.cl con RUT o passaporte venezolano, luego activa las credenciales en:
`mercadopago.cl → Tu negocio → Credenciales → Access Token`
