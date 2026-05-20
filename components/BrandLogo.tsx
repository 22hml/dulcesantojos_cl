"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  className?: string;
  height?: number;
};

export default function BrandLogo({ className = "", height = 44 }: Props) {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return (
      <span className={`flex flex-col leading-none ${className}`}>
        <span className="font-bebas text-lg tracking-widest text-theme sm:text-xl">
          DULCES
        </span>
        <span className="font-script -mt-0.5 text-xl leading-[0.9] text-gold sm:text-[1.45rem]">
          Antojos
        </span>
      </span>
    );
  }

  return (
    <Image
      src="/logo.png"
      alt="Dulces Antojos"
      width={Math.round(height * 2.8)}
      height={height}
      className={`h-auto w-auto rounded-full object-contain ${className}`}
      style={{ height: `${height}px`, width: "auto", maxWidth: `${height}px` }}
      priority
      onError={() => setImgFailed(true)}
    />
  );
}
