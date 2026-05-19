import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getJwtRole(key: string): string | null {
  try {
    const part = key.split(".")[1];
    const json = Buffer.from(part, "base64url").toString("utf8");
    const payload = JSON.parse(json) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"
    );
  }

  const role = getJwtRole(key);
  if (role && role !== "service_role") {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY incorrecta: tiene rol "${role}". ` +
        "En Supabase → Settings → API copia la clave service_role (secreta), no la anon."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
