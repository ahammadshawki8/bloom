import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { HeroMirror } from "./HeroMirror";
import { OpenStudio } from "./OpenStudio";

export function Hero() {
  return (
    <section className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 pt-6 pb-20 md:px-10 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:pt-10 lg:pb-28">
      <div className="max-w-[36rem]">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-paper px-3.5 py-1.5 text-micro text-mulberry-soft ring-1 ring-line">
          <span className="size-1.5 rounded-full bg-rose" />
          For the weeks before chemotherapy
        </p>
        <h1 className="type-atelier text-balance text-[2.9rem] leading-[1.02] sm:text-display md:text-[4rem] lg:text-hero">
          Choose your hair before treatment does.
        </h1>
        <p className="mt-6 max-w-[33rem] text-lead text-mulberry-soft">
          Bloom keeps a record of your own hair while it&apos;s still here, then lets you try matched wigs, head wraps and brows on your own face. At
          home, at your pace, with the people you love.
        </p>
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
      </div>
      <div className="lg:pl-6">
        <HeroMirror />
      </div>
    </section>
  );
}
