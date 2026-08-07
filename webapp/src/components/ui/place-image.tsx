"use client";

import { useState } from "react";
import { Landmark, Mountain, UtensilsCrossed, Palette, Waves, Trees, Sparkles, Building2, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";

const TAG_ICON: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  "Lịch sử": Landmark,
  "Thiên nhiên": Mountain,
  "Ẩm thực": UtensilsCrossed,
  "Văn hoá": Palette,
  "Biển đảo": Waves,
  "Núi rừng": Trees,
  "Tâm linh": Sparkles,
  "Đô thị": Building2,
};

const GRADIENTS = [
  "from-brand-600 to-brand-800",
  "from-accent-500 to-accent-600",
  "from-brand-500 to-brand-900",
];

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function PlaceImage({
  src,
  alt,
  tags = [],
  className,
}: {
  src?: string;
  alt: string;
  tags?: string[];
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const Icon = TAG_ICON[tags[0]] ?? MapPin;
  const gradient = GRADIENTS[hashStr(alt) % GRADIENTS.length];

  if (src && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        onError={() => setBroken(true)}
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br text-white/90",
        gradient,
        className
      )}
    >
      <Icon className="h-1/4 w-1/4 min-h-6 min-w-6" strokeWidth={1.5} />
    </div>
  );
}
