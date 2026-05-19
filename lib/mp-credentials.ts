/** Validaciones básicas de credenciales MP (no comparan prefijos: siempre son distintos). */
export function validateMpCredentialPair(): void {
  const token = process.env.MP_ACCESS_TOKEN?.trim() || "";
  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.trim() || "";

  if (!token || !publicKey) return;

  if (!token.startsWith("APP_USR-") && !token.startsWith("TEST-")) {
    throw new Error(
      "MP_ACCESS_TOKEN no parece de Mercado Pago (debe empezar con APP_USR- o TEST-)."
    );
  }

  if (!publicKey.startsWith("APP_USR-") && !publicKey.startsWith("TEST-")) {
    throw new Error(
      "NEXT_PUBLIC_MP_PUBLIC_KEY no parece de Mercado Pago (debe empezar con APP_USR-)."
    );
  }

  if (token === publicKey) {
    throw new Error(
      "MP_ACCESS_TOKEN y NEXT_PUBLIC_MP_PUBLIC_KEY no pueden ser el mismo valor. Copia la Public Key en una variable y el Access Token en la otra."
    );
  }

  if (token.length < 50) {
    throw new Error(
      `MP_ACCESS_TOKEN parece incompleto (${token.length} caracteres). Copia el Access Token completo.`
    );
  }

  if (publicKey.length < 40) {
    throw new Error(
      `NEXT_PUBLIC_MP_PUBLIC_KEY parece incompleta (${publicKey.length} caracteres). Copia la Public Key completa.`
    );
  }
}
