import type { Metadata } from "next";
import { PageHeader } from "@/components/studio/PageHeader";
import { PassportFlow } from "@/components/passport/PassportFlow";

export const metadata: Metadata = { title: "Make your hair passport" };

export default function NewPassportPage() {
  return (
    <>
      <PageHeader back={{ href: "/studio/passport", label: "Passport" }} />
      <main>
        <PassportFlow />
      </main>
    </>
  );
}
