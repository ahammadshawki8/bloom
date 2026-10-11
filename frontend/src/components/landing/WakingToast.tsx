"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cancelWaking, ensureAwake, useWake } from "@/lib/wake";

const LINES = [
  "Warming up your studio. The first visit can take a minute.",
  "Laying out the mirrors and the swatches.",
  "Almost there. Thank you for waiting.",
];

/** Gentle, honest waiting state while the free-tier backend boots. */
export function WakingToast() {
  const status = useWake((s) => s.status);
  const startedAt = useWake((s) => s.startedAt);
  const pending = useWake((s) => s.pending);
  const router = useRouter();
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (status !== "waking") return;
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [status]);

  const elapsed = now ? Math.max(0, Math.round((now - startedAt) / 1000)) : 0;
  const line = LINES[Math.min(LINES.length - 1, Math.floor(elapsed / 25))];
  const visible = status === "waking" || status === "failed";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-x-4 bottom-[calc(20px+var(--safe-bottom))] z-50 mx-auto max-w-md rounded-[26px] bg-paper p-5 shadow-float ring-1 ring-line"
        >
          {status === "waking" ? (
            <div className="flex items-start gap-4">
              <BloomSpinner />
              <div className="min-w-0 flex-1">
                <p className="type-studio text-[1.125rem]">Getting your studio ready</p>
                <p className="mt-1 text-small text-mulberry-soft">{line}</p>
                <div className="mt-3 flex items-center justify-between text-micro text-mulberry-soft">
                  <span>{elapsed}s · we&apos;ll take you in automatically</span>
                  <button onClick={cancelWaking} className="font-medium text-mulberry underline underline-offset-4">
                    Not now
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="type-studio text-[1.125rem]">The studio is taking longer than usual</p>
              <p className="mt-1 text-small text-mulberry-soft">Check your connection, then try again. Nothing you&apos;ve made is lost.</p>
              <div className="mt-3 flex gap-2">
                <button
                  className="h-10 rounded-full bg-mulberry px-4 text-small font-medium text-ivory"
                  onClick={() => {
                    useWake.setState({ status: "idle" });
                    ensureAwake(pending ?? "/studio").then((ok) => ok && router.push(pending ?? "/studio"));
                  }}
                >
                  Try again
                </button>
                <button className="h-10 rounded-full px-4 text-small font-medium" onClick={cancelWaking}>
                  Close
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BloomSpinner() {
  return (
    <motion.svg width="44" height="44" viewBox="0 0 44 44" aria-hidden animate={{ rotate: 360 }} transition={{ duration: 9, ease: "linear", repeat: Infinity }}>
      {[0, 72, 144, 216, 288].map((d, i) => (
        <motion.ellipse
          key={d}
          cx="22"
          cy="12"
          rx="5.5"
          ry="9"
          transform={`rotate(${d} 22 22)`}
          fill={i % 2 ? "var(--color-sage-wash)" : "var(--color-rose-wash)"}
          stroke="var(--color-rose)"
          strokeWidth="0.8"
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
      <circle cx="22" cy="22" r="3.2" fill="var(--color-rose-deep)" />
    </motion.svg>
  );
}
