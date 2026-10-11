"use client";

import { useState } from "react";
import { Sparkle, ArrowRight } from "@phosphor-icons/react";
import { useGuide } from "@/components/guide/GuideSheet";

/** Home entry to the agentic guide: describe what you want, the guide does the searching. */
export function GuideCard() {
  const [text, setText] = useState("");
  const setOpen = useGuide((s) => s.setOpen);
  return (
    <section aria-labelledby="guide-title" className="mt-4 rounded-[var(--radius-card)] bg-lilac-wash p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-paper text-lilac-deep shadow-lift">
          <Sparkle size={20} weight="fill" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="guide-title" className="type-studio text-[1.25rem] leading-tight">
            Not sure where to start?
          </h2>
          <p className="mt-1 text-[13px] text-mulberry-soft">Tell the guide what you&apos;d like. It searches the collection, checks colour and fit against your passport, and picks three looks.</p>
        </div>
      </div>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(true, text || "Close to my own colour, easy to look after");
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. soft waves, close to my colour"
          aria-label="What would you like?"
          className="h-11 min-w-0 flex-1 rounded-full bg-paper px-4 text-small ring-1 ring-line outline-none placeholder:text-mulberry-faint focus:ring-2 focus:ring-rose-deep"
        />
        <button type="submit" className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-mulberry px-5 text-small font-medium text-ivory">
          Ask <ArrowRight size={15} />
        </button>
      </form>
    </section>
  );
}
