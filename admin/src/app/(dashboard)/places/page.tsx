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
import {
  Aperture,
  MapPin,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
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
import type { Place } from "@/lib/types";

export default function PlacesPage() {
  const { user, can } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<"all" | "active" | "pending">("all");

  useEffect(() => {
    const q = query(collection(db, "places"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPlaces(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Place, "id">) })));
        setLoading(false);
      },
      (err) => {
        console.error("Không tải được danh sách địa điểm", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const pendingCount = useMemo(() => places.filter((p) => !p.isActive).length, [places]);

  const filtered = useMemo(() => {
    let list = places;
    if (statusTab === "active") list = list.filter((p) => p.isActive);
    if (statusTab === "pending") list = list.filter((p) => !p.isActive);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q)
    );
  }, [places, search, statusTab]);

  async function toggleField(p: Place, field: "isActive" | "isFeatured") {
    setBusyId(p.id);
    try {
      await updateDoc(doc(db, "places", p.id), { [field]: !p[field] });
    } catch {
      toast.error("Không thể cập nhật, kiểm tra lại quyền truy cập.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(p: Place) {
    const ok = await confirm({
      title: `Xoá địa điểm "${p.name}"?`,
      description: "Hành động này không thể hoàn tác.",
      confirmLabel: "Xoá",
      danger: true,
    });
    if (!ok) return;
    setBusyId(p.id);
    try {
      await deleteDoc(doc(db, "places", p.id));
      await logAction(user, "xoá địa điểm", { type: "place", id: p.id, label: p.name });
      toast.success("Đã xoá địa điểm.");
    } catch {
      toast.error("Không thể xoá, kiểm tra lại quyền truy cập.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Địa điểm"
        description={`${places.length} địa điểm`}
        actions={
          can.manageContent && (
            <Link href="/places/new">
              <Button>
                <Plus className="h-4 w-4" /> Thêm địa điểm
              </Button>
            </Link>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-surface-muted p-1 w-fit">
          {(
            [
              { key: "all", label: "Tất cả" },
              { key: "active", label: "Hoạt động" },
              { key: "pending", label: `Chờ duyệt${pendingCount ? ` (${pendingCount})` : ""}` },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setStatusTab(t.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                statusTab === t.key
                  ? "bg-surface text-brand-700 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc địa chỉ..."
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
                <th className="px-5 py-3 font-medium">Địa điểm</th>
                <th className="px-5 py-3 font-medium">Tag</th>
                <th className="px-5 py-3 font-medium">Đánh giá</th>
                <th className="px-5 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                    Đang tải...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                    <MapPin className="mx-auto mb-2 h-6 w-6 opacity-40" />
                    Chưa có địa điểm nào.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-surface-muted/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                        {p.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.coverImage} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(p.tags ?? []).slice(0, 2).map((t) => (
                        <Badge key={t} tone="neutral">
                          {t}
                        </Badge>
                      ))}
                      {(p.tags?.length ?? 0) > 2 && (
                        <Badge tone="neutral">+{p.tags.length - 2}</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1 text-foreground">
                      <Star className="h-3.5 w-3.5 fill-warning-600 text-warning-600" />
                      {p.ratingAvg?.toFixed(1) ?? "—"}{" "}
                      <span className="text-xs text-muted-foreground">({p.ratingCount ?? 0})</span>
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={p.isActive ? "success" : "neutral"}>
                        {p.isActive ? "Hoạt động" : "Đã ẩn"}
                      </Badge>
                      {p.isFeatured && <Badge tone="brand">Nổi bật</Badge>}
                      {p.has360 && <Badge tone="warning">360°</Badge>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {can.manageContent && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busyId === p.id}
                            onClick={() => toggleField(p, "isFeatured")}
                            title="Bật/tắt nổi bật"
                          >
                            <Star className="h-3.5 w-3.5" />
                          </Button>
                          <Link href={`/places/${p.id}/media360`}>
                            <Button variant="outline" size="sm" title="Ảnh 360°">
                              <Aperture className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Link href={`/places/${p.id}`}>
                            <Button variant="outline" size="sm" title="Sửa">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busyId === p.id}
                            onClick={() => handleDelete(p)}
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
