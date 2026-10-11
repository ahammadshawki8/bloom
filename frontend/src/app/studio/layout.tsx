import type { Metadata } from "next";
import { BottomNav, SideRail } from "@/components/studio/StudioNav";
import { Toaster } from "@/components/ui/Toast";
import { GuideSheet } from "@/components/guide/GuideSheet";

export const metadata: Metadata = {
  title: "Your studio",
};

export default function StudioLayout({ children }: LayoutProps<"/studio">) {
  return (
    <div className="flex min-h-dvh">
      <SideRail />
      <div className="min-w-0 flex-1 pb-[calc(84px+var(--safe-bottom))] md:pb-0">{children}</div>
      <BottomNav />
      <Toaster />
      <GuideSheet />
    </div>
  );
}
