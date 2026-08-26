"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import vi from "@/messages/vi.json";
import en from "@/messages/en.json";

export type Language = "vi" | "en";

type Messages = typeof vi;

const DICTIONARIES: Record<Language, Messages> = { vi, en };

const STORAGE_KEY = "language";

function readStoredLanguage(): Language | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "vi" || stored === "en" ? stored : null;
  } catch {
    return null;
  }
}

function writeStoredLanguage(lang: Language) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // localStorage có thể không khả dụng (chế độ riêng tư, quyền bị chặn...) — bỏ qua.
  }
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  // Mặc định "vi" để khớp HTML render ở server (không có localStorage/profile
  // lúc đó) — tránh lỗi hydration mismatch, cùng cách làm với ThemeToggle.
  const [language, setLanguageState] = useState<Language>("vi");

  useEffect(() => {
    const stored = readStoredLanguage();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ với localStorage (hệ thống ngoài React), giống ThemeToggle.
      setLanguageState(stored);
    }
  }, []);

  useEffect(() => {
    // Khi đã đăng nhập, profile.language trong Firestore là nguồn sự thật —
    // đồng bộ lại localStorage để giá trị này còn được nhớ cả sau khi đăng xuất.
    if (profile?.language === "vi" || profile?.language === "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ với profile Firestore (hệ thống ngoài React).
      setLanguageState(profile.language);
      writeStoredLanguage(profile.language);
    }
  }, [profile?.language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    writeStoredLanguage(lang);
  }, []);

  const value = useMemo<LanguageContextValue>(() => ({ language, setLanguage }), [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

type Params = Record<string, string | number>;

function lookup(dict: Messages, key: string): unknown {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
}

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, token: string) =>
    token in params ? String(params[token]) : match
  );
}

/** Hook tra cứu chuỗi dịch — key dạng "namespace.key", vd t("common.save"). */
export function useTranslations() {
  const { language } = useLanguage();

  return useCallback(
    (key: string, params?: Params): string => {
      const value = lookup(DICTIONARIES[language], key) ?? lookup(DICTIONARIES.vi, key);
      if (typeof value !== "string") return key;
      return interpolate(value, params);
    },
    [language]
  );
}
