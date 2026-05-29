"use client";

import dynamic from "next/dynamic";
import { useCart } from "@/context/CartContext";

const CartDrawer = dynamic(() => import("@/components/CartDrawer"), {
  ssr: false,
  loading: () => null,
});

const AddToCartModal = dynamic(() => import("@/components/AddToCartModal"), {
  ssr: false,
  loading: () => null,
});

export default function CartLayer() {
  const { isOpen, addedModal } = useCart();

  return (
    <>
      {isOpen && <CartDrawer />}
      {addedModal && <AddToCartModal />}
    </>
  );
}
