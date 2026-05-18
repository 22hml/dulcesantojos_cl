"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Order, OrderStatus, Product } from "@/types";
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

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, oRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/orders"),
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (oRes.ok) setOrders(await oRes.json());
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
    if (res.ok) {
      setAuthed(true);
      loadData();
    } else {
      const data = await res.json();
      setLoginError(data.error || "Error al iniciar sesión");
    }
  }

  async function updateProduct(id: number, fields: Partial<Product>) {
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...fields }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? updated : p))
      );
    }
  }

  async function updateOrderStatus(id: number, status: OrderStatus) {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? updated : o))
      );
    }
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-rose-100 bg-white p-8 shadow-lg"
        >
          <h1 className="font-display text-2xl font-bold text-cocoa">
            Panel Admin
          </h1>
          <p className="mt-1 text-sm text-cocoa/60">Dulces Antojos</p>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-6 w-full rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
          />
          {loginError && (
            <p className="mt-2 text-sm text-red-600">{loginError}</p>
          )}
          <button
            type="submit"
            className="mt-4 w-full rounded-full bg-rose-500 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"
          >
            Entrar
          </button>
          <Link href="/" className="mt-4 block text-center text-sm text-rose-500">
            ← Volver al sitio
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-rose-100 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="font-display text-xl font-bold text-cocoa">
            Admin · Dulces Antojos
          </h1>
          <Link href="/" className="text-sm text-rose-500 hover:underline">
            Ver tienda
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("products")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === "products"
                ? "bg-rose-500 text-white"
                : "bg-white text-cocoa ring-1 ring-rose-100"
            }`}
          >
            Productos
          </button>
          <button
            type="button"
            onClick={() => setTab("orders")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === "orders"
                ? "bg-rose-500 text-white"
                : "bg-white text-cocoa ring-1 ring-rose-100"
            }`}
          >
            Pedidos
          </button>
        </div>

        {loading && (
          <p className="mb-4 text-sm text-cocoa/50">Actualizando…</p>
        )}

        {tab === "products" && (
          <div className="space-y-4">
            {products.length === 0 ? (
              <p className="text-cocoa/60">
                No hay productos. Crea las tablas en Supabase y agrega datos.
              </p>
            ) : (
              products.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-rose-100 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-cocoa">{p.name}</p>
                      <p className="text-xs text-cocoa/50">{p.category}</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <span>Stock</span>
                      <input
                        type="number"
                        defaultValue={p.stock}
                        onBlur={(e) =>
                          updateProduct(p.id, {
                            stock: Number(e.target.value),
                          })
                        }
                        className="w-20 rounded-lg border border-rose-200 px-2 py-1"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <span>Precio</span>
                      <input
                        type="number"
                        defaultValue={p.price}
                        onBlur={(e) =>
                          updateProduct(p.id, {
                            price: Number(e.target.value),
                          })
                        }
                        className="w-28 rounded-lg border border-rose-200 px-2 py-1"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        defaultChecked={p.active}
                        onChange={(e) =>
                          updateProduct(p.id, { active: e.target.checked })
                        }
                      />
                      Activo
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-cocoa/60">Sin pedidos aún.</p>
            ) : (
              orders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-xl border border-rose-100 bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-cocoa">
                        Pedido #{o.id} · {formatCLP(o.total)}
                      </p>
                      <p className="text-sm text-cocoa/60">
                        {o.customer_phone} · {o.delivery_type}
                        {o.address && ` · ${o.address}`}
                      </p>
                    </div>
                    <select
                      value={o.status}
                      onChange={(e) =>
                        updateOrderStatus(o.id, e.target.value as OrderStatus)
                      }
                      className="rounded-lg border border-rose-200 px-2 py-1 text-sm"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ul className="mt-2 text-sm text-cocoa/70">
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
      </main>
    </div>
  );
}
