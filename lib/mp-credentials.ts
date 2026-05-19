/** Segmento identificador tras APP_USR- (misma app → mismo valor). */
export function mpCredentialAppId(credential: string): string | null {
  const parts = credential.trim().split("-");
  if (parts[0] !== "APP_USR" || !parts[1]) return null;
  return parts[1];
}

export function validateMpCredentialPair(): void {
  const token = process.env.MP_ACCESS_TOKEN?.trim() || "";
  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.trim() || "";

  if (!token || !publicKey) return;

  if (publicKey.length < 40) {
    throw new Error(
      `NEXT_PUBLIC_MP_PUBLIC_KEY parece incompleta (${publicKey.length} caracteres). Copia la Public Key completa de producción.`
    );
  }

  const tokenApp = mpCredentialAppId(token);
  const pubApp = mpCredentialAppId(publicKey);

  if (tokenApp && pubApp && tokenApp !== pubApp) {
    throw new Error(
      `Credenciales de Mercado Pago de aplicaciones distintas (token app ${tokenApp} vs public key app ${pubApp}). Copia ambas desde la misma app: Tus integraciones → Credenciales de producción.`
    );
  }
}
