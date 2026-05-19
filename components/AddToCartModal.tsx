"use client";

import { useCart } from "@/context/CartContext";
import { getProductEmoji } from "@/lib/product-emoji";

export default function AddToCartModal() {
  const { addedModal, closeAddedModal, openCart } = useCart();

  if (!addedModal) return null;

  const { product, qty } = addedModal;
  const emoji = getProductEmoji(product);

  return (
    <div
      className="fixed inset-0 z-[800] flex items-center justify-center p-4"
      style={{ background: "var(--overlay)" }}
      onClick={closeAddedModal}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="animate-fade-in w-full max-w-sm rounded-lg border border-theme bg-theme-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-center text-4xl">{emoji}</p>
        <h3 className="mt-3 text-center font-bebas text-2xl tracking-wide text-theme">
          ¡Agregado al carrito!
        </h3>
        <p className="mt-2 text-center text-sm text-theme-muted">
          <span className="font-semibold text-gold">{product.name}</span>
          {qty > 1 ? ` · ${qty} unidades` : ""}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={closeAddedModal}
            className="flex-1 rounded border border-theme bg-transparent py-3 font-outfit text-xs font-semibold uppercase tracking-wider text-theme-muted transition hover:border-gold hover:text-gold"
          >
            Seguir comprando
          </button>
          <button
            type="button"
            onClick={() => {
              closeAddedModal();
              openCart();
            }}
            className="flex-1 rounded bg-gold py-3 font-outfit text-xs font-bold uppercase tracking-wider text-black transition hover:bg-gold-light"
          >
            Ver carrito
          </button>
        </div>
      </div>
    </div>
  );
}
