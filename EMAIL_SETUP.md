# Integrar emails en dulcesantojos.cl

## Servicio recomendado: Resend
- Gratis hasta 3.000 emails/mes
- Integración nativa con Next.js
- https://resend.com

---

## 1. Instalar

```bash
npm install resend
```

## 2. Variable de entorno

En `.env.local` y en Vercel:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
```

## 3. Crear la utility de email

```typescript
// lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function formatCLP(n: number) {
  return '$' + n.toLocaleString('es-CL')
}

function buildItemsHTML(items: any[]) {
  return items.map(i => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td style="background:#1a1a1a;border:1px solid #222;border-radius:6px;padding:14px 18px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0;font-size:15px;color:#fff;font-weight:600;">${i.name}</p>
                <p style="margin:3px 0 0;font-size:12px;color:#555;">${i.qty} × ${formatCLP(i.price)}</p>
              </td>
              <td align="right">
                <p style="margin:0;font-size:17px;color:#E8A820;font-weight:700;">${formatCLP(i.price * i.qty)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `).join('')
}

export async function sendOrderConfirmation(order: any) {
  const items = order.items
  const subtotal = items.reduce((s: number, i: any) => s + i.price * i.qty, 0)
  const deliveryCost = order.delivery_cost || 0
  const total = subtotal + deliveryCost
  const date = new Date(order.created_at).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  // EMAIL AL CLIENTE
  if (order.customer_email) {
    await resend.emails.send({
      from: 'Dulces Antojos <pedidos@dulcesantojos.cl>',
      to: order.customer_email,
      subject: `✓ Pedido #${order.id} confirmado — Dulces Antojos`,
      html: clientEmailHTML({ order, items, subtotal, deliveryCost, total, date }),
    })
  }

  // EMAIL AL ADMIN
  await resend.emails.send({
    from: 'Sistema Dulces Antojos <sistema@dulcesantojos.cl>',
    to: 'admin@dulcesantojos.cl', // tu email real
    subject: `🔔 Nuevo pedido #${order.id} — ${formatCLP(total)}`,
    html: adminEmailHTML({ order, items, subtotal, deliveryCost, total, date }),
  })
}
```

## 4. Llamar desde el webhook

```typescript
// app/api/webhook/route.ts
import { sendOrderConfirmation } from '@/lib/email'

// ... después de actualizar el pedido a 'paid':
await sendOrderConfirmation(updatedOrder)
```

## 5. Variables en los templates HTML

Los templates usan estas variables que debes reemplazar con string interpolation en TypeScript:

| Variable | Valor |
|---|---|
| `{{order_id}}` | `order.id` |
| `{{order_date}}` | fecha formateada |
| `{{customer_name}}` | `order.customer_name` |
| `{{customer_phone}}` | `order.customer_phone` |
| `{{address}}` | `order.address` |
| `{{delivery_commune}}` | `order.delivery_commune` |
| `{{delivery_cost}}` | `formatCLP(order.delivery_cost)` |
| `{{subtotal}}` | `formatCLP(subtotal)` |
| `{{total}}` | `formatCLP(total)` |
| `{{mp_payment_id}}` | `order.mp_payment_id` |
| `{{items}}` | loop con `buildItemsHTML(items)` |

## 6. Agregar email del cliente en el carrito

En `CartDrawer.tsx`, agregar un campo opcional:
```tsx
<input
  type="email"
  placeholder="Tu email (para recibir confirmación)"
  value={customerEmail}
  onChange={e => setCustomerEmail(e.target.value)}
/>
```

Y pasarlo en el body del checkout:
```typescript
// api/checkout/route.ts
const { cart, deliveryType, address, customerPhone, customerEmail } = await req.json()
// guardar customer_email en la tabla orders
```

---

## Dominio de email (importante)

Para enviar desde `@dulcesantojos.cl` necesitas verificar el dominio en Resend:
1. Resend → Domains → Add domain → `dulcesantojos.cl`
2. Te dan registros DNS → agregarlos en Vercel DNS
3. Verificar y listo

Mientras tanto puedes usar `onboarding@resend.dev` para pruebas.
