"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { motion } from "motion/react";
import { House, IdentificationBadge, MagicWand, Heart, ShieldCheck, type Icon } from "@phosphor-icons/react";
import { Wordmark } from "@/components/brand/Wordmark";
import { useBloom } from "@/lib/store";
import { api } from "@/lib/api";

const ITEMS: { href: string; label: string; icon: Icon; match: (p: string) => boolean }[] = [
  { href: "/studio", label: "Home", icon: House, match: (p) => p === "/studio" },
  { href: "/studio/passport", label: "Passport", icon: IdentificationBadge, match: (p) => p.startsWith("/studio/passport") },
  { href: "/studio/try", label: "Studio", icon: MagicWand, match: (p) => p.startsWith("/studio/try") },
  { href: "/studio/saved", label: "Saved", icon: Heart, match: (p) => p.startsWith("/studio/saved") || p.startsWith("/studio/pack") },
];

function SavedBadge() {
  const n = useBloom((s) => s.saved.length);
  if (!n) return null;
  return (
    <span className="absolute -top-1 -right-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-deep px-1 text-[10px] font-semibold text-white">
      {n}
    </span>
  );
}

/** Bottom tab bar on phones. */
export function BottomNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Studio"
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-ivory/88 pb-[var(--safe-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {ITEMS.map(({ href, label, icon: I, match }) => {
          const active = match(path);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className="relative flex h-16 flex-col items-center justify-center gap-1">
                {active && (
                  <motion.span layoutId="tab-pill" className="absolute top-2 h-8 w-14 rounded-full bg-rose-wash" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
                )}
                <span className="relative">
                  <I size={22} weight={active ? "fill" : "regular"} className={active ? "text-mulberry" : "text-mulberry-soft"} />
                  {href === "/studio/saved" && <SavedBadge />}
                </span>
                <span className={clsx("relative text-[11px] font-medium", active ? "text-mulberry" : "text-mulberry-soft")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Left rail on tablets and desktops. */
export function SideRail() {
  const path = usePathname();
  return (
    <aside className="no-print sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-line/70 px-5 py-7 md:flex">
      <Link href="/" className="px-3" aria-label="Back to Bloom">
        <Wordmark />
      </Link>
      <ul className="mt-10 space-y-1">
        {ITEMS.map(({ href, label, icon: I, match }) => {
          const active = match(path);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative flex h-12 items-center gap-3 rounded-full px-4 text-[1rem] font-medium transition-colors",
                  active ? "text-mulberry" : "text-mulberry-soft hover:bg-mulberry/[0.04] hover:text-mulberry",
                )}
              >
                {active && <motion.span layoutId="rail-pill" className="absolute inset-0 rounded-full bg-rose-wash" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                <span className="relative">
                  <I size={22} weight={active ? "fill" : "regular"} />
                  {href === "/studio/saved" && <SavedBadge />}
                </span>
                <span className="relative">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto space-y-3">
        {api.mode === "mock" && (
          <p className="rounded-[18px] bg-butter-wash px-4 py-3 text-micro leading-snug text-butter-deep">
            Preview mode. Try-ons show real renders on a sample face.
          </p>
        )}
        <Link
          href="/studio/privacy"
          className={clsx(
            "flex h-11 items-center gap-3 rounded-full px-4 text-small",
            path.startsWith("/studio/privacy") ? "bg-sage-wash text-mulberry" : "text-mulberry-soft hover:text-mulberry",
          )}
        >
          <ShieldCheck size={20} />
          Privacy &amp; your data
        </Link>
      </div>
    </aside>
  );
}
