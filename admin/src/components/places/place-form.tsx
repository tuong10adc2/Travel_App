"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { cn } from "@/lib/cn";
import { PLACE_TAGS, WEEKDAYS, type Place } from "@/lib/types";

export interface PlaceFormValues {
  name: string;
  description: string;
  address: string;
  tags: string[];
  coverImage: string;
  images: string[];
  openingHours: Record<string, string>;
  ticketPrice: number;
  visitDurationMinutes: number;
  latitude?: number;
  longitude?: number;
  isFeatured: boolean;
  isActive: boolean;
}

const EMPTY: PlaceFormValues = {
  name: "",
  description: "",
  address: "",
  tags: [],
  coverImage: "",
  images: [],
  openingHours: {},
  ticketPrice: 0,
  visitDurationMinutes: 60,
  isFeatured: false,
  isActive: true,
};

export function placeToFormValues(p: Place): PlaceFormValues {
  return {
    name: p.name,
    description: p.description,
    address: p.address,
    tags: p.tags ?? [],
    coverImage: p.coverImage ?? "",
    images: p.images ?? [],
    openingHours: p.openingHours ?? {},
    ticketPrice: p.ticketPrice ?? 0,
    visitDurationMinutes: p.visitDurationMinutes ?? 60,
    latitude: p.location?.latitude,
    longitude: p.location?.longitude,
    isFeatured: p.isFeatured ?? false,
    isActive: p.isActive ?? true,
  };
}

export function PlaceForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: PlaceFormValues;
  submitLabel: string;
  onSubmit: (values: PlaceFormValues) => Promise<void>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<PlaceFormValues>(initial ?? EMPTY);
  const [tagInput, setTagInput] = useState("");
  const [imagesText, setImagesText] = useState((initial?.images ?? []).join("\n"));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof PlaceFormValues>(key: K, value: PlaceFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleTag(tag: string) {
    setValues((v) =>
      v.tags.includes(tag) ? { ...v, tags: v.tags.filter((t) => t !== tag) } : { ...v, tags: [...v.tags, tag] }
    );
  }

  function addCustomTag() {
    const tag = tagInput.trim();
    if (tag && !values.tags.includes(tag)) {
      update("tags", [...values.tags, tag]);
    }
    setTagInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.name.trim()) {
      setError("Vui lòng nhập tên địa điểm.");
      return;
    }
    setSubmitting(true);
    try {
      const images = imagesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      await onSubmit({ ...values, images });
    } catch (err) {
      setError((err as Error)?.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tên địa điểm *">
              <Input
                value={values.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="vd: Vịnh Hạ Long"
                required
              />
            </Field>
            <Field label="Địa chỉ">
              <Input
                value={values.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="vd: Quảng Ninh, Việt Nam"
              />
            </Field>
          </div>
          <Field label="Mô tả">
            <Textarea
              rows={4}
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Giới thiệu ngắn gọn về địa điểm..."
            />
          </Field>
          <Field label="Tag phân loại">
            <div className="flex flex-wrap gap-2">
              {PLACE_TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    values.tags.includes(tag)
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
                  )}
                >
                  {tag}
                </button>
              ))}
              {values.tags
                .filter((t) => !(PLACE_TAGS as readonly string[]).includes(t))
                .map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full border border-brand-600 bg-brand-600 px-3 py-1 text-xs font-medium text-white"
                  >
                    {tag}
                    <button type="button" onClick={() => toggleTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
            </div>
            <div className="mt-2 flex max-w-xs gap-2">
              <Input
                placeholder="Thêm tag khác..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomTag}>
                Thêm
              </Button>
            </div>
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hình ảnh</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <Field label="Ảnh bìa" hint="Tải ảnh lên (cần Storage đã bật) hoặc dán URL ảnh có sẵn.">
            <ImageUploadField
              value={values.coverImage}
              onChange={(url) => update("coverImage", url)}
              storagePath="places/covers"
            />
          </Field>
          <Field label="Thư viện ảnh (mỗi dòng 1 URL)">
            <Textarea
              rows={3}
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              placeholder={"https://...\nhttps://..."}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết tham quan</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Giá vé (VNĐ)">
              <Input
                type="number"
                min={0}
                value={values.ticketPrice}
                onChange={(e) => update("ticketPrice", Number(e.target.value))}
              />
            </Field>
            <Field label="Thời gian tham quan (phút)">
              <Input
                type="number"
                min={0}
                value={values.visitDurationMinutes}
                onChange={(e) => update("visitDurationMinutes", Number(e.target.value))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Vĩ độ (latitude)" hint="Tuỳ chọn — dùng cho bản đồ">
              <Input
                type="number"
                step="any"
                value={values.latitude ?? ""}
                onChange={(e) =>
                  update("latitude", e.target.value === "" ? undefined : Number(e.target.value))
                }
              />
            </Field>
            <Field label="Kinh độ (longitude)">
              <Input
                type="number"
                step="any"
                value={values.longitude ?? ""}
                onChange={(e) =>
                  update("longitude", e.target.value === "" ? undefined : Number(e.target.value))
                }
              />
            </Field>
          </div>
          <Field label="Giờ mở cửa" hint="Để trống nếu mở cửa cả ngày / không áp dụng">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {WEEKDAYS.map((d) => (
                <div key={d.key} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-sm text-muted-foreground">{d.label}</span>
                  <Input
                    placeholder="08:00-17:00"
                    value={values.openingHours[d.key] ?? ""}
                    onChange={(e) =>
                      update("openingHours", { ...values.openingHours, [d.key]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hiển thị</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
              checked={values.isActive}
              onChange={(e) => update("isActive", e.target.checked)}
            />
            Đang hoạt động (hiển thị cho người dùng)
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
              checked={values.isFeatured}
              onChange={(e) => update("isFeatured", e.target.checked)}
            />
            Nổi bật (ưu tiên hiển thị ở trang chủ)
          </label>
        </CardBody>
      </Card>

      {error && (
        <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Huỷ
        </Button>
      </div>
    </form>
  );
}
