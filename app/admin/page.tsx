"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { DeliveryZone, Order, OrderStatus, Product } from "@/types";
import { formatCLP } from "@/lib/format";
import ZoneCostEditor from "@/components/ZoneCostEditor";
import {
  STATUS_BADGE,
  STATUS_LABELS,
  countPaidUnprocessed,
  isOrderToday,
} from "@/lib/order-admin";
import HeroSlotsEditor from "@/components/admin/HeroSlotsEditor";
import { mergeHeroSlots } from "@/lib/hero-slots";
import type { HeroSlot } from "@/types/hero";

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "preparing",
  "sent",
  "done",
];

const emptyProduct = (): Partial<Product> => ({
  name: "",
  description: "",
  price: 0,
  unit: "unidad",
  stock: 0,
  category: "",
  mode: "pasteleria",
  highlight: "",
  image_url: null,
  active: true,
});

type Tab = "products" | "orders" | "zones";

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex rounded border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${STATUS_BADGE[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function SectionTitle({
  children,
  hint,
  alert,
}: {
  children: React.ReactNode;
  hint?: string;
  alert?: boolean;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-theme pb-3">
      <div className="flex items-center gap-2">
        <h2 className="font-bebas text-2xl tracking-wide text-theme">{children}</h2>
        {alert && (
          <span
            className="h-2.5 w-2.5 rounded-full bg-red-500"
            title="Hay pedidos pagados sin procesar"
          />
        )}
      </div>
      {hint && <p className="text-sm text-theme-muted">{hint}</p>}
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [tab, setTab] = useState<Tab>("products");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newZone, setNewZone] = useState({ comuna: "", delivery_cost: 2990 });
  const [heroSlots, setHeroSlots] = useState<HeroSlot[]>([]);

  const [productModeFilter, setProductModeFilter] = useState<
    "all" | "pasteleria" | "shop"
  >("all");
  const [productSearch, setProductSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    "all" | OrderStatus
  >("all");
  const [ordersTodayOnly, setOrdersTodayOnly] = useState(true);

  const paidUnprocessed = useMemo(
    () => countPaidUnprocessed(orders),
    [orders]
  );

  const todayOrders = useMemo(
    () => orders.filter((o) => isOrderToday(o.created_at)),
    [orders]
  );

  const productHeroSlot = useMemo(() => {
    const map: Record<number, number> = {};
    for (const s of heroSlots) {
      if (s.kind === "product" && s.product_id) map[s.product_id] = s.slot;
    }
    return map;
  }, [heroSlots]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (productModeFilter !== "all" && p.mode !== productModeFilter)
        return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.category?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [products, productModeFilter, productSearch]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (ordersTodayOnly && !isOrderToday(o.created_at)) return false;
      if (orderStatusFilter !== "all" && o.status !== orderStatusFilter)
        return false;
      return true;
    });
  }, [orders, ordersTodayOnly, orderStatusFilter]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, oRes, zRes, hRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/orders"),
        fetch("/api/admin/delivery-zones", { cache: "no-store" }),
        fetch("/api/admin/hero-slots"),
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (oRes.ok) setOrders(await oRes.json());
      if (zRes.ok) setZones(await zRes.json());
      if (hRes.ok) setHeroSlots(mergeHeroSlots(await hRes.json()));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => {
        if (r.ok) {
          setAuthed(true);
          loadData();
        }
      })
      .catch(() => {});
  }, [loadData]);

  useEffect(() => {
    if (!authed) return;
    const base = "Admin · Dulces Antojos";
    document.title =
      paidUnprocessed > 0 ? `● (${paidUnprocessed}) ${base}` : base;
    return () => {
      document.title = base;
    };
  }, [authed, paidUnprocessed]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok) {
      setAuthed(true);
      loadData();
    } else {
      setLoginError(data.error || "Contraseña incorrecta");
    }
  }

  async function saveProduct() {
    if (!editing?.name || !editing.price) return;
    const isNew = !editing.id;
    const res = await fetch("/api/admin/products", {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setEditing(null);
      loadData();
    } else {
      const data = await res.json();
      alert(data.error || "Error al guardar");
    }
  }

  async function deleteProduct(id: number) {
    if (!confirm("¿Eliminar este producto?")) return;
    await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData();
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) {
      setEditing((e) => ({ ...e, image_url: data.url }));
    } else {
      alert(data.error || "Error al subir imagen");
    }
  }

  async function updateOrderStatus(id: number, status: OrderStatus) {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) loadData();
  }

  async function saveZone(z: DeliveryZone, delivery_cost: number) {
    const res = await fetch("/api/admin/delivery-zones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: z.id, delivery_cost }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "No se pudo guardar la comuna");
      return;
    }
    loadData();
  }

  async function addZone() {
    if (!newZone.comuna.trim()) return;
    await fetch("/api/admin/delivery-zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newZone),
    });
    setNewZone({ comuna: "", delivery_cost: 2990 });
    loadData();
  }

  async function deleteZone(id: number) {
    if (!confirm("¿Eliminar comuna?")) return;
    await fetch("/api/admin/delivery-zones", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData();
  }

  const inputCls =
    "w-full rounded border border-theme bg-theme-input px-3 py-2 text-sm text-theme";

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-theme-base px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-lg border border-theme bg-theme-card p-8"
        >
          <h1 className="font-bebas text-3xl tracking-wide text-theme">
            PANEL ADMIN
          </h1>
          <input
            type="password"
            placeholder="Contraseña admin"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`mt-4 ${inputCls}`}
          />
          {loginError && (
            <p className="mt-2 text-sm text-red-400">{loginError}</p>
          )}
          <button
            type="submit"
            className="mt-4 w-full rounded bg-gold py-3 font-outfit text-sm font-bold uppercase text-black"
          >
            Entrar
          </button>
          <Link
            href="/"
            className="mt-4 block text-center text-sm text-gold hover:underline"
          >
            ← Volver a la tienda
          </Link>
        </form>
      </div>
    );
  }

  const tabLabels: { id: Tab; label: string; alert?: boolean }[] = [
    { id: "products", label: "Catálogo" },
    { id: "orders", label: "Pedidos", alert: paidUnprocessed > 0 },
    { id: "zones", label: "Despacho" },
  ];

  return (
    <div className="min-h-screen bg-theme-base">
      <header className="border-b border-theme bg-theme-card px-4 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-bebas text-2xl tracking-wide text-theme">
              Panel de administración
            </h1>
            <p className="text-sm text-theme-muted">Dulces Antojos · tienda online</p>
          </div>
          <Link href="/" className="text-sm text-gold hover:underline">
            Ver tienda →
          </Link>
        </div>
      </header>

      <nav className="border-b border-theme bg-theme-elevated">
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
          {tabLabels.map(({ id, label, alert }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`relative shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition ${
                tab === id
                  ? "border-gold text-gold"
                  : "border-transparent text-theme-muted hover:text-theme"
              }`}
            >
              {label}
              {alert && (
                <span className="absolute right-1 top-2 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {loading && (
          <p className="mb-4 text-sm text-theme-muted">Actualizando datos…</p>
        )}

        {tab === "products" && (
          <section>
            <SectionTitle hint={`${filteredProducts.length} productos visibles`}>
              Catálogo de productos
            </SectionTitle>

            <HeroSlotsEditor
              slots={heroSlots}
              products={products}
              inputCls={inputCls}
              onUpdated={loadData}
            />


            <div className="mb-4 flex flex-wrap gap-2">
              {(
                [
                  ["all", "Todos"],
                  ["pasteleria", "Pastelería"],
                  ["shop", "Shop"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setProductModeFilter(id)}
                  className={`rounded px-3 py-1.5 text-xs font-medium ${
                    productModeFilter === id
                      ? "bg-gold text-black"
                      : "border border-theme text-theme-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
              <input
                type="search"
                placeholder="Buscar por nombre o categoría…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className={`min-w-[200px] flex-1 ${inputCls}`}
              />
              <button
                type="button"
                onClick={() => setEditing(emptyProduct())}
                className="rounded bg-gold px-4 py-2 text-sm font-bold text-black"
              >
                + Crear producto nuevo
              </button>
            </div>

            {editing && (
              <div className="mb-6 rounded-lg border border-gold/30 bg-theme-card p-4 sm:p-6">
                <h3 className="mb-1 font-bebas text-xl text-theme">
                  {editing.id ? "Editar producto" : "Nuevo producto"}
                </h3>
                <p className="mb-4 text-xs text-theme-muted">
                  Completa los campos obligatorios (*) y sube una foto para el
                  catálogo.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-theme-muted">
                      Nombre *
                    </label>
                    <input
                      value={editing.name || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, name: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-theme-muted">
                      Categoría
                    </label>
                    <input
                      value={editing.category || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, category: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-theme-muted">
                      Precio CLP *
                    </label>
                    <input
                      type="number"
                      value={editing.price || ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          price: Number(e.target.value),
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-theme-muted">
                      Unidad
                    </label>
                    <input
                      value={editing.unit || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, unit: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-theme-muted">
                      Stock
                    </label>
                    <input
                      type="number"
                      value={editing.stock ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          stock: Number(e.target.value),
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-theme-muted">
                      Sección tienda
                    </label>
                    <select
                      value={editing.mode || "pasteleria"}
                      onChange={(e) =>
                        setEditing({ ...editing, mode: e.target.value })
                      }
                      className={inputCls}
                    >
                      <option value="pasteleria">Pastelería</option>
                      <option value="shop">Shop Cajas</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-theme-muted">
                      Etiqueta destacada
                    </label>
                    <input
                      placeholder="Más pedida, Nuevo…"
                      value={editing.highlight || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, highlight: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <p className="text-xs text-theme-muted sm:col-span-2">
                    Para la foto del inicio, usa la sección{" "}
                    <strong className="text-gold">Fotos del inicio</strong> (arriba):
                    casilla + tipo Producto o Foto libre.
                  </p>
                  <label className="flex items-end gap-2 pb-2 text-sm text-theme">
                    <input
                      type="checkbox"
                      checked={editing.active !== false}
                      onChange={(e) =>
                        setEditing({ ...editing, active: e.target.checked })
                      }
                    />
                    Visible en la tienda
                  </label>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-xs text-theme-muted">
                    Descripción
                  </label>
                  <textarea
                    value={editing.description || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, description: e.target.value })
                    }
                    className={inputCls}
                    rows={3}
                  />
                </div>
                <div className="mt-4 rounded border border-dashed border-theme p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-theme-muted">
                    Imagen del producto
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="cursor-pointer rounded border border-theme px-3 py-2 text-sm text-theme hover:border-gold">
                      {uploading ? "Subiendo…" : "📷 Elegir archivo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImageUpload(f);
                        }}
                      />
                    </label>
                    {editing.image_url && (
                      <div className="relative h-20 w-20 overflow-hidden rounded">
                        <Image
                          src={editing.image_url}
                          alt="Vista previa"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={saveProduct}
                    className="rounded bg-gold px-4 py-2 text-sm font-bold text-black"
                  >
                    Guardar producto
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="rounded border border-theme px-4 py-2 text-sm text-theme-muted"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {filteredProducts.length === 0 ? (
                <p className="text-sm text-theme-muted">
                  No hay productos con estos filtros.
                </p>
              ) : (
                filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap gap-4 rounded-lg border border-theme bg-theme-card p-4"
                  >
                    {p.image_url ? (
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded">
                        <Image
                          src={p.image_url}
                          alt={p.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded bg-theme-elevated text-3xl">
                        🧁
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-theme">
                        {p.name}
                        {productHeroSlot[p.id] != null && (
                          <span className="ml-2 rounded bg-gold/15 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-gold">
                            Inicio #{productHeroSlot[p.id]}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-theme-muted">
                        {p.mode === "pasteleria" ? "🎂 Pastelería" : "📦 Shop"} ·{" "}
                        {p.category || "Sin categoría"} · {formatCLP(p.price)} ·
                        Stock {p.stock}
                        {!p.active && (
                          <span className="ml-2 text-red-400">(oculto)</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2 self-center">
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        className="rounded border border-theme px-3 py-1 text-sm text-gold"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(p.id)}
                        className="rounded border border-red-500/40 px-3 py-1 text-sm text-red-400"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {tab === "orders" && (
          <section>
            <SectionTitle
              alert={paidUnprocessed > 0}
              hint={
                paidUnprocessed > 0
                  ? `${paidUnprocessed} pagado(s) sin procesar`
                  : undefined
              }
            >
              {ordersTodayOnly
                ? `Pedidos de hoy (${todayOrders.length})`
                : `Todos los pedidos (${orders.length})`}
            </SectionTitle>

            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setOrdersTodayOnly(true)}
                className={`rounded px-3 py-1.5 text-xs font-medium ${
                  ordersTodayOnly
                    ? "bg-gold text-black"
                    : "border border-theme text-theme-muted"
                }`}
              >
                Solo hoy
              </button>
              <button
                type="button"
                onClick={() => setOrdersTodayOnly(false)}
                className={`rounded px-3 py-1.5 text-xs font-medium ${
                  !ordersTodayOnly
                    ? "bg-gold text-black"
                    : "border border-theme text-theme-muted"
                }`}
              >
                Historial
              </button>
              <select
                value={orderStatusFilter}
                onChange={(e) =>
                  setOrderStatusFilter(e.target.value as "all" | OrderStatus)
                }
                className={`w-auto min-w-[140px] ${inputCls}`}
              >
                <option value="all">Todos los estados</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <p className="text-sm text-theme-muted">
                  No hay pedidos con estos filtros.
                </p>
              ) : (
                filteredOrders.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-lg border border-theme bg-theme-card p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-theme">
                            Pedido #{o.id}
                          </p>
                          <StatusBadge status={o.status} />
                        </div>
                        <p className="mt-1 text-lg font-bebas text-gold">
                          {formatCLP(o.total)}
                        </p>
                        <p className="text-sm text-theme-muted">
                          {new Date(o.created_at).toLocaleString("es-CL")}
                        </p>
                        <p className="text-sm text-theme-muted">
                          {o.customer_phone}
                          {o.customer_name && ` · ${o.customer_name}`}
                        </p>
                        <p className="text-sm text-theme-muted">
                          {o.delivery_type === "despacho"
                            ? "🚚 Despacho"
                            : o.delivery_type === "region"
                              ? "📦 Región (BlueExpress)"
                              : "🏪 Retiro"}
                          {o.address && ` · ${o.address}`}
                          {o.comuna && ` · ${o.comuna}`}
                          {o.customer_email && ` · ${o.customer_email}`}
                        </p>
                        {o.observaciones && (
                          <p className="mt-1 text-sm text-gold/90">
                            📝 {o.observaciones}
                          </p>
                        )}
                      </div>
                      <div className="min-w-[160px]">
                        <label className="mb-1 block text-xs text-theme-muted">
                          Cambiar estado
                        </label>
                        <select
                          value={o.status}
                          onChange={(e) =>
                            updateOrderStatus(
                              o.id,
                              e.target.value as OrderStatus
                            )
                          }
                          className={inputCls}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <ul className="mt-3 border-t border-theme pt-3 text-sm text-theme-muted">
                      {o.items?.map((item, i) => (
                        <li key={i}>
                          {item.qty}× {item.name} — {formatCLP(item.price * item.qty)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {tab === "zones" && (
          <section>
            <SectionTitle hint="Costo de despacho por comuna en el checkout">
              Zonas de despacho
            </SectionTitle>
            <p className="mb-4 text-sm text-theme-muted">
              Los clientes ven el costo al elegir despacho en el carrito.
            </p>
            <div className="mb-4 flex flex-wrap gap-2 rounded-lg border border-theme bg-theme-card p-4">
              <input
                placeholder="Nombre comuna"
                value={newZone.comuna}
                onChange={(e) =>
                  setNewZone({ ...newZone, comuna: e.target.value })
                }
                className={`flex-1 min-w-[140px] ${inputCls}`}
              />
              <input
                type="number"
                placeholder="Costo CLP"
                value={newZone.delivery_cost}
                onChange={(e) =>
                  setNewZone({
                    ...newZone,
                    delivery_cost: Number(e.target.value),
                  })
                }
                className={`w-28 ${inputCls}`}
              />
              <button
                type="button"
                onClick={addZone}
                className="rounded bg-gold px-4 py-2 text-sm font-bold text-black"
              >
                Agregar comuna
              </button>
            </div>
            <div className="space-y-3">
              {[...zones]
                .sort((a, b) =>
                  a.comuna.localeCompare(b.comuna, "es", { sensitivity: "base" })
                )
                .map((z) => (
                  <ZoneCostEditor
                    key={z.id}
                    zone={z}
                    inputCls={inputCls}
                    onSave={saveZone}
                    onDelete={deleteZone}
                  />
                ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
