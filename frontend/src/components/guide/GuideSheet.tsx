"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { create } from "zustand";
import { Sparkle, MagnifyingGlass, IdentificationBadge, Gauge, Eyeglasses, ArrowRight, CircleNotch } from "@phosphor-icons/react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useBloom } from "@/lib/store";
import type { GuideEvent, GuidePick } from "@/lib/types";

const SUGGESTIONS = ["Close to my own colour, easy to look after", "Something new and lighter for summer", "Soft waves, around shoulder length", "A wig and a soft wrap for sleeping days"];

const ICON: Record<string, typeof Sparkle> = {
  get_passport: IdentificationBadge,
  search_styles: MagnifyingGlass,
  fit_report: Gauge,
  suggest_brows_and_lashes: Eyeglasses,
};

interface GuideState {
  open: boolean;
  prompt: string;
  events: GuideEvent[];
  running: boolean;
  /** Start right away when opened with a prompt (e.g. from the home card). */
  autorun: boolean;
  setOpen: (open: boolean, prompt?: string) => void;
}

/** Shared open/close state so any page can summon the guide. */
export const useGuide = create<GuideState>((set) => ({
  open: false,
  prompt: "",
  events: [],
  running: false,
  autorun: false,
  setOpen: (open, prompt) => set((s) => ({ open, prompt: prompt ?? s.prompt, autorun: open && !!prompt })),
}));

