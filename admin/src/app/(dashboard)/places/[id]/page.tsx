"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, GeoPoint, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { logAction } from "@/lib/audit-log";
import { PageHeader } from "@/components/layout/page-header";
import {
  PlaceForm,
  placeToFormValues,
  type PlaceFormValues,
} from "@/components/places/place-form";
import type { Place } from "@/lib/types";

export default function EditPlacePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDoc(doc(db, "places", params.id))
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists()) {
          setPlace({ id: snap.id, ...(snap.data() as Omit<Place, "id">) });
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

  async function handleSubmit(values: PlaceFormValues) {
    await updateDoc(doc(db, "places", params.id), {
      name: values.name.trim(),
      description: values.description.trim(),
      address: values.address.trim(),
      tags: values.tags,
      coverImage: values.coverImage,
      images: values.images,
      openingHours: values.openingHours,
      ticketPrice: values.ticketPrice,
      visitDurationMinutes: values.visitDurationMinutes,
      location:
        values.latitude != null && values.longitude != null
          ? new GeoPoint(values.latitude, values.longitude)
          : null,
      isFeatured: values.isFeatured,
      isActive: values.isActive,
      updatedAt: serverTimestamp(),
    });
    await logAction(user, "cập nhật địa điểm", {
      type: "place",
      id: params.id,
      label: values.name,
    });
    toast.success("Đã lưu thay đổi.");
    router.push("/places");
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (notFound || !place) {
    return <p className="text-sm text-muted-foreground">Không tìm thấy địa điểm.</p>;
  }

  return (
    <div>
      <PageHeader title={`Sửa: ${place.name}`} description="Cập nhật thông tin địa điểm" />
      <PlaceForm
        initial={placeToFormValues(place)}
        submitLabel="Lưu thay đổi"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
