import type { Metadata } from "next";
import { QuietPage } from "@/components/brand/QuietPage";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "You're offline" };

export default function Offline() {
  return (
    <QuietPage title="You're offline" action={<ButtonLink href="/studio/saved">Open your saved looks</ButtonLink>}>
      Your passport and saved looks are still here on this phone. New try-ons will work again once you&apos;re connected.
    </QuietPage>
  );
}
