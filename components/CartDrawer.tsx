"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatCLP } from "@/lib/format";
import { buildOrderWhatsAppUrl } from "@/lib/order-whatsapp";
import CartItemThumb from "@/components/CartItemThumb";
import ComunaSelect from "@/components/ComunaSelect";
import { FALLBACK_DELIVERY_ZONES } from "@/lib/fallback-zones";
import type { DeliveryZone } from "@/types";

const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER;

const inputClass =
  "w-full rounded border border-theme bg-theme-input px-4 py-2.5 font-outfit text-sm text-theme placeholder:text-theme-muted focus:border-gold focus:outline-none";

function CardIcon() {
  return (
    <svg
      width="22"
      height="16"
      viewBox="0 0 22 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
    >
      <rect
        x="0.5"
        y="0.5"
        width="21"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1"
      />
      <rect x="0.5" y="4" width="21" height="3" fill="currentColor" />
      <rect x="3" y="10" width="6" height="2" rx="0.5" fill="currentColor" />
    </svg>
  );
}

export default function CartDrawer() {
  const { cart, isOpen, closeCart, subtotal, setQty, clearCart } = useCart();

  const [deliveryType, setDeliveryType] = useState<"despacho" | "retiro">(
    "retiro"
  );
  const [comuna, setComuna] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [zones, setZones] = useState<DeliveryZone[]>(FALLBACK_DELIVERY_ZONES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/delivery-zones")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setZones(data);
      })
      .catch(() => {});
  }, []);

  const selectedZone = useMemo(
    () => zones.find((z) => z.comuna === comuna),
    [zones, comuna]
  );

  const deliveryCost =
    deliveryType === "despacho" ? (selectedZone?.delivery_cost ?? 0) : 0;
  const total = subtotal + deliveryCost;
  const items = Object.values(cart);

  const fullAddress =
    deliveryType === "despacho" && streetAddress.trim() && comuna
      ? `${streetAddress.trim()}, ${comuna}`
      : "";

  async function handleCheckout() {
    if (!customerName.trim()) {
      setError("Ingresa tu nombre para el pedido");
      return;
    }
    if (!customerPhone.trim()) {
      setError("Ingresa tu teléfono para coordinar el pedido");
      return;
    }
    if (deliveryType === "despacho") {
      if (!comuna) {
        setError("Selecciona una comuna");
        return;
      }
      if (!streetAddress.trim()) {
        setError("Ingresa calle, número y depto/casa");
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart,
          deliveryType,
          address: streetAddress.trim(),
          comuna,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          observaciones: observaciones.trim() || undefined,
          deliveryCost,
          clientOrigin:
            typeof window !== "undefined" ? window.location.origin : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = [data.error, data.hint, data.detail]
          .filter(Boolean)
          .join(" — ");
        throw new Error(msg || "Error al iniciar el pago");
      }

      const checkoutUrl =
        data.checkout_url ||
        data.init_point ||
        data.sandbox_init_point;

      if (checkoutUrl) {
        const orderId =
          typeof data.order_id === "number" ? data.order_id : undefined;
        if (orderId) {
          const waUrl = buildOrderWhatsAppUrl(
            {
              id: orderId,
              delivery_type: deliveryType,
              address: fullAddress || null,
              comuna: deliveryType === "despacho" ? comuna : null,
              customer_name: customerName.trim(),
              customer_phone: customerPhone.trim(),
              observaciones: observaciones.trim() || null,
              subtotal,
              delivery_cost: deliveryCost,
              total,
              items: items.map((i) => ({
                name: i.name,
                qty: i.qty,
                price: i.price,
              })),
            },
            { mercadoPago: true }
          );
          if (waUrl) {
            try {
              sessionStorage.setItem("dulcesantojos_mp_wa_url", waUrl);
            } catch {
              /* ignore */
            }
          }
        }
        clearCart();
        window.location.href = checkoutUrl;
      } else {
        throw new Error(
          data.hint ||
            "Mercado Pago no devolvió URL de pago. Revisa MP_ACCESS_TOKEN en Vercel."
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  function buildWhatsAppLink() {
    if (!waNumber || items.length === 0) return "#";
    return (
      buildOrderWhatsAppUrl({
        delivery_type: deliveryType,
        address: fullAddress || null,
        comuna: deliveryType === "despacho" ? comuna : null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        observaciones: observaciones.trim() || null,
        subtotal,
        delivery_cost: deliveryCost,
        total,
        items: items.map((i) => ({
          name: i.name,
          qty: i.qty,
          price: i.price,
        })),
      }) ?? "#"
    );
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[900] flex justify-end backdrop-blur-sm"
      style={{ background: "var(--overlay)" }}
      onClick={(e) => e.target === e.currentTarget && closeCart()}
    >
      <aside className="flex h-full w-full max-w-[440px] animate-[dIn_0.3s_ease] flex-col border-l border-theme bg-theme-elevated">
        <div className="flex shrink-0 items-center justify-between border-b border-theme px-5 py-5 sm:px-8 sm:py-7">
          <h2 className="font-bebas text-2xl tracking-wider text-theme">
            MI <span className="text-gold">PEDIDO</span>
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="text-theme-muted transition hover:text-theme"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <span className="mb-4 block text-5xl opacity-30">🛒</span>
              <p className="text-[0.88rem] text-theme-muted">
                Tu pedido está vacío.
                <br />
                ¡Elige algo delicioso!
              </p>
            </div>
          ) : (
            <>
              <ul>
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 border-b border-theme py-4 sm:gap-4"
                  >
                    <CartItemThumb item={item} size={52} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.88rem] font-semibold text-theme">
                        {item.name}
                      </p>
                      <p className="font-bebas text-lg text-gold">
                        {formatCLP(item.price * item.qty)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQty(item.id, item.qty - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-theme bg-theme-card text-theme hover:bg-gold hover:text-black"
                      >
                        −
                      </button>
                      <span className="min-w-[18px] text-center text-sm font-bold">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(item.id, item.qty + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-theme bg-theme-card text-theme hover:bg-gold hover:text-black"
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded border border-theme bg-theme-card p-4 sm:p-5">
                <h3 className="mb-4 font-bebas text-base tracking-wider text-theme-soft">
                  ¿CÓMO LO RECIBE?
                </h3>
                <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryType("despacho")}
                    className={`rounded border p-2.5 text-center transition sm:p-3 ${
                      deliveryType === "despacho"
                        ? "border-gold bg-gold/10"
                        : "border-theme bg-theme-input"
                    }`}
                  >
                    <span className="mb-1 block text-xl sm:text-2xl">🛵</span>
                    <span className="block text-[0.75rem] font-semibold text-theme sm:text-[0.78rem]">
                      Despacho
                    </span>
                    <span className="text-[0.65rem] text-gold sm:text-[0.7rem]">
                      {comuna && selectedZone
                        ? `+${formatCLP(selectedZone.delivery_cost)}`
                        : "Según comuna"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType("retiro")}
                    className={`rounded border p-2.5 text-center transition sm:p-3 ${
                      deliveryType === "retiro"
                        ? "border-gold bg-gold/10"
                        : "border-theme bg-theme-input"
                    }`}
                  >
                    <span className="mb-1 block text-xl sm:text-2xl">🏪</span>
                    <span className="block text-[0.75rem] font-semibold text-theme sm:text-[0.78rem]">
                      Retiro
                    </span>
                    <span className="text-[0.65rem] text-gold sm:text-[0.7rem]">
                      Gratis
                    </span>
                  </button>
                </div>

                {deliveryType === "despacho" ? (
                  <div className="space-y-2">
                    <label className="block text-[0.72rem] uppercase tracking-wider text-theme-muted">
                      Comuna <span className="text-red-500">*</span>
                    </label>
                    <ComunaSelect
                      zones={zones}
                      value={comuna}
                      onChange={setComuna}
                      inputClassName={inputClass}
                    />
                    <label className="block text-[0.72rem] uppercase tracking-wider text-theme-muted">
                      Dirección (calle, número, depto){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Av. Providencia 1234, Depto 501"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                ) : (
                  <p className="text-[0.78rem] text-theme-muted">
                    Coordina el horario por WhatsApp.
                  </p>
                )}
              </div>

              <div className="mt-6 border-t border-theme pt-5">
                <h3 className="mb-4 font-bebas text-base tracking-wider text-theme-soft">
                  DATOS DE CONTACTO
                </h3>
                <label className="mb-1 block text-[0.72rem] text-theme-muted">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={inputClass}
                  required
                />
                <label className="mb-1 mt-3 block text-[0.72rem] text-theme-muted">
                  Teléfono WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Ej: +56 9 1234 5678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className={inputClass}
                  required
                />
                <label className="mb-1 mt-3 block text-[0.72rem] text-theme-muted">
                  Observaciones{" "}
                  <span className="text-theme-muted/60">(opcional)</span>
                </label>
                <textarea
                  placeholder="Ej: Sin nueces, entregar después de las 18:00…"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className={`${inputClass} min-h-[72px] resize-y`}
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="shrink-0 border-t border-theme px-5 py-4 sm:px-8 sm:py-5">
            <div className="space-y-1 text-[0.86rem] text-theme-muted">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCLP(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>
                  Despacho
                  {deliveryType === "despacho" && comuna ? ` (${comuna})` : ""}
                </span>
                <span>
                  {deliveryType === "despacho"
                    ? comuna
                      ? formatCLP(deliveryCost)
                      : "Elige comuna"
                    : "Gratis"}
                </span>
              </div>
              <div className="flex justify-between border-t border-theme pt-3 font-bebas text-xl text-theme">
                <span>TOTAL</span>
                <span className="text-gold">{formatCLP(total)}</span>
              </div>
            </div>

            {error && (
              <p className="mt-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={
                loading ||
                (deliveryType === "despacho" && (!comuna || !selectedZone))
              }
              onClick={handleCheckout}
              className="mt-4 flex w-full flex-col items-center justify-center gap-1 rounded bg-gold px-4 py-[1.2rem] font-outfit text-black transition hover:bg-gold-light disabled:opacity-60"
            >
              <span className="flex items-center justify-center gap-2.5 text-[0.88rem] font-bold uppercase tracking-widest">
                <CardIcon />
                {loading ? "Redirigiendo…" : "Pagar con Mercado Pago"}
              </span>
              <span className="text-[0.65rem] font-normal normal-case tracking-normal text-black/70">
                Tarjeta, débito o transferencia
              </span>
            </button>

            {waNumber && (
              <a
                href={buildWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-wa/30 py-3 font-outfit text-[0.75rem] font-semibold uppercase tracking-wider text-wa transition hover:border-wa hover:bg-wa/10 sm:text-[0.8rem]"
              >
                Enviar pedido por WhatsApp
              </a>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

