"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** ms — dùng để tạo hiệu ứng xuất hiện lần lượt (stagger) trong 1 grid/list */
  delay?: number;
  /** khoảng cách trượt lên khi xuất hiện, tính bằng px */
  y?: number;
};

export function Reveal({ children, className, delay = 0, y = 24 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Starts false on both server and client render so hydration matches;
  // effects only run client-side, so IntersectionObserver is always defined here.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: visible ? `${delay}ms` : "0ms",
        transform: visible ? "translateY(0)" : `translateY(${y}px)`,
      }}
      className={cn(
        "opacity-0 transition-all duration-700 ease-out will-change-transform motion-reduce:opacity-100 motion-reduce:transform-none motion-reduce:transition-none",
        visible && "opacity-100",
        className
      )}
    >
      {children}
    </div>
  );
}
