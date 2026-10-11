import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { HeroMirror } from "./HeroMirror";
import { OpenStudio } from "./OpenStudio";
import { Reveal, RiseText } from "@/components/motion/Reveal";

export function Hero() {
  return (
    <section className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 pt-6 pb-20 md:px-10 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:pt-10 lg:pb-28">
      <div className="max-w-[36rem]">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-paper px-3.5 py-1.5 text-micro text-mulberry-soft ring-1 ring-line">
          <span className="size-1.5 rounded-full bg-rose" />
          For the weeks before chemotherapy
        </p>
        <RiseText
          as="h1"
          text="Choose your hair before treatment does."
          className="type-atelier text-[2.9rem] leading-[1.02] text-balance sm:text-display md:text-[4rem] lg:text-hero"
        />
        <Reveal delay={0.45}>
          <p className="mt-6 max-w-[33rem] text-lead text-mulberry-soft">
            Bloom keeps a record of your own hair while it&apos;s still here, then lets you try matched wigs, head wraps, brows and lashes on your own face. At
            home, at your pace, with the people you love.
          </p>
        </Reveal>
        <Reveal delay={0.6}>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <OpenStudio size="lg" arrow>
              Open your studio
            </OpenStudio>
            <a href="#how" className="text-[1rem] font-medium underline decoration-rose/60 underline-offset-[6px] hover:decoration-rose-deep">
              See how it works
            </a>
          </div>
          <p className="mt-8 flex items-center gap-2 text-micro text-mulberry-soft">
            <ShieldCheck size={18} className="text-sage-deep" />
            Free. No account. Your photos stay on your phone.
          </p>
        </Reveal>
      </div>
      <Reveal delay={0.25} y={30} className="lg:pl-6">
        <HeroMirror />
      </Reveal>
    </section>
  );
}
