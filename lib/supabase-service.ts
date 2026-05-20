/**
 * Llamadas directas a PostgREST con service_role (evita problemas de RLS con el SDK).
 */

function getServiceConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"
    );
  }
  if (key.startsWith("eyJ") === false) {
    // ok
  }
  return { url, key };
}

export async function serviceRpc<T>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T> {
  const { url, key } = getServiceConfig();
  const res = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const err = data as { message?: string; code?: string };
    throw new Error(
      err?.message ||
        `Supabase RPC ${functionName} falló (${res.status})`
    );
  }

  return data as T;
}

export async function serviceInsertOrder(row: Record<string, unknown>) {
  const { url, key } = getServiceConfig();
  const res = await fetch(`${url}/rest/v1/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = data as { message?: string; code?: string };
    throw new Error(
      err?.message || `No se pudo insertar pedido (${res.status})`
    );
  }

  const rows = data as { id: number }[];
  return rows[0]?.id;
}

export async function serviceGetOrder(orderId: number) {
  const { url, key } = getServiceConfig();
  const res = await fetch(
    `${url}/rest/v1/orders?id=eq.${orderId}&select=*&limit=1`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = data as { message?: string };
    throw new Error(err?.message || `No se pudo leer pedido (${res.status})`);
  }

  const rows = (await res.json()) as Record<string, unknown>[];
  const row = rows[0];
  if (!row) return null;

  return row as {
    id: number;
    delivery_type: "despacho" | "retiro";
    address: string | null;
    comuna: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    observaciones: string | null;
    subtotal: number;
    delivery_cost: number;
    total: number;
    items: { id: number; name: string; qty: number; price: number }[];
  };
}

/** Actualiza pedido por REST (orders tiene RLS desactivado en fix-orders-rls.sql) */
export async function serviceUpdateOrder(
  orderId: number,
  fields: Record<string, unknown>
) {
  const { url, key } = getServiceConfig();
  const res = await fetch(`${url}/rest/v1/orders?id=eq.${orderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(fields),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = data as { message?: string };
    throw new Error(err?.message || `No se pudo actualizar pedido (${res.status})`);
  }
}
