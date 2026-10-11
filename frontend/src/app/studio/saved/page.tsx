import type { Metadata } from "next";
import { SavedBoard } from "@/components/saved/SavedBoard";

export const metadata: Metadata = { title: "Your looks" };

export default function SavedPage() {
  return <SavedBoard />;
}
