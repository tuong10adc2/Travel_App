"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { Bookmark, CalendarRange, Loader2, LogOut, User } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage, useTranslations } from "@/contexts/language-context";
import { useToast } from "@/contexts/toast-context";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Label } from "@/components/ui/input";
import { PatternOverlay } from "@/components/ui/pattern-overlay";
import { PLACE_TAGS, type AppUser } from "@/lib/types";

function formatDate(ts: unknown, locale: string) {
  const d = (ts as { toDate?: () => Date } | undefined)?.toDate?.();
  return d ? d.toLocaleDateString(locale) : null;
}

/// Đếm nhanh 1 collection lọc theo userId — dùng chung style với
/// saved/page.tsx và itineraries/page.tsx (onSnapshot, không thêm dependency
/// mới) chỉ để lấy `.size` cho 2 thẻ thống kê.
function useOwnedCount(collectionName: string, uid: string | undefined) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, collectionName), where("userId", "==", uid));
    const unsub = onSnapshot(q, (snap) => setCount(snap.size), () => setCount(null));
    return () => unsub();
  }, [collectionName, uid]);

  return count;
}

// key={profile.uid} ở component cha đảm bảo state dưới đây luôn khởi tạo
// đúng theo profile hiện tại mỗi khi profile đổi, không cần effect đồng bộ.
function ProfileForm({ profile }: { profile: AppUser }) {
  const { user, signOut } = useAuth();
  const toast = useToast();
  const t = useTranslations();
  const { setLanguage: setAppLanguage } = useLanguage();
  const [name, setName] = useState(profile.displayName ?? "");
  const [phone, setPhone] = useState(profile.phoneNumber ?? "");
  const [language, setLanguage] = useState<"vi" | "en">(profile.language ?? "vi");
  const [preferences, setPreferences] = useState<string[]>(profile.preferences ?? []);
  const [submitting, setSubmitting] = useState(false);

  const savedCount = useOwnedCount("saved_places", user?.uid);
  const itineraryCount = useOwnedCount("itineraries", user?.uid);
  const joinedLabel = formatDate(profile.createdAt, language === "en" ? "en-US" : "vi-VN");

  function toggleTag(tag: string) {
    setPreferences((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await updateProfile(user, { displayName: name.trim() });
      await updateDoc(doc(db, "users", user.uid), {
        displayName: name.trim(),
        phoneNumber: phone.trim() || null,
        language,
        preferences,
        updatedAt: serverTimestamp(),
      });
      setAppLanguage(language);
      toast.success(t("profile.toastUpdated"));
    } catch {
      toast.error(t("profile.toastUpdateFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative overflow-hidden">
      <PatternOverlay />
      <div className="relative mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-brand-600 p-0.5">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-surface text-2xl font-semibold text-brand-700">
            {(profile?.displayName || user?.email || "?").charAt(0).toUpperCase()}
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{profile?.displayName || t("profile.defaultTitle")}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          {joinedLabel && (
            <p className="text-xs text-muted-foreground">{t("profile.memberSince", { date: joinedLabel })}</p>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <Card className="relative flex flex-col items-center gap-1 overflow-hidden p-4 text-center">
          <PatternOverlay opacity={0.7} />
          <Bookmark className="relative h-5 w-5 text-brand-600" />
          <span className="relative text-xl font-semibold text-foreground">{savedCount ?? "—"}</span>
          <span className="relative text-xs text-muted-foreground">{t("profile.savedCount")}</span>
        </Card>
        <Card className="relative flex flex-col items-center gap-1 overflow-hidden p-4 text-center">
          <PatternOverlay opacity={0.7} />
          <CalendarRange className="relative h-5 w-5 text-brand-600" />
          <span className="relative text-xl font-semibold text-foreground">{itineraryCount ?? "—"}</span>
          <span className="text-xs text-muted-foreground">{t("profile.itineraryCount")}</span>
        </Card>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-surface p-6">
        <Field label={t("profile.name")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t("profile.phone")}>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("profile.phonePlaceholder")} />
        </Field>
        <div>
          <Label>{t("profile.languageLabel")}</Label>
          <div className="flex gap-2">
            {(["vi", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${
                  language === l ? "border-brand-600 bg-brand-50 text-brand-700" : "border-border text-muted-foreground"
                }`}
              >
                {l === "vi" ? t("profile.languageVi") : t("profile.languageEn")}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>{t("profile.preferencesLabel")}</Label>
          <p className="mb-2 text-xs text-muted-foreground">{t("profile.preferencesHint")}</p>
          <div className="flex flex-wrap gap-2">
            {PLACE_TAGS.map((tag) => {
              const selected = preferences.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    selected
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-border text-muted-foreground hover:bg-surface-muted"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
        <Button type="submit" loading={submitting}>
          <User className="h-4 w-4" /> {t("profile.saveChanges")}
        </Button>
      </form>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <Button variant="outline" onClick={() => signOut()} className="w-full">
          <LogOut className="h-4 w-4" /> {t("common.logout")}
        </Button>
      </div>
      </div>
    </div>
  );
}

function ProfileInner() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return <ProfileForm key={profile.uid} profile={profile} />;
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileInner />
    </RequireAuth>
  );
}
