"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowsLeftRight, HandPointing } from "@phosphor-icons/react";
import clsx from "clsx";
import { ArchMirror } from "@/components/mirror/ArchMirror";
import { CompareSlider } from "@/components/mirror/CompareSlider";
import { HeartToggle } from "@/components/ui/HeartToggle";

interface Props {
  original: string;
  current: string | null;
  loadingLabel: string | null;
  saved: boolean;
  onToggleSave: () => void;
  sampleNotice: boolean;
}

/** The fitting-room mirror: try-on result, press-and-hold to see your own hair, or compare side by side. */
export function MirrorStage({ original, current, loadingLabel, saved, onToggleSave, sampleNotice }: Props) {
  const [comparing, setComparing] = useState(false);
  const [peek, setPeek] = useState(false);
  const shown = !current || peek ? original : current;

  return (
    <div className="relative mx-auto w-full max-w-[min(420px,36dvh)] lg:max-w-[420px]">
      <ArchMirror
        src={comparing && current ? current : shown}
        alt={current ? "You, wearing this look" : "Your passport photo"}
        transitionName="mirror"
        priority
        sizes="(min-width: 1024px) 420px, 88vw"
        className="shadow-float"
      >
        {comparing && current ? (
          <CompareSlider before={original} after={current} />
        ) : (
          current && (
            <button
              className="absolute inset-0 cursor-pointer"
              aria-label="Press and hold to see your own hair"
              onPointerDown={() => setPeek(true)}
              onPointerUp={() => setPeek(false)}
              onPointerLeave={() => setPeek(false)}
              onPointerCancel={() => setPeek(false)}
              onContextMenu={(e) => e.preventDefault()}
            />
          )
        )}

        {/* peek label */}
        <AnimatePresence>
          {peek && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-[18%] left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-micro font-medium backdrop-blur">
              Your own hair
            </motion.span>
          )}
        </AnimatePresence>

        {/* loading veil */}
        <AnimatePresence>
          {loadingLabel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 grid place-items-center bg-ivory/55 backdrop-blur-[3px]"
              role="status"
              aria-live="polite"
            >
              <div className="flex flex-col items-center gap-3 px-6 text-center">
                <PetalLoader />
                <p className="type-studio max-w-[22ch] text-[1.1rem] leading-snug">{loadingLabel}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {sampleNotice && current && !comparing && (
          <span className="pointer-events-none absolute inset-x-6 bottom-4 rounded-2xl bg-white/80 px-3 py-2 text-center text-[11px] leading-snug backdrop-blur">
            Preview shown on our sample face. Try-ons on your own photo start once Bloom&apos;s server is connected.
          </span>
        )}
      </ArchMirror>

      {/* floating controls */}
      {current && (
        <div className="absolute top-[22%] -right-2 flex flex-col gap-2 sm:-right-5">
          <HeartToggle on={saved} onToggle={onToggleSave} />
          <button
            onClick={() => setComparing((c) => !c)}
            aria-pressed={comparing}
            aria-label={comparing ? "Stop comparing" : "Compare with your own hair"}
            className={clsx("grid size-11 place-items-center rounded-full shadow-lift transition-colors active:scale-90", comparing ? "bg-mulberry text-ivory" : "bg-paper text-mulberry")}
          >
            <ArrowsLeftRight size={20} />
          </button>
        </div>
      )}
      {current && !comparing && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-micro text-mulberry-soft">
          <HandPointing size={14} /> Press and hold the mirror to see your own hair
        </p>
      )}
      {!current && (
        <p className="mt-3 text-center text-micro text-mulberry-soft">Pick a look below to try it on.</p>
      )}
      {/* keep the original warm in cache for instant peeks */}
      <Image src={original} alt="" width={8} height={10} className="hidden" aria-hidden />
    </div>
  );
}

export function PetalLoader({ size = 54 }: { size?: number }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 44 44" aria-hidden animate={{ rotate: 360 }} transition={{ duration: 6, ease: "linear", repeat: Infinity }}>
      {[0, 72, 144, 216, 288].map((d, i) => (
        <g key={d} transform={`rotate(${d} 22 22)`}>
          <motion.ellipse
            cx="22"
            cy="11.5"
            rx="5.5"
            ry="9"
            fill={i % 2 ? "var(--color-sage-wash)" : "var(--color-rose-wash)"}
            stroke="var(--color-rose)"
            strokeWidth="0.8"
            animate={{ scaleY: [0.85, 1.08, 0.85] }}
            style={{ transformOrigin: "22px 22px", transformBox: "view-box" }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.18 }}
          />
        </g>
      ))}
      <circle cx="22" cy="22" r="3.4" fill="var(--color-rose-deep)" />
    </motion.svg>
  );
}
