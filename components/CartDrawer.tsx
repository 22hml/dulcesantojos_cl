"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatCLP } from "@/lib/format";
import { buildOrderWhatsAppUrl } from "@/lib/order-whatsapp";
import CartItemThumb from "@/components/CartItemThumb";
import ComunaSelect from "@/components/ComunaSelect";
import { FALLBACK_DELIVERY_ZONES } from "@/lib/fallback-zones";
import type { Cart, DeliveryZone } from "@/types";

const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER;

const inputClass =
  "w-full rounded border border-theme bg-theme-input px-4 py-2.5 font-outfit text-sm text-theme placeholder:text-theme-muted focus:border-gold focus:outline-none";

type CustomerField = "name" | "phone" | "comuna" | "address";

const FIELD_IDS: Record<CustomerField, string> = {
  name: "cart-field-name",
  phone: "cart-field-phone",
  comuna: "cart-field-comuna",
  address: "cart-field-address",
};

function focusCartField(field: CustomerField) {
  requestAnimationFrame(() => {
    const el = document.getElementById(FIELD_IDS[field]);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable =
      el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
        ? el
        : el.querySelector<HTMLInputElement | HTMLTextAreaElement>(
            "input, textarea"
          );
    focusable?.focus();
  });
}

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
  const { cart, isOpen, closeCart, subtotal, setQty, applyStockSnapshot } =
    useCart();

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
  const [waLoading, setWaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<CustomerField | null>(null);

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

  function fieldInputClass(field: CustomerField) {
    return fieldError === field
      ? `${inputClass} border-red-500 ring-1 ring-red-500/40`
      : inputClass;
  }

  function showFieldError(field: CustomerField, message: string) {
    setFieldError(field);
    setError(message);
    focusCartField(field);
  }

  function validateCustomerFields(): boolean {
    setFieldError(null);
    if (!customerName.trim()) {
      showFieldError("name", "Ingresa tu nombre para el pedido");
      return false;
    }
    if (!customerPhone.trim()) {
      showFieldError("phone", "Ingresa tu teléfono para coordinar el pedido");
      return false;
    }
    if (deliveryType === "despacho") {
      if (!comuna) {
        showFieldError("comuna", "Selecciona una comuna");
        return false;
      }
      if (!streetAddress.trim()) {
        showFieldError("address", "Ingresa calle, número y depto/casa");
        return false;
      }
    }
    return true;
  }

  function syncStockFromApi(products: Record<string, unknown> | undefined) {
    if (!products) return;
    const snapshot: Record<
      number,
      { stock: number; active?: boolean; price?: number; name?: string }
    > = {};
    for (const [id, raw] of Object.entries(products)) {
      const p = raw as {
        stock?: number;
        active?: boolean;
        price?: number;
        name?: string;
      };
      if (typeof p.stock === "number") {
        snapshot[Number(id)] = {
          stock: p.stock,
          active: p.active,
          price: p.price,
          name: p.name,
        };
      }
    }
    if (Object.keys(snapshot).length > 0) applyStockSnapshot(snapshot);
  }

  async function validateAndSyncStock(): Promise<Cart | null> {
    const currentItems = Object.values(cart);
    if (currentItems.length === 0) {
      setError("Tu pedido está vacío");
      return null;
    }

    const res = await fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: currentItems.map((i) => ({
          id: i.id,
          qty: i.qty,
          name: i.name,
        })),
      }),
    });

    const data = await res.json();
    syncStockFromApi(data.products);

    if (!res.ok) {
      setError(data.error || "No se pudo validar el stock");
      return null;
    }

    if (!data.ok) {
      setError(
        data.message ||
          "Algunos productos ya no tienen stock suficiente. Revisa las cantidades."
      );
      return null;
    }

    const synced: Cart = {};
    for (const item of currentItems) {
      const p = data.products?.[item.id] as
        | { stock: number; active?: boolean; price?: number; name?: string }
        | undefined;
      if (!p?.active || p.stock <= 0) continue;
      synced[item.id] = {
        ...item,
        stock: p.stock,
        qty: Math.min(item.qty, p.stock),
        ...(typeof p.price === "number" ? { price: p.price } : {}),
        ...(p.name ? { name: p.name } : {}),
      };
    }

    if (Object.keys(synced).length === 0) {
      setError("Tu pedido está vacío");
      return null;
    }

    return synced;
  }

  async function handleCheckout() {
    if (!validateCustomerFields()) return;

    setLoading(true);
    setError(null);

    try {
      const syncedCart = await validateAndSyncStock();
      if (!syncedCart) return;

      const syncedItems = Object.values(syncedCart);
      const syncedSubtotal = syncedItems.reduce(
        (s, i) => s + i.price * i.qty,
        0
      );
      const syncedTotal = syncedSubtotal + deliveryCost;

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: syncedCart,
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
        if (res.status === 409) syncStockFromApi(data.products);
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
              subtotal: syncedSubtotal,
              delivery_cost: deliveryCost,
              total: syncedTotal,
              items: syncedItems.map((i) => ({
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

  async function handleWhatsApp() {
    if (!waNumber) return;
    if (!validateCustomerFields()) return;

    setWaLoading(true);
    setError(null);

    try {
      const syncedCart = await validateAndSyncStock();
      if (!syncedCart) return;

      const freshItems = Object.values(syncedCart);
      const freshSubtotal = freshItems.reduce(
        (s, i) => s + i.price * i.qty,
        0
      );
      const freshTotal = freshSubtotal + deliveryCost;

      const url = buildOrderWhatsAppUrl({
        delivery_type: deliveryType,
        address: fullAddress || null,
        comuna: deliveryType === "despacho" ? comuna : null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        observaciones: observaciones.trim() || null,
        subtotal: freshSubtotal,
        delivery_cost: deliveryCost,
        total: freshTotal,
        items: freshItems.map((i) => ({
          name: i.name,
          qty: i.qty,
          price: i.price,
        })),
      });

      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setWaLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[900] flex justify-end backdrop-blur-sm"
      style={{ background: "var(--overlay)" }}
      onClick={(e) => e.target === e.currentTarget && closeCart()}
    >
      <aside className="relative flex h-full w-full max-w-[440px] animate-[dIn_0.3s_ease] flex-col border-l border-theme bg-theme-elevated">
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-theme-elevated/95 px-6 text-center backdrop-blur-sm">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            <p className="font-outfit text-sm font-semibold text-theme">
              Redirigiendo a Mercado Pago…
            </p>
            <p className="text-xs text-theme-muted">
              No cierres esta ventana
            </p>
          </div>
        )}
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
                    <div id="cart-field-comuna">
                      <ComunaSelect
                        zones={zones}
                        value={comuna}
                        onChange={(v) => {
                          setComuna(v);
                          if (fieldError === "comuna") setFieldError(null);
                        }}
                        inputClassName={fieldInputClass("comuna")}
                        id={FIELD_IDS.comuna}
                      />
                    </div>
                    <label className="block text-[0.72rem] uppercase tracking-wider text-theme-muted">
                      Dirección (calle, número, depto){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="cart-field-address"
                      type="text"
                      placeholder="Ej: Av. Providencia 1234, Depto 501"
                      value={streetAddress}
                      onChange={(e) => {
                        setStreetAddress(e.target.value);
                        if (fieldError === "address") setFieldError(null);
                      }}
                      className={fieldInputClass("address")}
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
                  id="cart-field-name"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (fieldError === "name") setFieldError(null);
                  }}
                  className={fieldInputClass("name")}
                  required
                />
                <label className="mb-1 mt-3 block text-[0.72rem] text-theme-muted">
                  Teléfono WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  id="cart-field-phone"
                  type="tel"
                  placeholder="Ej: +56 9 1234 5678"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    if (fieldError === "phone") setFieldError(null);
                  }}
                  className={fieldInputClass("phone")}
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
              <button
                type="button"
                disabled={loading || waLoading}
                onClick={() => void handleWhatsApp()}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-wa/30 py-3 font-outfit text-[0.75rem] font-semibold uppercase tracking-wider text-wa transition hover:border-wa hover:bg-wa/10 disabled:opacity-60 sm:text-[0.8rem]"
              >
                {waLoading ? "Validando stock…" : "Enviar pedido por WhatsApp"}
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

