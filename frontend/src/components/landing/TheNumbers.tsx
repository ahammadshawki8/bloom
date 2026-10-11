"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CountUp, Reveal, RiseText } from "@/components/motion/Reveal";
import { deltaE2000 } from "@/lib/color";
import { wornLab } from "@/lib/match";
import { demoPassport } from "@/lib/passport/demo";
import type { Style } from "@/lib/types";

const EASE = [0.22, 1, 0.36, 1] as const;
const ACCENT = "#a8505c"; // validated: emphasis hue vs. context gray (dataviz validator, light surface)
const CONTEXT = "#b8a9b1";
const THRESHOLD = 6;

export function TheNumbers() {
  return (
    <section className="relative overflow-hidden bg-paper">
      <div className="mx-auto max-w-[1240px] px-5 py-20 md:px-10 lg:py-28">
        <RiseText text="The numbers behind Bloom." className="max-w-[18ch] type-atelier text-h1 md:text-display" />

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <Stat value={65} suffix="%" label="of people having chemotherapy lose some or all of their hair." source={4} delay={0} />
          <Stat value={55} suffix="%" label="of breast cancer patients in one survey reported high distress from it." source={5} delay={0.1} />
          <Stat value={11651} suffix="" label="hair pixels measured, on the phone, to write one passport colour." delay={0.2} />
        </div>

        <Timeline />
        <ColourMatchChart />
      </div>
    </section>
  );
}

function Stat({ value, suffix, label, source, delay }: { value: number; suffix: string; label: string; source?: number; delay: number }) {
  return (
    <Reveal delay={delay} className="rounded-[var(--radius-card)] bg-ivory p-6">
      <p className="font-sans text-[3.25rem] leading-none font-semibold tracking-tight text-mulberry tabular-nums">
        <CountUp to={value} suffix={suffix} format={value > 999} />
      </p>
      <p className="mt-4 max-w-[30ch] text-body text-mulberry-soft">
        {label}
        {source && (
          <sup className="ml-0.5 text-micro">
            <a href={`#source-${source}`} aria-label={`Source ${source}`}>
              [{source}]
            </a>
          </sup>
        )}
      </p>
    </Reveal>
  );
}

/** The window: an illustrative timeline with Bloom's moment emphasised. */
function Timeline() {
  const reduce = useReducedMotion();
  const phases = [
    // claims-ok: names the event on the treatment timeline, not a diagnosis by Bloom
    { label: "Diagnosis to first infusion", note: "Hair is still yours. Bloom's window.", w: 26, emphasis: true },
    { label: "Weeks 2–4", note: "Hair loss usually begins", w: 18 },
    { label: "During treatment", note: "Wigs, wraps, or neither", w: 34 },
    // claims-ok: sourced description of the natural timeline (Consumer Reports), not a product claim
    { label: "About 3 months after", note: "Regrowth often starts, sometimes different", w: 22 },
  ];
  return (
    <Reveal className="mt-14 rounded-[var(--radius-card)] bg-ivory p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="type-studio text-h3">The window</h3>
        <p className="text-micro text-mulberry-soft">Illustrative. Every treatment plan is different.</p>
      </div>
      <div
        className="mt-6 flex h-3 gap-[2px] overflow-hidden rounded-full"
        role="img"
        // claims-ok: accessible text for the same sourced timeline
        aria-label="Timeline: diagnosis to first infusion is Bloom's window; hair loss begins weeks 2 to 4; regrowth often starts about 3 months after treatment."
      >
        {phases.map((p, i) => (
          <motion.span
            key={p.label}
            className="block h-full origin-left"
            style={{ width: `${p.w}%`, background: p.emphasis ? ACCENT : CONTEXT }}
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 + i * 0.25, ease: EASE }}
          />
        ))}
      </div>
      <ol className="mt-5 grid gap-4 sm:grid-cols-4">
        {phases.map((p, i) => (
          <motion.li
            key={p.label}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.35 + i * 0.25 }}
            className="border-l-2 pl-3"
            style={{ borderColor: p.emphasis ? ACCENT : CONTEXT }}
          >
            <p className="text-small font-semibold text-mulberry">{p.label}</p>
            <p className="text-micro text-mulberry-soft">{p.note}</p>
          </motion.li>
        ))}
      </ol>
    </Reveal>
  );
}

