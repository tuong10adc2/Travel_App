"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { Star } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { Review, ReviewTargetType } from "@/lib/types";

function useTargetLookup() {
  const [cache, setCache] = useState<Record<string, string>>({});
  async function resolve(id: string) {
    if (!id || cache[id] !== undefined) return;
    try {
      const snap = await getDoc(doc(db, "users", id));
      const data = snap.data() as { displayName?: string } | undefined;
      setCache((c) => ({ ...c, [id]: data?.displayName || "Người dùng" }));
    } catch {
      setCache((c) => ({ ...c, [id]: "Người dùng" }));
    }
  }
  return { cache, resolve };
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button key={i} type="button" onClick={() => onChange(i + 1)}>
          <Star
            className={cn(
              "h-6 w-6 transition-colors",
              i < value ? "fill-warning-600 text-warning-600" : "text-border hover:text-warning-600"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewSection({
  targetType,
  targetId,
}: {
  targetType: ReviewTargetType;
  targetId: string;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [approved, setApproved] = useState<Review[]>([]);
  const [mine, setMine] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const users = useTargetLookup();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const qApproved = query(
      collection(db, "reviews"),
      where("targetType", "==", targetType),
      where("targetId", "==", targetId),
      where("status", "==", "approved")
    );
    const unsub = onSnapshot(qApproved, (snap) => {
      setApproved(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, "id">) })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [targetType, targetId]);

  useEffect(() => {
    if (!user) return;
    const docId = `${targetType}_${targetId}_${user.uid}`;
    const unsub = onSnapshot(doc(db, "reviews", docId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...(snap.data() as Omit<Review, "id">) };
        setMine(data);
        setRating(data.rating);
        setComment(data.comment);
      } else {
        setMine(null);
      }
    });
    return () => {
      unsub();
      setMine(null);
    };
  }, [user, targetType, targetId]);

  useEffect(() => {
    approved.forEach((r) => users.resolve(r.userId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approved]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá.");
      return;
    }
    setSubmitting(true);
    const docId = `${targetType}_${targetId}_${user.uid}`;
    try {
      if (mine) {
        await updateDoc(doc(db, "reviews", docId), {
          rating,
          comment: comment.trim(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, "reviews", docId), {
          targetType,
          targetId,
          userId: user.uid,
          rating,
          comment: comment.trim(),
          images: [],
          status: "pending",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      toast.success("Đã gửi đánh giá, đang chờ duyệt.");
    } catch {
      toast.error("Không thể gửi đánh giá, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">
        Đánh giá {approved.length > 0 && `(${approved.length})`}
      </h2>

      {user ? (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-white p-5">
          {mine?.status === "pending" && (
            <Badge tone="warning" className="mb-3">Đánh giá của bạn đang chờ duyệt</Badge>
          )}
          <StarPicker value={rating} onChange={setRating} />
          <Textarea
            className="mt-3"
            rows={3}
            placeholder="Chia sẻ cảm nhận của bạn..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button type="submit" size="sm" className="mt-3" loading={submitting}>
            {mine ? "Cập nhật đánh giá" : "Gửi đánh giá"}
          </Button>
        </form>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-white p-5 text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-brand-700 hover:underline">
            Đăng nhập
          </Link>{" "}
          để viết đánh giá.
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải đánh giá...</p>
      ) : approved.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có đánh giá nào được duyệt.</p>
      ) : (
        <div className="space-y-4">
          {approved
            .filter((r) => r.userId !== user?.uid)
            .map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {users.cache[r.userId] ?? "..."}
                  </p>
                  <div className="flex items-center gap-0.5">
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
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
