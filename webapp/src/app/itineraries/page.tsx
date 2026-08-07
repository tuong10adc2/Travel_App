"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { CalendarRange, MapPinned, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import type { Itinerary } from "@/lib/types";

function formatDate(ts: unknown) {
  const d = (ts as { toDate?: () => Date } | undefined)?.toDate?.();
  return d ? d.toLocaleDateString("vi-VN") : "";
}

function ItinerariesInner() {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "itineraries"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Itinerary, "id">) })));
        setLoading(false);
      },
      (err) => {
        console.error("Không tải được danh sách lịch trình", err);
        toast.error("Không tải được danh sách lịch trình.");
        setLoading(false);
      }
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleDelete(it: Itinerary) {
    if (!confirm(`Xoá lịch trình "${it.name}"?`)) return;
    setBusyId(it.id);
    try {
      await deleteDoc(doc(db, "itineraries", it.id));
      toast.success("Đã xoá lịch trình.");
    } catch {
      toast.error("Không thể xoá lịch trình.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Lịch trình của tôi</h1>
          <p className="mt-2 text-muted-foreground">Tạo và quản lý các chuyến đi của bạn</p>
        </div>
        <Link href="/itineraries/new">
          <Button>
            <Plus className="h-4 w-4" /> Tạo lịch trình
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-16 text-center text-muted-foreground">
          <MapPinned className="mx-auto mb-3 h-6 w-6 opacity-40" />
          Bạn chưa có lịch trình nào.
          <div className="mt-4">
            <Link href="/itineraries/new">
              <Button variant="outline">Tạo lịch trình đầu tiên</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.id} className="group relative rounded-2xl border border-border bg-white p-5">
              <Link href={`/itineraries/${it.id}`} className="block">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <CalendarRange className="h-5 w-5" />
                </div>
                <h3 className="line-clamp-1 font-semibold text-foreground">{it.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(it.startDate)} — {formatDate(it.endDate)}
                </p>
              </Link>
              <button
                onClick={() => handleDelete(it)}
                disabled={busyId === it.id}
                className="absolute right-4 top-4 text-muted-foreground opacity-0 transition-opacity hover:text-danger-600 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ItinerariesPage() {
  return (
    <RequireAuth>
      <ItinerariesInner />
    </RequireAuth>
  );
}
