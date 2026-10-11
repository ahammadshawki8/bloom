"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ImageReveal, Reveal, RiseText } from "@/components/motion/Reveal";

/** The page deepens from ivory into mulberry as this moment arrives, then softens again. */
export function StillYou() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bg = useTransform(scrollYProgress, [0.05, 0.3, 0.75, 0.95], ["#fbf6f2", "#43293a", "#43293a", "#fbf6f2"]);
  const fg = useTransform(scrollYProgress, [0.05, 0.3, 0.75, 0.95], ["#43293a", "#fbf6f2", "#fbf6f2", "#43293a"]);

  return (
    <motion.section ref={ref} className="bg-mulberry text-ivory" style={reduce ? undefined : { backgroundColor: bg, color: fg }}>
      <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-24 md:px-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:py-32">
        <ImageReveal className="aspect-[4/5] rounded-[var(--radius-card)]" drift={56}>
          <Image
            src="/images/landing/still-you.webp"
            alt="A woman with a shaved head smiles, wearing long statement earrings"
            fill
            sizes="(min-width: 1024px) 680px, 120vw"
            className="object-cover grayscale-[15%]"
          />
        </ImageReveal>
        <div>
          <RiseText
            as="p"
            text="Some women choose a wig. Some choose a wrap. Some choose neither."
            className="type-atelier text-h1 leading-[1.08] md:text-display"
          />
          <Reveal delay={0.5}>
            <p className="mt-8 max-w-[42ch] text-lead opacity-80">
              Every one of those is right. Bloom is a place to try all of it, gently and privately, so whatever you decide feels like your choice.
            </p>
          </Reveal>
        </div>
      </div>
    </motion.section>
  );
}
