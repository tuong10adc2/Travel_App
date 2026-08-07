"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { ArrowLeft, Clock, Loader2, MapPin, Package, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { PlaceImage } from "@/components/ui/place-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ReviewSection } from "@/components/reviews/review-section";
import type { Place, Tour } from "@/lib/types";

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + " đ";
}

export default function TourDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const [tour, setTour] = useState<Tour | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const snap = await getDoc(doc(db, "tours", params.id));
      if (cancelled) return;
      if (!snap.exists()) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const t = { id: snap.id, ...(snap.data() as Omit<Tour, "id">) };
      setTour(t);
      setName(t.name);
      const placeSnaps = await Promise.all(t.placeIds.map((id) => getDoc(doc(db, "places", id))));
      if (cancelled) return;
      setPlaces(
        placeSnaps
          .filter((s) => s.exists())
          .map((s) => ({ id: s.id, ...(s.data() as Omit<Place, "id">) }))
      );
      setLoading(false);
    }
    load().catch(() => setNotFound(true));
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  function openModal() {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/tours/${params.id}`)}`);
      return;
    }
    setModalOpen(true);
  }

  async function handleCreate() {
    if (!tour || !user) return;
    setSubmitting(true);
    try {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + Math.max(1, tour.durationDays) - 1);

      const itineraryRef = await addDoc(collection(db, "itineraries"), {
        userId: user.uid,
        name: name.trim() || tour.name,
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
        isShared: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const perDay = Math.ceil(tour.placeIds.length / Math.max(1, tour.durationDays));
      const batch = writeBatch(db);
      tour.placeIds.forEach((placeId, idx) => {
        const dayIndex = Math.min(Math.floor(idx / perDay), tour.durationDays - 1);
        const order = idx % perDay;
        const itemRef = doc(collection(db, "itineraries", itineraryRef.id, "itinerary_items"));
        batch.set(itemRef, { placeId, dayIndex, order, note: "", createdAt: serverTimestamp() });
      });
      await batch.commit();

      toast.success("Đã tạo lịch trình từ tour.");
      router.push(`/itineraries/${itineraryRef.id}`);
    } catch {
      toast.error("Không thể tạo lịch trình từ tour.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (notFound || !tour) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-muted-foreground">Không tìm thấy tour này.</p>
        <Link href="/tours" className="mt-4 inline-block text-brand-700 hover:underline">
          Quay lại danh sách tour
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/tours" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách tour
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlaceImage src={tour.coverImage} alt={tour.name} className="h-72 w-full rounded-2xl sm:h-96" />

          <div className="mt-6">
            <div className="mb-2 flex gap-1.5">
              <Badge tone="brand">{tour.durationDays} ngày</Badge>
              <Badge tone="neutral">{tour.placeIds.length} địa điểm</Badge>
            </div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{tour.name}</h1>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-foreground">{tour.description}</p>
          </div>

          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Địa điểm trong tour</h2>
            <div className="space-y-3">
              {places.map((p) => (
                <Link
                  key={p.id}
                  href={`/places/${p.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-white p-3 hover:bg-surface-muted"
                >
                  <PlaceImage src={p.coverImage} alt={p.name} tags={p.tags} className="h-16 w-20 shrink-0 rounded-lg" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{p.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" /> {p.address}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <ReviewSection targetType="tour" targetId={tour.id} />
          </div>
        </div>

        <div className="sticky top-24 h-fit rounded-2xl border border-border bg-white p-5">
          <p className="text-2xl font-bold text-brand-700">{formatVnd(tour.price)}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" /> {tour.durationDays} ngày · {tour.placeIds.length} địa điểm
          </p>
          <Button className="mt-4 w-full" size="lg" onClick={openModal}>
            <Package className="h-4.5 w-4.5" /> Thêm vào lịch trình của tôi
          </Button>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Tạo lịch trình từ tour</h3>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <Field label="Tên lịch trình">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Ngày bắt đầu">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Field>
              <Button className="w-full" onClick={handleCreate} loading={submitting}>
                Tạo lịch trình
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
