"use client";

import { AnimatePresence, motion } from "motion/react";
import { create } from "zustand";
import { useEffect, type ReactNode } from "react";

interface ToastItem {
  id: number;
  message: ReactNode;
  action?: { label: string; onClick: () => void };
}

interface ToastState {
  items: ToastItem[];
  push: (t: Omit<ToastItem, "id">, ms?: number) => void;
  dismiss: (id: number) => void;
}

let seq = 0;
export const useToasts = create<ToastState>((set, get) => ({
  items: [],
  push: (t, ms = 3200) => {
    const id = ++seq;
    set((s) => ({ items: [...s.items.slice(-2), { ...t, id }] }));
    setTimeout(() => get().dismiss(id), ms);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

export const toast = (message: ReactNode, action?: ToastItem["action"]) => useToasts.getState().push({ message, action });

/** Renders transient confirmations. Lives once per layout. */
export function Toaster({ offsetClass = "bottom-[calc(96px+var(--safe-bottom))] md:bottom-8" }: { offsetClass?: string }) {
  const items = useToasts((s) => s.items);
  const dismiss = useToasts((s) => s.dismiss);
  useEffect(() => () => useToasts.setState({ items: [] }), []);
  return (
    <div aria-live="polite" className={`pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4 ${offsetClass}`}>
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="pointer-events-auto flex max-w-md items-center gap-4 rounded-full bg-mulberry py-3 pr-3 pl-5 text-small text-ivory shadow-float"
          >
            <span>{t.message}</span>
            {t.action && (
              <button
                className="rounded-full bg-ivory/12 px-3 py-1.5 font-medium hover:bg-ivory/20"
                onClick={() => {
                  t.action!.onClick();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
