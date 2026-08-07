"use client";

import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { logAction } from "@/lib/audit-log";
import { PageHeader } from "@/components/layout/page-header";
import { TourForm, type TourFormValues } from "@/components/tours/tour-form";

export default function NewTourPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  async function handleSubmit(values: TourFormValues) {
    const docRef = await addDoc(collection(db, "tours"), {
      name: values.name.trim(),
      description: values.description.trim(),
      placeIds: values.placeIds,
      coverImage: values.coverImage,
      price: values.price,
      durationDays: values.durationDays,
      isActive: values.isActive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await logAction(user, "tạo tour", { type: "tour", id: docRef.id, label: values.name });
    toast.success("Đã tạo tour mới.");
    router.push("/tours");
  }

  return (
    <div>
      <PageHeader title="Thêm tour" description="Tạo gói lịch trình dựng sẵn" />
      <TourForm submitLabel="Tạo tour" onSubmit={handleSubmit} />
    </div>
  );
}
