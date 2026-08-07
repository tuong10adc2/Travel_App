"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import type { Place, Tour } from "@/lib/types";

export interface TourFormValues {
  name: string;
  description: string;
  placeIds: string[];
  coverImage: string;
  price: number;
  durationDays: number;
  isActive: boolean;
}

const EMPTY: TourFormValues = {
  name: "",
  description: "",
  placeIds: [],
  coverImage: "",
  price: 0,
  durationDays: 1,
  isActive: true,
};

export function tourToFormValues(t: Tour): TourFormValues {
  return {
    name: t.name,
    description: t.description,
    placeIds: t.placeIds ?? [],
    coverImage: t.coverImage ?? "",
    price: t.price ?? 0,
    durationDays: t.durationDays ?? 1,
    isActive: t.isActive ?? true,
  };
}

export function TourForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: TourFormValues;
  submitLabel: string;
  onSubmit: (values: TourFormValues) => Promise<void>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<TourFormValues>(initial ?? EMPTY);
  const [places, setPlaces] = useState<Place[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "places"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) =>
      setPlaces(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Place, "id">) })))
    );
    return () => unsub();
  }, []);

  function update<K extends keyof TourFormValues>(key: K, value: TourFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function togglePlace(placeId: string) {
    setValues((v) =>
      v.placeIds.includes(placeId)
        ? { ...v, placeIds: v.placeIds.filter((id) => id !== placeId) }
        : { ...v, placeIds: [...v.placeIds, placeId] }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.name.trim()) {
      setError("Vui lòng nhập tên tour.");
      return;
    }
    if (values.placeIds.length === 0) {
      setError("Chọn ít nhất 1 địa điểm cho tour.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
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
          <CardTitle>Thông tin tour</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <Field label="Tên tour *">
            <Input
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="vd: Sa Pa mùa lúa chín"
              required
            />
          </Field>
          <Field label="Mô tả">
            <Textarea
              rows={4}
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Giá (VNĐ)">
              <Input
                type="number"
                min={0}
                value={values.price}
                onChange={(e) => update("price", Number(e.target.value))}
              />
            </Field>
            <Field label="Số ngày">
              <Input
                type="number"
                min={1}
                value={values.durationDays}
                onChange={(e) => update("durationDays", Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Ảnh bìa">
            <ImageUploadField
              value={values.coverImage}
              onChange={(url) => update("coverImage", url)}
              storagePath="tours/covers"
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Địa điểm trong tour ({values.placeIds.length} đã chọn)</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {places.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-muted"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
                  checked={values.placeIds.includes(p.id)}
                  onChange={() => togglePlace(p.id)}
                />
                <span className="truncate">{p.name}</span>
              </label>
            ))}
            {places.length === 0 && (
              <p className="text-sm text-muted-foreground">Chưa có địa điểm nào để chọn.</p>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
              checked={values.isActive}
              onChange={(e) => update("isActive", e.target.checked)}
            />
            Đang hoạt động (hiển thị cho người dùng)
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
