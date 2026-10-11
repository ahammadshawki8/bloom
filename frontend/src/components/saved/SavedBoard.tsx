"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Check, X, ArrowsLeftRight, UsersThree, Heart, Question } from "@phosphor-icons/react";
import { PageHeader } from "@/components/studio/PageHeader";
import { Hydrated } from "@/components/studio/Hydrated";
import { ButtonLink, Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { useBloom } from "@/lib/store";
import { useCatalog } from "@/lib/catalog/useCatalog";
import { describeLook } from "@/lib/catalog/describe";
import type { Shelf } from "@/lib/types";
import { CompareSheet } from "./CompareSheet";
import { ShareSheet } from "./ShareSheet";
import { SentShares } from "./SentShares";

export function SavedBoard() {
  return (
    <>
      <PageHeader title="Your looks" />
      <main className="mx-auto max-w-[1120px] px-4 pb-36 md:px-10 md:pb-16">
        <Hydrated>
          <Board />
        </Hydrated>
      </main>
    </>
  );
}

function Board() {
  const saved = useBloom((s) => s.saved);
  const results = useBloom((s) => s.results);
  const save = useBloom((s) => s.save);
  const unsave = useBloom((s) => s.unsave);
  const { styles } = useCatalog();
  const [shelf, setShelf] = useState<Shelf>("keep");
  const [picked, setPicked] = useState<string[]>([]);
  const [sheet, setSheet] = useState<"compare" | "share" | null>(null);

  const counts = { keep: saved.filter((s) => s.shelf === "keep").length, maybe: saved.filter((s) => s.shelf === "maybe").length };
  const visible = useMemo(() => saved.filter((s) => s.shelf === shelf && results[s.resultId]), [saved, shelf, results]);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]));

  if (!saved.length) {
    return (
      <div className="mx-auto mt-6 max-w-[520px] rounded-[var(--radius-sheet)] bg-rose-wash p-8 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-paper text-rose-deep shadow-lift">
          <Heart size={26} weight="fill" />
        </div>
        <h2 className="mt-5 type-studio text-h3">Nothing saved yet</h2>
        <p className="mx-auto mt-2 max-w-[34ch] text-small text-mulberry-soft">
          Tap the heart on any look you like in the fitting room. Your favourites gather here, ready to compare or share.
        </p>
        <ButtonLink href="/studio/try" className="mt-6">
          Open the fitting room
        </ButtonLink>
      </div>
    );
  }

  return (
    <>
      <p className="-mt-2 mb-5 max-w-[52ch] text-body text-mulberry-soft">Pick up to three to compare, or to send to someone you trust.</p>

      <div role="tablist" className="inline-grid grid-cols-2 rounded-full bg-ivory-deep p-1">
        {(["keep", "maybe"] as const).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={shelf === s}
            onClick={() => setShelf(s)}
            className={clsx(
              "relative flex h-10 items-center gap-2 rounded-full px-5 text-small font-semibold",
              shelf === s ? "text-mulberry" : "text-mulberry-soft",
            )}
          >
            {shelf === s && <motion.span layoutId="shelf-bg" className="absolute inset-0 rounded-full bg-paper shadow-lift" />}
            <span className="relative flex items-center gap-1.5">
              {s === "keep" ? <Heart size={16} weight="fill" className="text-rose-deep" /> : <Question size={16} />}
              {s === "keep" ? "Loved" : "Maybe"}
              <span className="text-mulberry-soft">{counts[s]}</span>
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 text-small text-mulberry-soft">{shelf === "maybe" ? "Move looks here when you're not sure yet." : "Nothing in Loved right now."}</p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
          <AnimatePresence initial={false}>
            {visible.map(({ resultId }) => {
              const r = results[resultId];
              const info = describeLook(r, styles);
              const on = picked.includes(resultId);
              const order = picked.indexOf(resultId) + 1;
              return (
                <motion.li
                  key={resultId}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="relative">
                    <button
                      onClick={() => toggle(resultId)}
                      aria-pressed={on}
                      aria-label={`${on ? "Unselect" : "Select"} ${info.title}`}
                      className="block w-full"
                    >
                      <span
                        className={clsx(
                          "relative block aspect-[4/5] arch bg-ivory-deep ring-offset-4 ring-offset-ivory transition-shadow",
                          on && "ring-2 ring-mulberry",
                        )}
                      >
                        <Image src={r.image} alt="" fill sizes="(min-width: 1024px) 240px, 45vw" className="object-cover" />
                      </span>
                    </button>
                    <span
                      aria-hidden
                      className={clsx(
                        "pointer-events-none absolute top-3 left-3 grid size-7 place-items-center rounded-full text-[12px] font-bold transition-all",
                        on ? "bg-mulberry text-ivory" : "bg-white/80 ring-1 ring-mulberry/20 backdrop-blur",
                      )}
                    >
                      {on ? order : ""}
                    </span>
                    <button
                      onClick={() => {
                        unsave(resultId);
                        setPicked((p) => p.filter((x) => x !== resultId));
                        toast("Removed.", { label: "Undo", onClick: () => save(resultId, shelf) });
                      }}
                      aria-label={`Remove ${info.title}`}
                      className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-white/80 backdrop-blur hover:bg-white"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <div className="mt-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-small font-medium">{info.title}</p>
                      <p className="truncate text-[12px] text-mulberry-soft">{info.subtitle}</p>
                    </div>
                    <button
                      onClick={() => {
                        save(resultId, shelf === "keep" ? "maybe" : "keep");
                        toast(shelf === "keep" ? "Moved to Maybe." : "Moved to Loved.");
                      }}
                      className="shrink-0 rounded-full px-2 py-1 text-[12px] font-medium text-mulberry-soft ring-1 ring-line hover:text-mulberry"
                    >
                      {shelf === "keep" ? "Maybe" : "Love it"}
                    </button>
                  </div>
                  <Link
                    href={`/studio/pack?result=${encodeURIComponent(resultId)}`}
                    className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-sage-deep underline underline-offset-4"
                  >
                    <Check size={13} /> This is the one
                  </Link>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <SentShares />

      {/* action bar */}
      <AnimatePresence>
        {picked.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="no-print fixed inset-x-3 bottom-[calc(76px+var(--safe-bottom))] z-40 mx-auto flex max-w-lg items-center gap-2 rounded-full bg-mulberry p-2 pl-5 text-ivory shadow-float md:bottom-6 md:left-[calc(248px+1rem)]"
          >
            <span className="text-small">{picked.length} selected</span>
            <div className="ml-auto flex gap-2">
              <button className="h-9 rounded-full px-3 text-small font-medium text-ivory/85 hover:bg-ivory/10 hover:text-ivory" onClick={() => setPicked([])}>
                Clear
              </button>
              <Button
                size="sm"
                className="bg-ivory/12 shadow-none hover:bg-ivory/20"
                disabled={picked.length < 2}
                icon={<ArrowsLeftRight size={16} />}
                onClick={() => setSheet("compare")}
              >
                Compare
              </Button>
              <Button
                size="sm"
                className="bg-rose text-mulberry shadow-none hover:bg-[#d49c9c]"
                icon={<UsersThree size={16} />}
                onClick={() => setSheet("share")}
              >
                Ask family
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CompareSheet open={sheet === "compare"} ids={picked} onClose={() => setSheet(null)} />
      <ShareSheet
        open={sheet === "share"}
        ids={picked}
        onClose={() => setSheet(null)}
        onShared={() => {
          setPicked([]);
        }}
      />
    </>
  );
}
