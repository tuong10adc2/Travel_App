import { WEEKDAYS } from "@/lib/types";
import type { OpeningHours } from "@/lib/types";

export function formatOpeningHours(hours?: OpeningHours): { label: string; value: string }[] {
  if (!hours || Object.keys(hours).length === 0) return [];
  const values = WEEKDAYS.map((d) => hours[d.key] ?? "Đóng cửa");
  const allSame = values.every((v) => v === values[0]);
  if (allSame) {
    return [{ label: "Cả tuần", value: values[0] }];
  }
  return WEEKDAYS.map((d) => ({ label: d.label, value: hours[d.key] ?? "Đóng cửa" }));
}
