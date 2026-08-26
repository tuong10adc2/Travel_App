"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import {
  ArrowLeft,
  CalendarPlus,
  GripVertical,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage, useTranslations } from "@/contexts/language-context";
import { useToast } from "@/contexts/toast-context";
import { RequireAuth } from "@/components/require-auth";
import { PlaceImage } from "@/components/ui/place-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Itinerary, ItineraryItem, Place } from "@/lib/types";

function toDate(ts: unknown): Date | null {
  return (ts as { toDate?: () => Date } | undefined)?.toDate?.() ?? null;
}

function dayCount(it: Itinerary): number {
  const start = toDate(it.startDate);
  const end = toDate(it.endDate);
  if (!start || !end) return 1;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
}

function dayLabel(it: Itinerary, dayIndex: number, t: (key: string, params?: Record<string, string | number>) => string, locale: string): string {
  const start = toDate(it.startDate);
  const dayText = t("common.day", { n: dayIndex + 1 });
  if (!start) return dayText;
  const d = new Date(start);
  d.setDate(d.getDate() + dayIndex);
  return `${dayText} · ${d.toLocaleDateString(locale)}`;
}

function PlacePickerModal({
  onPick,
  onClose,
}: {
  onPick: (place: Place) => void;
  onClose: () => void;
}) {
  const t = useTranslations();
  const [places, setPlaces] = useState<Place[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "places"), where("isActive", "==", true));
    getDocs(q).then((snap) => {
      setPlaces(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Place, "id">) })));
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return places.filter((p) => (s ? p.name?.toLowerCase().includes(s) : true));
  }, [places, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">{t("itineraryDetail.pickerTitle")}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={t("itineraryDetail.pickerSearchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto">
          {loading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("itineraryDetail.pickerEmpty")}</p>
          )}
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => onPick(p)}
              className="flex w-full items-center gap-3 rounded-xl border border-border p-2.5 text-left hover:bg-surface-muted"
            >
              <PlaceImage src={p.coverImage} alt={p.name} tags={p.tags} className="h-12 w-14 shrink-0 rounded-lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">{p.address}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ItineraryDetailInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const t = useTranslations();
  const { language } = useLanguage();
  const locale = language === "en" ? "en-US" : "vi-VN";

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [places, setPlaces] = useState<Record<string, Place>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pickerDay, setPickerDay] = useState<number | null>(null);
  const [dragging, setDragging] = useState<{ day: number; id: string } | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "itineraries", params.id),
      (snap) => {
        if (snap.exists()) {
          setItinerary({ id: snap.id, ...(snap.data() as Omit<Itinerary, "id">) });
        } else {
          setNotFound(true);
        }
        setLoading(false);
      },
      () => {
        setNotFound(true);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [params.id]);

  useEffect(() => {
    const q = query(
      collection(db, "itineraries", params.id, "itinerary_items"),
      orderBy("dayIndex", "asc"),
      orderBy("order", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ItineraryItem, "id">) })));
    });
    return () => unsub();
  }, [params.id]);

  useEffect(() => {
    const missing = [...new Set(items.map((i) => i.placeId))].filter((id) => !places[id]);
    if (missing.length === 0) return;
    Promise.all(missing.map((id) => getDoc(doc(db, "places", id)))).then((snaps) => {
      setPlaces((prev) => {
        const next = { ...prev };
        snaps.forEach((s) => {
          if (s.exists()) next[s.id] = { id: s.id, ...(s.data() as Omit<Place, "id">) };
        });
        return next;
      });
    });
  }, [items, places]);

  const days = useMemo(() => {
    if (!itinerary) return [];
    const n = dayCount(itinerary);
    return Array.from({ length: n }, (_, i) => i).map((dayIndex) => ({
      dayIndex,
      items: items.filter((it) => it.dayIndex === dayIndex),
    }));
  }, [itinerary, items]);

  async function handleAddDay() {
    if (!itinerary) return;
    const end = toDate(itinerary.endDate) ?? new Date();
    end.setDate(end.getDate() + 1);
    try {
      await updateDoc(doc(db, "itineraries", itinerary.id), {
        endDate: Timestamp.fromDate(end),
        updatedAt: serverTimestamp(),
      });
    } catch {
      toast.error(t("itineraryDetail.toastAddDayFailed"));
    }
  }

  async function handleAddPlace(place: Place) {
    if (pickerDay === null) return;
    try {
      const dayItems = items.filter((it) => it.dayIndex === pickerDay);
      await addDoc(collection(db, "itineraries", params.id, "itinerary_items"), {
        placeId: place.id,
        dayIndex: pickerDay,
        order: dayItems.length,
        note: "",
        createdAt: serverTimestamp(),
      });
      toast.success(t("itineraryDetail.toastAdded", { name: place.name }));
    } catch {
      toast.error(t("itineraryDetail.toastAddFailed"));
    } finally {
      setPickerDay(null);
    }
  }

  async function handleRemoveItem(itemId: string) {
    try {
      await deleteDoc(doc(db, "itineraries", params.id, "itinerary_items", itemId));
    } catch {
      toast.error(t("itineraryDetail.toastRemoveFailed"));
    }
  }

  async function handleDrop(dayIndex: number, targetId: string) {
    if (!dragging || dragging.day !== dayIndex || dragging.id === targetId) {
      setDragging(null);
      return;
    }
    const dayItems = [...items.filter((it) => it.dayIndex === dayIndex)];
    const fromIdx = dayItems.findIndex((it) => it.id === dragging.id);
    const toIdx = dayItems.findIndex((it) => it.id === targetId);
    if (fromIdx === -1 || toIdx === -1) {
      setDragging(null);
      return;
    }
    const [moved] = dayItems.splice(fromIdx, 1);
    dayItems.splice(toIdx, 0, moved);
    setDragging(null);

    const batch = writeBatch(db);
    dayItems.forEach((it, idx) => {
      batch.update(doc(db, "itineraries", params.id, "itinerary_items", it.id), { order: idx });
    });
    try {
      await batch.commit();
    } catch {
      toast.error(t("itineraryDetail.toastReorderFailed"));
    }
  }

  async function handleDeleteItinerary() {
    if (!itinerary || !confirm(t("itineraryDetail.confirmDelete", { name: itinerary.name }))) return;
    try {
      await deleteDoc(doc(db, "itineraries", itinerary.id));
      router.push("/itineraries");
    } catch {
      toast.error(t("itineraryDetail.toastDeleteFailed"));
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (notFound || !itinerary || itinerary.userId !== user?.uid) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-muted-foreground">{t("itineraryDetail.notFound")}</p>
        <Link href="/itineraries" className="mt-4 inline-block text-brand-700 hover:underline">
          {t("itineraryDetail.backToList")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/itineraries" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> {t("itineraryDetail.backToList")}
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{itinerary.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAddDay}>
            <CalendarPlus className="h-4 w-4" /> {t("itineraryDetail.addDay")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDeleteItinerary} className="hover:border-danger-600 hover:text-danger-600">
            <Trash2 className="h-4 w-4" /> {t("itineraryDetail.deleteItinerary")}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {days.map(({ dayIndex, items: dayItems }) => (
          <div key={dayIndex} className="rounded-2xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-foreground">{dayLabel(itinerary, dayIndex, t, locale)}</h2>
              <Button variant="secondary" size="sm" onClick={() => setPickerDay(dayIndex)}>
                <Plus className="h-3.5 w-3.5" /> {t("itineraryDetail.addPlace")}
              </Button>
            </div>

            {dayItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("itineraryDetail.emptyDay")}</p>
            ) : (
              <div className="space-y-2">
                {dayItems.map((item) => {
                  const place = places[item.placeId];
                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => setDragging({ day: dayIndex, id: item.id })}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(dayIndex, item.id)}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2.5 hover:bg-surface-muted"
                    >
                      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                      {place ? (
                        <>
                          <PlaceImage
                            src={place.coverImage}
                            alt={place.name}
                            tags={place.tags}
                            className="h-12 w-14 shrink-0 rounded-lg"
                          />
                          <Link href={`/places/${place.id}`} className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{place.name}</p>
                            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" /> {place.address}
                            </p>
                          </Link>
                        </>
                      ) : (
                        <div className="flex-1 text-sm text-muted-foreground">{t("common.loading")}</div>
                      )}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="shrink-0 text-muted-foreground hover:text-danger-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {pickerDay !== null && (
        <PlacePickerModal onPick={handleAddPlace} onClose={() => setPickerDay(null)} />
      )}
    </div>
  );
}

export default function ItineraryDetailPage() {
  return (
    <RequireAuth>
      <ItineraryDetailInner />
    </RequireAuth>
  );
}
