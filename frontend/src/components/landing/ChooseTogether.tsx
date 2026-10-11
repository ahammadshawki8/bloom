import Image from "next/image";
import { Heart } from "@phosphor-icons/react/dist/ssr";

export function ChooseTogether() {
  return (
    <section className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 py-20 md:px-10 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:py-28">
      <div className="order-2 lg:order-1">
        <h2 className="type-atelier max-w-[14ch] text-h1 md:text-display">Nobody should have to choose alone.</h2>
        <p className="mt-6 max-w-[44ch] text-lead text-mulberry-soft">
          Send your three favourite looks to your sister, your mum, your best friend. They open a link on any phone and tap a heart. No app, no sign-up.
          The link closes on its own after seven days.
        </p>
      </div>
      <div className="relative order-1 mx-auto w-full max-w-[520px] lg:order-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)]">
          <Image
            src="/images/landing/together.webp"
            alt="Two women hold each other in a long embrace in a field"
            fill
            sizes="(min-width: 1024px) 520px, 100vw"
            className="object-cover"
          />
        </div>
        {/* the family view, floating */}
        <div className="absolute -bottom-8 left-4 w-[62%] max-w-[300px] rounded-[24px] bg-paper p-4 shadow-float sm:left-[-28px]">
          <p className="text-micro text-mulberry-soft">From Sara</p>
          <p className="type-studio mt-0.5 text-[1.05rem] leading-snug">Which one feels like me?</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {["hope-medium-wig--coffee-latte", "bamboo-turban--periwinkle", "rochelle-long-wig--marble-brown"].map((l, i) => (
              <div key={l} className="relative">
                <div className="arch relative aspect-[4/5]">
                  <Image src={`/fixtures/tryon/${l}.webp`} alt="" fill sizes="90px" className="object-cover" />
                </div>
                <span
                  className={`absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold shadow-lift ${
                    i === 0 ? "bg-rose-deep text-white" : "bg-white text-mulberry"
                  }`}
                >
                  <Heart weight="fill" size={10} />
                  {[3, 1, 0][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
