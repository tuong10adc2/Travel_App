"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { CalendarPlus, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "@/contexts/language-context";
import { useToast } from "@/contexts/toast-context";
import { Button } from "@/components/ui/button";
import type { Itinerary } from "@/lib/types";

function dayCount(it: Itinerary): number {
  const start = (it.startDate as { toDate?: () => Date } | undefined)?.toDate?.();
  const end = (it.endDate as { toDate?: () => Date } | undefined)?.toDate?.();
  if (!start || !end) return 1;
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return Math.max(1, diff + 1);
}

export function AddToItineraryButton({
  placeId,
  placeName,
  className,
}: {
  placeId: string;
  placeName: string;
  className?: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [dayIndex, setDayIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  async function openModal() {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/places/${placeId}`)}`);
      return;
    }
    setOpen(true);
    setLoading(true);
    setDayIndex(0);
    try {
      const snap = await getDocs(
        query(collection(db, "itineraries"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))
      );
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Itinerary, "id">) }));
      setItineraries(list);
      if (list.length > 0) setSelectedId(list[0].id);
    } catch {
      toast.error(t("addToItinerary.toastLoadFailed"));
    } finally {
      setLoading(false);
    }
  }

  const selected = itineraries.find((i) => i.id === selectedId);

  async function handleAdd() {
    if (!selected || !user) return;
    setSubmitting(true);
    try {
      const itemsSnap = await getDocs(
        query(collection(db, "itineraries", selected.id, "itinerary_items"), where("dayIndex", "==", dayIndex))
      );
      await addDoc(collection(db, "itineraries", selected.id, "itinerary_items"), {
        placeId,
        dayIndex,
        order: itemsSnap.size,
        note: "",
        createdAt: serverTimestamp(),
      });
      toast.success(t("addToItinerary.toastAdded", { place: placeName, itinerary: selected.name }));
      setOpen(false);
    } catch {
      toast.error(t("addToItinerary.toastAddFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={openModal} className={className}>
        <CalendarPlus className="h-4 w-4" /> {t("addToItinerary.button")}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">{t("addToItinerary.modalTitle")}</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
            ) : itineraries.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {t("addToItinerary.empty")}{" "}
                <Link href="/itineraries/new" className="font-medium text-brand-700 hover:underline">
                  {t("addToItinerary.createNew")}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{t("addToItinerary.itineraryLabel")}</label>
                  <select
                    className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                    value={selectedId}
                    onChange={(e) => {
                      setSelectedId(e.target.value);
                      setDayIndex(0);
                    }}
                  >
                    {itineraries.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selected && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t("addToItinerary.dayLabel")}</label>
                    <select
                      className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                      value={dayIndex}
                      onChange={(e) => setDayIndex(Number(e.target.value))}
                    >
                      {Array.from({ length: dayCount(selected) }).map((_, i) => (
                        <option key={i} value={i}>
                          {t("addToItinerary.dayOption", { n: i + 1 })}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <Button className="w-full" onClick={handleAdd} loading={submitting} disabled={!selected}>
                  {t("addToItinerary.button")}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
