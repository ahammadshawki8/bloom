"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import clsx from "clsx";
import { ArchMirror } from "@/components/mirror/ArchMirror";

const LOOKS = [
  { src: "/fixtures/demo/face.webp", title: "Her own hair", note: "Measured: dark chocolate brown", swatch: "#493321" },
  { src: "/fixtures/tryon/monroe-medium-wig--coffee-latte.webp", title: "Monroe wig, coffee latte", note: "Very close to her colour", swatch: "#4d3a2f" },
  { src: "/fixtures/tryon/floral-head-scarf--floral.webp", title: "Floral head scarf", note: "Tied the way she likes", swatch: "#c9a7a0" },
  { src: "/fixtures/tryon/bamboo-turban--sage-green.webp", title: "Bamboo turban, sage", note: "Soft for sleeping days", swatch: "#8fae9a" },
  { src: "/fixtures/tryon/diana-lf-long-wig--copper-glaze.webp", title: "Diana wig, copper glaze", note: "Something new, just to see", swatch: "#a5683d" },
];

/** The hero: one face, five looks, all real try-on renders. */
export function HeroMirror() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const look = LOOKS[i];

  useEffect(() => {
    if (paused || reduce) return;
    const t = setTimeout(() => setI((n) => (n + 1) % LOOKS.length), i === 0 ? 2600 : 3400);
    return () => clearTimeout(t);
  }, [i, paused, reduce]);

  return (
    <figure className="relative mx-auto w-[86%] max-w-[440px] sm:w-full" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <div className="relative">
        {/* a second arch behind the mirror, like a reflection's edge */}
        <div aria-hidden className="absolute inset-0 translate-x-4 translate-y-4 arch bg-rose-wash md:translate-x-6 md:translate-y-6" />
        <ArchMirror src={look.src} alt={`${look.title}. A real virtual try-on on a sample face.`} transitionName="mirror" priority className="shadow-float" />

        {/* measured swatch, like a label tucked into the vanity frame */}
        <div className="absolute inset-x-0 -bottom-6 flex justify-center px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={look.title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="flex max-w-full items-center gap-3 rounded-full bg-paper py-2 pr-5 pl-2 shadow-float"
            >
              <span className="size-9 shrink-0 rounded-full ring-2 ring-white" style={{ background: look.swatch }} />
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-small font-medium">{look.title}</span>
                <span className="block truncate text-micro text-mulberry-soft">{look.note}</span>
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <figcaption className="mt-12 flex items-center justify-center gap-2">
        <span className="sr-only">Choose a look</span>
        {LOOKS.map((l, n) => (
          <button
            key={l.title}
            onClick={() => {
              setI(n);
              setPaused(true);
            }}
            aria-label={l.title}
            aria-current={n === i}
            className="grid size-8 place-items-center"
          >
            <span
              className={clsx("block rounded-full transition-all duration-300", n === i ? "h-2 w-6 bg-mulberry" : "size-2 bg-mulberry/25 hover:bg-mulberry/50")}
            />
          </button>
        ))}
      </figcaption>
    </figure>
  );
}
