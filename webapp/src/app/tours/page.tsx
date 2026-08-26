"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Package, Search } from "lucide-react";
import { db } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlaceImage } from "@/components/ui/place-image";
import { Reveal } from "@/components/ui/reveal";
import { useTranslations } from "@/contexts/language-context";
import type { Tour } from "@/lib/types";

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + " đ";
}

export default function ToursPage() {
  const t = useTranslations();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(db, "tours"), where("isActive", "==", true));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTours(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Tour, "id">) })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return tours.filter((tour) => (s ? tour.name?.toLowerCase().includes(s) : true));
  }, [tours, search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t("tours.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("tours.subtitle")}</p>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder={t("tours.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-16 text-center text-muted-foreground">
          <Package className="mx-auto mb-3 h-6 w-6 opacity-40" />
          {t("tours.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tour, i) => (
            <Reveal key={tour.id} delay={(i % 6) * 70} y={16}>
              <Link
                href={`/tours/${tour.id}`}
                className="group block overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/10"
              >
                <PlaceImage src={tour.coverImage} alt={tour.name} className="h-44 w-full transition-transform duration-300 group-hover:scale-105" />
                <div className="p-4">
                  <h3 className="line-clamp-1 font-semibold text-foreground">{tour.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{tour.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <Badge tone="brand">{t("tours.durationDays", { n: tour.durationDays })}</Badge>
                      <Badge tone="neutral">{t("tours.placeCount", { n: tour.placeIds?.length ?? 0 })}</Badge>
                    </div>
                    <span className="font-semibold text-brand-700">{formatVnd(tour.price)}</span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
