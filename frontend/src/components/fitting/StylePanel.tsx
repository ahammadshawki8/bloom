"use client";

import { useState } from "react";
import clsx from "clsx";
import { ArrowSquareOut, CaretDown, Info } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import type { Style, Variant } from "@/lib/types";

interface Props {
  style: Style;
  variant: Variant;
  onVariant: (v: Variant) => void;
  busy: boolean;
}

const LENGTH = { short: "Short", medium: "Medium", long: "Long" } as const;

/** Compact product panel: name, price, colours, and details on demand. */
export function StylePanel({ style, variant, onVariant, busy }: Props) {
  const [open, setOpen] = useState(false);
  const isWig = style.kind === "wig";
  const facts = [
    isWig && style.length ? `${LENGTH[style.length]} length` : null,
    isWig && style.texture ? (style.texture === "wavy" ? "Wavy" : "Straight") : null,
    style.bangs ? "With bangs" : null,
    style.laceFront ? "Lace front (natural hairline)" : null,
    style.rooted ? "Rooted colour" : null,
    style.capSize ? `${style.capSize[0].toUpperCase()}${style.capSize.slice(1)} cap` : null,
  ].filter(Boolean) as string[];

  return (
    <section aria-label={`${style.name} details`} className="rounded-[var(--radius-card)] bg-paper p-4 ring-1 ring-line">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate type-studio text-[1.25rem] leading-tight">{style.name}</h2>
          <p className="truncate text-[13px] text-mulberry-soft">
            {variant.colorName} · ${variant.price.toFixed(0)} · {style.retailer}
          </p>
        </div>
        <a
          href={style.url}
          target="_blank"
          rel="noreferrer"
          className="grid size-10 shrink-0 place-items-center rounded-full ring-1 ring-line hover:ring-mulberry/40"
          aria-label={`View ${style.name} at ${style.retailer}`}
        >
          <ArrowSquareOut size={18} />
        </a>
      </div>

      {style.variants.length > 1 && (
        <div className="mt-3 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Colour">
          {style.variants.map((v) => {
            const on = v.id === variant.id;
            return (
              <button
                key={v.id}
                role="radio"
                aria-checked={on}
                aria-label={v.colorName}
                title={v.colorName}
                disabled={busy}
                onClick={() => onVariant(v)}
                className={clsx(
                  "size-8 rounded-full ring-offset-2 ring-offset-paper transition-transform active:scale-90 disabled:opacity-60",
                  on ? "ring-2 ring-mulberry" : "ring-1 ring-line hover:scale-105",
                )}
                style={{ background: v.hex }}
              />
            );
          })}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-3 flex items-center gap-1 text-[13px] font-medium text-mulberry-soft hover:text-mulberry"
      >
        Details <CaretDown size={13} className={clsx("transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            {facts.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {facts.map((f) => (
                  <li key={f} className="rounded-full bg-ivory px-2.5 py-1 text-[12px]">
                    {f}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 flex gap-2 text-[12px] text-mulberry-soft">
              <Info size={15} className="mt-px shrink-0" />
              {style.finalSale
                ? "Marked final sale by the retailer, so it can't be returned. Worth being sure here first."
                : isWig
                  ? "Many retailers won't take wigs back once opened or worn. Check the return policy before buying."
                  : "Headwear is often final sale for hygiene reasons. Check the size guide and return policy."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
