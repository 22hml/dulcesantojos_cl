"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { getDiscountedPrice, type Product } from "@/types";
import { formatCLP } from "@/lib/format";
import { isSupabaseStorageUrl } from "@/lib/image-optimization";
import { getProductEmoji, getStockStatus } from "@/lib/product-emoji";
import { useCart } from "@/context/CartContext";
import ProductImageModal from "./ProductImageModal";

type Props = { product: Product };

function ZoomIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
    </svg>
  );
}

export default function ProductCard({ product }: Props) {
  const { addItem, setQty, cart } = useCart();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [descriptionCanExpand, setDescriptionCanExpand] = useState(false);
  const descriptionRef = useRef<HTMLSpanElement>(null);
  const qty = cart[product.id]?.qty ?? 0;
  const outOfStock = product.stock <= 0;
  const stock = getStockStatus(product.stock);
  const emoji = getProductEmoji(product);
  const finalPrice = getDiscountedPrice(product);
  const hasDiscount = !!product.discount_pct;

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;

    function updateOverflow() {
      const current = descriptionRef.current;
      if (!current || descriptionOpen) return;
      setDescriptionCanExpand(current.scrollHeight > current.clientHeight + 1);
    }

    updateOverflow();
    window.addEventListener("resize", updateOverflow);
    return () => window.removeEventListener("resize", updateOverflow);
  }, [product.description, descriptionOpen]);

  function changeQty(delta: number, openDrawer = false) {
    const next = qty + delta;
    if (next <= 0) {
      setQty(product.id, 0);
    } else if (next <= product.stock) {
      if (qty === 0 && delta > 0) {
        addItem(product, { openDrawer });
        if (delta > 1) setQty(product.id, next);
      } else {
        setQty(product.id, next);
      }
    }
  }

  return (
    <>
      <article className="group bg-card transition-colors hover:bg-card2">
        <div
          className="relative h-[180px] overflow-hidden sm:h-[220px]"
          style={{
            background: `linear-gradient(145deg, var(--img-gradient-from), var(--img-gradient-to))`,
          }}
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, 33vw"
              unoptimized={isSupabaseStorageUrl(product.image_url)}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-[6.5rem] transition-transform duration-300 group-hover:scale-105">
                {emoji}
              </span>
            </div>
          )}

          <span
            className={`pointer-events-none absolute left-3 top-3 rounded-sm px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider ${stock.className}`}
          >
            {stock.label}
          </span>
          {product.highlight && (
            <span className="pointer-events-none absolute right-3 top-3 rounded-sm bg-gold px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-black">
              {product.highlight}
            </span>
          )}
          {hasDiscount && (
            <span
              className={`pointer-events-none absolute right-3 rounded-sm bg-red-500 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-white shadow-lg ${
                product.highlight ? "top-11" : "top-3"
              }`}
            >
              -{product.discount_pct}% OFF
            </span>
          )}

          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-2.5 py-1.5 font-outfit text-[0.65rem] font-medium text-white opacity-0 shadow-lg backdrop-blur-sm transition hover:bg-black/70 group-hover:opacity-100 max-sm:opacity-90"
            aria-label={`Ver foto de ${product.name}`}
          >
            <ZoomIcon />
            <span className="hidden sm:inline">Ver foto</span>
          </button>
        </div>

        <div className="p-6 pb-7">
          <p className="mb-1.5 text-[0.65rem] font-medium uppercase tracking-[0.15em] text-gold-dark">
            {product.category}
          </p>
          <h3 className="font-bebas text-[1.45rem] leading-none tracking-wide text-theme">
            {product.name}
          </h3>
          {product.description && (
            <button
              type="button"
              onClick={() =>
                descriptionCanExpand && setDescriptionOpen((open) => !open)
              }
              className={`mt-2 block w-full text-left ${
                descriptionCanExpand ? "cursor-pointer" : "cursor-default"
              }`}
              aria-expanded={descriptionOpen}
            >
              <span
                ref={descriptionRef}
                className={`block overflow-hidden text-[0.82rem] font-light leading-relaxed text-gray transition-[max-height] duration-200 ${
                  descriptionOpen ? "max-h-none" : "max-h-[3.2rem]"
                }`}
              >
                {product.description}
              </span>
              {descriptionCanExpand && (
                <span className="mt-1 block text-[0.65rem] font-semibold uppercase tracking-wider text-gold/80">
                  {descriptionOpen ? "Ver menos" : "Ver descripción completa"}
                </span>
              )}
            </button>
          )}
          <div className="mt-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[0.62rem] uppercase tracking-wider text-gray">
                {hasDiscount ? "Oferta disponible" : "Precio"}
              </p>
              {hasDiscount && (
                <p className="font-outfit text-[0.72rem] text-gray line-through">
                  {formatCLP(product.price)}
                </p>
              )}
              <p className="font-bebas text-[1.75rem] leading-none text-gold">
                {formatCLP(finalPrice)}
              </p>
              <p className="text-[0.68rem] text-gray">por {product.unit}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => changeQty(-1)}
                disabled={qty === 0}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-theme bg-theme-card text-theme transition hover:border-gold hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
              >
                −
              </button>
              <span className="min-w-[22px] text-center text-[0.95rem] font-bold text-theme">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => changeQty(1)}
                disabled={outOfStock || qty >= product.stock}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-theme bg-theme-card text-theme transition hover:border-gold hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>
          <button
            type="button"
            disabled={outOfStock}
            onClick={() => changeQty(1)}
            className="mt-4 w-full rounded-sm border border-gold/30 bg-transparent py-3 font-outfit text-[0.78rem] font-semibold uppercase tracking-widest text-gold transition hover:border-gold hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
          >
            {outOfStock ? "Sin stock disponible" : "+ Agregar al pedido"}
          </button>
        </div>
      </article>

      {previewOpen && (
        <ProductImageModal
          product={product}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
