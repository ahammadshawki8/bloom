"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import clsx from "clsx";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Content that lifts softly into place the first time it scrolls into view. */
export function Reveal({ children, delay = 0, y = 22, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** A headline whose lines rise in sequence, like a page being turned. */
export function RiseText({ text, className, as: Tag = "h2" }: { text: string; className?: string; as?: "h1" | "h2" | "p" }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  const MotionTag = motion[Tag];
  return (
    <MotionTag
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ staggerChildren: 0.045 }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={i}>
          <span className="inline-block overflow-hidden pb-[0.08em] align-bottom" aria-hidden>
            <motion.span
              className="inline-block"
              variants={{ hidden: { y: "105%", opacity: 0 }, shown: { y: "0%", opacity: 1, transition: { duration: 0.75, ease: EASE } } }}
            >
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </MotionTag>
  );
}

/**
 * A photograph that unveils from the bottom like a curtain lifting, then drifts
 * gently with the scroll (parallax) for depth.
 */
export function ImageReveal({ children, className, drift = 40 }: { children: ReactNode; className?: string; drift?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [drift, -drift]);
  return (
    <motion.div
      ref={ref}
      className={clsx("relative overflow-hidden", className)}
      initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0% round 28px)" }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0% round 28px)" }}
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
      transition={{ duration: 1.1, ease: EASE }}
    >
      <motion.div className="absolute inset-[-8%]" style={reduce ? undefined : { y }}>
        {children}
      </motion.div>
    </motion.div>
  );
}

/** A number that counts up once when it becomes visible. */
export function CountUp({
  to,
  suffix = "",
  prefix = "",
  decimals = 0,
  format = false,
  className,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  format?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      const id = requestAnimationFrame(() => setValue(to));
      return () => cancelAnimationFrame(id);
    }
    const controls = animate(0, to, { duration: 1.6, ease: EASE, onUpdate: setValue });
    return () => controls.stop();
  }, [inView, to, reduce]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {format ? Math.round(value).toLocaleString("en-US") : value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
