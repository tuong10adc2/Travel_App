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
  Sparkles,
  Star,
  Ticket,
  Utensils,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { formatOpeningHours } from "@/lib/opening-hours";
import { PlaceImage } from "@/components/ui/place-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveToggleButton } from "@/components/save-toggle-button";
import { AddToItineraryButton } from "@/components/add-to-itinerary-button";
import { ReviewSection } from "@/components/reviews/review-section";
import { useTranslations, useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import type { Place } from "@/lib/types";

interface PlaceTranslation {
  description: string;
  highlights: string[];
  foodToTry: string[];
}

export default function PlaceDetailPage() {
  const params = useParams<{ id: string }>();
  const t = useTranslations();
  const { language } = useLanguage();
  const { user } = useAuth();

  function formatVnd(n: number) {
    return n > 0 ? n.toLocaleString("vi-VN") + " đ" : t("placeDetail.free");
  }

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [translation, setTranslation] = useState<PlaceTranslation | null>(null);

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

  // Chế độ tiếng Anh chỉ dịch được UI tĩnh (messages/en.json) và tag cố định — description/
  // highlights/foodToTry là nội dung tự do nhập trong Firestore nên phải gọi riêng
  // /api/translate-place (dịch bằng Claude, cache lại trong chính doc places/{id}). Reset về
  // null khi đổi ngôn ngữ/đổi trang để không hiện nhầm bản dịch của địa điểm trước.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ theo khoá (language, place) đổi, giống cách language-context.tsx làm.
    setTranslation(null);
    if (language !== "en" || !place) return;
    let cancelled = false;
    // Không bắt buộc đăng nhập mới gọi — trang này xem công khai được, và server đã tự cho đọc
    // bản dịch cache mà không cần token (chỉ dịch MỚI mới cần). Có đăng nhập thì gửi kèm token để
    // lỡ chưa ai dịch trước, chính người này có thể kích hoạt dịch mới.
    Promise.resolve(user?.getIdToken())
      .then((idToken) =>
        fetch("/api/translate-place", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({ placeId: place.id }),
        })
      )
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data && !data.error) setTranslation(data as PlaceTranslation);
      })
      .catch(() => {
        // Lỗi dịch không chặn trang — người dùng vẫn thấy nội dung tiếng Việt gốc.
      });
    return () => {
      cancelled = true;
    };
  }, [language, user, place]);

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

  // dedupe: `images` từ import cũ thường đã chứa sẵn coverImage làm phần tử đầu, nếu ghép thẳng
  // [coverImage, ...images] sẽ hiện 2 ảnh giống hệt nhau trong gallery.
  const gallery = Array.from(new Set([place.coverImage, ...(place.images ?? [])])).filter(Boolean);
  const hours = formatOpeningHours(place.openingHours);
  const description = translation?.description || place.description;
  const highlights = translation?.highlights?.length ? translation.highlights : place.highlights;
  const foodToTry = translation?.foodToTry?.length ? translation.foodToTry : place.foodToTry;

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

            <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground">{description}</p>

            {highlights && highlights.length > 0 && (
              <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                  <Sparkles className="h-4 w-4" /> {t("placeDetail.highlightsHeading")}
                </h3>
                <ul className="space-y-1.5 text-sm text-foreground">
                  {highlights.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-brand-600">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {foodToTry && foodToTry.length > 0 && (
              <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                  <Utensils className="h-4 w-4" /> {t("placeDetail.foodToTryHeading")}
                </h3>
                <ul className="space-y-1.5 text-sm text-foreground">
                  {foodToTry.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-brand-600">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

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

            {place.location && (
              <div className="mt-6">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                  <MapPin className="h-4 w-4" /> {t("placeDetail.mapHeading")}
                </h3>
                <div className="overflow-hidden rounded-2xl border border-border">
                  <iframe
                    title={`Bản đồ ${place.name}`}
                    className="h-64 w-full"
                    loading="lazy"
                    src={`https://maps.google.com/maps?q=${place.location.latitude},${place.location.longitude}&z=15&output=embed`}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-10">
            <ReviewSection targetType="place" targetId={place.id} />
          </div>
        </div>

        <div className="sticky top-24 h-fit space-y-3 rounded-2xl border border-border bg-surface p-5">
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
