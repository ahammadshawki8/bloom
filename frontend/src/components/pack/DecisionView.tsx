"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowSquareOut, Printer, Copy, Check, ShieldCheck, Gift, Hospital } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { PageHeader } from "@/components/studio/PageHeader";
import { Hydrated } from "@/components/studio/Hydrated";
import { ArchMirror } from "@/components/mirror/ArchMirror";
import { Button, ButtonLink } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { useBloom } from "@/lib/store";
import { useCatalog } from "@/lib/catalog/useCatalog";
import { describeLook } from "@/lib/catalog/describe";

export function DecisionView() {
  return (
    <>
      <PageHeader back={{ href: "/studio/saved", label: "Your looks" }} title="Your choice" />
      <main className="mx-auto max-w-[1000px] px-4 pb-16 md:px-10">
        <Hydrated>
          <Content />
        </Hydrated>
      </main>
    </>
  );
}

const STEPS = [
  { t: "Call your insurer", s: "Ask whether your plan covers a “cranial hair prosthesis” for hair loss from cancer treatment, and whether there is a limit." },
  {
    t: "Ask your doctor for a prescription",
    s: "It should say “cranial hair prosthesis”, not “wig”, with your diagnosis. The letter below is a starting point.",
  },
  { t: "Get an itemised invoice", s: "Ask the retailer to describe the item as a cranial hair prosthesis. Some will add the billing code A9282." },
  { t: "Keep your receipts and claim", s: "Many plans reimburse after you buy. Send the prescription and invoice together." },
];

