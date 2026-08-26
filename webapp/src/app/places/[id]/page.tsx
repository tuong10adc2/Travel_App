"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import {
  ArrowLeft,
  Clock,
  Loader2,
  MapPin,
  Star,
  Ticket,
  View,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { formatOpeningHours } from "@/lib/opening-hours";
import { PlaceImage } from "@/components/ui/place-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveToggleButton } from "@/components/save-toggle-button";
import { AddToItineraryButton } from "@/components/add-to-itinerary-button";
import { ReviewSection } from "@/components/reviews/review-section";
import { useTranslations } from "@/contexts/language-context";
import type { Place } from "@/lib/types";

export default function PlaceDetailPage() {
  const params = useParams<{ id: string }>();
  const t = useTranslations();

  function formatVnd(n: number) {
    return n > 0 ? n.toLocaleString("vi-VN") + " đ" : t("placeDetail.free");
  }

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getDoc(doc(db, "places", params.id))
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists() && (snap.data() as Place).isActive !== false) {
          setPlace({ id: snap.id, ...(snap.data() as Omit<Place, "id">) });
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (notFound || !place) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-muted-foreground">{t("placeDetail.notFound")}</p>
        <Link href="/explore" className="mt-4 inline-block text-brand-700 hover:underline">
          {t("placeDetail.backToExplore")}
        </Link>
      </div>
    );
  }

  const gallery = [place.coverImage, ...(place.images ?? [])].filter(Boolean);
  const hours = formatOpeningHours(place.openingHours);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/explore"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t("placeDetail.backToExplore")}
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl">
            <PlaceImage
              src={gallery[activeImage]}
              alt={place.name}
              tags={place.tags}
              className="h-72 w-full sm:h-96"
            />
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                    activeImage === i ? "border-brand-600" : "border-transparent"
                  }`}
                >
                  <PlaceImage src={img} alt={`${place.name} ${i}`} tags={place.tags} className="h-full w-full" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {place.tags?.map((t) => (
                    <Badge key={t} tone="brand">{t}</Badge>
                  ))}
                  {place.has360 && <Badge tone="accent">VR 360°</Badge>}
                </div>
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{place.name}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" /> {place.address}
                </p>
              </div>
              <SaveToggleButton placeId={place.id} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-5 text-sm">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Star className="h-4 w-4 fill-warning-600 text-warning-600" />
                {place.ratingAvg?.toFixed(1) ?? "—"}
                <span className="font-normal text-muted-foreground">{t("placeDetail.ratingCount", { count: place.ratingCount ?? 0 })}</span>
              </span>
              {place.visitDurationMinutes ? (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {t("placeDetail.visitDuration", { hours: (place.visitDurationMinutes / 60).toFixed(1) })}
                </span>
              ) : null}
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Ticket className="h-4 w-4" /> {formatVnd(place.ticketPrice)}
              </span>
            </div>

            <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground">{place.description}</p>

            {hours.length > 0 && (
              <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                  <Clock className="h-4 w-4" /> {t("placeDetail.openingHours")}
                </h3>
                <dl className="grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
                  {hours.map((h) => (
                    <div key={h.label} className="flex justify-between border-b border-border/60 py-1">
                      <dt className="text-muted-foreground">{h.label}</dt>
                      <dd className="text-foreground">{h.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          <div className="mt-10">
            <ReviewSection targetType="place" targetId={place.id} />
          </div>
        </div>

        <div className="sticky top-24 h-fit space-y-3 rounded-2xl border border-border bg-surface p-5">
          {place.has360 && (
            <Link href={`/places/${place.id}/vr360`} className="block">
              <Button className="w-full" size="lg">
                <View className="h-4.5 w-4.5" /> {t("placeDetail.experienceVr360")}
              </Button>
            </Link>
          )}
          <AddToItineraryButton placeId={place.id} placeName={place.name} className="w-full" />
          <Link href="/chat" className="block">
            <Button variant="ghost" className="w-full">
              {t("placeDetail.askAiAboutPlace")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
