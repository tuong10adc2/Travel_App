"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Search, MapPin } from "lucide-react";
import { db } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { PatternOverlay } from "@/components/ui/pattern-overlay";
import { Reveal } from "@/components/ui/reveal";
import { PlaceCard } from "@/components/place-card";
import { useTranslations } from "@/contexts/language-context";
import { cn } from "@/lib/cn";
import { PLACE_TAGS, type Place } from "@/lib/types";

function ExploreInner() {
  const searchParams = useSearchParams();
  const t = useTranslations();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "places"), where("isActive", "==", true));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPlaces(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Place, "id">) })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return places
      .filter((p) => (s ? p.name?.toLowerCase().includes(s) || p.address?.toLowerCase().includes(s) : true))
      .filter((p) => (selectedTag ? p.tags?.includes(selectedTag) : true))
      .sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  }, [places, search, selectedTag]);

  return (
    <div className="relative overflow-hidden">
      <PatternOverlay />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t("explore.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("explore.subtitle")}</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder={t("explore.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag(null)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              selectedTag === null
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
            )}
          >
            {t("explore.all")}
          </button>
          {PLACE_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                selectedTag === tag
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{t("explore.resultCount", { count: filtered.length })}</p>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-16 text-center text-muted-foreground">
          <MapPin className="mx-auto mb-3 h-6 w-6 opacity-40" />
          {t("explore.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p, i) => (
            <Reveal key={p.id} delay={(i % 8) * 60} y={16}>
              <PlaceCard place={p} />
            </Reveal>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <ExploreInner />
    </Suspense>
  );
}
