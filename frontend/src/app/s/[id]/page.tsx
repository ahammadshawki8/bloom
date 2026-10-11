import type { Metadata } from "next";
import { Suspense } from "react";
import { FamilyView } from "@/components/share/FamilyView";

export const metadata: Metadata = {
  title: "Help me choose",
  description: "Someone you love would like your help choosing a look. Tap a heart on the one that feels most like them.",
  robots: { index: false, follow: false },
};

export default function SharePage() {
  return (
    <Suspense fallback={null}>
      <FamilyView />
    </Suspense>
  );
}
