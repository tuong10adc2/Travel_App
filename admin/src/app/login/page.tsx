"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ensureUserDoc } from "@/lib/ensure-user-doc";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

function firebaseAuthErrorMessage(code: string) {
  switch (code) {
    case "auth/too-many-requests":
      return "Bạn đã thử sai quá nhiều lần, vui lòng thử lại sau.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null;
    default:
      return "Đăng nhập thất bại. Vui lòng thử lại.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, loading, isStaff } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (user && profile) {
      if (isStaff) router.replace("/");
    }
  }, [loading, user, profile, isStaff, router]);

  async function handleGoogleSignIn() {
    setError(null);
    setSubmitting(true);
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      await ensureUserDoc(credential.user);
      router.replace("/");
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      const message = firebaseAuthErrorMessage(code);
      if (message) setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const showNotAuthorized = !loading && user && profile && !isStaff;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-white">
          <Image src="/logo.png" alt="TngGuide" width={48} height={48} className="h-12 w-12 rounded-xl object-cover" />
          <div className="text-center">
            <h1 className="text-xl font-semibold">TngGuide Admin</h1>
            <p className="text-sm text-white/70">Bảng điều khiển quản trị</p>
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-6 shadow-2xl shadow-brand-900/30">
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
            <div className="space-y-4">
              {error && (
                <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
                  {error}
                </p>
              )}
              <Button
                type="button"
                className="w-full"
                size="lg"
                loading={submitting}
                onClick={handleGoogleSignIn}
              >
                Đăng nhập với Google
              </Button>
            </div>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-white/60">
          Chỉ dành cho quản trị viên, biên tập viên nội dung và nhân viên hỗ trợ.
        </p>
      </div>
    </div>
  );
}
