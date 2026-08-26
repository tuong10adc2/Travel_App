"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Compass } from "lucide-react";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useTranslations } from "@/contexts/language-context";

function firebaseAuthErrorMessage(code: string, t: (key: string) => string) {
  switch (code) {
    case "auth/invalid-email":
      return t("login.errorInvalidEmail");
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return t("login.errorWrongCredential");
    case "auth/too-many-requests":
      return t("login.errorTooManyRequests");
    default:
      return t("login.errorDefault");
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const redirect = searchParams.get("redirect") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace(redirect);
    } catch (err) {
      setError(firebaseAuthErrorMessage((err as { code?: string })?.code ?? "", t));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label={t("common.email")}>
        <Input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("common.emailPlaceholder")}
        />
      </Field>
      <Field label={t("common.password")}>
        <Input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("common.passwordPlaceholder")}
        />
      </Field>
      <div className="text-right">
        <Link href="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">
          {t("login.forgotPassword")}
        </Link>
      </div>
      {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}
      <Button type="submit" className="w-full" size="lg" loading={submitting}>
        {t("common.login")}
      </Button>
    </form>
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
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("login.noAccount")}{" "}
          <Link href="/register" className="font-medium text-brand-700 hover:underline">
            {t("common.registerNow")}
          </Link>
        </p>
      </div>
    </div>
  );
}
