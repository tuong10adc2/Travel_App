"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { ArrowLeft, Compass, Loader2, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { logAction } from "@/lib/audit-log";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import type { Media360, Place } from "@/lib/types";

export default function PlaceMedia360Page() {
  const params = useParams<{ id: string }>();
  const placeId = params.id;
  const { user } = useAuth();
  const toast = useToast();

  const [place, setPlace] = useState<Place | null>(null);
  const [items, setItems] = useState<Media360[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "places", placeId)).then((snap) => {
      if (snap.exists()) setPlace({ id: snap.id, ...(snap.data() as Omit<Place, "id">) });
    });
  }, [placeId]);

  useEffect(() => {
    const q = query(
      collection(db, "media_360"),
      where("placeId", "==", placeId),
      orderBy("order", "asc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Media360, "id">) })));
        setLoading(false);
      },
      (err) => {
        console.error("Không tải được danh sách ảnh 360°", err);
        toast.error("Không tải được danh sách ảnh 360° — kiểm tra console để biết chi tiết.");
        setLoading(false);
      }
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId]);

  async function syncHas360(count: number) {
    await updateDoc(doc(db, "places", placeId), { has360: count > 0 });
  }

  async function handleCreate() {
    if (!newUrl.trim()) {
      toast.error("Cần có ảnh 360° trước khi thêm.");
      return;
    }
    setCreating(true);
    try {
      await addDoc(collection(db, "media_360"), {
        placeId,
        type: "image",
        url: newUrl.trim(),
        title: newTitle.trim() || `Điểm nhìn ${items.length + 1}`,
        order: items.length,
        hotspots: [],
        createdAt: serverTimestamp(),
      });
      await syncHas360(items.length + 1);
      await logAction(user, "thêm ảnh 360°", { type: "media_360", id: placeId, label: newTitle });
      toast.success("Đã thêm điểm nhìn 360°.");
      setNewTitle("");
      setNewUrl("");
    } catch {
      toast.error("Không thể thêm — kiểm tra Storage/quyền truy cập.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(item: Media360) {
    if (!confirm(`Xoá điểm nhìn "${item.title}"?`)) return;
    try {
      await deleteDoc(doc(db, "media_360", item.id));
      // xoá tham chiếu hotspot trỏ tới điểm nhìn vừa xoá ở các điểm nhìn còn lại
      const remaining = items.filter((i) => i.id !== item.id);
      await Promise.all(
        remaining
          .filter((i) => i.hotspots?.some((h) => h.targetMediaId === item.id))
          .map((i) =>
            updateDoc(doc(db, "media_360", i.id), {
              hotspots: (i.hotspots ?? []).filter((h) => h.targetMediaId !== item.id),
            })
          )
      );
      await syncHas360(remaining.length);
      toast.success("Đã xoá.");
    } catch {
      toast.error("Không thể xoá.");
    }
  }

  async function addHotspot(item: Media360) {
    const target = items.find((i) => i.id !== item.id);
    if (!target) {
      toast.error("Cần ít nhất 2 điểm nhìn để tạo hotspot.");
      return;
    }
    const hotspots = [
      ...(item.hotspots ?? []),
      { targetMediaId: target.id, yaw: 0, pitch: 0, label: target.title },
    ];
    await updateDoc(doc(db, "media_360", item.id), { hotspots });
  }

  async function updateHotspot(
    item: Media360,
    index: number,
    patch: Partial<{ targetMediaId: string; yaw: number; pitch: number; label: string }>
  ) {
    const hotspots = (item.hotspots ?? []).map((h, i) => (i === index ? { ...h, ...patch } : h));
    await updateDoc(doc(db, "media_360", item.id), { hotspots });
  }

  async function removeHotspot(item: Media360, index: number) {
    const hotspots = (item.hotspots ?? []).filter((_, i) => i !== index);
    await updateDoc(doc(db, "media_360", item.id), { hotspots });
  }

  return (
    <div>
      <Link
        href="/places"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách địa điểm
      </Link>
      <PageHeader
        title={`Ảnh 360° — ${place?.name ?? "..."}`}
        description="Quản lý các điểm nhìn 360° và hotspot liên kết giữa chúng"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Thêm điểm nhìn mới</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tên điểm nhìn">
              <Input
                placeholder="vd: Trên biển, Đỉnh núi..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Ảnh equirectangular (tỷ lệ 2:1)">
            <ImageUploadField
              value={newUrl}
              onChange={setNewUrl}
              storagePath={`media360/${placeId}`}
            />
          </Field>
          <Button onClick={handleCreate} loading={creating}>
            <Plus className="h-4 w-4" /> Thêm điểm nhìn
          </Button>
        </CardBody>
      </Card>

      {loading && (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có điểm nhìn 360° nào.</p>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.title} className="h-full w-full object-cover" />
                </div>
                <CardTitle>{item.title}</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(item)}
                className="hover:border-danger-600 hover:text-danger-600"
              >
                <Trash2 className="h-3.5 w-3.5" /> Xoá
              </Button>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  <Compass className="mr-1.5 inline h-4 w-4 text-brand-600" />
                  Hotspot liên kết
                </p>
                <Button variant="secondary" size="sm" onClick={() => addHotspot(item)}>
                  <Plus className="h-3.5 w-3.5" /> Thêm hotspot
                </Button>
              </div>
              {(item.hotspots ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">Chưa có hotspot nào.</p>
              )}
              {(item.hotspots ?? []).map((h, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-5 sm:items-end">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-muted-foreground">Điểm nhìn đích</label>
                    <select
                      className="h-9 w-full rounded-lg border border-border bg-white px-2 text-sm"
                      value={h.targetMediaId}
                      onChange={(e) => {
                        const target = items.find((i) => i.id === e.target.value);
                        updateHotspot(item, idx, {
                          targetMediaId: e.target.value,
                          label: target?.title ?? h.label,
                        });
                      }}
                    >
                      {items
                        .filter((i) => i.id !== item.id)
                        .map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.title}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Yaw</label>
                    <Input
                      type="number"
                      value={h.yaw}
                      onChange={(e) => updateHotspot(item, idx, { yaw: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Pitch</label>
                    <Input
                      type="number"
                      value={h.pitch}
                      onChange={(e) => updateHotspot(item, idx, { pitch: Number(e.target.value) })}
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeHotspot(item, idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
