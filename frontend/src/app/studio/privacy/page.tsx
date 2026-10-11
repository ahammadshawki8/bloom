import type { Metadata } from "next";
import { PrivacyView } from "@/components/studio/PrivacyView";

export const metadata: Metadata = { title: "Privacy & your data" };

export default function PrivacyPage() {
  return <PrivacyView />;
}
