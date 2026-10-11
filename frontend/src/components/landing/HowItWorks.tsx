import Image from "next/image";
import { Heart } from "@phosphor-icons/react/dist/ssr";

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-[1240px] scroll-mt-8 px-5 py-20 md:px-10 lg:py-28">
      <div className="max-w-[40rem]">
        <h2 className="type-atelier text-h1 md:text-display">Three gentle steps.</h2>
        <p className="mt-5 text-lead text-mulberry-soft">About ten minutes in all. Stop whenever you like; everything waits for you.</p>
      </div>

      <ol className="mt-14 grid gap-14 md:grid-cols-3 md:gap-8">
        <Step n={1} title="Make your hair passport" body="A few guided photos while your hair is still yours. Bloom measures its colour, length, texture and fullness, and keeps it on your phone.">
          <PassportVignette />
        </Step>
        <Step n={2} title="Try looks on your own face" body="Real wigs matched to your colour, soft wraps and turbans, and brows. Each one rendered on your photo, side by side with your own hair.">
          <TryOnVignette />
        </Step>
        <Step n={3} title="Choose together" body="Send your favourites to the people you trust. They vote with a heart from wherever they are, and you decide.">
          <ShareVignette />
        </Step>
      </ol>
    </section>
  );
}

function Step({ n, title, body, children }: { n: number; title: string; body: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col">
      <div className="relative grid aspect-[5/4] place-items-center overflow-hidden rounded-[var(--radius-card)] bg-ivory-deep">{children}</div>
      <div className="mt-7 flex items-baseline gap-4">
        <span className="type-atelier text-h2 leading-none text-rose-deep">{n}</span>
        <h3 className="type-studio text-h3">{title}</h3>
      </div>
      <p className="mt-3 max-w-[38ch] text-body text-mulberry-soft">{body}</p>
    </li>
  );
}

function PassportVignette() {
  return (
    <div className="flex w-[78%] items-center gap-4 rounded-[22px] bg-paper p-4 shadow-float">
      <div className="arch relative aspect-[4/5] w-[38%] shrink-0">
        <Image src="/fixtures/demo/face.webp" alt="" fill sizes="140px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        <p className="type-studio text-[1.05rem] leading-tight">Hair passport</p>
        <div className="flex items-center gap-2">
          <span className="size-6 rounded-full ring-2 ring-white" style={{ background: "#5e4028" }} />
          <span className="text-micro leading-tight">Dark chocolate brown</span>
        </div>
        <p className="text-micro text-mulberry-soft">Medium · straight · full</p>
      </div>
    </div>
  );
}

function TryOnVignette() {
  const looks = ["alana-medium-wig--ginger-brown", "bamboo-turban--cashmere-pink", "tracy-short-wig--copper-glaze"];
  return (
    <div className="flex items-end gap-3">
      {looks.map((l, i) => (
        <div key={l} className={`arch relative aspect-[4/5] shadow-lift ${i === 1 ? "w-28 md:w-32" : "w-20 md:w-24"}`}>
          <Image src={`/fixtures/tryon/${l}.webp`} alt="" fill sizes="130px" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

function ShareVignette() {
  const votes = [
    { l: "abigail-lf-medium-wig--ginger-brown", who: "Mum", n: 2 },
    { l: "floral-head-scarf--floral", who: "Ayesha", n: 3 },
  ];
  return (
    <div className="w-[70%] space-y-3">
      {votes.map((v) => (
        <div key={v.l} className="flex items-center gap-3 rounded-[18px] bg-paper p-2.5 pr-4 shadow-lift">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-[12px]">
            <Image src={`/fixtures/tryon/${v.l}.webp`} alt="" fill sizes="48px" className="object-cover" />
          </div>
          <span className="flex-1 text-micro text-mulberry-soft">{v.who} loved this</span>
          <span className="flex items-center gap-1 text-small font-medium text-rose-deep">
            <Heart weight="fill" size={16} /> {v.n}
          </span>
        </div>
      ))}
    </div>
  );
}
