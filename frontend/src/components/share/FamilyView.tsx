"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Heart, ThumbsDown, CheckCircle } from "@phosphor-icons/react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { tallyShare, type Share } from "@/lib/types";

type State = { kind: "loading" } | { kind: "missing" } | { kind: "ready"; share: Share } | { kind: "sent"; share: Share };
type Choice = 1 | -1;

/** What family sees: no account, no app. Love it or pass on each look, see how others voted. */
export function FamilyView() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [choices, setChoices] = useState<Record<number, Choice>>({});
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const share = state.kind === "ready" || state.kind === "sent" ? state.share : null;
  const owner = share?.ownerName;
  const tallies = share ? tallyShare(share) : [];
  const chosen = Object.keys(choices).length;

  function choose(i: number, v: Choice) {
    setChoices((c) => {
      const next = { ...c };
      if (next[i] === v) delete next[i];
      else next[i] = v;
      return next;
    });
  }

  async function send() {
    if (!chosen || state.kind !== "ready") return;
    setBusy(true);
    setError(null);
    try {
      const updated = await api.vote(id, {
        votes: Object.entries(choices).map(([i, v]) => ({ itemIndex: Number(i), value: v })),
        name: name.trim() || undefined,
        note: note.trim() || undefined,
      });
      setState({ kind: "sent", share: updated });
    } catch {
      setError("That didn't send. Check your connection and try again.");
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

        {share && (
          <>
            <section className="mx-auto mt-6 max-w-[38rem] text-center md:mt-10">
              <p className="text-small text-mulberry-soft">{owner ? `${owner} would love your help` : "Someone you love would like your help"}</p>
              <h1 className="mt-2 type-studio text-h1 md:text-display">{share.message || "Which one feels most like me?"}</h1>
              <p className="mt-3 text-small text-mulberry-soft">These are virtual try-ons. Tell her which you love and which aren&apos;t quite her.</p>
            </section>

            <ul
              className={clsx(
                "mx-auto mt-10 grid gap-x-4 gap-y-8",
                share.items.length === 1 ? "max-w-xs" : share.items.length === 2 ? "max-w-xl grid-cols-2" : "max-w-3xl grid-cols-2 md:grid-cols-3",
              )}
            >
              {share.items.map((item, i) => {
                const c = choices[i];
                const t = tallies[i];
                const locked = state.kind === "sent";
                return (
                  <li key={item.resultId} className={clsx(share.items.length === 3 && i === 2 && "col-span-2 mx-auto w-1/2 md:col-span-1 md:w-auto")}>
                    <span
                      className={clsx(
                        "relative block aspect-[4/5] arch bg-ivory-deep ring-offset-4 ring-offset-ivory transition-all duration-300",
                        c === 1 && "ring-2 ring-rose-deep",
                        c === -1 && "opacity-60 ring-2 ring-mulberry/30",
                      )}
                    >
                      <Image src={item.image} alt={item.title} fill sizes="(min-width: 768px) 300px, 45vw" className="object-cover" />
                    </span>
                    <p className="mt-3 text-center text-small font-medium">{item.title}</p>
                    {item.subtitle && <p className="text-center text-[12px] text-mulberry-soft">{item.subtitle}</p>}
                    <div className="mt-3 flex justify-center gap-2">
                      <VoteButton on={c === 1} disabled={locked} onClick={() => choose(i, 1)} label={`Love ${item.title}`}>
                        <Heart size={18} weight={c === 1 ? "fill" : "regular"} /> {t.up}
                      </VoteButton>
                      <VoteButton on={c === -1} disabled={locked} onClick={() => choose(i, -1)} label={`${item.title} is not for her`} tone="down">
                        <ThumbsDown size={18} weight={c === -1 ? "fill" : "regular"} /> {t.down}
                      </VoteButton>
                    </div>
                  </li>
                );
              })}
            </ul>

            <AnimatePresence mode="wait">
              {state.kind === "ready" ? (
                <motion.section key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto mt-12 max-w-md">
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
                      placeholder="The first one is so you."
                      className="mt-2 w-full resize-none rounded-2xl bg-paper px-4 py-3 ring-1 ring-line outline-none placeholder:text-mulberry-faint focus:ring-2 focus:ring-rose-deep"
                    />
                  </label>
                  {error && (
                    <p role="alert" className="mt-3 text-small text-rose-deep">
                      {error}
                    </p>
                  )}
                  <Button size="lg" className="mt-5 w-full" disabled={!chosen || busy} onClick={send}>
                    {busy ? "Sending…" : !chosen ? "Choose on at least one look" : `Send to ${owner ?? "her"}`}
                  </Button>
                  <p className="mt-4 text-center text-micro text-mulberry-soft">
                    This link closes on {new Date(share.expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "long" })}.
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
                    {owner ? `${owner} will` : "She'll"} see your choices{note.trim() ? " and your note" : ""}. Thank you for being there.
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

function VoteButton({
  on,
  disabled,
  onClick,
  label,
  tone = "up",
  children,
}: {
  on: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
  tone?: "up" | "down";
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      aria-label={label}
      className={clsx(
        "flex h-10 min-w-[4.25rem] items-center justify-center gap-1.5 rounded-full px-3 text-small font-semibold tabular-nums transition-colors disabled:cursor-default",
        on ? (tone === "up" ? "bg-rose-deep text-white" : "bg-mulberry text-ivory") : "bg-paper text-mulberry ring-1 ring-line hover:ring-mulberry/40",
      )}
    >
      {children}
    </motion.button>
  );
}
