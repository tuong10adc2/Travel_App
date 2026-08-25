"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getCountFromServer,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { Users, MapPin, Package, Star, ImagePlay, ArrowRight } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Counts {
  users?: number;
  disabledUsers?: number;
  places?: number;
  activePlaces?: number;
  placesWith360?: number;
  tours?: number;
  pendingReviews?: number;
}

interface AuditEntry {
  id: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetLabel: string;
  createdAt?: { toDate: () => Date };
}

export default function DashboardPage() {
  const { can, profile } = useAuth();
  const [counts, setCounts] = useState<Counts>({});
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState<AuditEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const next: Counts = {};
      try {
        if (can.manageUsers) {
          const usersSnap = await getCountFromServer(collection(db, "users"));
          next.users = usersSnap.data().count;
          const disabledSnap = await getCountFromServer(
            query(collection(db, "users"), where("isDisabled", "==", true))
          );
          next.disabledUsers = disabledSnap.data().count;
        }
        if (can.manageContent) {
          const placesSnap = await getCountFromServer(collection(db, "places"));
          next.places = placesSnap.data().count;
          const activeSnap = await getCountFromServer(
            query(collection(db, "places"), where("isActive", "==", true))
          );
          next.activePlaces = activeSnap.data().count;
          const with360Snap = await getCountFromServer(
            query(collection(db, "places"), where("has360", "==", true))
          );
          next.placesWith360 = with360Snap.data().count;
          const toursSnap = await getCountFromServer(collection(db, "tours"));
          next.tours = toursSnap.data().count;
        }
        if (can.moderateReviews) {
          const pendingSnap = await getCountFromServer(
            query(collection(db, "reviews"), where("status", "==", "pending"))
          );
          next.pendingReviews = pendingSnap.data().count;
        }
      } catch (err) {
        console.error("Không tải được thống kê", err);
      }
      if (!cancelled) {
        setCounts(next);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [can.manageUsers, can.manageContent, can.moderateReviews]);

  useEffect(() => {
    if (!can.manageRoles) return;
    const q = query(collection(db, "audit_logs"), orderBy("createdAt", "desc"), limit(8));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRecentLogs(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AuditEntry, "id">) }))
        );
      },
      () => setRecentLogs([])
    );
    return () => unsub();
  }, [can.manageRoles]);

  return (
    <div>
      <PageHeader
        title={`Chào ${profile?.displayName || "bạn"} 👋`}
        description="Tổng quan hệ thống TngGuide"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {can.manageUsers && (
          <StatCard
            label="Người dùng"
            value={counts.users ?? 0}
            icon={Users}
            loading={loading}
            tone="brand"
          />
        )}
        {can.manageContent && (
          <>
            <StatCard
              label="Địa điểm đang hoạt động"
              value={`${counts.activePlaces ?? 0}/${counts.places ?? 0}`}
              icon={MapPin}
              loading={loading}
              tone="success"
            />
            <StatCard
              label="Địa điểm có VR 360°"
              value={counts.placesWith360 ?? 0}
              icon={ImagePlay}
              loading={loading}
              tone="brand"
            />
            <StatCard
              label="Tour gợi ý"
              value={counts.tours ?? 0}
              icon={Package}
              loading={loading}
              tone="warning"
            />
          </>
        )}
        {can.moderateReviews && (
          <StatCard
            label="Đánh giá chờ duyệt"
            value={counts.pendingReviews ?? 0}
            icon={Star}
            loading={loading}
            tone={counts.pendingReviews ? "danger" : "success"}
          />
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {can.manageContent && (
          <Card>
            <CardHeader>
              <CardTitle>Việc cần làm</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <Link
                href="/places"
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-surface-muted"
              >
                <span>Quản lý địa điểm & gắn ảnh 360°</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              {can.moderateReviews && (
                <Link
                  href="/reviews"
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-surface-muted"
                >
                  <span>
                    Duyệt đánh giá mới{" "}
                    {!!counts.pendingReviews && (
                      <Badge tone="danger" className="ml-1">
                        {counts.pendingReviews}
                      </Badge>
                    )}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              )}
            </CardBody>
          </Card>
        )}

        {can.manageRoles && (
          <Card>
            <CardHeader>
              <CardTitle>Nhật ký thao tác gần đây</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {recentLogs.length === 0 && (
                <p className="text-sm text-muted-foreground">Chưa có thao tác nào.</p>
              )}
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="text-foreground">
                      <span className="font-medium">{log.actorEmail}</span> {log.action}{" "}
                      <span className="text-muted-foreground">
                        {log.targetType} {log.targetLabel && `“${log.targetLabel}”`}
                      </span>
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {log.createdAt?.toDate
                      ? log.createdAt.toDate().toLocaleString("vi-VN")
                      : ""}
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
