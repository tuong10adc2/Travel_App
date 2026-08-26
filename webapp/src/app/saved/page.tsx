"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { Heart } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { RequireAuth } from "@/components/require-auth";
import { PlaceCard } from "@/components/place-card";
import { Reveal } from "@/components/ui/reveal";
import { useTranslations } from "@/contexts/language-context";
import type { Place, SavedPlace } from "@/lib/types";

function SavedInner() {
  const { user } = useAuth();
  const t = useTranslations();
  const [saved, setSaved] = useState<SavedPlace[]>([]);
  const [places, setPlaces] = useState<Record<string, Place>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "saved_places"), where("userId", "==", user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setSaved(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SavedPlace, "id">) })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const missing = saved.map((s) => s.placeId).filter((id) => !places[id]);
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
  }, [saved, places]);

  const list = saved.map((s) => places[s.placeId]).filter((p): p is Place => !!p);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t("saved.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("saved.subtitle")}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-16 text-center text-muted-foreground">
          <Heart className="mx-auto mb-3 h-6 w-6 opacity-40" />
          {t("saved.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((p, i) => (
            <Reveal key={p.id} delay={(i % 8) * 60} y={16}>
              <PlaceCard place={p} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SavedPage() {
  return (
    <RequireAuth>
      <SavedInner />
    </RequireAuth>
  );
}
