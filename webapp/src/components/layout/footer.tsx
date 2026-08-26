"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "@/contexts/language-context";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Image src="/logo.png" alt="TngGuide" width={32} height={32} className="h-8 w-8 rounded-lg object-cover" />
              <span className="text-base font-semibold text-foreground">TngGuide</span>
            </div>
            <p className="text-sm text-muted-foreground">{t("footer.tagline")}</p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">{t("footer.exploreHeading")}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/explore" className="hover:text-brand-700">{t("footer.places")}</Link></li>
              <li><Link href="/tours" className="hover:text-brand-700">{t("footer.suggestedTours")}</Link></li>
              <li><Link href="/itineraries" className="hover:text-brand-700">{t("footer.myItineraries")}</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">{t("footer.aiFeaturesHeading")}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/chat" className="hover:text-brand-700">{t("footer.aiChat")}</Link></li>
              <li><span>{t("footer.smartGuide")}</span></li>
              <li><span>{t("footer.preview360")}</span></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">{t("footer.accountHeading")}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/login" className="hover:text-brand-700">{t("common.login")}</Link></li>
              <li><Link href="/register" className="hover:text-brand-700">{t("common.register")}</Link></li>
              <li><Link href="/profile" className="hover:text-brand-700">{t("footer.profile")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          {t("footer.copyright", { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}
