import type { Metadata } from "next";
import { Suspense } from "react";
import { DecisionView } from "@/components/pack/DecisionView";

export const metadata: Metadata = { title: "Your choice" };

export default function PackPage() {
  return (
    <Suspense fallback={null}>
      <DecisionView />
    </Suspense>
  );
}
