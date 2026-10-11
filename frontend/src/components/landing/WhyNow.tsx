import Image from "next/image";
import { ImageReveal, Reveal, RiseText } from "@/components/motion/Reveal";

const TRUTHS = [
  { text: "Hair loss from chemotherapy often begins two to four weeks after the first infusion.", ref: 1 },
  { text: "Many wigs can't be returned once they've been opened or tried on, for hygiene reasons.", ref: 2 },
  { text: "Your own hair is the best colour reference a wig fitter will ever have, and right now it's still here.", ref: 3 },
];

export function WhyNow() {
  return (
    <section className="bg-paper">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-20 md:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20 lg:py-28">
        <ImageReveal className="aspect-[4/5] rounded-[var(--radius-card)] lg:aspect-[5/6]">
          <Image
            src="/images/landing/wrap-portrait.webp"
            alt="A woman in a soft head wrap looks calmly toward the camera"
            fill
            sizes="(min-width: 1024px) 680px, 120vw"
            className="object-cover object-[62%_50%]"
          />
        </ImageReveal>
        <div>
          <RiseText text="The best time to choose a wig is before you need one." className="max-w-[16ch] type-atelier text-h1 md:text-display" />
          <ul className="mt-10 space-y-7">
            {TRUTHS.map((t, i) => (
              <li key={t.ref} className="border-t border-line pt-6">
                <Reveal delay={0.1 + i * 0.12}>
                  <p className="max-w-[44ch] text-lead text-mulberry">
                    {t.text}
                    <sup className="ml-0.5 text-micro text-mulberry-soft">
                      <a href={`#source-${t.ref}`} aria-label={`Source ${t.ref}`}>
                        [{t.ref}]
                      </a>
                    </sup>
                  </p>
                </Reveal>
              </li>
            ))}
          </ul>
          <Reveal delay={0.4}>
            <p className="mt-10 max-w-[48ch] text-body text-mulberry-soft">
              So the time to try on is the time you&apos;re least likely to. Bloom fits that window: a few quiet minutes on your phone, from your sofa or a
              hospital chair.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
