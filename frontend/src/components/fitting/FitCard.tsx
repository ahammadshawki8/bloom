"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CaretDown, Drop, Smiley, Ruler } from "@phosphor-icons/react";
import clsx from "clsx";
import type { FitReport } from "@/lib/match/fit";

const ICON = { colour: Drop, face: Smiley, length: Ruler } as const;
const EASE = [0.22, 1, 0.36, 1] as const;

/** Fit at a glance: an overall score and three measured meters, each with its source. */
export function FitCard({ report, measuring }: { report: FitReport; measuring?: boolean }) {
  const [open, setOpen] = useState(false);
  const r = 26;
  const c = 2 * Math.PI * r;
  const verdict = report.overall >= 85 ? "Feels like you" : report.overall >= 70 ? "A good fit" : "Something different";

  return (
    <section aria-label="How this look fits you" className="rounded-[var(--radius-card)] bg-paper p-4 ring-1 ring-line">
      <div className="flex items-center gap-4">
        <div className="relative size-14 shrink-0">
          <svg viewBox="0 0 64 64" className="size-14 -rotate-90" aria-hidden>
            <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-ivory-deep)" strokeWidth="6" />
            <motion.circle
              cx="32"
              cy="32"
              r={r}
              fill="none"
              stroke="var(--color-mulberry)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: c * (1 - report.overall / 100) }}
              transition={{ duration: 0.9, ease: EASE }}
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-[1.05rem] font-semibold tabular-nums">{report.overall}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="type-studio text-[1.15rem] leading-tight">{verdict}</p>
          <p className="text-[12px] text-mulberry-soft">Fit score{measuring ? " · measuring…" : " · colour, face, length"}</p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-[12px] font-medium ring-1 ring-line hover:ring-mulberry/40"
        >
          How
          <CaretDown size={13} className={clsx("transition-transform", open && "rotate-180")} />
        </button>
      </div>

      <ul className="mt-3 grid grid-cols-3 gap-3">
        {report.metrics.map((m, i) => {
          const I = ICON[m.key];
          return (
            <li key={m.key} className="min-w-0">
              <span className="flex items-center gap-1 text-[11px] text-mulberry-soft">
                <I size={12} />
                {m.label}
              </span>
              <span className="mt-0.5 line-clamp-2 block min-h-[2lh] text-[12px] leading-tight font-medium" title={m.display}>
                {m.display}
              </span>
              <div
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ivory-deep"
                role="meter"
                aria-valuenow={m.value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={m.label}
              >
                <motion.div
                  className="h-full rounded-full bg-mulberry"
                  initial={{ width: 0 }}
                  animate={{ width: `${m.value}%` }}
                  transition={{ duration: 0.8, delay: 0.1 + i * 0.1, ease: EASE }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <AnimatePresence initial={false}>
        {open && (
          <motion.dl
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 space-y-3 overflow-hidden border-t border-line pt-4"
          >
            {report.metrics.map((m) => (
              <div key={m.key}>
                <dt className="text-[13px] font-medium">{m.label}</dt>
                <dd className="text-[12px] text-mulberry-soft">
                  {m.detail} <span className="text-mulberry-faint">·</span> <span className="italic">{m.source}</span>
                </dd>
              </div>
            ))}
            <p className="text-[11px] text-mulberry-soft">Weights: colour 45%, face shape 35%, length 20%. A preview, not a guarantee of fit.</p>
          </motion.dl>
        )}
      </AnimatePresence>
    </section>
  );
}
