"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Heart } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { useBloom } from "@/lib/store";
import type { Share } from "@/lib/types";

/** Links she has sent, with the hearts and notes that came back. */
export function SentShares() {
  const sent = useBloom((s) => s.shares);
  const [live, setLive] = useState<Record<string, Share | null>>({});

  useEffect(() => {
    let alive = true;
    Promise.all(sent.map((s) => api.getShare(s.id).then((v) => [s.id, v] as const))).then((pairs) => {
      if (alive) setLive(Object.fromEntries(pairs));
    });
    return () => {
      alive = false;
    };
  }, [sent]);

  if (!sent.length) return null;

  return (
    <section className="mt-14" aria-labelledby="sent-title">
      <h2 id="sent-title" className="type-studio text-h3">
        What they said
      </h2>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {sent.map((s) => {
          const share = live[s.id];
          const expired = new Date(s.expiresAt) < new Date();
          const votes = share?.votes ?? [];
          return (
            <li key={s.id} className="rounded-[var(--radius-card)] bg-paper p-4 ring-1 ring-line">
              <div className="flex items-center justify-between text-micro text-mulberry-soft">
                <span>Sent {new Date(s.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                <span>
                  {share === undefined ? "Checking…" : expired || share === null ? "Closed" : `${votes.length} ${votes.length === 1 ? "reply" : "replies"}`}
                </span>
              </div>
              <div className="mt-3 flex gap-3">
                {(share?.items ?? []).map((item, i) => {
                  const n = votes.filter((v) => v.itemIndex === i).length;
                  return (
                    <div key={item.resultId} className="relative w-20">
                      <div className="relative aspect-[4/5] arch bg-ivory-deep">
                        <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                      </div>
                      <span
                        className={`absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-lift ${n ? "bg-rose-deep text-white" : "bg-white text-mulberry-soft"}`}
                      >
                        <Heart size={10} weight="fill" /> {n}
                      </span>
                    </div>
                  );
                })}
              </div>
              {votes.some((v) => v.note) && (
                <ul className="mt-5 space-y-2">
                  {votes
                    .filter((v) => v.note)
                    .map((v) => (
                      <li key={v.at} className="rounded-2xl bg-rose-wash px-4 py-2.5 text-small">
                        <span className="font-medium">{v.name || "Someone"}:</span> {v.note}
                      </li>
                    ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
