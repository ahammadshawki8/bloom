import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/studio/PageHeader";
import { FittingRoom } from "@/components/fitting/FittingRoom";
import { GuideButton } from "@/components/guide/GuideButton";

export const metadata: Metadata = { title: "Fitting room" };

export default function TryPage() {
  return (
    <>
      <PageHeader title="Your fitting room" actions={<GuideButton label="Ask the guide" />} />
      <main>
        <Suspense fallback={null}>
          <FittingRoom />
        </Suspense>
      </main>
    </>
  );
}
