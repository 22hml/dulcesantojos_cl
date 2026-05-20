import Image from "next/image";
import type { Product } from "@/types";
import { getProductEmoji } from "@/lib/product-emoji";

type Props = {
  item: Pick<Product, "name" | "image_url" | "category" | "mode">;
  size?: number;
  className?: string;
};

export default function CartItemThumb({
  item,
  size = 48,
  className = "",
}: Props) {
  const emoji = getProductEmoji(item as Product);

  if (item.image_url) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-md border border-theme bg-theme-elevated ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={item.image_url}
          alt={item.name}
          fill
          className="object-cover"
          sizes={`${size}px`}
        />
      </div>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-md border border-theme bg-theme-elevated ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
      aria-hidden
    >
      {emoji}
    </span>
  );
}
