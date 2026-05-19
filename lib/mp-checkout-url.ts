import type { MpPreferenceResponse } from "@/lib/mercadopago-preference";

function isLocalHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h.includes("localhost") ||
    h.includes("127.0.0.1") ||
    h.startsWith("192.168.") ||
    h.endsWith(".local")
  );
}

export function isMpSandboxEnabled(): boolean {
  const flag = process.env.MP_USE_SANDBOX?.trim().toLowerCase();
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;
  return false;
}

/** Origen del navegador (solo informativo / sandbox local). */
export function resolveCheckoutAppUrl(
  req: Request,
  clientOrigin?: string
): string {
  const fromEnv = (
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ).replace(/\/$/, "");

  if (clientOrigin) {
    try {
      const u = new URL(clientOrigin);
      if (isLocalHost(u.host)) return u.origin;
    } catch {
      /* ignore */
    }
  }

  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "";
  if (host && isLocalHost(host)) {
    const proto = req.headers.get("x-forwarded-proto") || "http";
    return `${proto}://${host.split(",")[0].trim()}`;
  }

  return fromEnv;
}

/**
 * URL base para back_urls y webhooks.
 * Producción: siempre NEXT_PUBLIC_APP_URL (HTTPS).
 * Sandbox: permite localhost o dominio público.
 */
export function resolveMpBackBase(
  req: Request,
  clientOrigin?: string,
  useSandbox = isMpSandboxEnabled()
): string {
  const publicUrl = (
    process.env.NEXT_PUBLIC_APP_URL || ""
  ).replace(/\/$/, "");

  if (!useSandbox) {
    if (!publicUrl || isLocalHost(publicUrl)) {
      throw new Error(
        "Modo producción: configura NEXT_PUBLIC_APP_URL=https://dulcesantojos.cl (o tu dominio con HTTPS)."
      );
    }
    if (!publicUrl.startsWith("https://")) {
      throw new Error(
        "Modo producción: NEXT_PUBLIC_APP_URL debe usar HTTPS."
      );
    }
    return publicUrl;
  }

  const origin = resolveCheckoutAppUrl(req, clientOrigin);
  if (isLocalHost(origin) && publicUrl && !isLocalHost(publicUrl)) {
    return publicUrl;
  }
  return origin;
}

export function shouldUseMpSandbox(): boolean {
  return isMpSandboxEnabled();
}

export function pickMpCheckoutUrl(
  preference: Pick<MpPreferenceResponse, "init_point" | "sandbox_init_point">,
  useSandbox: boolean
): string | undefined {
  if (useSandbox) {
    return preference.sandbox_init_point || preference.init_point;
  }
  return preference.init_point || preference.sandbox_init_point;
}
