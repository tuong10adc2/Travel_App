"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function Topbar() {
  const { profile, user, signOut } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-end border-b border-border bg-surface px-6">

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium leading-tight text-foreground">
            {profile?.displayName || user?.email}
          </p>
          <p className="text-xs leading-tight text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {(profile?.displayName || user?.email || "?").charAt(0).toUpperCase()}
        </div>
        <button
          onClick={() => signOut()}
          title="Đăng xuất"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-muted hover:text-danger-600"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}
