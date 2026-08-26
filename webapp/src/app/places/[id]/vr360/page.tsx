"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, doc, getDoc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { ArrowLeft, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { useTranslations } from "@/contexts/language-context";
import { cn } from "@/lib/cn";
import type { Media360, Place } from "@/lib/types";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";

export default function PlaceVr360Page() {
  const params = useParams<{ id: string }>();
  const t = useTranslations();
  const placeId = params.id;
  const [place, setPlace] = useState<Place | null>(null);
  const [items, setItems] = useState<Media360[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    getDoc(doc(db, "places", placeId)).then((snap) => {
      if (snap.exists()) setPlace({ id: snap.id, ...(snap.data() as Omit<Place, "id">) });
    });
  }, [placeId]);

  useEffect(() => {
    const q = query(collection(db, "media_360"), where("placeId", "==", placeId), orderBy("order", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Media360, "id">) }));
        setItems(list);
        setActiveId((prev) => prev ?? list[0]?.id ?? null);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [placeId]);

  const active = items.find((i) => i.id === activeId);

  useEffect(() => {
    if (!active || !containerRef.current) return;
    let cancelled = false;

    async function mount() {
      const { Viewer } = await import("@photo-sphere-viewer/core");
      const { MarkersPlugin } = await import("@photo-sphere-viewer/markers-plugin");
      if (cancelled || !containerRef.current || !active) return;

      const markers = (active.hotspots ?? []).map((h, idx) => ({
        id: `hotspot-${idx}`,
        position: { yaw: `${h.yaw}deg`, pitch: `${h.pitch}deg` },
        html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9999px;background:rgba(14,124,102,0.9);color:white;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)">➜</div>`,
        tooltip: h.label,
        size: { width: 36, height: 36 },
        anchor: "center center",
        data: { targetMediaId: h.targetMediaId },
      }));

      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }

      const viewer = new Viewer({
        container: containerRef.current,
        panorama: active.url,
        navbar: ["zoom", "move", "fullscreen"],
        plugins: [[MarkersPlugin, { markers }]],
      });

      const markersPlugin = viewer.getPlugin(MarkersPlugin) as InstanceType<typeof MarkersPlugin>;
      markersPlugin?.addEventListener("select-marker", (e: { marker: { data?: { targetMediaId?: string } } }) => {
        const target = e.marker.data?.targetMediaId;
        if (target) setActiveId(target);
      });

      viewerRef.current = viewer;
    }

    mount();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, active?.url]);

  useEffect(() => {
    return () => {
      viewerRef.current?.destroy();
    };
  }, []);

  return (
    <div className="relative flex h-[calc(100vh-4rem)] flex-col bg-black">
      <div className="absolute left-4 top-4 z-10 flex items-center gap-3">
        <Link
          href={`/places/${placeId}`}
          className="flex items-center gap-1.5 rounded-full bg-black/50 px-3.5 py-2 text-sm text-white backdrop-blur hover:bg-black/70"
        >
          <ArrowLeft className="h-4 w-4" /> {place?.name ?? t("vr360.back")}
        </Link>
      </div>

      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-white/70">
            {t("vr360.empty")}
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {items.length > 1 && (
        <div className="flex justify-center gap-2 bg-black/80 px-4 py-3">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => setActiveId(it.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                activeId === it.id ? "bg-brand-500 text-white" : "bg-white/10 text-white/80 hover:bg-white/20"
              )}
            >
              {it.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
