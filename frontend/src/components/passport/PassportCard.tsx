"use client";

import { motion } from "motion/react";
import { ArchMirror } from "@/components/mirror/ArchMirror";
import type { Passport } from "@/lib/types";

const LENGTH = { short: "Short", medium: "Medium, around the shoulders", long: "Long, past the shoulders" } as const;
const TEXTURE = { straight: "Straight", wavy: "Wavy" } as const;
const DENSITY = { 1: "Fine", 2: "Light", 3: "Full", 4: "Very full" } as const;

const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

interface Props {
  passport: Passport;
  /** Staggered entrance for the reveal moment. */
  reveal?: boolean;
  transitionName?: string;
}

export function PassportCard({ passport, reveal, transitionName }: Props) {
  const item = (i: number) =>
    reveal
      ? {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.35 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
        }
      : {};

  return (
    <article className="passport-card overflow-hidden rounded-[var(--radius-sheet)] bg-paper shadow-float ring-1 ring-line print:shadow-none">
      <div className="grid gap-0 sm:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-rose-wash p-5 sm:p-7">
          <ArchMirror
            src={passport.photo}
            alt="Passport photo"
            transitionName={transitionName}
            reveal={false}
            sizes="(min-width: 640px) 320px, 80vw"
            className="mx-auto max-w-[280px]"
          />
        </div>
        <div className="flex flex-col p-5 sm:p-7">
          <motion.div {...item(0)}>
            <p className="text-micro text-mulberry-soft">
              {passport.isDemo ? "Sample hair passport" : "Hair passport"} · measured {fmt(passport.createdAt)}
            </p>
            <h2 className="mt-1 type-studio text-h2">Your natural hair</h2>
          </motion.div>

          <motion.div {...item(1)} className="mt-6 flex items-center gap-4 rounded-[22px] bg-ivory p-4">
            <motion.span
              className="size-16 shrink-0 rounded-full ring-4 ring-white"
              style={{ background: passport.hair.hex }}
              initial={reveal ? { scale: 0.3 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: reveal ? 0.5 : 0 }}
            />
            <div className="min-w-0">
              <p className="type-studio text-[1.3rem] leading-tight">{passport.hair.name}</p>
              <p className="mt-0.5 text-micro text-mulberry-soft">
                {passport.hair.hex.toUpperCase()} · L*{passport.hair.lab[0].toFixed(0)} a*{passport.hair.lab[1].toFixed(0)} b*{passport.hair.lab[2].toFixed(0)}
              </p>
              <p className="mt-0.5 text-micro text-mulberry-soft">
                Measured on this phone{passport.hair.samples ? ` from ${passport.hair.samples.toLocaleString()} hair pixels` : ""}
              </p>
            </div>
          </motion.div>

          <dl className="mt-5 divide-y divide-line">
            {passport.length && <Row i={2} reveal={reveal} label="Length" value={LENGTH[passport.length]} />}
            {(passport.curl || passport.texture) && (
              <Row
                i={3}
                reveal={reveal}
                label="Texture"
                value={passport.curl ? `${passport.curl.label} (${passport.curl.code.toUpperCase()})` : TEXTURE[passport.texture!]}
              />
            )}
            {passport.density && (
              <Row
                i={4}
                reveal={reveal}
                label="Fullness"
                value={
                  <span className="flex items-center gap-2">
                    <span className="flex gap-1" aria-hidden>
                      {[1, 2, 3, 4].map((n) => (
                        <span key={n} className={`size-2.5 rounded-full ${n <= passport.density! ? "bg-mulberry" : "bg-line"}`} />
                      ))}
                    </span>
                    {DENSITY[passport.density]}
                  </span>
                }
              />
            )}
            {passport.browHex && (
              <Row
                i={5}
                reveal={reveal}
                label="Brow shade"
                value={
                  <span className="flex items-center gap-2">
                    <span className="size-4 rounded-full ring-2 ring-white" style={{ background: passport.browHex }} />
                    {passport.browHex.toUpperCase()}
                  </span>
                }
              />
            )}
          </dl>
          <p className="mt-auto pt-5 text-micro text-mulberry-soft">
            Show this to a wig fitter to match colour and length. A cosmetic record, not a medical one.
          </p>
        </div>
      </div>
    </article>
  );
}

function Row({ label, value, i, reveal }: { label: string; value: React.ReactNode; i: number; reveal?: boolean }) {
  return (
    <motion.div
      className="flex items-center justify-between gap-4 py-3"
      initial={reveal ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reveal ? 0.35 + i * 0.12 : 0, duration: 0.45 }}
    >
      <dt className="text-small text-mulberry-soft">{label}</dt>
      <dd className="text-right text-small font-medium">{value}</dd>
    </motion.div>
  );
}
