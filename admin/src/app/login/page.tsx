"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Compass } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";

function firebaseAuthErrorMessage(code: string) {
  switch (code) {
    case "auth/invalid-email":
      return "Email không hợp lệ.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email hoặc mật khẩu không đúng.";
    case "auth/too-many-requests":
      return "Bạn đã thử sai quá nhiều lần, vui lòng thử lại sau.";
    default:
      return "Đăng nhập thất bại. Vui lòng thử lại.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, loading, isStaff } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (user && profile) {
      if (isStaff) router.replace("/");
    }
  }, [loading, user, profile, isStaff, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/");
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      setError(firebaseAuthErrorMessage(code));
    } finally {
      setSubmitting(false);
    }
  }

  const showNotAuthorized = !loading && user && profile && !isStaff;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Compass className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold">VietGuide Admin</h1>
            <p className="text-sm text-white/70">Bảng điều khiển quản trị</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-2xl shadow-brand-900/30">
          {showNotAuthorized ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-foreground">
                Tài khoản <span className="font-medium">{user?.email}</span> không có quyền
                truy cập trang quản trị.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => auth.signOut()}
              >
                Đăng xuất
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Email">
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ban@vietguide.ai"
                />
              </Field>
              <Field label="Mật khẩu">
                <Input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </Field>
              {error && (
                <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" size="lg" loading={submitting}>
                Đăng nhập
              </Button>
            </form>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-white/60">
          Chỉ dành cho quản trị viên, biên tập viên nội dung và nhân viên hỗ trợ.
        </p>
      </div>
    </div>
  );
}