/** The Bloom guide: an agent that plans with an LLM and acts through Bloom's own tools. */
export function GuideSheet() {
  const { open, prompt, events, running, setOpen } = useGuide();
  const passport = useBloom((s) => s.passport);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const picks = events.find((e): e is Extract<GuideEvent, { type: "picks" }> => e.type === "picks");
  const done = events.find((e): e is Extract<GuideEvent, { type: "done" }> => e.type === "done");

  async function run(text: string) {
    if (!passport || running) return;
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setError(null);
    useGuide.setState({ prompt: text, events: [], running: true });
    try {
      await api.guide({ prompt: text, passport }, (e) => useGuide.setState((s) => ({ events: [...s.events, e] })), ctrl.signal);
    } catch (e) {
      if (!ctrl.signal.aborted) setError((e as { hint?: string }).hint ?? "The guide couldn't finish. Please try again.");
    } finally {
      useGuide.setState({ running: false });
    }
  }

  const autorun = useGuide((s) => s.autorun);
  useEffect(() => {
    if (!open || !autorun) return;
    queueMicrotask(() => {
      useGuide.setState({ autorun: false });
      run(useGuide.getState().prompt);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autorun]);

  return (
    <Sheet open={open} onClose={() => setOpen(false)} title="Your Bloom guide" wide>
      {!passport ? (
        <div className="py-6 text-center">
          <p className="text-body text-mulberry-soft">The guide works from your hair passport. Make one first, or use the sample face.</p>
          <Link href="/studio/passport" onClick={() => setOpen(false)} className="mt-4 inline-block font-medium underline underline-offset-4">
            Go to your passport
          </Link>
        </div>
      ) : (
        <div className="space-y-5 pb-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(prompt);
            }}
          >
            <label htmlFor="guide-prompt" className="text-small text-mulberry-soft">
              Tell me what you&apos;re hoping for. I&apos;ll search the collection, check colour and fit against your passport, and bring back a few looks.
            </label>
            <div className="mt-3 flex gap-2">
              <input
                id="guide-prompt"
                value={prompt}
                onChange={(e) => useGuide.setState({ prompt: e.target.value })}
                maxLength={300}
                placeholder="e.g. close to my colour, low maintenance"
                className="h-12 min-w-0 flex-1 rounded-2xl bg-paper px-4 text-body ring-1 ring-line outline-none placeholder:text-mulberry-faint focus:ring-2 focus:ring-rose-deep"
              />
              <Button type="submit" disabled={running || !prompt.trim()} icon={running ? <CircleNotch size={18} className="animate-spin" /> : <Sparkle size={18} />}>
                {running ? "Working" : "Ask"}
              </Button>
            </div>
            <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={running}
                  onClick={() => run(s)}
                  className="shrink-0 rounded-full bg-lilac-wash px-3.5 py-2 text-[13px] font-medium text-mulberry transition-colors hover:bg-[#ddd5ea] disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </form>

          {events.length > 0 && (
            <ol className="space-y-2" aria-live="polite" aria-label="What the guide is doing">
              <AnimatePresence initial={false}>
                {events
                  .filter((e) => e.type === "tool" || e.type === "thinking")
                  .map((e, i) => {
                    if (e.type === "thinking")
                      return (
                        <motion.li key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="pl-9 text-[13px] text-mulberry-soft italic">
                          {e.text}
                        </motion.li>
                      );
                    if (e.type !== "tool") return null;
                    const I = ICON[e.name] ?? Sparkle;
                    return (
                      <motion.li key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-sage-wash text-sage-deep">
                          <I size={14} />
                        </span>
                        <span className="min-w-0 text-[13px]">
                          <span className="font-medium">{e.label}</span>
                          {e.detail && <span className="text-mulberry-soft"> · {e.detail}</span>}
                        </span>
                      </motion.li>
                    );
                  })}
              </AnimatePresence>
              {running && !picks && (
                <li className="flex items-center gap-3 pl-0.5 text-[13px] text-mulberry-soft">
                  <CircleNotch size={18} className="animate-spin" /> Thinking…
                </li>
              )}
            </ol>
          )}

          {error && (
            <p role="alert" className="rounded-2xl bg-rose-wash px-4 py-3 text-small">
              {error}
            </p>
          )}

          {picks && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <p className="type-studio text-[1.2rem]">{picks.note}</p>
              <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                {picks.picks.map((p) => (
                  <PickCard key={p.variant_id} pick={p} demo={passport.isDemo} onGo={() => setOpen(false)} />
                ))}
              </ul>
              {picks.brows && (
                <p className="mt-4 rounded-2xl bg-butter-wash px-4 py-3 text-[13px]">
                  <span className="font-semibold">
                    {picks.brows.brow_label} brows, {picks.brows.lash_label.toLowerCase()} lashes.
                  </span>{" "}
                  <span className="text-mulberry-soft">{picks.brows.why}</span>{" "}
                  <Link href="/studio/try?tab=brows" onClick={() => setOpen(false)} className="font-medium underline underline-offset-4">
                    Try them
                  </Link>
                </p>
              )}
            </motion.section>
          )}

          {done && (
            <p className="text-[11px] text-mulberry-soft">
              {done.planner === "llm"
                ? `Planned by ${done.model?.split("/").slice(1).join("/") ?? "an AI model"}, using Bloom's own tools for every number.`
                : "Planned step by step with Bloom's own tools."}{" "}
              Cosmetic suggestions only.
            </p>
          )}
        </div>
      )}
    </Sheet>
  );
}

function PickCard({ pick, demo, onGo }: { pick: GuidePick; demo: boolean; onGo: () => void }) {
  // On the sample face, show the real pre-rendered try-on; otherwise the product.
  const [src, setSrc] = useState(demo ? `/fixtures/tryon/${pick.variant_id}.webp` : `/fixtures/catalog/${pick.variant_id}.webp`);
  return (
    <li className="flex flex-col rounded-[22px] bg-paper p-3 ring-1 ring-line">
      <span className="relative block aspect-[4/5] overflow-hidden arch bg-ivory-deep">
        <Image src={src} alt={pick.title} fill sizes="200px" className="object-cover" onError={() => setSrc(`/fixtures/catalog/${pick.variant_id}.webp`)} />
        {pick.overall !== undefined && (
          <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold tabular-nums">Fit {pick.overall}</span>
        )}
      </span>
      <p className="mt-2.5 text-[13px] font-semibold">{pick.title}</p>
      <p className="mt-0.5 flex-1 text-[12px] leading-snug text-mulberry-soft">{pick.why}</p>
      <Link
        href={`/studio/try?variant=${encodeURIComponent(pick.variant_id)}`}
        onClick={onGo}
        className="mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-mulberry text-[13px] font-medium text-ivory"
      >
        Try it on <ArrowRight size={14} />
      </Link>
    </li>
  );
}
