"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { Lock, Search, Unlock, Users as UsersIcon } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { logAction } from "@/lib/audit-log";
import { useToast } from "@/contexts/toast-context";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AppUser, UserRole } from "@/lib/types";

const ROLE_LABEL: Record<UserRole, string> = {
  user: "Người dùng",
  admin: "Super Admin",
  content_editor: "Content Editor",
  support: "Support",
};

const ROLE_TONE: Record<UserRole, "brand" | "warning" | "success" | "neutral" | "danger"> = {
  user: "neutral",
  admin: "danger",
  content_editor: "warning",
  support: "brand",
};

export default function UsersPage() {
  const { user: currentUser, can } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyUid, setBusyUid] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setUsers(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<AppUser, "uid">) })));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [users, search]);

  async function toggleDisabled(u: AppUser) {
    if (u.uid === currentUser?.uid) {
      toast.error("Không thể tự khoá tài khoản của chính mình.");
      return;
    }
    setBusyUid(u.uid);
    try {
      await updateDoc(doc(db, "users", u.uid), { isDisabled: !u.isDisabled });
      await logAction(currentUser, u.isDisabled ? "mở khoá tài khoản" : "khoá tài khoản", {
        type: "user",
        id: u.uid,
        label: u.email,
      });
      toast.success(u.isDisabled ? "Đã mở khoá tài khoản." : "Đã khoá tài khoản.");
    } catch {
      toast.error("Thao tác thất bại, kiểm tra lại quyền truy cập.");
    } finally {
      setBusyUid(null);
    }
  }

  async function changeRole(u: AppUser, role: UserRole) {
    if (u.uid === currentUser?.uid) {
      toast.error("Không thể tự đổi quyền của chính mình.");
      return;
    }
    setBusyUid(u.uid);
    try {
      await updateDoc(doc(db, "users", u.uid), { role });
      await logAction(currentUser, `đổi quyền thành ${ROLE_LABEL[role]}`, {
        type: "user",
        id: u.uid,
        label: u.email,
      });
      toast.success("Đã cập nhật quyền.");
    } catch {
      toast.error("Thao tác thất bại, kiểm tra lại quyền truy cập.");
    } finally {
      setBusyUid(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Người dùng"
        description={`${users.length} tài khoản đã đăng ký`}
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc email..."
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
                <th className="px-5 py-3 font-medium">Người dùng</th>
                <th className="px-5 py-3 font-medium">Quyền</th>
                <th className="px-5 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                    Đang tải...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                    <UsersIcon className="mx-auto mb-2 h-6 w-6 opacity-40" />
                    Không tìm thấy người dùng nào.
                  </td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u.uid} className="hover:bg-surface-muted/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                        {(u.displayName || u.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {u.displayName || "(chưa đặt tên)"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {can.manageRoles ? (
                      <select
                        className="h-8 rounded-lg border border-border bg-surface px-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                        value={u.role}
                        disabled={busyUid === u.uid || u.uid === currentUser?.uid}
                        onChange={(e) => changeRole(u, e.target.value as UserRole)}
                      >
                        {Object.entries(ROLE_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {u.isDisabled ? (
                      <Badge tone="danger">Đã khoá</Badge>
                    ) : (
                      <Badge tone="success">Hoạt động</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/reviews?userId=${u.uid}`}>
                        <Button variant="ghost" size="sm">
                          Xem đánh giá
                        </Button>
                      </Link>
                      {can.manageUsers && (
                        <Button
                          variant={u.isDisabled ? "secondary" : "outline"}
                          size="sm"
                          loading={busyUid === u.uid}
                          disabled={u.uid === currentUser?.uid}
                          onClick={() => toggleDisabled(u)}
                        >
                          {u.isDisabled ? (
                            <Unlock className="h-3.5 w-3.5" />
                          ) : (
                            <Lock className="h-3.5 w-3.5" />
                          )}
                          {u.isDisabled ? "Mở khoá" : "Khoá"}
                        </Button>
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
