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
const ONSET_DAY = 18;
const SCALE_DAYS = 28;
const ONSET_POSITION = (ONSET_DAY / SCALE_DAYS) * 100;

const STUDY_BARS = [
  { label: "Used a wig", value: 84 },
  { label: "Lost eyebrow hair", value: 90 },
  { label: "Lost eyelash hair", value: 88 },
] as const;

export function TheNumbers() {
  return (
    <section className="relative overflow-hidden bg-paper">
      <div className="mx-auto max-w-[1240px] px-5 py-20 md:px-10 lg:py-28">
        <RiseText text="The numbers behind Bloom." className="max-w-[18ch] type-atelier text-h1 md:text-display" />
        <Reveal delay={0.1}>
          <p className="mt-5 max-w-[66ch] text-lead text-mulberry-soft">
            A survey of 1,478 breast cancer patients at 47 sites in Japan shows how quickly appearance can change, and why Bloom includes wigs, brows, and
            lashes.
            <sup className="ml-1 text-micro">
              <a href="#source-4" aria-label="Source 4">
                [4]
              </a>
            </sup>
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <OnsetChart />
          <AppearanceChart />
        </div>
        <ColourMatchChart />
      </div>
    </section>
  );
}

/** A four-week scale gives the study's mean onset a clear, honest reference point. */
function OnsetChart() {
  const reduce = useReducedMotion();
  return (
    <Reveal className="flex h-full flex-col rounded-[var(--radius-card)] bg-ivory p-6 md:p-8">
      <p className="text-micro font-semibold tracking-[0.12em] text-mulberry-soft uppercase">The preparation window</p>
      <h3 className="mt-3 type-studio text-h3">Hair loss started after</h3>
      <p className="mt-5 flex items-baseline gap-2 font-sans leading-none text-mulberry">
        <CountUp to={ONSET_DAY} className="text-[4.5rem] font-semibold tracking-tight tabular-nums md:text-[5rem]" />
        <span className="text-h3">days</span>
      </p>
      <p className="mt-2 text-small text-mulberry-soft">on average after chemotherapy began in this study.</p>

      <div className="mt-auto pt-12">
        <div
          className="relative h-3 rounded-full bg-paper"
          role="img"
          aria-label="From the first treatment to four weeks later, the average start of hair loss in this study was day 18."
        >
          <motion.div
            className="h-full origin-left rounded-full"
            style={{ width: `${ONSET_POSITION}%`, background: ACCENT }}
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: EASE }}
          />
          <span
            className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-ivory bg-mulberry shadow-lift"
            style={{ left: `${ONSET_POSITION}%` }}
            aria-hidden
          />
        </div>
        <div className="mt-4 flex justify-between gap-3 text-micro text-mulberry-soft">
          <span>First treatment</span>
          <span>Four weeks</span>
        </div>
        <p className="mt-6 border-t border-line pt-4 text-small text-mulberry-soft">An average, not a deadline. Individual experiences vary.</p>
      </div>
    </Reveal>
  );
}

/** Three comparable percentages from the same study, all shown on a 100% scale. */
function AppearanceChart() {
  const reduce = useReducedMotion();
  return (
    <Reveal delay={0.1} className="h-full rounded-[var(--radius-card)] bg-ivory p-6 md:p-8">
      <p className="text-micro font-semibold tracking-[0.12em] text-mulberry-soft uppercase">What patients reported</p>
      <h3 className="mt-3 type-studio text-h3">Hair, brows, and lashes</h3>
      <ul className="mt-8 space-y-7">
        {STUDY_BARS.map((bar, i) => (
          <li key={bar.label}>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="text-small font-medium text-mulberry">{bar.label}</span>
              <span className="text-h3 leading-none font-semibold text-mulberry tabular-nums">{bar.value}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-paper" role="img" aria-label={`${bar.value}% of surveyed patients ${bar.label.toLowerCase()}.`}>
              <motion.div
                className="h-full origin-left rounded-full"
                style={{ width: `${bar.value}%`, background: i === 0 ? ACCENT : CONTEXT }}
                initial={reduce ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.12, ease: EASE }}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-between text-[11px] text-mulberry-soft" aria-hidden>
        <span>0</span>
        <span>50</span>
        <span>100%</span>
      </div>
      <p className="mt-6 border-t border-line pt-4 text-small text-mulberry-soft">
        One survey, one scale. These figures describe this study&apos;s participants.
      </p>
    </Reveal>
  );
}

interface Row {
  name: string;
  colour: string;
  hex: string;
  dE: number;
}

/** The nearest five wigs, measured against one passport: ΔE2000 on the rendered try-on. */
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

  const shownRows = rows.slice(0, 5);
  const max = Math.max(12, ...shownRows.map((r) => r.dE)) * 1.1;
  const close = rows.filter((r) => r.dE < THRESHOLD).length;

  return (
    <Reveal className="mt-6 rounded-[var(--radius-card)] bg-ivory p-6 md:p-8">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
        <div>
          <h3 className="type-studio text-h3">Measured on the try-on</h3>
          <p className="mt-3 max-w-[40ch] text-body text-mulberry-soft">
            For one sample Hair Passport, Bloom compares her measured hair colour with each wig&apos;s rendered shade. These are the five closest styles; a
            shorter bar means a closer colour match.
          </p>
          <p className="mt-6 font-sans text-[3.25rem] leading-none font-semibold tracking-tight tabular-nums">
            <CountUp to={close} />
            <span className="text-h3 font-medium text-mulberry-soft"> of {rows.length || 11}</span>
          </p>
          <p className="mt-2 text-small text-mulberry-soft">wig styles meet Bloom&apos;s close-shade threshold (ΔE below {THRESHOLD}).</p>
        </div>

        <div className="relative" onMouseLeave={() => setHover(null)}>
          {/* threshold */}
          <div
            className="pointer-events-none absolute inset-y-0 z-10 border-l border-dashed border-mulberry/40"
            style={{ left: `calc(7.5rem + (100% - 7.5rem - 3rem) * ${THRESHOLD / max})` }}
          >
            <span className="absolute -top-5 -translate-x-1/2 text-[11px] whitespace-nowrap text-mulberry-soft">close shade</span>
          </div>
          <ul className="space-y-[6px] pt-4">
            {shownRows.map((r, i) => {
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
            <caption>Five closest wig styles by colour distance from the sample Hair Passport</caption>
            <thead>
              <tr>
                <th>Style</th>
                <th>Closest shade</th>
                <th>ΔE2000</th>
              </tr>
            </thead>
            <tbody>
              {shownRows.map((r) => (
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
