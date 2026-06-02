"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatCLP } from "@/lib/format";
import { buildOrderWhatsAppUrl } from "@/lib/order-whatsapp";
import CartItemThumb from "@/components/CartItemThumb";
import ComunaSelect from "@/components/ComunaSelect";
import { FALLBACK_DELIVERY_ZONES } from "@/lib/fallback-zones";
import { getDiscountedPrice, type Cart, type DeliveryZone } from "@/types";
import { isValidEmail, type DeliveryType } from "@/types/delivery";

const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER;

const inputClass =
  "w-full rounded border border-theme bg-theme-input px-4 py-2.5 font-outfit text-sm text-theme placeholder:text-theme-muted focus:border-gold focus:outline-none";

type CustomerField =
  | "name"
  | "phone"
  | "email"
  | "comuna"
  | "address"
  | "pickupPolicy";

const FIELD_IDS: Record<CustomerField, string> = {
  name: "cart-field-name",
  phone: "cart-field-phone",
  email: "cart-field-email",
  comuna: "cart-field-comuna",
  address: "cart-field-address",
  pickupPolicy: "cart-field-pickup-policy",
};

type AppliedCoupon = {
  code: string;
  discount_pct: number;
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

  const [deliveryType, setDeliveryType] = useState<DeliveryType>("retiro");
  const [comuna, setComuna] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [regionAddress, setRegionAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [pickupPolicyAccepted, setPickupPolicyAccepted] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponPanelOpen, setCouponPanelOpen] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [zones, setZones] = useState<DeliveryZone[]>(FALLBACK_DELIVERY_ZONES);
  const [loading, setLoading] = useState(false);
  const [waLoading, setWaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<CustomerField | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    const previous = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = previous.overflow;
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    fetch("/api/delivery-zones", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setZones(data);
      })
      .catch(() => {});
  }, [isOpen]);

  const selectedZone = useMemo(
    () => zones.find((z) => z.comuna === comuna),
    [zones, comuna]
  );

  const deliveryCost =
    deliveryType === "despacho" ? (selectedZone?.delivery_cost ?? 0) : 0;
  const couponDiscount = appliedCoupon
    ? Math.min(
        subtotal,
        Math.round(subtotal * (appliedCoupon.discount_pct / 100))
      )
    : 0;
  const total = subtotal - couponDiscount + deliveryCost;
  const items = Object.values(cart);

  const fullAddress =
    deliveryType === "despacho" && streetAddress.trim() && comuna
      ? `${streetAddress.trim()}, ${comuna}`
      : deliveryType === "region" && regionAddress.trim()
        ? regionAddress.trim()
        : "";
  const needsPickupPolicy = deliveryType === "retiro" && !pickupPolicyAccepted;

  useEffect(() => {
    setAppliedCoupon(null);
    setCouponError(null);
  }, [customerEmail, subtotal]);

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

  function validateCustomerFields({
    requireEmail = false,
  }: { requireEmail?: boolean } = {}): boolean {
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
    if (deliveryType === "region") {
      if (!regionAddress.trim()) {
        showFieldError(
          "address",
          "Ingresa la dirección completa (calle, número, ciudad y región)"
        );
        return false;
      }
    }
    if (deliveryType === "retiro" && !pickupPolicyAccepted) {
      showFieldError(
        "pickupPolicy",
        "Debes aceptar la política de retiro antes de continuar"
      );
      return false;
    }

    const email = customerEmail.trim();
    if (requireEmail || deliveryType === "region") {
      if (!email) {
        showFieldError("email", "Ingresa tu correo electrónico");
        return false;
      }
      if (!isValidEmail(email)) {
        showFieldError("email", "Ingresa un correo electrónico válido");
        return false;
      }
    } else if (email && !isValidEmail(email)) {
      showFieldError("email", "Ingresa un correo electrónico válido");
      return false;
    }
    return true;
  }

  async function applyCoupon() {
    const code = couponCode.trim();
    if (!code) {
      setCouponError("Ingresa un código de cupón");
      return;
    }
    if (!customerEmail.trim() || !isValidEmail(customerEmail.trim())) {
      setCouponError("Ingresa un correo válido antes de aplicar el cupón");
      focusCartField("email");
      return;
    }
    if (subtotal <= 0) {
      setCouponError("El carrito no tiene productos para aplicar descuento");
      return;
    }

    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          email: customerEmail.trim(),
          subtotal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo aplicar el cupón");
      }
      setAppliedCoupon({
        code: data.code,
        discount_pct: Number(data.discount_pct),
      });
      setCouponCode(data.code || code.toUpperCase());
      setCouponPanelOpen(false);
    } catch (e) {
      setAppliedCoupon(null);
      setCouponError(e instanceof Error ? e.message : "Cupón inválido");
    } finally {
      setCouponLoading(false);
    }
  }

  function syncStockFromApi(products: Record<string, unknown> | undefined) {
    if (!products) return;
    const snapshot: Record<
      number,
      {
        stock: number;
        active?: boolean;
        price?: number;
        name?: string;
        discount_pct?: number | null;
      }
    > = {};
    for (const [id, raw] of Object.entries(products)) {
      const p = raw as {
        stock?: number;
        active?: boolean;
        price?: number;
        name?: string;
        discount_pct?: number | null;
      };
      if (typeof p.stock === "number") {
        snapshot[Number(id)] = {
          stock: p.stock,
          active: p.active,
          price: p.price,
          name: p.name,
          discount_pct: p.discount_pct,
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
        | {
            stock: number;
            active?: boolean;
            price?: number;
            name?: string;
            discount_pct?: number | null;
          }
        | undefined;
      if (!p?.active || p.stock <= 0) continue;
      synced[item.id] = {
        ...item,
        stock: p.stock,
        qty: Math.min(item.qty, p.stock),
        ...(typeof p.price === "number" ? { price: p.price } : {}),
        ...(p.name ? { name: p.name } : {}),
        ...("discount_pct" in p ? { discount_pct: p.discount_pct } : {}),
      };
    }

    if (Object.keys(synced).length === 0) {
      setError("Tu pedido está vacío");
      return null;
    }

    return synced;
  }

  async function handleCheckout() {
    if (!validateCustomerFields({ requireEmail: true })) return;

    setLoading(true);
    setError(null);

    try {
      const syncedCart = await validateAndSyncStock();
      if (!syncedCart) return;

      const syncedItems = Object.values(syncedCart);
      const syncedSubtotal = syncedItems.reduce(
        (s, i) => s + getDiscountedPrice(i) * i.qty,
        0
      );
      const syncedCouponDiscount = appliedCoupon
        ? Math.min(
            syncedSubtotal,
            Math.round(syncedSubtotal * (appliedCoupon.discount_pct / 100))
          )
        : 0;
      const syncedTotal = syncedSubtotal - syncedCouponDiscount + deliveryCost;

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: syncedCart,
          deliveryType,
          address:
            deliveryType === "region"
              ? regionAddress.trim()
              : streetAddress.trim(),
          comuna,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
          observaciones: observaciones.trim() || undefined,
          deliveryCost,
          couponCode: appliedCoupon?.code,
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
              customer_email: customerEmail.trim() || null,
              observaciones: observaciones.trim() || null,
              subtotal: syncedSubtotal - syncedCouponDiscount,
              delivery_cost: deliveryCost,
              total: syncedTotal,
              coupon_code: appliedCoupon?.code ?? null,
              coupon_discount: syncedCouponDiscount || null,
              items: syncedItems.map((i) => ({
                name: i.name,
                qty: i.qty,
                price: getDiscountedPrice(i),
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
        (s, i) => s + getDiscountedPrice(i) * i.qty,
        0
      );
      const freshTotal = freshSubtotal + deliveryCost;

      const url = buildOrderWhatsAppUrl({
        delivery_type: deliveryType,
        address: fullAddress || null,
        comuna: deliveryType === "despacho" ? comuna : null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || null,
        observaciones: observaciones.trim() || null,
        subtotal: freshSubtotal,
        delivery_cost: deliveryCost,
        total: freshTotal,
        items: freshItems.map((i) => ({
          name: i.name,
          qty: i.qty,
          price: getDiscountedPrice(i),
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
      className="fixed inset-0 z-[900] flex touch-none justify-end overflow-hidden backdrop-blur-sm"
      style={{ background: "var(--overlay)" }}
      onClick={(e) => e.target === e.currentTarget && closeCart()}
    >
      <aside className="relative flex h-full w-full max-w-[440px] animate-[dIn_0.3s_ease] touch-auto flex-col border-l border-theme bg-theme-elevated">
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

        <div className="flex-1 overscroll-contain overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <span className="mb-4 block text-5xl opacity-30">🛒</span>
              {error && (
                <p className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {error}
                </p>
              )}
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
                        {formatCLP(getDiscountedPrice(item) * item.qty)}
                      </p>
                      {!!item.discount_pct && (
                        <p className="text-[0.68rem] text-theme-muted">
                          {formatCLP(item.price)} c/u · -{item.discount_pct}% OFF
                        </p>
                      )}
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
                <div className="mb-4 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryType("despacho");
                      setFieldError(null);
                    }}
                    className={`rounded border p-2 text-center transition ${
                      deliveryType === "despacho"
                        ? "border-gold bg-gold/10"
                        : "border-theme bg-theme-input"
                    }`}
                  >
                    <span className="mb-1 block text-lg sm:text-xl">🛵</span>
                    <span className="block text-[0.68rem] font-semibold leading-tight text-theme sm:text-[0.72rem]">
                      Despacho
                    </span>
                    <span className="text-[0.6rem] text-gold sm:text-[0.65rem]">
                      {comuna && selectedZone
                        ? `+${formatCLP(selectedZone.delivery_cost)}`
                        : "RM"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryType("retiro");
                      setFieldError(null);
                    }}
                    className={`rounded border p-2 text-center transition ${
                      deliveryType === "retiro"
                        ? "border-gold bg-gold/10"
                        : "border-theme bg-theme-input"
                    }`}
                  >
                    <span className="mb-1 block text-lg sm:text-xl">🏪</span>
                    <span className="block text-[0.68rem] font-semibold leading-tight text-theme sm:text-[0.72rem]">
                      Retiro
                    </span>
                    <span className="text-[0.6rem] text-gold sm:text-[0.65rem]">
                      Gratis
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryType("region");
                      setFieldError(null);
                    }}
                    className={`rounded border p-2 text-center transition ${
                      deliveryType === "region"
                        ? "border-gold bg-gold/10"
                        : "border-theme bg-theme-input"
                    }`}
                  >
                    <span className="mb-1 block text-lg sm:text-xl">📦</span>
                    <span className="block text-[0.68rem] font-semibold leading-tight text-theme sm:text-[0.72rem]">
                      Región
                    </span>
                    <span className="text-[0.6rem] leading-tight text-gold sm:text-[0.65rem]">
                      BlueExpress
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
                ) : deliveryType === "region" ? (
                  <div className="space-y-2">
                    <p className="rounded border border-gold/25 bg-gold/5 px-3 py-2 text-[0.75rem] leading-relaxed text-theme-muted">
                      Envío por{" "}
                      <strong className="text-theme">BlueExpress</strong> con{" "}
                      <strong className="text-theme">cobro a destino</strong>.
                      El costo del flete no está incluido en el total del
                      pedido.
                    </p>
                    <label className="block text-[0.72rem] uppercase tracking-wider text-theme-muted">
                      Dirección completa (calle, número, ciudad, región){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="cart-field-address"
                      placeholder="Ej: Los Carrera 450, Puerto Montt, Los Lagos"
                      value={regionAddress}
                      onChange={(e) => {
                        setRegionAddress(e.target.value);
                        if (fieldError === "address") setFieldError(null);
                      }}
                      className={`${fieldInputClass("address")} min-h-[72px] resize-y`}
                      rows={2}
                    />
                    <p className="text-[0.72rem] text-theme-muted">
                      Nombre, teléfono y correo se completan abajo en datos de
                      contacto.
                    </p>
                  </div>
                ) : (
                  <div
                    id={FIELD_IDS.pickupPolicy}
                    className={`space-y-3 rounded border px-3 py-3 ${
                      fieldError === "pickupPolicy"
                        ? "border-red-500 bg-red-500/10"
                        : "border-gold/25 bg-gold/5"
                    }`}
                  >
                    <p className="text-[0.75rem] leading-relaxed text-theme-muted">
                      <strong className="text-theme">Importante:</strong> los
                      pedidos con retiro deben ser retirados dentro de un plazo
                      máximo de <strong className="text-theme">5 días hábiles</strong>{" "}
                      desde la confirmación de disponibilidad. Pasado ese plazo,
                      el pedido se considerará{" "}
                      <strong className="text-theme">no retirado</strong> y no se
                      garantiza su conservación ni devolución, especialmente en
                      productos preparados, personalizados o reservados.
                    </p>
                    <label className="flex cursor-pointer items-start gap-2 text-[0.75rem] leading-relaxed text-theme">
                      <input
                        type="checkbox"
                        checked={pickupPolicyAccepted}
                        onChange={(e) => {
                          setPickupPolicyAccepted(e.target.checked);
                          if (fieldError === "pickupPolicy") setFieldError(null);
                        }}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-gold"
                      />
                      <span>
                        Acepto que tengo hasta 5 días hábiles para retirar mi
                        pedido una vez confirmado.
                      </span>
                    </label>
                  </div>
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
                  Correo electrónico{" "}
                  <span className="text-theme-muted/60">
                    (requerido para pagar)
                  </span>
                </label>
                <input
                  id="cart-field-email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  value={customerEmail}
                  onChange={(e) => {
                    setCustomerEmail(e.target.value);
                    if (fieldError === "email") setFieldError(null);
                  }}
                  className={fieldInputClass("email")}
                />
                <p className="mt-1 text-[0.72rem] text-theme-muted">
                  Te enviaremos el detalle de la compra cuando Mercado Pago
                  confirme el pago.
                </p>
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
          <div className="shrink-0 border-t border-theme px-5 py-3 sm:px-8 sm:py-4">
            <div className="relative mb-2">
              <button
                type="button"
                onClick={() => setCouponPanelOpen((open) => !open)}
                className={`flex w-full items-center justify-between rounded border px-3 py-2 font-outfit text-[0.68rem] font-semibold uppercase tracking-wider transition ${
                  appliedCoupon
                    ? "border-gold/50 bg-gold/10 text-gold"
                    : "border-theme bg-theme-card text-theme-muted hover:border-gold hover:text-gold"
                }`}
              >
                <span>
                  {appliedCoupon
                    ? `Cupón ${appliedCoupon.code} aplicado`
                    : "Tengo un cupón"}
                </span>
                <span className="text-sm">{couponPanelOpen ? "−" : "+"}</span>
              </button>

              {couponPanelOpen && (
                <div className="absolute bottom-full left-0 right-0 z-20 mb-2 rounded-lg border border-gold/30 bg-theme-elevated p-3 shadow-2xl">
                  <label className="mb-2 block text-[0.66rem] uppercase tracking-wider text-theme-muted">
                    Código de descuento
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej: DulcesAntojos"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError(null);
                        setAppliedCoupon(null);
                      }}
                      className={`${inputClass} h-10 px-3 py-1.5 uppercase`}
                    />
                    <button
                      type="button"
                      onClick={() => void applyCoupon()}
                      disabled={couponLoading}
                      className="h-10 shrink-0 rounded bg-gold px-3 font-outfit text-[0.68rem] font-bold uppercase tracking-wider text-black transition hover:bg-gold-light disabled:opacity-50"
                    >
                      {couponLoading ? "..." : "Aplicar"}
                    </button>
                  </div>
                  {appliedCoupon && (
                    <p className="mt-2 text-[0.7rem] text-gold">
                      -{appliedCoupon.discount_pct}% aplicado al subtotal.
                    </p>
                  )}
                  {couponError && (
                    <p className="mt-2 text-[0.7rem] text-red-400">
                      {couponError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setCouponPanelOpen(false)}
                    className="mt-2 text-[0.68rem] text-theme-muted hover:text-theme"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-0.5 text-[0.82rem] text-theme-muted">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCLP(subtotal)}</span>
              </div>
              {appliedCoupon && couponDiscount > 0 && (
                <div className="flex justify-between text-gold">
                  <span>Cupón {appliedCoupon.code}</span>
                  <span>-{formatCLP(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>
                  {deliveryType === "region"
                    ? "Envío región"
                    : "Despacho"}
                  {deliveryType === "despacho" && comuna ? ` (${comuna})` : ""}
                </span>
                <span>
                  {deliveryType === "despacho"
                    ? comuna
                      ? formatCLP(deliveryCost)
                      : "Elige comuna"
                    : deliveryType === "region"
                      ? "Cobro a destino"
                      : "Gratis"}
                </span>
              </div>
              <div className="mt-1 flex justify-between border-t border-theme pt-2 font-bebas text-lg text-theme">
                <span>TOTAL</span>
                <span className="text-gold">{formatCLP(total)}</span>
              </div>
            </div>

            {error && (
              <p className="mt-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className={`mt-3 grid gap-2 ${waNumber ? "grid-cols-2" : ""}`}>
              <button
                type="button"
                disabled={
                  loading ||
                  (deliveryType === "despacho" && (!comuna || !selectedZone)) ||
                  needsPickupPolicy
                }
                onClick={handleCheckout}
                className="flex min-h-[48px] w-full flex-col items-center justify-center rounded bg-gold px-3 py-2 font-outfit text-black transition hover:bg-gold-light disabled:opacity-60"
              >
                <span className="flex items-center justify-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-wider">
                  <CardIcon />
                  {loading ? "Redirigiendo" : "Mercado Pago"}
                </span>
                <span className="text-[0.55rem] font-normal normal-case tracking-normal text-black/70">
                  pagar online
                </span>
              </button>

              {waNumber && (
                <button
                  type="button"
                  disabled={
                    loading || waLoading || needsPickupPolicy || !!appliedCoupon
                  }
                  onClick={() => void handleWhatsApp()}
                  className="flex min-h-[48px] w-full items-center justify-center rounded border border-wa/30 px-3 py-2 font-outfit text-[0.68rem] font-semibold uppercase tracking-wider text-wa transition hover:border-wa hover:bg-wa/10 disabled:opacity-60"
                >
                  {waLoading ? "Validando" : "WhatsApp"}
                </button>
              )}
            </div>
            {waNumber && appliedCoupon && (
              <p className="mt-1.5 text-center text-[0.66rem] text-theme-muted">
                Para usar el cupón, finaliza con Mercado Pago.
              </p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

