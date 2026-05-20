export type DeliveryType = "despacho" | "retiro" | "region";

export function deliveryTypeLabel(type: DeliveryType): string {
  switch (type) {
    case "despacho":
      return "Despacho";
    case "retiro":
      return "Retiro";
    case "region":
      return "Envío a región";
  }
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
