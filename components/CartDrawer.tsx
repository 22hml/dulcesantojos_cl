"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatCLP } from "@/lib/format";
import { getProductEmoji } from "@/lib/product-emoji";

const DELIVERY_COST = 2990;
const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER;

export default function CartDrawer() {
  const {
    cart,
    isOpen,
    closeCart,
    subtotal,
    setQty,
    removeItem,
    clearCart,
  } = useCart();

  const [deliveryType, setDeliveryType] = useState<"despacho" | "retiro">(
    "retiro"
  );
  const [address, setAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = Object.values(cart);
  const deliveryCost = deliveryType === "despacho" ? DELIVERY_COST : 0;
  const total = subtotal + deliveryCost;

  async function handleCheckout() {
    if (!customerPhone.trim()) {
      setError("Ingresa tu teléfono para coordinar el pedido");
      return;
    }
    if (deliveryType === "despacho" && !address.trim()) {
      setError("Ingresa la dirección de despacho");
      return;
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
          address,
          customerName,
          customerPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al iniciar el pago");
      }

      const checkoutUrl = data.init_point || data.sandbox_init_point;
      if (checkoutUrl) {
        clearCart();
        window.location.href = checkoutUrl;
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
    const msg = `🎂 *Hola Dulces Antojos!* Quiero hacer un pedido:\n\n${lines.join("\n")}\n\n*Total:* ${formatCLP(total)}\n*Entrega:* ${deliveryType === "despacho" ? "Despacho" : "Retiro en tienda"}`;
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[900] flex justify-end bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && closeCart()}
    >
      <aside className="flex h-full w-full max-w-[440px] animate-[dIn_0.3s_ease] flex-col border-l border-border bg-dark">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-8 py-7">
          <h2 className="font-bebas text-2xl tracking-wider text-white">
            MI <span className="text-gold">PEDIDO</span>
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="text-gray transition hover:text-white"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <span className="mb-4 block text-5xl opacity-30">🛒</span>
              <p className="text-[0.88rem] text-gray">
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
                    className="flex items-center gap-4 border-b border-border py-4"
                  >
                    <span className="shrink-0 text-3xl">
                      {getProductEmoji(item)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.88rem] font-semibold text-white">
                        {item.name}
                      </p>
                      <p className="font-bebas text-lg text-gold">
                        {formatCLP(item.price * item.qty)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQty(item.id, item.qty - 1)}
                        className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-[#333] bg-border text-white hover:bg-gold hover:text-black"
                      >
                        −
                      </button>
                      <span className="min-w-[20px] text-center font-bold">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(item.id, item.qty + 1)}
                        className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-[#333] bg-border text-white hover:bg-gold hover:text-black"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="ml-1 text-xs text-gray hover:text-gold"
                      >
                        Quitar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded border border-border bg-[#1A1A1A] p-5">
                <h3 className="mb-4 font-bebas text-base tracking-wider text-soft">
                  ¿CÓMO LO RECIBE?
                </h3>
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryType("despacho")}
                    className={`rounded border p-3 text-center transition ${
                      deliveryType === "despacho"
                        ? "border-gold bg-gold/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <span className="mb-1 block text-2xl">🛵</span>
                    <span className="block text-[0.78rem] font-semibold">
                      Despacho
                    </span>
                    <span className="text-[0.7rem] text-gold">+$2.990</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType("retiro")}
                    className={`rounded border p-3 text-center transition ${
                      deliveryType === "retiro"
                        ? "border-gold bg-gold/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <span className="mb-1 block text-2xl">🏪</span>
                    <span className="block text-[0.78rem] font-semibold">
                      Retiro
                    </span>
                    <span className="text-[0.7rem] text-gold">Gratis</span>
                  </button>
                </div>
                {deliveryType === "despacho" ? (
                  <input
                    type="text"
                    placeholder="Dirección, número, comuna..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded border border-border bg-card px-4 py-2.5 font-outfit text-sm text-white placeholder:text-[#555] focus:border-gold focus:outline-none"
                  />
                ) : (
                  <p className="text-[0.78rem] text-gray">
                    Coordina el horario por WhatsApp.
                  </p>
                )}
              </div>

              <input
                type="text"
                placeholder="Tu nombre"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-4 w-full rounded border border-border bg-card px-4 py-2.5 font-outfit text-sm text-white placeholder:text-[#555] focus:border-gold focus:outline-none"
              />
              <input
                type="tel"
                placeholder="Teléfono WhatsApp *"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="mt-2 w-full rounded border border-border bg-card px-4 py-2.5 font-outfit text-sm text-white placeholder:text-[#555] focus:border-gold focus:outline-none"
              />
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="shrink-0 border-t border-border px-8 py-5">
            <div className="space-y-1 text-[0.86rem] text-gray">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCLP(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Despacho</span>
                <span>{deliveryCost ? formatCLP(deliveryCost) : "Gratis"}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 font-bebas text-xl text-white">
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
              disabled={loading}
              onClick={handleCheckout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-gold py-4 font-outfit text-[0.88rem] font-bold uppercase tracking-widest text-black transition hover:bg-gold-light disabled:opacity-60"
            >
              {loading ? "Redirigiendo…" : "💳 Pagar con Mercado Pago"}
            </button>

            {waNumber && (
              <a
                href={buildWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-wa/30 py-3.5 font-outfit text-[0.8rem] font-semibold uppercase tracking-wider text-wa transition hover:border-wa hover:bg-wa/10"
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
