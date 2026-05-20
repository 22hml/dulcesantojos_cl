"use client";

import { useEffect, useState } from "react";
import type { DeliveryZone } from "@/types";
import { formatCLP } from "@/lib/format";

type Props = {
  zone: DeliveryZone;
  inputCls: string;
  onSave: (zone: DeliveryZone, delivery_cost: number) => Promise<void>;
  onDelete: (id: number) => void;
};

export default function ZoneCostEditor({
  zone,
  inputCls,
  onSave,
  onDelete,
}: Props) {
  const [cost, setCost] = useState(zone.delivery_cost);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCost(zone.delivery_cost);
  }, [zone.delivery_cost]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(zone, cost);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-lg border border-theme bg-theme-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-theme-muted">
            Comuna
          </p>
          <p className="font-semibold text-theme">{zone.comuna}</p>
        </div>
        <div className="w-full sm:w-40">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-theme-muted">
            Costo despacho (CLP)
          </label>
          <input
            type="number"
            min={0}
            step={100}
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-theme-muted">
            Vista cliente: {formatCLP(cost)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || cost < 0}
            className="rounded bg-gold px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(zone.id)}
            className="rounded border border-red-500/40 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
          >
            Eliminar
          </button>
        </div>
      </div>
    </article>
  );
}
