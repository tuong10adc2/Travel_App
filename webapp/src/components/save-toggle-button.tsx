"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { Heart } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "@/contexts/language-context";
import { useToast } from "@/contexts/toast-context";
import { cn } from "@/lib/cn";

export function SaveToggleButton({ placeId, className }: { placeId: string; className?: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    const docId = `${user.uid}_${placeId}`;
    const unsub = onSnapshot(doc(db, "saved_places", docId), (snap) => setSaved(snap.exists()));
    return () => {
      unsub();
      setSaved(false);
    };
  }, [user, placeId]);

  async function toggle() {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/places/${placeId}`)}`);
      return;
    }
    setBusy(true);
    const docId = `${user.uid}_${placeId}`;
    try {
      if (saved) {
        await deleteDoc(doc(db, "saved_places", docId));
      } else {
        await setDoc(doc(db, "saved_places", docId), {
          userId: user.uid,
          placeId,
          createdAt: serverTimestamp(),
        });
      }
    } catch {
      toast.error(t("saveToggle.toastFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={saved ? t("saveToggle.saved") : t("saveToggle.notSaved")}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full border transition-colors disabled:opacity-50",
        saved
          ? "border-danger-600 bg-danger-50 text-danger-600"
          : "border-border bg-surface text-muted-foreground hover:text-danger-600",
        className
      )}
    >
      <Heart className={cn("h-5 w-5", saved && "fill-danger-600")} />
    </button>
  );
}
