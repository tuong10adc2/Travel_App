"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

function NewItineraryInner() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const start = Timestamp.fromDate(new Date(startDate));
      const ref = await addDoc(collection(db, "itineraries"), {
        userId: user.uid,
        name: name.trim() || "Lịch trình của tôi",
        startDate: start,
        endDate: start,
        isShared: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      router.push(`/itineraries/${ref.id}`);
    } catch {
      toast.error("Không thể tạo lịch trình.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Tạo lịch trình mới</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-white p-6">
        <Field label="Tên lịch trình">
          <Input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="vd: Hè ở Đà Lạt"
          />
        </Field>
        <Field label="Ngày bắt đầu">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Button type="submit" className="w-full" loading={submitting}>
          Tạo lịch trình
        </Button>
      </form>
    </div>
  );
}

export default function NewItineraryPage() {
  return (
    <RequireAuth>
      <NewItineraryInner />
    </RequireAuth>
  );
}
