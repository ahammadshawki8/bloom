"use client";

import { Heart } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";

interface Props {
  on: boolean;
  onToggle: () => void;
  label?: string;
  size?: "md" | "lg";
  className?: string;
}

/** Save-a-look heart with a small petal burst when it turns on. */
export function HeartToggle({ on, onToggle, label = "Save this look", size = "md", className }: Props) {
  const dim = size === "lg" ? "size-14" : "size-11";
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Saved. Tap to remove" : label}
      onClick={onToggle}
      className={clsx("relative inline-grid place-items-center rounded-full bg-paper shadow-lift transition-transform active:scale-90", dim, className)}
    >
      <motion.span key={String(on)} initial={{ scale: on ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 520, damping: 14 }}>
        <Heart size={size === "lg" ? 26 : 22} weight={on ? "fill" : "regular"} className={on ? "text-rose-deep" : "text-mulberry"} />
      </motion.span>
      <AnimatePresence>
        {on && (
          <motion.span
            key="burst"
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <motion.span
                key={deg}
                className="absolute top-1/2 left-1/2 size-1.5 rounded-full bg-rose"
                initial={{ x: "-50%", y: "-50%" }}
                animate={{ x: `calc(-50% + ${Math.cos((deg * Math.PI) / 180) * 26}px)`, y: `calc(-50% + ${Math.sin((deg * Math.PI) / 180) * 26}px)` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
