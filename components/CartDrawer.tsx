"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatCLP } from "@/lib/format";
import { getProductEmoji } from "@/lib/product-emoji";
import { FALLBACK_DELIVERY_ZONES } from "@/lib/fallback-zones";
import type { DeliveryZone } from "@/types";

const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER;

const inputClass =
  "w-full rounded border border-theme bg-theme-input px-4 py-2.5 font-outfit text-sm text-theme placeholder:text-theme-muted focus:border-gold focus:outline-none";

export default function CartDrawer() {
  const {
    cart,
    isOpen,
    closeCart,
    subtotal,
    setQty,
    clearCart,
  } = useCart();

  const [deliveryType, setDeliveryType] = useState<"despacho" | "retiro">(
    "retiro"
  );
  const [zones, setZones] = useState<DeliveryZone[]>(FALLBACK_DELIVERY_ZONES);
  const [comuna, setComuna] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
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
          customerName,
          customerPhone,
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

      const sandbox =
        process.env.NEXT_PUBLIC_MP_USE_SANDBOX === "true" ||
        process.env.NEXT_PUBLIC_MP_USE_SANDBOX === "1";

      // Producción: ir directo al init_point (evita pantalla en blanco del Wallet → payment/redirect)
      if (!sandbox && data.checkout_url) {
        clearCart();
        window.location.href = data.checkout_url;
      } else if (data.preference_id) {
        clearCart();
        const q = new URLSearchParams({ pref_id: data.preference_id });
        if (data.checkout_url) q.set("url", data.checkout_url);
        window.location.href = `/pagar?${q.toString()}`;
      } else if (data.checkout_url || data.sandbox_init_point || data.init_point) {
        clearCart();
        const checkoutUrl = sandbox
          ? data.sandbox_init_point ||
            data.checkout_url ||
            data.init_point
          : data.init_point ||
            data.checkout_url ||
            data.sandbox_init_point;
        window.location.href = checkoutUrl;
      } else {
        throw new Error(
          data.hint ||
            "Mercado Pago no devolvió URL de pago. Revisa MP_ACCESS_TOKEN en .env.local."
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
    const lines = items.map(
      (i) => `• ${i.name} x${i.qty} — ${formatCLP(i.price * i.qty)}`
    );
    let entrega =
      deliveryType === "despacho"
        ? `Despacho a domicilio`
        : "Retiro en tienda";
    if (deliveryType === "despacho" && fullAddress) {
      entrega += `\n📍 *Dirección:* ${fullAddress}`;
    }
    if (deliveryType === "despacho" && deliveryCost > 0) {
      entrega += `\n🛵 *Costo despacho:* ${formatCLP(deliveryCost)}`;
    }
    const msg = `🎂 *Hola Dulces Antojos!* Quiero hacer un pedido:\n\n${lines.join("\n")}\n\n*Subtotal:* ${formatCLP(subtotal)}\n*Despacho:* ${deliveryType === "despacho" ? formatCLP(deliveryCost) : "Gratis"}\n*Total:* ${formatCLP(total)}\n\n*Entrega:* ${entrega}${customerName ? `\n👤 ${customerName}` : ""}${customerPhone ? `\n📱 ${customerPhone}` : ""}`;
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
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
                    <span className="shrink-0 text-2xl sm:text-3xl">
                      {getProductEmoji(item)}
                    </span>
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
                      Comuna *
                    </label>
                    <select
                      value={comuna}
                      onChange={(e) => setComuna(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Selecciona comuna</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.comuna}>
                          {z.comuna} — {formatCLP(z.delivery_cost)}
                        </option>
                      ))}
                    </select>
                    <label className="block text-[0.72rem] uppercase tracking-wider text-theme-muted">
                      Dirección (calle, número, depto) *
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

              <input
                type="text"
                placeholder="Tu nombre"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={`mt-4 ${inputClass}`}
              />
              <input
                type="tel"
                placeholder="Teléfono WhatsApp *"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className={`mt-2 ${inputClass}`}
              />
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
                <span>Despacho</span>
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
              className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-gold py-3.5 font-outfit text-[0.82rem] font-bold uppercase tracking-widest text-black transition hover:bg-gold-light disabled:opacity-60 sm:py-4 sm:text-[0.88rem]"
            >
              {loading ? "Redirigiendo…" : "💳 Pagar con Mercado Pago"}
            </button>

            {waNumber && (
              <a
                href={buildWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-wa/30 py-3 font-outfit text-[0.75rem] font-semibold uppercase tracking-wider text-wa transition hover:border-wa hover:bg-wa/10 sm:text-[0.8rem]"
              >
                Consultar por WhatsApp
              </a>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
