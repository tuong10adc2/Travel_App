"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

const TILE = 260;

// Chấm rải trong 1 ô lặp (toạ độ cố định, không random) — cùng tinh thần
// `Random(7)` seed cố định ở bản Flutter.
const DOTS: Array<[number, number, number]> = [
  [30, 30, 2.2], [95, 55, 1.6], [150, 20, 1.9], [210, 45, 1.4],
  [45, 130, 1.7], [120, 150, 2.0], [190, 120, 1.5], [235, 160, 1.8],
  [20, 220, 1.6], [80, 235, 1.9], [160, 215, 1.4], [230, 240, 1.7],
];

/// Họa tiết đường cong mềm + chấm nhỏ dùng chung cho webapp — cùng "họ" hoạ
/// tiết với `PatternOverlay` bên Flutter (`lib/core/widgets/background_blobs.dart`).
///
/// Dùng SVG `<pattern>` lặp lại theo 1 ô kích thước **cố định (px thật)**
/// thay vì 1 `viewBox` kéo giãn theo % container — cách cũ khiến chấm/đường
/// bị phóng to thô trên màn hình rộng vì cùng 1 hình bị stretch theo tỉ lệ
/// container thay vì giữ nguyên kích thước vật lý. Với `<pattern>`, ô luôn
/// đúng `260x260px` bất kể khung to hay nhỏ — màn rộng chỉ lặp lại nhiều ô
/// hơn, không phóng to từng chấm.
export function PatternOverlay({
  color = "var(--brand-600)",
  opacity = 1,
  className,
}: {
  color?: string;
  opacity?: number;
  className?: string;
}) {
  const id = `pattern-overlay-${useId().replace(/:/g, "")}`;

  return (
    <svg className={cn("pointer-events-none absolute inset-0 h-full w-full", className)} aria-hidden="true">
      <defs>
        <pattern id={id} width={TILE} height={TILE} patternUnits="userSpaceOnUse">
          <g stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity={0.16 * opacity}>
            <path d={`M0,80 Q65,50 130,80 T${TILE},80`} />
            <path d={`M0,180 Q65,205 130,175 T${TILE},180`} />
          </g>
          <g fill={color} opacity={0.24 * opacity}>
            {DOTS.map(([x, y, r], i) => (
              <circle key={i} cx={x} cy={y} r={r} />
            ))}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
