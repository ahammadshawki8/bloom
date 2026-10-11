"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Heart, CheckCircle } from "@phosphor-icons/react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { Share } from "@/lib/types";

type State = { kind: "loading" } | { kind: "missing" } | { kind: "ready"; share: Share } | { kind: "sent"; share: Share; pick: number };

/** What family sees: no account, no app, just the looks and a heart. */
export function FamilyView() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [pick, setPick] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api.getShare(id).then((s) => {
      if (!alive) return;
      if (!s || new Date(s.expiresAt) < new Date()) setState({ kind: "missing" });
      else setState({ kind: "ready", share: s });
    });
    return () => {
      alive = false;
    };
  }, [id]);

  const owner = state.kind === "ready" || state.kind === "sent" ? state.share.ownerName : undefined;

  async function send() {
    if (pick === null || state.kind !== "ready") return;
    setBusy(true);
    try {
      const share = await api.vote(id, { itemIndex: pick, name: name.trim() || undefined, note: note.trim() || undefined });
      setState({ kind: "sent", share, pick });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-ivory">
      <header className="mx-auto flex max-w-[1000px] items-center justify-between px-5 pt-[calc(16px+var(--safe-top))] pb-2 md:px-8 md:pt-7">
        <Wordmark />
        <span className="text-micro text-mulberry-soft">A private link</span>
      </header>

      <main className="mx-auto max-w-[1000px] px-5 pb-16 md:px-8">
        {state.kind === "loading" && <div className="mt-16 h-64 animate-pulse rounded-[var(--radius-card)] bg-ivory-deep" />}

        {state.kind === "missing" && (
          <div className="mx-auto mt-16 max-w-md text-center">
            <h1 className="type-studio text-h2">This link has closed</h1>
            <p className="mt-3 text-body text-mulberry-soft">
              Bloom links close after seven days to keep photos private. Ask for a fresh one if you&apos;d still like to help.
            </p>
          </div>
        )}

        {(state.kind === "ready" || state.kind === "sent") && (
          <>
            <section className="mx-auto mt-6 max-w-[38rem] text-center md:mt-10">
              <p className="text-small text-mulberry-soft">{owner ? `${owner} would love your help` : "Someone you love would like your help"}</p>
              <h1 className="mt-2 type-studio text-h1 md:text-display">{state.share.message || "Which one feels most like me?"}</h1>
              <p className="mt-3 text-small text-mulberry-soft">These are virtual try-ons. Tap the heart on your favourite.</p>
            </section>

            <ul
              className={clsx(
                "mx-auto mt-10 grid gap-x-4 gap-y-8",
                state.share.items.length === 1 ? "max-w-xs" : state.share.items.length === 2 ? "max-w-xl grid-cols-2" : "max-w-3xl grid-cols-2 md:grid-cols-3",
              )}
            >
              {state.share.items.map((item, i) => {
                const chosen = (state.kind === "sent" ? state.pick : pick) === i;
                return (
                  <li key={item.resultId} className={clsx(state.share.items.length === 3 && i === 2 && "col-span-2 mx-auto w-1/2 md:col-span-1 md:w-auto")}>
                    <button
                      disabled={state.kind === "sent"}
                      onClick={() => setPick(i)}
                      aria-pressed={chosen}
                      aria-label={`Choose ${item.title}`}
                      className="group relative block w-full"
                    >
                      <span
                        className={clsx(
                          "relative block aspect-[4/5] arch bg-ivory-deep ring-offset-4 ring-offset-ivory transition-all duration-300",
                          chosen ? "ring-2 ring-rose-deep" : "group-hover:-translate-y-1",
                        )}
                      >
                        <Image src={item.image} alt={item.title} fill sizes="(min-width: 768px) 300px, 45vw" className="object-cover" />
                      </span>
                      <motion.span
                        animate={chosen ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className={clsx(
                          "absolute -bottom-5 left-1/2 grid size-12 -translate-x-1/2 place-items-center rounded-full shadow-float",
                          chosen ? "bg-rose-deep text-white" : "bg-paper text-mulberry",
                        )}
                      >
                        <Heart size={24} weight={chosen ? "fill" : "regular"} />
                      </motion.span>
                    </button>
                    <p className="mt-8 text-center text-small font-medium">{item.title}</p>
                    {item.subtitle && <p className="text-center text-[12px] text-mulberry-soft">{item.subtitle}</p>}
                  </li>
                );
              })}
            </ul>

            <AnimatePresence mode="wait">
              {state.kind === "ready" ? (
                <motion.section key="form" initial={{ opacity: 0 }} animate={{ opacity: pick === null ? 0.5 : 1 }} className="mx-auto mt-12 max-w-md">
                  <label className="block">
                    <span className="text-small font-medium">Your name</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={40}
                      placeholder="Mum"
                      className="mt-2 h-12 w-full rounded-2xl bg-paper px-4 ring-1 ring-line outline-none placeholder:text-mulberry-faint focus:ring-2 focus:ring-rose-deep"
                    />
                  </label>
                  <label className="mt-4 block">
                    <span className="text-small font-medium">A few words, if you like</span>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={200}
                      rows={3}
                      placeholder="This one is so you."
                      className="mt-2 w-full resize-none rounded-2xl bg-paper px-4 py-3 ring-1 ring-line outline-none placeholder:text-mulberry-faint focus:ring-2 focus:ring-rose-deep"
                    />
                  </label>
                  <Button size="lg" className="mt-5 w-full" disabled={pick === null || busy} onClick={send}>
                    {busy ? "Sending…" : pick === null ? "Tap a heart first" : `Send my heart${owner ? ` to ${owner}` : ""}`}
                  </Button>
                  <p className="mt-4 text-center text-micro text-mulberry-soft">
                    This link closes on {new Date(state.share.expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "long" })}.
                  </p>
                </motion.section>
              ) : (
                <motion.section
                  key="sent"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-auto mt-12 max-w-md rounded-[var(--radius-card)] bg-sage-wash p-6 text-center"
                >
                  <CheckCircle size={32} weight="fill" className="mx-auto text-sage-deep" />
                  <h2 className="mt-3 type-studio text-h3">Sent with love</h2>
                  <p className="mt-2 text-small text-mulberry-soft">
                    {owner ? `${owner} will` : "They'll"} see your heart{note.trim() ? " and your note" : ""}. Thank you for being there.
                  </p>
                </motion.section>
              )}
            </AnimatePresence>

            <p className="mt-16 text-center text-micro text-mulberry-soft">
              Made with{" "}
              <Link href="/" className="underline underline-offset-4">
                Bloom
              </Link>
              , a gentle try-on studio for the weeks before chemotherapy.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
