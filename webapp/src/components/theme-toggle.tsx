"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

type Theme = "light" | "dark";

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem("theme");
  return stored === "light" || stored === "dark" ? stored : null;
}

function effectiveTheme(): Theme {
  const stored = getStoredTheme();
  if (stored) return stored;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // localStorage/matchMedia không có ở server nên state ban đầu luôn là
    // "light" để khớp HTML server-render — đồng bộ lại giá trị thật ngay khi
    // component gắn vào DOM. Đây đúng là việc effect nên làm (đồng bộ với hệ
    // thống bên ngoài — browser storage), không phải trường hợp "không cần
    // effect": dùng lazy initializer thay thế sẽ khiến icon (Sun/Moon) render
    // khác HTML server ngay từ lần render đầu và gây lỗi hydration thật sự,
    // chứ không chỉ lệch text — suppressHydrationWarning không cứu được vì
    // nó chỉ nuốt cảnh báo mismatch trên chính node đó, không áp dụng cho
    // con cháu có cấu trúc khác nhau.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(effectiveTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem("theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground",
        className
      )}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
