export type CartStockLine = {
  id: number;
  qty: number;
  name?: string;
};

export type StockIssue = {
  id: number;
  name: string;
  requested: number;
  available: number;
};

export type ProductStockSnapshot = {
  id: number;
  name: string;
  stock: number;
  active: boolean;
  price: number;
};

export function buildStockValidation(
  lines: CartStockLine[],
  products: ProductStockSnapshot[]
): { ok: boolean; issues: StockIssue[]; productsById: Record<number, ProductStockSnapshot> } {
  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));
  const issues: StockIssue[] = [];

  for (const line of lines) {
    const product = productsById[line.id];
    const name = product?.name ?? line.name ?? `Producto #${line.id}`;

    if (!product || !product.active) {
      issues.push({
        id: line.id,
        name,
        requested: line.qty,
        available: 0,
      });
      continue;
    }

    if (line.qty > product.stock) {
      issues.push({
        id: line.id,
        name,
        requested: line.qty,
        available: product.stock,
      });
    }
  }

  return { ok: issues.length === 0, issues, productsById };
}

export function formatStockIssuesMessage(issues: StockIssue[]): string {
  if (issues.length === 0) return "";
  return issues
    .map((i) => {
      if (i.available <= 0) {
        return `${i.name} ya no tiene stock disponible`;
      }
      return `${i.name}: pediste ${i.requested}, solo quedan ${i.available}`;
    })
    .join(". ");
}