function Content() {
  const params = useSearchParams();
  const results = useBloom((s) => s.results);
  const passport = useBloom((s) => s.passport);
  const { styles } = useCatalog();
  const result = results[params.get("result") ?? ""];
  const [done, setDone] = useState<number[]>([]);
  const [patient, setPatient] = useState("");
  const [copied, setCopied] = useState(false);

  if (!result) {
    return (
      <div className="mx-auto mt-8 max-w-md text-center">
        <h2 className="type-studio text-h3">Choose a look first</h2>
        <p className="mt-2 text-small text-mulberry-soft">Open your saved looks and tap “This is the one”.</p>
        <ButtonLink href="/studio/saved" className="mt-5">
          Your looks
        </ButtonLink>
      </div>
    );
  }

  const info = describeLook(result, styles);
  const isWig = result.kind === "wig";
  const today = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  const letter = `To whom it may concern,

${patient || "[Patient name]"} is under my care for [diagnosis] and is receiving treatment that is expected to cause hair loss (alopecia). I am prescribing a cranial hair prosthesis for this patient.

[Doctor's name and signature]
[Practice name, address and phone]
[Date]`;

  return (
    <>
      {/* The choice */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="no-print grid items-center gap-6 rounded-[var(--radius-sheet)] bg-rose-wash p-5 sm:grid-cols-[0.7fr_1.3fr] sm:p-8"
      >
        <ArchMirror src={result.image} alt={info.title} reveal={false} className="mx-auto w-full max-w-[240px]" sizes="240px" />
        <div>
          <p className="text-small text-mulberry-soft">You chose</p>
          <h2 className="mt-1 type-studio text-h1">{info.title}</h2>
          {info.subtitle && <p className="mt-1 text-body text-mulberry-soft">{info.subtitle}</p>}
          {info.style && info.variant && (
            <>
              <p className="mt-4 text-small">
                ${info.variant.price.toFixed(0)} at {info.style.retailer}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={info.style.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-mulberry px-6 text-[1rem] font-medium text-ivory shadow-lift hover:bg-[#563649]"
                >
                  View at {info.style.retailer} <ArrowSquareOut size={18} />
                </a>
              </div>
              <p className="mt-4 max-w-[46ch] text-micro text-mulberry-soft">
                Bloom doesn&apos;t sell anything or earn from this link. Take your hair passport along if you visit a fitter in person.
              </p>
            </>
          )}
        </div>
      </motion.section>

      {!isWig && (
        <section className="no-print mt-10 rounded-[var(--radius-card)] bg-sage-wash p-5 md:p-6">
          <h2 className="type-studio text-h3">Good to know</h2>
          <p className="mt-2 max-w-[60ch] text-small text-mulberry-soft">
            Insurance usually covers wigs, not head wraps or scarves. Many cancer centres and charities give soft wraps away for free, so it&apos;s worth asking
            the nurse or social worker before you buy.
          </p>
        </section>
      )}

      {isWig && (
        <>
          {/* Paying for it */}
          <section className="no-print mt-12">
            <h2 className="type-studio text-h2 text-balance">Pay less, or nothing at all</h2>
            <p className="mt-2 max-w-[56ch] text-body text-mulberry-soft">Help exists, but it&apos;s rarely explained. Here is what usually works.</p>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
              <div className="rounded-[var(--radius-card)] bg-paper p-5 ring-1 ring-line md:p-6">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={22} className="text-sage-deep" />
                  <h3 className="type-studio text-h3">Insurance may cover it</h3>
                </div>
                <p className="mt-2 text-small text-mulberry-soft">
                  Many plans reimburse a cranial hair prosthesis when hair loss comes from cancer treatment. Coverage and limits differ by plan and country.
                </p>
                <ol className="mt-4 space-y-2">
                  {STEPS.map((s, i) => {
                    const on = done.includes(i);
                    return (
                      <li key={s.t}>
                        <button
                          onClick={() => setDone((d) => (on ? d.filter((x) => x !== i) : [...d, i]))}
                          aria-pressed={on}
                          className="flex w-full gap-3 rounded-2xl p-3 text-left hover:bg-ivory"
                        >
                          <span
                            className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ring-1 transition-colors ${on ? "bg-sage-deep text-white ring-sage-deep" : "ring-mulberry/30"}`}
                          >
                            {on ? <Check size={14} weight="bold" /> : <span className="text-[12px] font-semibold">{i + 1}</span>}
                          </span>
                          <span>
                            <span className={`block text-small font-medium ${on ? "text-mulberry-soft line-through" : ""}`}>{s.t}</span>
                            <span className="block text-[13px] text-mulberry-soft">{s.s}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-3 text-[12px] text-mulberry-soft">
                  Billing code: HCPCS A9282, “Wig, any type, each” (US).{" "}
                  <a className="underline underline-offset-2" href="https://aapc.com/codes/hcpcs-codes/A9282" target="_blank" rel="noreferrer">
                    Source
                  </a>
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-[var(--radius-card)] bg-lilac-wash p-5 md:p-6">
                  <div className="flex items-center gap-2.5">
                    <Gift size={22} className="text-lilac-deep" />
                    <h3 className="type-studio text-[1.3rem]">Free wig programmes</h3>
                  </div>
                  <p className="mt-2 text-small text-mulberry-soft">
                    Charities such as EBeauty give wigs to women with cancer-related hair loss. They usually ask for a note from your doctor, nurse or social
                    worker, and photos of your hair from before.
                  </p>
                  <p className="mt-2 text-small font-medium">Your hair passport is exactly that.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ButtonLink href="/studio/passport" size="sm" variant="outline">
                      Open my passport
                    </ButtonLink>
                    <a
                      href="https://www.ebeauty.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 px-2 text-small font-medium underline underline-offset-4"
                    >
                      EBeauty <ArrowSquareOut size={14} />
                    </a>
                  </div>
                </div>
                <div className="rounded-[var(--radius-card)] bg-sage-wash p-5 md:p-6">
                  <div className="flex items-center gap-2.5">
                    <Hospital size={22} className="text-sage-deep" />
                    <h3 className="type-studio text-[1.3rem]">Ask your cancer centre</h3>
                  </div>
                  <p className="mt-2 text-small text-mulberry-soft">
                    Many hospitals run wig banks or know local fitters. The social worker or nurse navigator is the person to ask.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Printable summary */}
          <section className="mt-12">
            <div className="no-print flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="type-studio text-h2">Summary for your insurer</h2>
                <p className="mt-1 text-small text-mulberry-soft">Add your name, then print it or save it as a PDF. Your name isn&apos;t stored.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  icon={copied ? <Check size={18} /> : <Copy size={18} />}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(letter);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      toast("Copy didn't work here.");
                    }
                  }}
                >
                  {copied ? "Copied" : "Copy letter"}
                </Button>
                <Button icon={<Printer size={18} />} onClick={() => window.print()}>
                  Print
                </Button>
              </div>
            </div>
            <label className="no-print mt-5 block max-w-sm">
              <span className="text-small font-medium">Your full name</span>
              <input
                value={patient}
                onChange={(e) => setPatient(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl bg-paper px-4 ring-1 ring-line outline-none focus:ring-2 focus:ring-rose-deep"
                autoComplete="name"
              />
            </label>

            <article className="mt-6 rounded-[var(--radius-card)] bg-paper p-6 ring-1 ring-line md:p-10 print:mt-0 print:rounded-none print:p-0 print:ring-0">
              <header className="flex flex-col-reverse gap-4 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div>
                  <p className="text-micro text-mulberry-soft">Prepared {today}</p>
                  <h3 className="mt-1 type-studio text-h2">Cranial hair prosthesis</h3>
                  <p className="text-small text-mulberry-soft">For hair loss from cancer treatment · HCPCS A9282</p>
                </div>
                <p className="text-small sm:text-right">
                  <span className="block text-micro text-mulberry-soft">Patient</span>
                  {patient || "_______________________"}
                </p>
              </header>
              <div className="grid gap-6 py-6 sm:grid-cols-[150px_1fr]">
                <div className="relative aspect-[4/5] w-[150px] overflow-hidden rounded-2xl bg-ivory-deep">
                  <Image src={result.image} alt="" fill sizes="150px" className="object-cover" />
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-small">
                  <dt className="text-mulberry-soft">Item</dt>
                  <dd>
                    {info.title}
                    {info.subtitle ? `, ${info.subtitle}` : ""}
                  </dd>
                  {info.style && (
                    <>
                      <dt className="text-mulberry-soft">Retailer</dt>
                      <dd>{info.style.retailer}</dd>
                      <dt className="text-mulberry-soft">Price</dt>
                      <dd>${info.variant?.price.toFixed(2)}</dd>
                      <dt className="text-mulberry-soft">Product page</dt>
                      <dd className="break-all">{info.style.url}</dd>
                    </>
                  )}
                  {passport && (
                    <>
                      <dt className="text-mulberry-soft">Natural hair</dt>
                      <dd>
                        {passport.hair.name} ({passport.hair.hex.toUpperCase()}){passport.length ? `, ${passport.length} length` : ""}
                      </dd>
                    </>
                  )}
                </dl>
              </div>
              <div className="border-t border-line pt-5">
                <p className="text-micro text-mulberry-soft">Suggested wording for the prescribing doctor</p>
                <pre className="mt-2 font-sans text-small leading-relaxed whitespace-pre-wrap">{letter}</pre>
              </div>
              <p className="mt-6 text-[11px] text-mulberry-soft">
                Prepared with Bloom, a cosmetic try-on tool. This summary is not medical advice; coverage depends on your plan.
              </p>
            </article>
          </section>
        </>
      )}
    </>
  );
}
