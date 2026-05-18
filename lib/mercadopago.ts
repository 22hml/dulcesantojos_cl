import { MercadoPagoConfig } from "mercadopago";

export function getMercadoPagoConfig() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MP_ACCESS_TOKEN no configurado");
  }
  return new MercadoPagoConfig({ accessToken });
}
