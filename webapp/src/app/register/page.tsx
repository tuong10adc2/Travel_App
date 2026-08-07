"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Compass } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

function firebaseAuthErrorMessage(code: string) {
  switch (code) {
    case "auth/email-already-in-use":
      return "Email này đã được đăng ký.";
    case "auth/invalid-email":
      return "Email không hợp lệ.";
    case "auth/weak-password":
      return "Mật khẩu quá yếu, cần ít nhất 6 ký tự.";
    default:
      return "Đăng ký thất bại. Vui lòng thử lại.";
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() });
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email: email.trim(),
        displayName: name.trim(),
        phoneNumber: null,
        role: "user",
        preferences: [],
        language: "vi",
        isDisabled: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      router.replace("/");
    } catch (err) {
      setError(firebaseAuthErrorMessage((err as { code?: string })?.code ?? ""));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-surface-muted px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Compass className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground">Tạo tài khoản</h1>
            <p className="text-sm text-muted-foreground">Bắt đầu hành trình khám phá của bạn</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Họ tên">
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@email.com"
              />
            </Field>
            <Field label="Mật khẩu" hint="Tối thiểu 6 ký tự">
              <Input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Field label="Xác nhận mật khẩu">
              <Input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}
            <Button type="submit" className="w-full" size="lg" loading={submitting}>
              Đăng ký
            </Button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
