"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { Product } from "@/types";
import { formatCLP } from "@/lib/format";
import { isSupabaseStorageUrl } from "@/lib/image-optimization";
import { getProductEmoji } from "@/lib/product-emoji";

type Props = {
  product: Product;
  onClose: () => void;
};

/** Modal centrado solo para previsualizar la foto del producto */
export default function ProductImageModal({ product, onClose }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Previsualización: ${product.name}`}
      className="fixed inset-0 z-[800] flex items-center justify-center p-4 sm:p-8"
      style={{ background: "rgba(0,0,0,0.88)" }}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/20 sm:right-6 sm:top-6"
        aria-label="Cerrar"
      >
        ✕
      </button>

      <div
        className="animate-modal-in flex max-h-[90vh] w-full max-w-2xl flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex max-h-[min(75vh,640px)] w-full items-center justify-center">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              width={900}
              height={900}
              className="max-h-[min(75vh,640px)] w-auto max-w-full rounded-lg object-contain shadow-2xl"
              sizes="(max-width: 768px) 100vw, 672px"
              priority
              unoptimized={isSupabaseStorageUrl(product.image_url)}
            />
          ) : (
            <div
              className="flex min-h-[280px] w-full items-center justify-center rounded-xl"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(232,168,32,0.12), rgba(255,255,255,0.05))",
              }}
            >
              <span className="text-[7rem]">{getProductEmoji(product)}</span>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="font-bebas text-2xl tracking-wide text-white sm:text-3xl">
            {product.name}
          </p>
          <p className="mt-1 font-bebas text-xl text-gold sm:text-2xl">
            {formatCLP(product.price)}
          </p>
          <p className="text-sm text-white/50">por {product.unit}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}
