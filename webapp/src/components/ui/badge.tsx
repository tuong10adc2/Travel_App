import { cn } from "@/lib/cn";

type Tone = "brand" | "success" | "warning" | "danger" | "neutral" | "accent";

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700",
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-600",
  danger: "bg-danger-50 text-danger-600",
  neutral: "bg-surface-muted text-muted-foreground",
  accent: "bg-accent-500/15 text-accent-600",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
