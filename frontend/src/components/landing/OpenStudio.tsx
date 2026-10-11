"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, type ReactNode } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import clsx from "clsx";
import { ensureAwake, warmBackend } from "@/lib/wake";

/** Warms the backend once, as soon as the landing page is on screen. */
export function WarmUp() {
  useEffect(() => {
    warmBackend();
  }, []);
  return null;
}

interface Props {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "outline" | "quiet";
  size?: "md" | "lg";
  className?: string;
  arrow?: boolean;
}

/** Any doorway from the atelier into the studio. Waits for the backend if needed. */
export function OpenStudio({ href = "/studio", children, variant = "primary", size = "md", className, arrow }: Props) {
  const router = useRouter();

  useEffect(() => {
    router.prefetch(href);
  }, [router, href]);

  async function go() {
    const ok = await ensureAwake(href);
    if (ok) startTransition(() => router.push(href));
  }

  return (
    <button
      type="button"
      onClick={go}
      className={clsx(
        "group inline-flex items-center justify-center gap-2.5 rounded-full font-medium transition-[transform,background-color,border-color] duration-200 active:scale-[0.97]",
        size === "lg" ? "h-14 px-8 text-[1.0625rem]" : "h-11 px-5 text-small",
        variant === "primary" && "bg-mulberry text-ivory shadow-lift hover:bg-[#563649]",
        variant === "outline" && "border border-mulberry/25 text-mulberry hover:border-mulberry/60",
        variant === "quiet" && "text-mulberry underline decoration-rose/60 underline-offset-[6px] hover:decoration-rose-deep",
        className,
      )}
    >
      {children}
      {arrow && <ArrowRight size={18} weight="regular" className="transition-transform duration-300 group-hover:translate-x-0.5" />}
    </button>
  );
}
