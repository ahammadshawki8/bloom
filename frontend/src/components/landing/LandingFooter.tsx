import Image from "next/image";
import { Wordmark } from "@/components/brand/Wordmark";
import { OpenStudio } from "./OpenStudio";

const SOURCES = [
  {
    n: 1,
    text: "American Cancer Society, “Coping With Hair Loss”; CDC breast cancer survivor resources.",
    href: "https://www.cancer.org/cancer/managing-cancer/side-effects/hair-skin-nails/hair-loss/coping-with-hair-loss.html",
  },
  {
    n: 2,
    text: "Consumer Reports, “What to Know About Wigs for Cancer Patients”; retailer return policies for opened wigs.",
    href: "https://www.consumerreports.org/health/personal-care/what-to-know-about-wigs-for-cancer-patients-a6586018801",
  },
  {
    n: 3,
    text: "American Cancer Society, “Choosing and Wearing a Wig”: shop before treatment so the colour and style can be matched.",
    href: "https://www.cancer.org/cancer/managing-cancer/side-effects/hair-skin-nails/hair-loss/choosing-and-wearing-wig.html",
  },
];

export function ClosingInvite() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-5 py-20 md:px-10 lg:grid-cols-[1fr_auto] lg:py-24">
        <div>
          <h2 className="type-atelier max-w-[18ch] text-h1 md:text-display">Your studio is ready whenever you are.</h2>
          <div className="mt-8">
            <OpenStudio size="lg" arrow>
              Open your studio
            </OpenStudio>
          </div>
        </div>
        <div className="hidden items-end gap-3 lg:flex" aria-hidden>
          {["warm-light", "natural-red", "turban-profile"].map((p, i) => (
            <div key={p} className={`relative overflow-hidden rounded-[22px] ${i === 1 ? "h-64 w-44" : "h-52 w-36"}`}>
              <Image src={`/images/landing/${p}.webp`} alt="" fill sizes="180px" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 md:px-10 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-4">
          <Wordmark />
          <p className="max-w-[32ch] text-small text-mulberry-soft">
            A cosmetic try-on studio. Bloom doesn&apos;t diagnose, treat or give medical advice. Talk to your care team about your treatment.
          </p>
        </div>
        <div className="space-y-6 text-small text-mulberry-soft">
          <div>
            <h3 className="font-medium text-mulberry">Sources</h3>
            <ol className="mt-3 space-y-2">
              {SOURCES.map((s) => (
                <li key={s.n} id={`source-${s.n}`} className="scroll-mt-8">
                  [{s.n}]{" "}
                  <a href={s.href} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-4 hover:text-mulberry">
                    {s.text}
                  </a>
                </li>
              ))}
            </ol>
          </div>
          <p>
            Try-ons are rendered with the YouCam API (hair transfer and makeup virtual try-on). Product images belong to their retailers and link back to
            them. Portrait photography from Unsplash; see CREDITS.md.
          </p>
        </div>
      </div>
    </footer>
  );
}
