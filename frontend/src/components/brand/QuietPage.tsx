import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "./Wordmark";

/** A calm full-page message: offline, not found, something went wrong. */
export function QuietPage({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-ivory px-6 py-16">
      <div className="max-w-md text-center">
        <Link href="/" aria-label="Bloom home" className="inline-block">
          <Wordmark size="lg" />
        </Link>
        <div aria-hidden className="mx-auto mt-10 aspect-[4/5] w-32 arch bg-rose-wash" />
        <h1 className="mt-8 type-studio text-h2">{title}</h1>
        <div className="mt-3 text-body text-mulberry-soft">{children}</div>
        {action && <div className="mt-7">{action}</div>}
      </div>
    </main>
  );
}
