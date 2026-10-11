"use client";

import Link from "next/link";
import Image from "next/image";
import { useBloom } from "@/lib/store";

/** "Pick up where you left off": the last few try-ons, newest first. */
export function RecentLooks() {
  const results = useBloom((s) => s.results);
  const recent = Object.values(results)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);
  if (!recent.length) return null;
  return (
    <section className="mt-10" aria-labelledby="recent-title">
      <div className="flex items-baseline justify-between">
        <h2 id="recent-title" className="type-studio text-h3">
          Pick up where you left off
        </h2>
        <Link href="/studio/try" className="text-small font-medium underline decoration-rose/60 underline-offset-4">
          Open studio
        </Link>
      </div>
      <ul className="no-scrollbar -mx-4 mt-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {recent.map((r) => (
          <li key={r.id} className="snap-start">
            <Link href={`/studio/try?result=${encodeURIComponent(r.id)}`} className="block w-28 md:w-32">
              <span className="arch relative block aspect-[4/5] bg-ivory-deep">
                <Image src={r.image} alt="A look you tried" fill sizes="128px" className="object-cover" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
