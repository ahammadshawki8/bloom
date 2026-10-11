"use client";

import { QuietPage } from "@/components/brand/QuietPage";
import { Button } from "@/components/ui/Button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <QuietPage title="Something didn't load" action={<Button onClick={reset}>Try again</Button>}>
      Your passport and looks are safe on this phone. If this keeps happening, refresh the page.
    </QuietPage>
  );
}
