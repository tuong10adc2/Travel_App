"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { logAction } from "@/lib/audit-log";
import { PageHeader } from "@/components/layout/page-header";
import { TourForm, tourToFormValues, type TourFormValues } from "@/components/tours/tour-form";
import type { Tour } from "@/lib/types";

export default function EditTourPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDoc(doc(db, "tours", params.id))
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists()) {
          setTour({ id: snap.id, ...(snap.data() as Omit<Tour, "id">) });
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function handleSubmit(values: TourFormValues) {
    await updateDoc(doc(db, "tours", params.id), {
      name: values.name.trim(),
      description: values.description.trim(),
      placeIds: values.placeIds,
      coverImage: values.coverImage,
      price: values.price,
      durationDays: values.durationDays,
      isActive: values.isActive,
      updatedAt: serverTimestamp(),
    });
    await logAction(user, "cập nhật tour", { type: "tour", id: params.id, label: values.name });
    toast.success("Đã lưu thay đổi.");
    router.push("/tours");
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (notFound || !tour) {
    return <p className="text-sm text-muted-foreground">Không tìm thấy tour.</p>;
  }

  return (
    <div>
      <PageHeader title={`Sửa: ${tour.name}`} description="Cập nhật thông tin tour" />
      <TourForm initial={tourToFormValues(tour)} submitLabel="Lưu thay đổi" onSubmit={handleSubmit} />
    </div>
  );
}
