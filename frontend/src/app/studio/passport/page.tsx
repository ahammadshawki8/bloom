import type { Metadata } from "next";
import { PassportView } from "@/components/passport/PassportView";

export const metadata: Metadata = { title: "Hair passport" };

export default function PassportPage() {
  return <PassportView />;
}
