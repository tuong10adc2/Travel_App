"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Package,
  Star,
  ScrollText,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  visible: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const { can, role } = useAuth();

  const items: NavItem[] = [
    { href: "/", label: "Tổng quan", icon: LayoutDashboard, visible: true },
    { href: "/users", label: "Người dùng", icon: Users, visible: can.manageUsers },
    { href: "/places", label: "Địa điểm", icon: MapPin, visible: can.manageContent },
    { href: "/tours", label: "Tour", icon: Package, visible: can.manageContent },
    { href: "/reviews", label: "Đánh giá", icon: Star, visible: can.moderateReviews },
    { href: "/audit-log", label: "Nhật ký", icon: ScrollText, visible: can.manageRoles },
  ];

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <Image src="/logo.png" alt="TngGuide" width={32} height={32} className="h-8 w-8 rounded-lg object-cover" />
        <div>
          <p className="text-sm font-semibold leading-tight text-foreground">TngGuide</p>
          <p className="text-xs leading-tight text-muted-foreground">Admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items
          .filter((i) => i.visible)
          .map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-muted px-3 py-2 text-xs text-muted-foreground">
          <span>
            Vai trò hiện tại:{" "}
            <span className="font-medium text-foreground">
              {role === "admin"
                ? "Super Admin"
                : role === "content_editor"
                ? "Content Editor"
                : role === "support"
                ? "Support"
                : "—"}
            </span>
          </span>
          <ThemeToggle className="h-7 w-7" />
        </div>
      </div>
    </aside>
  );
}
