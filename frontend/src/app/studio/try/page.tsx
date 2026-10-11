import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/studio/PageHeader";
import { FittingRoom } from "@/components/fitting/FittingRoom";

export const metadata: Metadata = { title: "Fitting room" };

export default function TryPage() {
  return (
    <>
      <PageHeader title="Your fitting room" />
      <Suspense fallback={null}>
        <FittingRoom />
      </Suspense>
    </>
  );
}
