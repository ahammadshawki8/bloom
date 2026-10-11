"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "@phosphor-icons/react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}

/** Bottom sheet on phones, centred dialog on larger screens. Esc and backdrop close it. */
export function Sheet({ open, onClose, title, children, wide }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => panel.current?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      clearTimeout(t);
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-6">
          <motion.div
            className="absolute inset-0 bg-mulberry/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => info.offset.y > 120 && onClose()}
            className={`relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[var(--radius-sheet)] bg-ivory pb-[calc(20px+var(--safe-bottom))] shadow-float outline-none md:rounded-[var(--radius-sheet)] md:pb-6 ${wide ? "md:max-w-[880px]" : "md:max-w-[560px]"}`}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between bg-ivory/95 px-5 pt-3 pb-2 backdrop-blur md:px-7 md:pt-6">
              <span aria-hidden className="absolute top-2 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-line md:hidden" />
              <h2 className="mt-3 type-studio text-h3 md:mt-0">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="mt-3 grid size-10 place-items-center rounded-full hover:bg-mulberry/5 md:mt-0">
                <X size={20} />
              </button>
            </div>
            <div className="px-5 pt-2 md:px-7">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
