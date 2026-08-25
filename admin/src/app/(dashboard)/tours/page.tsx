"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { useConfirm } from "@/contexts/confirm-context";
import { logAction } from "@/lib/audit-log";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Tour } from "@/lib/types";

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + " đ";
}

export default function ToursPage() {
  const { user, can } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "tours"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTours(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Tour, "id">) })));
        setLoading(false);
      },
      (err) => {
        console.error("Không tải được danh sách tour", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tours;
    return tours.filter((t) => t.name?.toLowerCase().includes(q));
  }, [tours, search]);

  async function toggleActive(t: Tour) {
    setBusyId(t.id);
    try {
      await updateDoc(doc(db, "tours", t.id), { isActive: !t.isActive });
    } catch {
      toast.error("Không thể cập nhật.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(t: Tour) {
    const ok = await confirm({
      title: `Xoá tour "${t.name}"?`,
      description: "Hành động này không thể hoàn tác.",
      confirmLabel: "Xoá",
      danger: true,
    });
    if (!ok) return;
    setBusyId(t.id);
    try {
      await deleteDoc(doc(db, "tours", t.id));
      await logAction(user, "xoá tour", { type: "tour", id: t.id, label: t.name });
      toast.success("Đã xoá tour.");
    } catch {
      toast.error("Không thể xoá.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Tour gợi ý"
        description={`${tours.length} tour`}
        actions={
          can.manageContent && (
            <Link href="/tours/new">
              <Button>
                <Plus className="h-4 w-4" /> Thêm tour
              </Button>
            </Link>
          )
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên tour..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Tour</th>
                <th className="px-5 py-3 font-medium">Số ngày</th>
                <th className="px-5 py-3 font-medium">Địa điểm</th>
                <th className="px-5 py-3 font-medium">Giá</th>
                <th className="px-5 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                    Đang tải...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                    <Package className="mx-auto mb-2 h-6 w-6 opacity-40" />
                    Chưa có tour nào.
                  </td>
                </tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-surface-muted/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                        {t.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.coverImage} alt={t.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="truncate font-medium text-foreground">{t.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-foreground">{t.durationDays} ngày</td>
                  <td className="px-5 py-3 text-foreground">{t.placeIds?.length ?? 0}</td>
                  <td className="px-5 py-3 text-foreground">{formatVnd(t.price ?? 0)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={t.isActive ? "success" : "neutral"}>
                      {t.isActive ? "Hoạt động" : "Đã ẩn"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {can.manageContent && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busyId === t.id}
                            onClick={() => toggleActive(t)}
                          >
                            {t.isActive ? "Ẩn" : "Hiện"}
                          </Button>
                          <Link href={`/tours/${t.id}`}>
                            <Button variant="outline" size="sm" title="Sửa">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busyId === t.id}
                            onClick={() => handleDelete(t)}
                            title="Xoá"
                            className="hover:border-danger-600 hover:text-danger-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
