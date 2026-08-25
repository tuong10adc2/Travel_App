"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  collection,
  getCountFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import {
  Search,
  MapPin,
  Sparkles,
  Compass,
  MessageCircle,
  View,
  CalendarRange,
  Languages,
  ArrowRight,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { PlaceCard } from "@/components/place-card";
import type { Place } from "@/lib/types";

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Trợ lý AI hỏi đáp",
    desc: "Hỏi về lịch sử, văn hoá, ẩm thực hay địa điểm ẩn — AI gợi ý đúng nơi phù hợp sở thích của bạn.",
  },
  {
    icon: View,
    title: "Trải nghiệm VR 360°",
    desc: "Xem trước không gian thực tế tại từng địa điểm trước khi đặt chân tới, xoay 360° mượt mà.",
  },
  {
    icon: CalendarRange,
    title: "Lịch trình thông minh",
    desc: "Tạo lịch trình theo ngày, thêm/sắp xếp điểm đến tự do, biến tour gợi ý thành hành trình của riêng bạn.",
  },
  {
    icon: Languages,
    title: "Đa ngôn ngữ",
    desc: "Giao diện và trợ lý hỗ trợ tiếng Việt và tiếng Anh, phù hợp cả du khách trong và ngoài nước.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [featured, setFeatured] = useState<Place[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [stats, setStats] = useState({ places: 0, with360: 0, tours: 0 });

  useEffect(() => {
    const q = query(
      collection(db, "places"),
      where("isActive", "==", true),
      where("isFeatured", "==", true),
      orderBy("createdAt", "desc"),
      limit(6)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setFeatured(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Place, "id">) })));
        setLoadingFeatured(false);
      },
      () => setLoadingFeatured(false)
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    async function loadStats() {
      try {
        const [placesSnap, with360Snap, toursSnap] = await Promise.all([
          getCountFromServer(query(collection(db, "places"), where("isActive", "==", true))),
          getCountFromServer(
            query(collection(db, "places"), where("isActive", "==", true), where("has360", "==", true))
          ),
          getCountFromServer(query(collection(db, "tours"), where("isActive", "==", true))),
        ]);
        setStats({
          places: placesSnap.data().count,
          with360: with360Snap.data().count,
          tours: toursSnap.data().count,
        });
      } catch {
        // thống kê chỉ mang tính minh hoạ, bỏ qua nếu lỗi
      }
    }
    loadStats();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(search.trim() ? `/explore?q=${encodeURIComponent(search.trim())}` : "/explore");
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -top-24 h-72 w-72 animate-pulse-slow rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-16 h-80 w-80 animate-pulse-slow rounded-full bg-accent-500/20 blur-3xl [animation-delay:1.5s]" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
          <Reveal y={16}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Trợ lý du lịch AI cho Việt Nam
            </div>
          </Reveal>
          <Reveal y={16} delay={80}>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Người bạn đồng hành AI cho
              <br className="hidden sm:block" /> mọi nẻo đường Việt Nam
            </h1>
          </Reveal>
          <Reveal y={16} delay={160}>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/85 sm:text-lg">
              Trợ lý du lịch số riêng bạn — mang đến tri thức bản địa và dẫn đường thông minh
              tới mọi miền đất nước.
            </p>
          </Reveal>

          <Reveal y={16} delay={240}>
            <form
              onSubmit={handleSearch}
              className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-2 shadow-xl shadow-brand-900/30"
            >
              <Search className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Bạn muốn đi đâu tiếp theo?"
                className="h-11 flex-1 border-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <Button type="submit" size="lg">
                Khám phá ngay
              </Button>
            </form>
          </Reveal>

          <Reveal y={16} delay={320}>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm text-white/80">
              <Link href="/chat" className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 transition-colors hover:bg-white/20">
                <MessageCircle className="h-3.5 w-3.5" /> Hỏi trợ lý AI
              </Link>
              <Link href="/tours" className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 transition-colors hover:bg-white/20">
                <Compass className="h-3.5 w-3.5" /> Xem tour gợi ý
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
          {[
            { value: `${stats.places}+`, label: "Địa điểm & di tích" },
            { value: `${stats.with360}`, label: "Trải nghiệm VR 360°" },
            { value: `${stats.tours}+`, label: "Tour gợi ý sẵn" },
            { value: "24/7", label: "Đồng hành cùng AI" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 80} className="text-center">
              <p className="text-3xl font-bold text-brand-700">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Tương lai của hành trình khám phá
          </h2>
          <p className="mt-3 text-muted-foreground">
            Công nghệ tinh tế hoà quyện cùng am hiểu bản địa.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 90}>
              <div className="group h-full rounded-2xl border border-border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                  <f.icon className="h-5.5 w-5.5" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured places */}
      <section className="bg-surface-muted py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Địa điểm nổi bật</h2>
              <p className="mt-2 text-muted-foreground">Những điểm đến được yêu thích nhất</p>
            </div>
            <Link href="/explore" className="hidden items-center gap-1 text-sm font-medium text-brand-700 hover:underline sm:flex">
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
          {loadingFeatured ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-white" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center text-muted-foreground">
              <MapPin className="mx-auto mb-3 h-6 w-6 opacity-40" />
              Chưa có địa điểm nổi bật nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 90}>
                  <PlaceCard place={p} />
                </Reveal>
              ))}
            </div>
          )}
          <div className="mt-8 text-center sm:hidden">
            <Link href="/explore">
              <Button variant="outline">Xem tất cả địa điểm</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-8 py-12 text-center text-white sm:flex-row sm:text-left">
            <div>
              <h2 className="text-2xl font-bold">Sẵn sàng cho chuyến đi tiếp theo?</h2>
              <p className="mt-2 text-white/80">
                Tạo lịch trình cá nhân hoặc hỏi trợ lý AI ngay hôm nay.
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <Link href="/itineraries/new">
                <Button variant="white" size="lg">
                  Tạo lịch trình
                </Button>
              </Link>
              <Link href="/chat">
                <Button variant="outlineInverse" size="lg">
                  Hỏi trợ lý AI
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
