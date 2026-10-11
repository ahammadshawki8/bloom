import Image from "next/image";

export function StillYou() {
  return (
    <section className="bg-mulberry text-ivory">
      <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-20 md:px-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:py-0">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] lg:my-20">
          <Image
            src="/images/landing/still-you.webp"
            alt="A woman with a shaved head smiles, wearing long statement earrings"
            fill
            sizes="(min-width: 1024px) 520px, 100vw"
            className="object-cover grayscale-[15%]"
          />
        </div>
        <div className="lg:py-20">
          <p className="type-atelier text-h1 leading-[1.08] md:text-display">
            Some women choose a wig. Some choose a wrap. Some choose neither.
          </p>
          <p className="mt-8 max-w-[42ch] text-lead text-ivory/75">
            Every one of those is right. Bloom is a place to try all of it, gently and privately, so whatever you decide feels like your choice.
          </p>
        </div>
      </div>
    </section>
  );
}
