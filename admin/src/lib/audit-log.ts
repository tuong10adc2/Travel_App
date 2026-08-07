import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "firebase/auth";

export async function logAction(
  actor: User | null,
  action: string,
  target: { type: string; id: string; label?: string }
) {
  if (!actor) return;
  try {
    await addDoc(collection(db, "audit_logs"), {
      actorUid: actor.uid,
      actorEmail: actor.email ?? "",
      action,
      targetType: target.type,
      targetId: target.id,
      targetLabel: target.label ?? "",
      createdAt: serverTimestamp(),
    });
  } catch {
    // Audit log là best-effort, không chặn thao tác chính nếu ghi log lỗi.
  }
}
