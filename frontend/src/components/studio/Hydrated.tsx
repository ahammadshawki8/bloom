"use client";

import type { ReactNode } from "react";
import { useBloom } from "@/lib/store";

/** Renders children only once on-device data has loaded from IndexedDB. */
export function Hydrated({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const hydrated = useBloom((s) => s.hydrated);
  return hydrated ? children : (fallback ?? <PageSkeleton />);
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-[1120px] animate-pulse px-4 py-6 md:px-10" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-2/3 rounded-full bg-ivory-deep" />
      <div className="mt-3 h-5 w-1/2 rounded-full bg-ivory-deep" />
      <div className="mt-8 h-56 rounded-[var(--radius-card)] bg-ivory-deep" />
    </div>
  );
}
