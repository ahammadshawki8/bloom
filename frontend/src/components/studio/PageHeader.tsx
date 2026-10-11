"use client";

import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/Wordmark";

interface Props {
  title?: string;
  back?: { href: string; label: string };
  actions?: ReactNode;
  /** Show the wordmark on phones (home screen). */
  brand?: boolean;
}

/** Top bar for studio pages. On phones it carries back/brand; on desktop it's a quiet title row. */
export function PageHeader({ title, back, actions, brand }: Props) {
  return (
    <header className="no-print sticky top-0 z-30 bg-ivory/85 pt-[var(--safe-top)] backdrop-blur-xl md:static md:bg-transparent md:backdrop-blur-none">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center gap-2 px-4 md:h-20 md:px-10">
        {back ? (
          <Link href={back.href} className="-ml-2 flex h-11 items-center gap-1 rounded-full pr-3 pl-2 text-small font-medium hover:bg-mulberry/5" aria-label={back.label}>
            <CaretLeft size={20} />
            <span className="hidden sm:inline">{back.label}</span>
          </Link>
        ) : brand ? (
          <Link href="/" className="md:hidden" aria-label="Back to Bloom">
            <Wordmark />
          </Link>
        ) : null}
        {title && <h1 className="type-studio truncate text-[1.2rem] md:text-h3">{title}</h1>}
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
