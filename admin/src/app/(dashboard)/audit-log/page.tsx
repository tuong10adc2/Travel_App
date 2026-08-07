"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { ScrollText } from "lucide-react";
import { db } from "@/lib/firebase";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";

interface AuditEntry {
  id: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  createdAt?: { toDate: () => Date };
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "audit_logs"), orderBy("createdAt", "desc"), limit(200));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLogs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AuditEntry, "id">) })));
        setLoading(false);
      },
      (err) => {
        console.error("Không tải được nhật ký thao tác", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return (
    <div>
      <PageHeader title="Nhật ký thao tác" description="Lịch sử hành động của quản trị viên & nhân viên" />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Thời gian</th>
                <th className="px-5 py-3 font-medium">Người thực hiện</th>
                <th className="px-5 py-3 font-medium">Hành động</th>
                <th className="px-5 py-3 font-medium">Đối tượng</th>
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
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                    <ScrollText className="mx-auto mb-2 h-6 w-6 opacity-40" />
                    Chưa có thao tác nào được ghi lại.
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-muted/50">
                  <td className="whitespace-nowrap px-5 py-3 text-xs text-muted-foreground">
                    {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString("vi-VN") : "—"}
                  </td>
                  <td className="px-5 py-3 text-foreground">{log.actorEmail}</td>
                  <td className="px-5 py-3 text-foreground">{log.action}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {log.targetType}
                    {log.targetLabel ? ` — ${log.targetLabel}` : ""}
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
