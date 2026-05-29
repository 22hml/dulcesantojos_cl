"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { isSupabaseStorageUrl } from "@/lib/image-optimization";
import type { HeroSlot, HeroSlotKind } from "@/types/hero";
import type { Product } from "@/types";

type Props = {
  slots: HeroSlot[];
  products: Product[];
  inputCls: string;
  onUpdated: () => void;
};

export default function HeroSlotsEditor({
  slots,
  products,
  inputCls,
  onUpdated,
}: Props) {
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [savingSlot, setSavingSlot] = useState<number | null>(null);
  const [panelKind, setPanelKind] = useState<Record<number, HeroSlotKind>>({});

  const bySlot = Object.fromEntries(slots.map((s) => [s.slot, s])) as Record<
    number,
    HeroSlot
  >;

  useEffect(() => {
    setPanelKind({});
  }, [slots]);

  async function saveSlot(body: Record<string, unknown>) {
    const slot = Number(body.slot);
    setSavingSlot(slot);
    try {
      const res = await fetch("/api/admin/hero-slots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "No se pudo guardar");
        return;
      }
      setPanelKind((prev) => {
        const next = { ...prev };
        delete next[slot];
        return next;
      });
      onUpdated();
    } finally {
      setSavingSlot(null);
    }
  }

  async function uploadAndSaveCustom(slot: number, file: File, caption?: string) {
    setUploadingSlot(slot);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "hero");
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error al subir");
        return;
      }
      const current = bySlot[slot];
      await saveSlot({
        slot,
        kind: "custom",
        image_url: data.url,
        caption: caption ?? current?.caption ?? "",
        alt_text: current?.alt_text || caption || "Dulces Antojos",
      });
    } finally {
      setUploadingSlot(null);
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-gold/25 bg-theme-card p-4 sm:p-5">
      <h3 className="font-bebas text-xl tracking-wide text-theme">
        Fotos del <span className="text-gold">inicio</span>
      </h3>
      <p className="mt-1 text-sm text-theme-muted">
        Hasta 4 fotos: productos o imágenes propias (repostera, local, equipo). Sin
        configurar, se usan productos automáticos.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {([1, 2, 3, 4] as const).map((slot) => {
          const row = bySlot[slot] ?? {
            slot,
            kind: "empty" as const,
            product_id: null,
            image_url: null,
            caption: null,
            alt_text: null,
          };
          const uiKind = panelKind[slot] ?? row.kind;
          const busy = savingSlot === slot || uploadingSlot === slot;
          const previewUrl =
            uiKind === "custom"
              ? row.image_url
              : uiKind === "product" && row.product_id
                ? products.find((p) => p.id === row.product_id)?.image_url ||
                  row.image_url
                : null;
          const label =
            uiKind === "product"
              ? products.find((p) => p.id === row.product_id)?.name
              : uiKind === "custom"
                ? row.caption || "Foto libre"
                : null;

          return (
            <div
              key={slot}
              className="rounded-lg border border-theme bg-theme-elevated p-3"
            >
              <p className="mb-2 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-gold">
                Casilla {slot}
              </p>

              <div className="relative mx-auto mb-2 aspect-square w-full max-w-[140px] overflow-hidden rounded bg-theme-base">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt={label || `Casilla ${slot}`}
                    fill
                    className="object-cover"
                    unoptimized={isSupabaseStorageUrl(previewUrl)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl text-theme-muted">
                    {uiKind === "empty" ? "—" : "🧁"}
                  </div>
                )}
              </div>

              {label && (
                <p className="mb-2 truncate text-center text-xs font-medium text-theme">
                  {label}
                </p>
              )}

              <div className="mb-2 flex flex-wrap justify-center gap-1">
                {(
                  [
                    ["product", "Producto"],
                    ["custom", "Foto libre"],
                    ["empty", "Vacío"],
                  ] as const
                ).map(([kind, text]) => (
                  <button
                    key={kind}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (kind === "empty") {
                        saveSlot({ slot, kind: "empty" });
                        return;
                      }
                      setPanelKind((prev) => ({ ...prev, [slot]: kind }));
                    }}
                    className={`rounded px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide ${
                      uiKind === kind
                        ? "bg-gold text-black"
                        : "border border-theme text-theme-muted"
                    }`}
                  >
                    {text}
                  </button>
                ))}
              </div>

              {uiKind === "product" && (
                <select
                  className={`mb-2 w-full ${inputCls} text-xs`}
                  value={row.product_id ?? ""}
                  disabled={busy}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    if (id) saveSlot({ slot, kind: "product", product_id: id });
                  }}
                >
                  <option value="">Elegir producto…</option>
                  {products
                    .filter((p) => p.active)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              )}

              {uiKind === "custom" && (
                <div className="space-y-2">
                  <label className="block cursor-pointer rounded border border-dashed border-theme px-2 py-2 text-center text-[0.65rem] text-theme-muted hover:border-gold">
                    {uploadingSlot === slot ? "Subiendo…" : "📷 Subir o cambiar foto"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={busy}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadAndSaveCustom(slot, f, row.caption || undefined);
                      }}
                    />
                  </label>
                  <input
                    key={`${slot}-${row.caption}`}
                    placeholder="Texto opcional (ej. Nuestra repostera)"
                    defaultValue={row.caption || ""}
                    className={`${inputCls} text-xs`}
                    disabled={busy || !row.image_url}
                    onBlur={(e) => {
                      if (!row.image_url) return;
                      const caption = e.target.value.trim();
                      if (caption === (row.caption || "")) return;
                      saveSlot({
                        slot,
                        kind: "custom",
                        image_url: row.image_url,
                        caption,
                        alt_text: caption || row.alt_text || "Dulces Antojos",
                      });
                    }}
                  />
                </div>
              )}

              {uiKind === "empty" && (
                <p className="text-center text-[0.65rem] text-theme-muted">
                  Elige Producto o Foto libre arriba
                </p>
              )}

              {row.kind !== "empty" && uiKind === row.kind && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => saveSlot({ slot, kind: "empty" })}
                  className="mt-2 w-full rounded border border-red-500/30 py-1 text-[0.65rem] text-red-400"
                >
                  Quitar de la casilla
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}