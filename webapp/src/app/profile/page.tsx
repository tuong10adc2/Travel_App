"use client";

import { useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { Loader2, LogOut, User } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/contexts/toast-context";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/input";
import type { AppUser } from "@/lib/types";

// key={profile.uid} ở component cha đảm bảo state dưới đây luôn khởi tạo
// đúng theo profile hiện tại mỗi khi profile đổi, không cần effect đồng bộ.
function ProfileForm({ profile }: { profile: AppUser }) {
  const { user, signOut } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(profile.displayName ?? "");
  const [phone, setPhone] = useState(profile.phoneNumber ?? "");
  const [language, setLanguage] = useState<"vi" | "en">(profile.language ?? "vi");
  const [submitting, setSubmitting] = useState(false);

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
        updatedAt: serverTimestamp(),
      });
      toast.success("Đã cập nhật hồ sơ.");
    } catch {
      toast.error("Không thể cập nhật hồ sơ.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-semibold text-brand-700">
          {(profile?.displayName || user?.email || "?").charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{profile?.displayName || "Hồ sơ cá nhân"}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-white p-6">
        <Field label="Họ tên">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Số điện thoại">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901 234 567" />
        </Field>
        <div>
          <Label>Ngôn ngữ giao diện</Label>
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
                {l === "vi" ? "Tiếng Việt" : "English"}
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" loading={submitting}>
          <User className="h-4 w-4" /> Lưu thay đổi
        </Button>
      </form>

      <div className="mt-6 rounded-2xl border border-border bg-white p-6">
        <Button variant="outline" onClick={() => signOut()} className="w-full">
          <LogOut className="h-4 w-4" /> Đăng xuất
        </Button>
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
