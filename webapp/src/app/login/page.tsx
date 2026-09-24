"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Compass, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { ensureUserDoc } from "@/lib/ensure-user-doc";
import { useTranslations } from "@/contexts/language-context";

function firebaseAuthErrorMessage(code: string, t: (key: string) => string) {
  switch (code) {
    case "auth/too-many-requests":
      return t("login.errorTooManyRequests");
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null;
    default:
      return t("login.errorDefault");
  }
}

function GoogleLogo() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function GoogleSignInButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const redirect = searchParams.get("redirect") || "/";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setSubmitting(true);
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      await ensureUserDoc(credential.user);
      router.replace(redirect);
    } catch (err) {
      const message = firebaseAuthErrorMessage((err as { code?: string })?.code ?? "", t);
      if (message) setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}
      <button type="button" className="google-btn" disabled={submitting} onClick={handleClick}>
        {submitting ? <Loader2 className="h-5 w-5 animate-spin text-[#4285f4]" /> : <GoogleLogo />}
        {t("login.withGoogle")}
      </button>
    </div>
  );
}

export default function LoginPage() {
  const t = useTranslations();
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-surface-muted px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Compass className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground">{t("login.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("login.subtitle")}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-lg shadow-black/10">
          <Suspense fallback={null}>
            <GoogleSignInButton />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
