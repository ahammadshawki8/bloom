"use client";

import clsx from "clsx";
import { ArrowSquareOut, Info, CheckCircle, Ruler } from "@phosphor-icons/react";
import { deltaE2000, describeDeltaE } from "@/lib/color";
import { wornLab } from "@/lib/match";
import type { Passport, Style, Variant } from "@/lib/types";

interface Props {
  style: Style;
  variant: Variant;
  passport: Passport;
  onVariant: (v: Variant) => void;
  rendered: { deltaE: number | null; measuring: boolean } | null;
  reasons: string[];
  busy: boolean;
}

const LENGTH = { short: "Short", medium: "Medium", long: "Long" } as const;

export function StylePanel({ style, variant, passport, onVariant, rendered, reasons, busy }: Props) {
  const isWig = style.kind === "wig";
  const productDe = deltaE2000(passport.hair.lab, wornLab(variant));
  const words = describeDeltaE(rendered?.deltaE ?? productDe);

  return (
    <section aria-label={`${style.name} details`} className="rounded-[var(--radius-card)] bg-paper p-5 ring-1 ring-line">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="type-studio text-h3 leading-tight">{style.name}</h2>
          <p className="mt-0.5 text-small text-mulberry-soft">
            {variant.colorName} · ${variant.price.toFixed(0)}
            {isWig && style.length ? ` · ${LENGTH[style.length]}` : ""}
            {isWig && style.texture ? `, ${style.texture}` : ""}
          </p>
        </div>
        <a
          href={style.url}
          target="_blank"
          rel="noreferrer"
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-small font-medium ring-1 ring-line hover:ring-mulberry/40"
        >
          Retailer <ArrowSquareOut size={16} />
        </a>
      </div>

      {/* colours */}
      {style.variants.length > 1 && (
        <div className="mt-5">
          <p className="text-micro text-mulberry-soft">Colours</p>
          <div className="mt-2 flex flex-wrap gap-2.5" role="radiogroup" aria-label="Colour">
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
                  className={clsx("size-10 rounded-full ring-offset-2 ring-offset-paper transition-transform active:scale-90 disabled:opacity-60", on ? "ring-2 ring-mulberry" : "ring-1 ring-line hover:scale-105")}
                  style={{ background: v.hex }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* colour match, verified on the render */}
      {isWig && (
        <div className={clsx("mt-5 rounded-[20px] p-4", words.tone === "match" || words.tone === "close" ? "bg-sage-wash" : words.tone === "gentle" ? "bg-butter-wash" : "bg-lilac-wash")}>
          <div className="flex items-center gap-3">
            <span className="flex -space-x-2" aria-hidden>
              <span className="size-8 rounded-full ring-2 ring-white" style={{ background: passport.hair.hex }} />
              <span className="size-8 rounded-full ring-2 ring-white" style={{ background: variant.hex }} />
            </span>
            <div className="min-w-0">
              <p className="text-small font-semibold">{words.label} to your colour</p>
              <p className="text-micro text-mulberry-soft">{words.sentence}</p>
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-micro">
            <div className="rounded-xl bg-white/60 px-3 py-2">
              <dt className="text-mulberry-soft">{variant.renderLab ? "Worn, reference face" : "Product photo"}</dt>
              <dd className="font-medium">ΔE {productDe.toFixed(1)}</dd>
            </div>
            <div className="rounded-xl bg-white/60 px-3 py-2">
              <dt className="flex items-center gap-1 text-mulberry-soft">
                <Ruler size={12} /> Measured on you
              </dt>
              <dd className="font-medium">{rendered?.measuring ? "Measuring…" : rendered?.deltaE != null ? `ΔE ${rendered.deltaE.toFixed(1)}` : "Try it on to measure"}</dd>
            </div>
          </dl>
        </div>
      )}

      {reasons.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {reasons.slice(1).map((r) => (
            <li key={r} className="flex items-center gap-2 text-small">
              <CheckCircle size={16} weight="fill" className="text-sage-deep" /> {r}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 flex gap-2 text-micro text-mulberry-soft">
        <Info size={16} className="mt-px shrink-0" />
        {style.finalSale
          ? "Marked final sale by the retailer, so it can't be returned. Worth being sure here first."
          : isWig
            ? "Many retailers won't take wigs back once opened or worn. Check the return policy before buying."
            : "Headwear is often final sale for hygiene reasons. Check the size guide and return policy."}
      </p>
    </section>
  );
}
