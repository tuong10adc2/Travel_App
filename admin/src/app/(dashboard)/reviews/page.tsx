"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Check, EyeOff, Sparkles, Star, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useConfirm } from "@/contexts/confirm-context";
import { logAction } from "@/lib/audit-log";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Review, ReviewStatus } from "@/lib/types";

const TABS: { key: ReviewStatus | "all"; label: string }[] = [
  { key: "pending", label: "Chờ duyệt" },
  { key: "approved", label: "Đã duyệt" },
  { key: "hidden", label: "Đã ẩn" },
  { key: "all", label: "Tất cả" },
];

function useLookup(kind: "places" | "tours" | "users") {
  const [cache, setCache] = useState<Record<string, string>>({});
  async function resolve(id: string) {
    if (!id || cache[id] !== undefined) return;
    try {
      const snap = await getDoc(doc(db, kind, id));
      const data = snap.data() as { name?: string; displayName?: string; email?: string } | undefined;
      const label = data ? data.name ?? data.displayName ?? data.email ?? id : "(đã xoá)";
      setCache((c) => ({ ...c, [id]: label }));
    } catch {
      setCache((c) => ({ ...c, [id]: id }));
    }
  }
  return { cache, resolve };
}

export default function ReviewsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Đang tải...</p>}>
      <ReviewsPageInner />
    </Suspense>
  );
}

function ReviewsPageInner() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const searchParams = useSearchParams();
  const userIdFilter = searchParams.get("userId");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ReviewStatus | "all">(userIdFilter ? "all" : "pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  const places = useLookup("places");
  const tours = useLookup("tours");
  const users = useLookup("users");

  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setReviews(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, "id">) })));
        setLoading(false);
      },
      (err) => {
        console.error("Không tải được danh sách đánh giá", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    reviews.forEach((r) => {
      users.resolve(r.userId);
      if (r.targetType === "place") places.resolve(r.targetId);
      else tours.resolve(r.targetId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviews]);

  const filtered = useMemo(() => {
    let list = reviews;
    if (userIdFilter) list = list.filter((r) => r.userId === userIdFilter);
    if (tab !== "all") list = list.filter((r) => r.status === tab);
    // Đẩy đánh giá bị AI đánh dấu khả nghi lên đầu để content editor ưu tiên xem trước.
    return [...list].sort((a, b) => Number(!!b.aiModeration?.flagged) - Number(!!a.aiModeration?.flagged));
  }, [reviews, tab, userIdFilter]);

  async function setStatus(r: Review, status: ReviewStatus) {
    setBusyId(r.id);
    try {
      await updateDoc(doc(db, "reviews", r.id), { status, updatedAt: serverTimestamp() });
      await logAction(user, `${status === "approved" ? "duyệt" : "ẩn"} đánh giá`, {
        type: "review",
        id: r.id,
      });
      toast.success(status === "approved" ? "Đã duyệt đánh giá." : "Đã ẩn đánh giá.");
    } catch {
      toast.error("Không thể cập nhật, kiểm tra lại quyền truy cập.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(r: Review) {
    const ok = await confirm({
      title: "Xoá đánh giá này?",
      description: "Hành động không thể hoàn tác.",
      confirmLabel: "Xoá",
      danger: true,
    });
    if (!ok) return;
    setBusyId(r.id);
    try {
      await deleteDoc(doc(db, "reviews", r.id));
      await logAction(user, "xoá đánh giá", { type: "review", id: r.id });
      toast.success("Đã xoá đánh giá.");
    } catch {
      toast.error("Không thể xoá.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Đánh giá"
        description={
          userIdFilter
            ? `Lọc theo người dùng: ${users.cache[userIdFilter] ?? userIdFilter}`
            : "Duyệt, ẩn hoặc xoá đánh giá từ người dùng"
        }
      />

      <div className="mb-4 flex gap-1 rounded-lg bg-surface-muted p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t.key ? "bg-surface text-brand-700 shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
        {!loading && filtered.length === 0 && (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            Không có đánh giá nào.
          </Card>
        )}
        {filtered.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">
                    {users.cache[r.userId] ?? "..."}
                  </span>
                  <span className="text-muted-foreground">
                    đánh giá {r.targetType === "place" ? "địa điểm" : "tour"}{" "}
                    <span className="font-medium text-foreground">
                      {(r.targetType === "place" ? places.cache[r.targetId] : tours.cache[r.targetId]) ?? "..."}
                    </span>
                  </span>
                  <Badge
                    tone={
                      r.status === "approved" ? "success" : r.status === "pending" ? "warning" : "neutral"
                    }
                  >
                    {r.status === "approved" ? "Đã duyệt" : r.status === "pending" ? "Chờ duyệt" : "Đã ẩn"}
                  </Badge>
                  {r.aiModeration?.flagged && (
                    <Badge tone="danger" title={r.aiModeration.reason ?? undefined}>
                      <Sparkles className="mr-1 h-3 w-3" /> AI: khả nghi
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3.5 w-3.5",
                        i < r.rating ? "fill-warning-600 text-warning-600" : "text-border"
                      )}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-foreground">{r.comment}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {r.status !== "approved" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busyId === r.id}
                    onClick={() => setStatus(r, "approved")}
                  >
                    <Check className="h-3.5 w-3.5" /> Duyệt
                  </Button>
                )}
                {r.status !== "hidden" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === r.id}
                    onClick={() => setStatus(r, "hidden")}
                  >
                    <EyeOff className="h-3.5 w-3.5" /> Ẩn
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === r.id}
                  onClick={() => handleDelete(r)}
                  className="hover:border-danger-600 hover:text-danger-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
