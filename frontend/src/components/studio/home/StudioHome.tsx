"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Heart, Sparkle } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { PageHeader } from "@/components/studio/PageHeader";
import { ArchMirror } from "@/components/mirror/ArchMirror";
import { ButtonLink, Button } from "@/components/ui/Button";
import { useBloom } from "@/lib/store";
import { demoPassport } from "@/lib/passport/demo";
import { toast } from "@/components/ui/Toast";
import { ShieldCheck } from "@phosphor-icons/react";
import { RecentLooks } from "./RecentLooks";

const lengthWord = { short: "Short", medium: "Medium", long: "Long" } as const;
const densityWord = { 1: "fine", 2: "light", 3: "full", 4: "very full" } as const;

export function StudioHome() {
  const hydrated = useBloom((s) => s.hydrated);
  const passport = useBloom((s) => s.passport);
  const setPassport = useBloom((s) => s.setPassport);
  const hasPassport = hydrated && !!passport;

  return (
    <>
      <PageHeader
        brand
        actions={
          <Link href="/studio/privacy" className="grid size-11 place-items-center rounded-full hover:bg-mulberry/5 md:hidden" aria-label="Privacy and your data">
            <ShieldCheck size={22} />
          </Link>
        }
      />
      <main className="mx-auto max-w-[1120px] px-4 pb-10 md:px-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <h1 className="type-studio text-h1 md:text-display">A little space, just for you.</h1>
          <p className="mt-2 text-lead text-mulberry-soft">What would you like to try today?</p>
        </motion.div>

        <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_1.25fr] lg:gap-6">
          {/* Passport hero card */}
          <section aria-label="Your hair passport" className="flex gap-4 rounded-[var(--radius-card)] bg-rose-wash p-4 sm:gap-6 sm:p-5 lg:flex-col lg:p-6">
            <div className="w-[38%] shrink-0 sm:w-[34%] lg:mx-auto lg:w-[64%]">
              <ArchMirror
                src={passport?.photo ?? "/fixtures/demo/face.webp"}
                alt={passport ? "Your passport photo" : "Sample face"}
                transitionName="mirror"
                reveal={false}
                priority
                sizes="(min-width: 1024px) 300px, 40vw"
              >
                {!hasPassport && (
                  <span className="absolute inset-x-0 bottom-3 mx-auto w-max rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium backdrop-blur">Sample</span>
                )}
              </ArchMirror>
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center lg:items-center lg:text-center">
              {hasPassport && passport ? (
                <>
                  <p className="text-micro text-mulberry-soft">{passport.isDemo ? "Sample passport" : "Your hair passport"}</p>
                  <div className="mt-2 flex items-center gap-2.5">
                    <span className="size-7 shrink-0 rounded-full ring-2 ring-white" style={{ background: passport.hair.hex }} />
                    <span className="type-studio text-[1.25rem] leading-tight">{passport.hair.name}</span>
                  </div>
                  <p className="mt-2 text-small text-mulberry-soft">
                    {[passport.length && lengthWord[passport.length], passport.texture, passport.density && densityWord[passport.density]].filter(Boolean).join(" · ")}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 lg:justify-center">
                    <ButtonLink href="/studio/try" size="sm">
                      Try a look
                    </ButtonLink>
                    <ButtonLink href="/studio/passport" size="sm" variant="outline">
                      Open passport
                    </ButtonLink>
                  </div>
                </>
              ) : (
                <>
                  <p className="type-studio text-[1.3rem] leading-tight sm:text-h3">Begin with your hair passport</p>
                  <p className="mt-2 text-small text-mulberry-soft">A few guided photos, about two minutes. Everything stays on this phone.</p>
                  <div className="mt-4 flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap lg:items-center lg:justify-center">
                    <ButtonLink href="/studio/passport/new" size="sm">
                      Make my passport
                    </ButtonLink>
                    <Button
                      size="sm"
                      variant="quiet"
                      className="h-auto! -ml-2 py-2 text-left whitespace-normal! underline decoration-rose/60 underline-offset-4 sm:ml-0"
                      onClick={() => {
                        setPassport(demoPassport());
                        toast("Using the sample face. You can make your own anytime.");
                      }}
                    >
                      Look around with a sample face
                    </Button>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Category tiles */}
          <section aria-label="Explore" className="grid grid-cols-2 gap-3 sm:gap-4">
            <Tile href="/studio/try?tab=wigs" title="Try a new look" sub="Wigs matched to you" tone="bg-lilac-wash" img="/fixtures/tryon/abigail-lf-medium-wig--honey-wheat.webp" tall />
            <Tile href="/studio/try?tab=wraps" title="Head wraps" sub="Soft turbans and scarves" tone="bg-sage-wash" img="/fixtures/tryon/bamboo-turban--sage-green.webp" tall />
            <Tile href="/studio/try?tab=brows" title="Brows & beauty" sub="Shape and shade" tone="bg-butter-wash" icon={<Sparkle size={22} />} />
            <SavedTile />
          </section>
        </div>

        <RecentLooks />
      </main>
    </>
  );
}

function Tile({ href, title, sub, tone, img, icon, tall }: { href: string; title: string; sub: string; tone: string; img?: string; icon?: React.ReactNode; tall?: boolean }) {
  return (
    <Link href={href} className={`group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] ${tone} transition-transform duration-300 active:scale-[0.98]`}>
      {img && (
        <div className={`relative ${tall ? "aspect-[4/4.2]" : "aspect-square"} overflow-hidden`}>
          <Image src={img} alt="" fill sizes="(min-width: 1024px) 300px, 45vw" className="object-cover object-top transition-transform duration-500 ease-[var(--ease-petal)] group-hover:scale-[1.03]" />
        </div>
      )}
      <div className="flex flex-1 flex-col justify-end p-4">
        {icon && <span className="mb-6 text-butter-deep">{icon}</span>}
        <span className="flex items-center gap-1.5 type-studio text-[1.1rem] leading-tight sm:text-[1.25rem]">
          {title}
          <ArrowUpRight size={16} className="shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
        <span className="mt-0.5 line-clamp-1 text-micro text-mulberry-soft">{sub}</span>
      </div>
    </Link>
  );
}

function SavedTile() {
  const saved = useBloom((s) => s.saved);
  const results = useBloom((s) => s.results);
  const thumbs = saved.slice(0, 3).map((x) => results[x.resultId]).filter(Boolean);
  return (
    <Link href="/studio/saved" className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-paper p-4 ring-1 ring-line transition-transform active:scale-[0.98]">
      <div className="mb-6 flex h-[22px] items-center">
        {thumbs.length ? (
          <span className="flex -space-x-2">
            {thumbs.map((r) => (
              <span key={r.id} className="relative size-8 overflow-hidden rounded-full ring-2 ring-paper">
                <Image src={r.image} alt="" fill sizes="32px" className="object-cover" />
              </span>
            ))}
          </span>
        ) : (
          <Heart size={22} className="text-rose-deep" />
        )}
      </div>
      <span className="mt-auto flex items-center gap-1.5 type-studio text-[1.1rem] leading-tight sm:text-[1.25rem]">
        Saved looks
        <ArrowUpRight size={16} className="shrink-0" />
      </span>
      <span className="mt-0.5 text-micro text-mulberry-soft">{saved.length ? `${saved.length} saved` : "Your favourites live here"}</span>
    </Link>
  );
}
