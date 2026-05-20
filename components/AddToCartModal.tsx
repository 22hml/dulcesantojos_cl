"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/context/CartContext";
import CartItemThumb from "@/components/CartItemThumb";

export default function AddToCartModal() {
  const { addedModal, closeAddedModal, openCart } = useCart();

  useEffect(() => {
    if (!addedModal) return;
    const t = window.setTimeout(closeAddedModal, 5000);
    return () => window.clearTimeout(t);
  }, [addedModal, closeAddedModal]);

  if (!addedModal) return null;

  const { product, qty } = addedModal;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[750] p-3 sm:p-4">
      <button
        type="button"
        className="pointer-events-auto absolute inset-0"
        aria-label="Cerrar"
        onClick={closeAddedModal}
      />
      <div
        role="status"
        className="animate-toast-in pointer-events-auto absolute bottom-20 right-3 w-[min(100%,280px)] rounded-lg border border-theme bg-theme-card p-3 shadow-xl sm:bottom-6 sm:right-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <CartItemThumb item={product} size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-gold">
              Agregado al carrito
            </p>
            <p className="truncate text-sm font-semibold text-theme">
              {product.name}
              {qty > 1 ? ` · ×${qty}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={closeAddedModal}
            className="shrink-0 text-theme-muted hover:text-theme"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="mt-2.5 flex gap-2">
          <button
            type="button"
            onClick={closeAddedModal}
            className="flex-1 rounded border border-theme py-2 font-outfit text-[0.65rem] font-semibold uppercase tracking-wide text-theme-muted transition hover:border-gold hover:text-gold"
          >
            Seguir
          </button>
          <button
            type="button"
            onClick={() => {
              closeAddedModal();
              openCart();
            }}
            className="flex-1 rounded bg-gold py-2 font-outfit text-[0.65rem] font-bold uppercase tracking-wide text-black transition hover:bg-gold-light"
          >
            Ver carrito
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