interface Row {
  name: string;
  colour: string;
  hex: string;
  dE: number;
}

/** Every wig, measured against one passport: ΔE2000 on the rendered try-on. */
function ColourMatchChart() {
  const [styles, setStyles] = useState<Style[] | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    fetch("/fixtures/catalog.json")
      .then((r) => r.json())
      .then((d) => setStyles(d.styles));
  }, []);

  const rows: Row[] = useMemo(() => {
    if (!styles) return [];
    const p = demoPassport();
    return styles
      .filter((s) => s.kind === "wig")
      .map((s) => {
        const best = s.variants.map((v) => ({ v, d: deltaE2000(p.hair.lab, wornLab(v)) })).sort((a, b) => a.d - b.d)[0];
        return { name: s.name, colour: best.v.colorName, hex: best.v.hex, dE: best.d };
      })
      .sort((a, b) => a.dE - b.dE);
  }, [styles]);

  const max = Math.max(12, ...rows.map((r) => r.dE)) * 1.1;
  const close = rows.filter((r) => r.dE < THRESHOLD).length;

  return (
    <Reveal className="mt-6 rounded-[var(--radius-card)] bg-ivory p-6 md:p-8">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
        <div>
          <h3 className="type-studio text-h3">Measured, not guessed</h3>
          <p className="mt-3 max-w-[40ch] text-body text-mulberry-soft">
            One sample passport, every wig in the collection. Each bar is the colour distance (ΔE2000) between her measured hair and the wig&apos;s closest
            shade, read off the real try-on render. Lower is closer.
          </p>
          <p className="mt-6 font-sans text-[3.25rem] leading-none font-semibold tracking-tight tabular-nums">
            <CountUp to={close} />
            <span className="text-h3 font-medium text-mulberry-soft"> of {rows.length || 11}</span>
          </p>
          <p className="mt-2 text-small text-mulberry-soft">styles read as her own colour (ΔE under {THRESHOLD}).</p>
        </div>

        <div className="relative" onMouseLeave={() => setHover(null)}>
          {/* threshold */}
          <div
            className="pointer-events-none absolute inset-y-0 z-10 border-l border-dashed border-mulberry/40"
            style={{ left: `calc(7.5rem + (100% - 7.5rem - 3rem) * ${THRESHOLD / max})` }}
          >
            <span className="absolute -top-5 -translate-x-1/2 text-[11px] whitespace-nowrap text-mulberry-soft">reads as hers</span>
          </div>
          <ul className="space-y-[6px] pt-4">
            {rows.map((r, i) => {
              const on = r.dE < THRESHOLD;
              return (
                <li key={r.name} className="flex items-center gap-2" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0}>
                  <span className="flex w-[7rem] shrink-0 items-center gap-1.5 truncate text-[12px] text-mulberry">
                    <span className="size-2.5 shrink-0 rounded-full ring-1 ring-white" style={{ background: r.hex }} aria-hidden />
                    {r.name}
                  </span>
                  <span className="relative h-[14px] flex-1">
                    <motion.span
                      className="absolute inset-y-0 left-0 origin-left rounded-r-[4px]"
                      style={{ width: `${(r.dE / max) * 100}%`, background: on ? ACCENT : CONTEXT, opacity: hover === null || hover === i ? 1 : 0.45 }}
                      initial={reduce ? false : { scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.1 + i * 0.05, ease: EASE }}
                    />
                  </span>
                  <span className="w-[2.5rem] shrink-0 text-right text-[12px] text-mulberry-soft tabular-nums">{r.dE.toFixed(1)}</span>
                  {hover === i && (
                    <span className="pointer-events-none absolute right-0 z-20 -translate-y-8 rounded-xl bg-mulberry px-3 py-1.5 text-[12px] text-ivory shadow-float">
                      {r.name}, {r.colour}: ΔE {r.dE.toFixed(1)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <table className="sr-only">
            <caption>Colour distance from the sample passport, per wig style</caption>
            <thead>
              <tr>
                <th>Style</th>
                <th>Closest shade</th>
                <th>ΔE2000</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td>{r.colour}</td>
                  <td>{r.dE.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Reveal>
  );
}
