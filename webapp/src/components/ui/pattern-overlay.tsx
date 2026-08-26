import { cn } from "@/lib/cn";

// Vị trí chấm cố định (không random mỗi lần render) — cùng tinh thần với
// `Random(7)` seed cố định ở bản Flutter, chỉ khác là toạ độ viết tay theo
// khung toạ độ 0-100 để khớp `viewBox`.
const DOTS: Array<[number, number, number]> = [
  [6, 14, 1.1], [18, 4, 0.8], [31, 22, 1.3], [46, 8, 0.9], [58, 18, 1.1],
  [72, 6, 0.8], [86, 16, 1.2], [95, 28, 0.9], [12, 38, 0.9], [27, 48, 1.2],
  [41, 36, 0.8], [63, 44, 1.1], [79, 38, 0.9], [90, 50, 1.3], [8, 62, 1.0],
  [22, 72, 0.8], [37, 66, 1.2], [52, 78, 0.9], [68, 68, 1.1], [83, 76, 0.8],
  [15, 88, 1.1], [44, 92, 0.9], [60, 86, 1.2], [77, 92, 0.8], [93, 84, 1.0],
];

/// Họa tiết đường cong mềm + chấm nhỏ dùng chung cho webapp — cùng "họ" hoạ
/// tiết với `PatternOverlay` bên Flutter (`lib/core/widgets/background_blobs.dart`)
/// để 2 nền tảng nhất quán. Đặt tuyệt đối phủ kín cha (`absolute inset-0`),
/// cha cần `relative` + `overflow-hidden`. `opacity` nhân thêm để giảm độ
/// đậm khi nền khung đã có màu riêng (vd banner nền brand đậm, chấm trắng
/// cần nhạt hơn nền trang).
export function PatternOverlay({
  color = "var(--brand-600)",
  opacity = 1,
  className,
}: {
  color?: string;
  opacity?: number;
  className?: string;
}) {
  return (
    <svg
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g stroke={color} strokeWidth="0.5" fill="none" strokeLinecap="round" opacity={0.16 * opacity}>
        <path d="M -2 8 Q 35 0 62 20 Q 86 38 102 28" />
        <path d="M -2 42 Q 28 55 55 38 Q 80 23 102 46" />
        <path d="M -2 78 Q 30 92 58 74 Q 82 60 102 80" />
      </g>
      <g fill={color} opacity={0.24 * opacity}>
        {DOTS.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>
    </svg>
  );
}
