"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatCLP } from "@/lib/format";
import type { DeliveryZone } from "@/types";

type Props = {
  zones: DeliveryZone[];
  value: string;
  onChange: (comuna: string) => void;
  inputClassName?: string;
  id?: string;
};

export default function ComunaSelect({
  zones,
  value,
  onChange,
  inputClassName = "",
  id,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const listboxId = `${id ?? generatedId}-listbox`;

  const sorted = useMemo(
    () =>
      [...zones].sort((a, b) =>
        a.comuna.localeCompare(b.comuna, "es", { sensitivity: "base" })
      ),
    [zones]
  );

  const selected = sorted.find((z) => z.comuna === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((z) => z.comuna.toLowerCase().includes(q));
  }, [sorted, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue = open
    ? query
    : selected
      ? `${selected.comuna} — ${formatCLP(selected.delivery_cost)}`
      : "";

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        placeholder="Buscar o elegir comuna…"
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        className={inputClassName}
      />
      {open && (
        <ul
          id={listboxId}
          className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded border border-theme bg-theme-card py-1 shadow-lg"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-theme-muted">
              Sin resultados
            </li>
          ) : (
            filtered.map((z) => (
              <li key={z.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={z.comuna === value}
                  className={`w-full px-3 py-2.5 text-left text-sm transition hover:bg-gold/10 ${
                    z.comuna === value ? "bg-gold/15 font-semibold text-theme" : "text-theme"
                  }`}
                  onClick={() => {
                    onChange(z.comuna);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  {z.comuna}
                  <span className="ml-2 text-gold">
                    {formatCLP(z.delivery_cost)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
