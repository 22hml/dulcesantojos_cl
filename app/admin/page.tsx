"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { DeliveryZone, Order, OrderStatus, Product } from "@/types";
import { formatCLP } from "@/lib/format";

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "preparing",
  "sent",
  "done",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  preparing: "Preparando",
  sent: "Enviado",
  done: "Listo",
};

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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, oRes, zRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/orders"),
        fetch("/api/admin/delivery-zones"),
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (oRes.ok) setOrders(await oRes.json());
      if (zRes.ok) setZones(await zRes.json());
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

  async function saveZone(z: DeliveryZone) {
    await fetch("/api/admin/delivery-zones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(z),
    });
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
          <p className="mt-1 text-sm text-theme-muted">Dulces Antojos</p>
          <p className="mt-3 text-xs text-theme-muted">
            La clave va en <code className="text-gold">.env.local</code> como{" "}
            <code className="text-gold">ADMIN_PASSWORD</code>
          </p>
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

  return (
    <div className="min-h-screen bg-theme-base">
      <header className="border-b border-theme bg-theme-card px-4 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <h1 className="font-bebas text-2xl tracking-wide text-theme">
            ADMIN · DULCES ANTOJOS
          </h1>
          <Link href="/" className="text-sm text-gold hover:underline">
            Ver tienda →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {(
            [
              ["products", "Productos"],
              ["orders", "Pedidos"],
              ["zones", "Despacho"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded px-4 py-2 text-sm font-medium ${
                tab === id
                  ? "bg-gold text-black"
                  : "border border-theme text-theme-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <p className="mb-4 text-sm text-theme-muted">Actualizando…</p>
        )}

        {tab === "products" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setEditing(emptyProduct())}
              className="rounded bg-gold px-4 py-2 text-sm font-bold text-black"
            >
              + Nuevo producto
            </button>

            {editing && (
              <div className="rounded-lg border border-gold/30 bg-theme-card p-4 sm:p-6">
                <h2 className="mb-4 font-bebas text-xl text-theme">
                  {editing.id ? "Editar producto" : "Nuevo producto"}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    placeholder="Nombre *"
                    value={editing.name || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                    className={inputCls}
                  />
                  <input
                    placeholder="Categoría"
                    value={editing.category || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, category: e.target.value })
                    }
                    className={inputCls}
                  />
                  <input
                    type="number"
                    placeholder="Precio CLP *"
                    value={editing.price || ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        price: Number(e.target.value),
                      })
                    }
                    className={inputCls}
                  />
                  <input
                    placeholder="Unidad (caja, c/u...)"
                    value={editing.unit || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, unit: e.target.value })
                    }
                    className={inputCls}
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    value={editing.stock ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        stock: Number(e.target.value),
                      })
                    }
                    className={inputCls}
                  />
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
                  <input
                    placeholder="Destacado (Más pedida, Nuevo...)"
                    value={editing.highlight || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, highlight: e.target.value })
                    }
                    className={inputCls}
                  />
                  <label className="flex items-center gap-2 text-sm text-theme">
                    <input
                      type="checkbox"
                      checked={editing.active !== false}
                      onChange={(e) =>
                        setEditing({ ...editing, active: e.target.checked })
                      }
                    />
                    Activo en tienda
                  </label>
                </div>
                <textarea
                  placeholder="Descripción"
                  value={editing.description || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                  className={`mt-3 ${inputCls}`}
                  rows={3}
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer rounded border border-theme px-3 py-2 text-sm text-theme">
                    {uploading ? "Subiendo…" : "📷 Subir foto"}
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
                    <div className="relative h-16 w-16 overflow-hidden rounded">
                      <Image
                        src={editing.image_url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={saveProduct}
                    className="rounded bg-gold px-4 py-2 text-sm font-bold text-black"
                  >
                    Guardar
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

            {products.map((p) => (
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
                  <p className="font-semibold text-theme">{p.name}</p>
                  <p className="text-xs text-theme-muted">
                    {p.mode} · {p.category} · {formatCLP(p.price)} · Stock{" "}
                    {p.stock}
                  </p>
                </div>
                <div className="flex gap-2">
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
            ))}
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-theme-muted">Sin pedidos aún.</p>
            ) : (
              orders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-lg border border-theme bg-theme-card p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-theme">
                        Pedido #{o.id} · {formatCLP(o.total)}
                      </p>
                      <p className="text-sm text-theme-muted">
                        {o.customer_phone}
                        {o.customer_name && ` · ${o.customer_name}`}
                      </p>
                      <p className="text-sm text-theme-muted">
                        {o.delivery_type}
                        {o.address && ` · ${o.address}`}
                        {o.comuna && ` · ${o.comuna}`}
                      </p>
                    </div>
                    <select
                      value={o.status}
                      onChange={(e) =>
                        updateOrderStatus(o.id, e.target.value as OrderStatus)
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
                  <ul className="mt-2 text-sm text-theme-muted">
                    {o.items?.map((item, i) => (
                      <li key={i}>
                        {item.qty}x {item.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "zones" && (
          <div className="space-y-4">
            <p className="text-sm text-theme-muted">
              Define el costo de despacho por comuna. Los clientes lo ven al
              elegir despacho en el carrito.
            </p>
            <div className="flex flex-wrap gap-2 rounded-lg border border-theme bg-theme-card p-4">
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
                Agregar
              </button>
            </div>
            {zones.map((z) => (
              <div
                key={z.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-theme bg-theme-card p-3"
              >
                <span className="flex-1 font-medium text-theme">{z.comuna}</span>
                <input
                  type="number"
                  defaultValue={z.delivery_cost}
                  onBlur={(e) =>
                    saveZone({ ...z, delivery_cost: Number(e.target.value) })
                  }
                  className={`w-28 ${inputCls}`}
                />
                <button
                  type="button"
                  onClick={() => deleteZone(z.id)}
                  className="text-sm text-red-400"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
