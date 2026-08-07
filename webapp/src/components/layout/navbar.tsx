"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Map,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { href: "/explore", label: "Khám phá" },
  { href: "/tours", label: "Tours" },
  { href: "/itineraries", label: "Lịch trình" },
  { href: "/chat", label: "Trợ lý AI" },
  { href: "/saved", label: "Đã lưu" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Compass className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold text-foreground">VietGuide</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 hover:bg-surface-muted"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {(profile?.displayName || user.email || "?").charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate text-sm font-medium text-foreground">
                  {profile?.displayName || "Tài khoản"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-surface-muted"
                  >
                    <UserIcon className="h-4 w-4" /> Hồ sơ cá nhân
                  </Link>
                  <Link
                    href="/itineraries"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-surface-muted lg:hidden"
                  >
                    <Map className="h-4 w-4" /> Lịch trình
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-danger-600 hover:bg-danger-50"
                  >
                    <LogOut className="h-4 w-4" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login">
                <span className="rounded-lg px-3.5 py-2 text-sm font-medium text-foreground hover:bg-surface-muted">
                  Đăng nhập
                </span>
              </Link>
              <Link href="/register">
                <span className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                  Đăng ký
                </span>
              </Link>
            </>
          )}
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-white px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-muted"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-muted"
                >
                  Hồ sơ cá nhân
                </Link>
                <button
                  onClick={() => signOut()}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-danger-600 hover:bg-danger-50"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <div className="mt-2 flex gap-2">
                <Link href="/login" className="flex-1">
                  <span className="flex h-10 items-center justify-center rounded-lg border border-border text-sm font-medium">
                    Đăng nhập
                  </span>
                </Link>
                <Link href="/register" className="flex-1">
                  <span className="flex h-10 items-center justify-center rounded-lg bg-brand-600 text-sm font-medium text-white">
                    Đăng ký
                  </span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
