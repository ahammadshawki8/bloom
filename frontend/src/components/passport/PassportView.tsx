"use client";

import { Printer, ArrowCounterClockwise, MagicWand } from "@phosphor-icons/react";
import { PageHeader } from "@/components/studio/PageHeader";
import { Hydrated } from "@/components/studio/Hydrated";
import { PassportCard } from "./PassportCard";
import { ButtonLink, Button } from "@/components/ui/Button";
import { useBloom } from "@/lib/store";
import { demoPassport } from "@/lib/passport/demo";
import { toast } from "@/components/ui/Toast";
import { ArchMirror } from "@/components/mirror/ArchMirror";

export function PassportView() {
  return (
    <>
      <PageHeader title="Hair passport" />
      <main className="mx-auto max-w-[920px] px-4 pb-12 md:px-10">
        <Hydrated>
          <Content />
        </Hydrated>
      </main>
    </>
  );
}

function Content() {
  const passport = useBloom((s) => s.passport);
  const setPassport = useBloom((s) => s.setPassport);

  if (!passport) {
    return (
      <section className="grid items-center gap-8 rounded-[var(--radius-sheet)] bg-rose-wash p-6 sm:grid-cols-[0.8fr_1.2fr] sm:p-10">
        <ArchMirror src="/fixtures/demo/face.webp" alt="Sample face" reveal={false} className="mx-auto w-full max-w-[240px] opacity-90" />
        <div>
          <h2 className="type-studio text-h2">No passport yet</h2>
          <p className="mt-3 max-w-[40ch] text-body text-mulberry-soft">
            Make one while your hair is still the way you know it. It takes about two minutes, and every wig suggestion is matched to it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/studio/passport/new">Make my passport</ButtonLink>
            <Button
              variant="outline"
              onClick={() => {
                setPassport(demoPassport());
                toast("Using the sample passport.");
              }}
            >
              Use the sample face
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <PassportCard passport={passport} />
      <div className="no-print mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/studio/try" icon={<MagicWand size={18} />}>
          See my matches
        </ButtonLink>
        <Button variant="outline" icon={<Printer size={18} />} onClick={() => window.print()}>
          Print or save as PDF
        </Button>
        <ButtonLink href="/studio/passport/new" variant="quiet" icon={<ArrowCounterClockwise size={18} />}>
          {passport.isDemo ? "Make my own" : "Retake"}
        </ButtonLink>
      </div>
      {passport.isDemo && (
        <p className="no-print mt-4 text-small text-mulberry-soft">
          This is the sample face from the YouCam API documentation, so you can explore before taking photos.
        </p>
      )}
    </>
  );
}
