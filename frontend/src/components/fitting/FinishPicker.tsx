"use client";

import Image from "next/image";
import clsx from "clsx";
import { motion } from "motion/react";
import { Check, ProhibitInset } from "@phosphor-icons/react";
import { NECKLACES, PALETTES, PIPELINE, LOOK_BASES } from "@/lib/catalog/looks";
import { api } from "@/lib/api";
import type { TryOnResult } from "@/lib/types";

interface Props {
  bases: TryOnResult[];
  base: TryOnResult | null;
  palette: string;
  necklace: string | null;
  busy: boolean;
  onBase: (r: TryOnResult) => void;
  onPalette: (id: string) => void;
  onNecklace: (id: string | null) => void;
  onTryBase: (variantId: string) => void;
}

/** Complete the look: her hair choice + brows, lashes, lip and blush + a necklace, in one chained render. */
export function FinishPicker({ bases, base, palette, necklace, busy, onBase, onPalette, onNecklace, onTryBase }: Props) {
  const previewOnly = api.mode === "mock";
  const suggestions = previewOnly ? LOOK_BASES.filter((id) => !bases.some((b) => b.variantId === id)) : [];

  return (
    <div className="space-y-5">
      <ol className="flex flex-wrap items-center gap-1.5 text-[11px] text-mulberry-soft" aria-label="How a complete look is made">
        {PIPELINE.map((p, i) => (
          <li key={p.api} className="flex items-center gap-1.5">
            <span className="rounded-full bg-ivory-deep px-2.5 py-1">
              <span className="font-semibold text-mulberry">{p.api}</span> · {p.does}
            </span>
            {i < PIPELINE.length - 1 && <span aria-hidden>→</span>}
          </li>
        ))}
      </ol>

      <div>
        <p className="mb-2 text-small font-medium">1. Your hair</p>
        {bases.length === 0 && suggestions.length === 0 ? (
          <p className="text-small text-mulberry-soft">Try a wig or wrap first, then come back to finish the look.</p>
        ) : (
          <div className="-mx-4 no-scrollbar flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
            {bases.map((b) => (
              <button
                key={b.id}
                onClick={() => onBase(b)}
                aria-pressed={base?.id === b.id}
                className={clsx(
                  "relative w-16 shrink-0 arch overflow-hidden ring-2 ring-offset-2 ring-offset-ivory",
                  base?.id === b.id ? "ring-mulberry" : "ring-transparent",
                )}
              >
                <span className="relative block aspect-[4/5]">
                  <Image src={b.image} alt="A look you tried" fill sizes="64px" className="object-cover" />
                </span>
              </button>
            ))}
            {suggestions.map((id) => (
              <button
                key={id}
                onClick={() => onTryBase(id)}
                className="relative w-16 shrink-0 arch overflow-hidden opacity-70 ring-1 ring-line ring-offset-2 ring-offset-ivory hover:opacity-100"
              >
                <span className="relative block aspect-[4/5]">
                  <Image src={`/fixtures/tryon/${id}.webp`} alt="Try this first" fill sizes="64px" className="object-cover" />
                </span>
                <span className="absolute inset-x-0 bottom-0 bg-white/85 py-0.5 text-center text-[9px] font-semibold">Try</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-small font-medium">2. Brows, lashes and colour</p>
        <div className="grid grid-cols-3 gap-2">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              onClick={() => onPalette(p.id)}
              disabled={busy || !base}
              aria-pressed={palette === p.id}
              className={clsx(
                "rounded-2xl bg-paper p-2.5 text-left ring-2 transition-colors disabled:opacity-50",
                palette === p.id ? "ring-mulberry" : "ring-transparent hover:ring-line",
              )}
            >
              <span className="flex gap-1" aria-hidden>
                <span className="h-5 w-7 rounded-full" style={{ background: p.lip }} />
                <span className="size-5 rounded-full" style={{ background: p.blush }} />
              </span>
              <span className="mt-1.5 block text-[13px] font-medium">{p.label}</span>
              <span className="block text-[11px] leading-snug text-mulberry-soft">{p.note}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-mulberry-soft">
          Brows in your passport shade and natural lashes are always included; both can thin during treatment.
        </p>
      </div>

      <div>
        <p className="mb-2 text-small font-medium">3. A finishing piece</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onNecklace(null)}
            disabled={busy || !base}
            aria-pressed={necklace === null}
            className={clsx(
              "grid place-items-center rounded-2xl bg-paper p-2.5 ring-2 disabled:opacity-50",
              necklace === null ? "ring-mulberry" : "ring-transparent hover:ring-line",
            )}
          >
            <ProhibitInset size={22} className="text-mulberry-soft" />
            <span className="mt-1 text-[13px] font-medium">None</span>
          </button>
          {NECKLACES.map((n) => (
            <button
              key={n.id}
              onClick={() => onNecklace(n.id)}
              disabled={busy || !base}
              aria-pressed={necklace === n.id}
              className={clsx(
                "overflow-hidden rounded-2xl bg-paper text-left ring-2 disabled:opacity-50",
                necklace === n.id ? "ring-mulberry" : "ring-transparent hover:ring-line",
              )}
            >
              <span className="relative block aspect-[4/3] bg-white">
                <Image src={n.image} alt="" fill sizes="120px" className="object-contain p-1" />
              </span>
              <span className="block px-2.5 pt-1.5 text-[13px] font-medium">{n.label}</span>
              <span className="block px-2.5 pb-2 text-[11px] text-mulberry-soft">
                ${n.price} · {n.retailer}
              </span>
            </button>
          ))}
        </div>
      </div>

      {base && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-[12px] text-sage-deep">
          <Check size={14} weight="bold" /> Each change re-renders the whole look through the pipeline above.
        </motion.p>
      )}
    </div>
  );
}
