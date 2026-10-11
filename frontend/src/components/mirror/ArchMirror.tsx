"use client";

import Image from "next/image";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { ViewTransition, type ReactNode } from "react";

interface Props {
  src: string;
  alt: string;
  /** Shared-element name so the mirror can travel between pages. */
  transitionName?: string;
  /** Bloom-reveal when src changes (try-on landed). */
  reveal?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  imageClassName?: string;
  children?: ReactNode;
}

/**
 * The vanity mirror: Bloom's one shared object between the atelier (landing)
 * and the studio (app). A tall frame with a semicircular top.
 */
export function ArchMirror({
  src,
  alt,
  transitionName,
  reveal = true,
  priority,
  sizes = "(min-width: 1024px) 480px, 90vw",
  className,
  imageClassName,
  children,
}: Props) {
  const frame = (
    <div className={clsx("relative isolate aspect-[4/5] arch bg-ivory-deep", className)}>
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={src}
          className="absolute inset-0"
          initial={reveal ? { clipPath: "circle(0% at 50% 42%)", filter: "blur(6px)" } : { opacity: 0 }}
          animate={reveal ? { clipPath: "circle(80% at 50% 42%)", filter: "blur(0px)" } : { opacity: 1 }}
          exit={{ opacity: 1, transition: { duration: 0.9 } }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={clsx("object-cover", imageClassName)} />
        </motion.div>
      </AnimatePresence>
      {/* a soft inner rim, like glass catching light */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 arch shadow-[inset_0_0_0_1px_rgb(255_255_255/0.5),inset_0_-40px_60px_-50px_rgb(67_41_58/0.35)]"
      />
      {children}
    </div>
  );

  if (!transitionName) return frame;
  return (
    <ViewTransition name={transitionName} share="mirror-morph" default="none">
      {frame}
    </ViewTransition>
  );
}
