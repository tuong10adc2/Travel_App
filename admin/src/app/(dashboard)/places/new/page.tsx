"use client";

import { useRouter } from "next/navigation";
import { addDoc, collection, GeoPoint, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { logAction } from "@/lib/audit-log";
import { PageHeader } from "@/components/layout/page-header";
import { PlaceForm, type PlaceFormValues } from "@/components/places/place-form";

// Domain webapp (Vercel) — nơi host /api/notify-new-place thay cho Cloud Function
// notifyNewPlace cũ (chặn bởi Blaze). Xem migration-vercel-ai.md.
const WEBAPP_API_BASE_URL = "https://travel-app-6rww.vercel.app";

export default function NewPlacePage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  async function handleSubmit(values: PlaceFormValues) {
    const docRef = await addDoc(collection(db, "places"), {
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
      ratingAvg: 0,
      ratingCount: 0,
      isFeatured: values.isFeatured,
      isActive: values.isActive,
      has360: false,
      createdBy: user?.uid ?? "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await logAction(user, "tạo địa điểm", { type: "place", id: docRef.id, label: values.name });
    if (values.isActive && user) {
      const idToken = await user.getIdToken();
      fetch(`${WEBAPP_API_BASE_URL}/api/notify-new-place`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ placeId: docRef.id, placeName: values.name }),
      }).catch(() => {});
    }
    toast.success("Đã tạo địa điểm mới.");
    router.push("/places");
  }

  return (
    <div>
      <PageHeader title="Thêm địa điểm" description="Tạo địa điểm mới cho hệ thống" />
      <PlaceForm submitLabel="Tạo địa điểm" onSubmit={handleSubmit} />
    </div>
  );
}
