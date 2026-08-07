import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "brand",
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "brand" | "success" | "warning" | "danger";
  loading?: boolean;
}) {
  const toneClasses = {
    brand: "bg-brand-50 text-brand-600",
    success: "bg-success-50 text-success-600",
    warning: "bg-warning-50 text-warning-600",
    danger: "bg-danger-50 text-danger-600",
  }[tone];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", toneClasses)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold text-foreground">
            {loading ? "—" : value}
          </p>
        </div>
      </div>
    </Card>
  );
}
