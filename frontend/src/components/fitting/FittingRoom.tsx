"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import clsx from "clsx";
import { CaretDown } from "@phosphor-icons/react";
import { MirrorStage } from "./MirrorStage";
import { StyleRail, type RailItem } from "./StyleRail";
import { StylePanel } from "./StylePanel";
import { BrowPicker } from "./BrowPicker";
import { FinishPicker } from "./FinishPicker";
import { FitCard } from "./FitCard";
import { ButtonLink, Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { api, ApiError } from "@/lib/api";
import { useCatalog, findVariant } from "@/lib/catalog/useCatalog";
import { PALETTES } from "@/lib/catalog/looks";
import { rankLooks, type MatchMode } from "@/lib/match";
import { fitReport } from "@/lib/match/fit";
import { useBloom } from "@/lib/store";
import { demoPassport } from "@/lib/passport/demo";
import { useRenderedColour } from "@/lib/vision/useRenderedColour";
import type { BrowPreset, HairLength, Passport, Style, TryOnResult, Variant } from "@/lib/types";

type Tab = "wigs" | "wraps" | "brows" | "finish";
const TABS: { id: Tab; label: string }[] = [
  { id: "wigs", label: "Wigs" },
  { id: "wraps", label: "Wraps" },
  { id: "brows", label: "Brows" },
  { id: "finish", label: "Finish" },
];

export function FittingRoom() {
  const passport = useBloom((s) => s.passport);
  const hydrated = useBloom((s) => s.hydrated);
  if (!hydrated) return <div className="mx-auto mt-10 aspect-[4/5] w-[70%] max-w-[380px] animate-pulse rounded-t-full rounded-b-[28px] bg-ivory-deep" />;
  if (!passport) return <NoPassport />;
  return <Room passport={passport} />;
}

function Room({ passport }: { passport: Passport }) {
  const params = useSearchParams();
  const router = useRouter();
  const { styles, error } = useCatalog();
  const results = useBloom((s) => s.results);
  const addResult = useBloom((s) => s.addResult);
  const saved = useBloom((s) => s.saved);
  const save = useBloom((s) => s.save);
  const unsave = useBloom((s) => s.unsave);

  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) ?? "wigs");
  const [mode, setMode] = useState<MatchMode>("match");
  const [length, setLength] = useState<HairLength | "all">("all");
  const [selected, setSelected] = useState<{ style: Style; variant: Variant } | null>(null);
  const [browId, setBrowId] = useState<string | null>(null);
  const [current, setCurrent] = useState<TryOnResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [finishBase, setFinishBase] = useState<TryOnResult | null>(null);
  const [palette, setPalette] = useState(PALETTES[0].id);
  const [necklace, setNecklace] = useState<string | null>(null);
  const reqId = useRef(0);

  // Latest result per variant
  const byVariant = useMemo(() => {
    const m = new Map<string, TryOnResult>();
    for (const r of Object.values(results).sort((a, b) => a.createdAt.localeCompare(b.createdAt))) m.set(r.variantId, r);
    return m;
  }, [results]);
  const tried = useMemo(() => new Set(byVariant.keys()), [byVariant]);
  const hairResults = useMemo(() => [...byVariant.values()].filter((r) => r.kind === "wig" || r.kind === "wrap").reverse(), [byVariant]);

  // Deep link: ?result=<id>, applied once the catalogue has loaded
  const [linked, setLinked] = useState(false);
  if (!linked && styles) {
    setLinked(true);
    const r = results[params.get("result") ?? ""];
    if (r) {
      setCurrent(r);
      if (r.kind === "brow") {
        setTab("brows");
        setBrowId(r.variantId);
      } else if (r.kind === "look" && r.look) {
        setTab("finish");
        setPalette(r.look.palette);
        setNecklace(r.look.necklace);
        setFinishBase(results[r.look.baseResultId] ?? null);
      } else {
        const f = findVariant(styles, r.variantId);
        if (f) {
          setSelected(f);
          setTab(f.style.kind === "wrap" ? "wraps" : "wigs");
        }
      }
    }
  }

  const wigItems: (RailItem & { reasons: string[] })[] = useMemo(() => {
    if (!styles) return [];
    return rankLooks(passport, styles, mode)
      .filter((r) => length === "all" || r.style.length === length)
      .map((r) => ({ style: r.style, variant: r.variant, deltaE: r.deltaE, reasons: r.reasons }));
  }, [styles, passport, mode, length]);

  const wrapItems: RailItem[] = useMemo(
    () => (styles ?? []).filter((s) => s.kind === "wrap").flatMap((s) => s.variants.map((v) => ({ style: { ...s, id: `${s.id}::${v.id}` }, variant: v }))),
    [styles],
  );

  const run = useCallback(
    async (label: string, job: () => Promise<TryOnResult>, cachedId?: string) => {
      const cached = cachedId ? byVariant.get(cachedId) : undefined;
      if (cached) {
        setCurrent(cached);
        return cached;
      }
      const id = ++reqId.current;
      setLoading(label);
      try {
        const r = await job();
        if (id !== reqId.current) return null;
        addResult(r);
        setCurrent(r);
        return r;
      } catch (e) {
        const err = e as ApiError;
        toast(err.hint ?? err.message ?? "That try-on didn't work. Please try again.");
        return null;
      } finally {
        if (id === reqId.current) setLoading(null);
      }
    },
    [byVariant, addResult],
  );

  const realStyleOf = (style: Style) => (style.id.includes("::") ? ((styles ?? []).find((s) => s.id === style.id.split("::")[0]) ?? style) : style);

  const tryVariant = (style: Style, variant: Variant) => {
    const realStyle = realStyleOf(style);
    setSelected({ style: realStyle, variant });
    useBloom.getState().setLastStyle(realStyle.id);
    return run(
      `Trying on ${realStyle.name}${realStyle.variants.length > 1 ? ` in ${variant.colorName}` : ""}…`,
      () => api.tryOn({ passport, style: realStyle, variant }),
      variant.id,
    );
  };

  const tryBrow = (p: BrowPreset) => {
    setBrowId(p.id);
    run(`Drawing ${p.label.toLowerCase()} brows…`, () => api.brows({ passport, preset: p }), p.id);
  };

  const compose = (base: TryOnResult, nextPalette: string, nextNecklace: string | null) => {
    const id = `${base.variantId}--${nextPalette}${nextNecklace ? `--${nextNecklace}` : ""}`;
    run(
      "Finishing your look: brows, lashes, colour, then the necklace…",
      () => api.composeLook({ passport, base, palette: nextPalette, necklace: nextNecklace }),
      id,
    );
  };

  const activeFinishBase = finishBase ?? (current && (current.kind === "wig" || current.kind === "wrap") ? current : (hairResults[0] ?? null));

  // Fit report for the current hair result (wig or wrap)
  const currentHair = current && (current.kind === "wig" || current.kind === "wrap") ? findVariant(styles, current.variantId) : null;
  const rendered = useRenderedColour(current && current.kind === "wig" ? current.image : null, passport.hair.lab);
  const report = currentHair && currentHair.style.kind === "wig" ? fitReport(passport, currentHair.style, currentHair.variant, rendered.deltaE) : null;

  const isSaved = !!current && saved.some((s) => s.resultId === current.id);

  const panel =
    selected && ((tab === "wigs" && selected.style.kind === "wig") || (tab === "wraps" && selected.style.kind === "wrap")) ? (
      <StylePanel style={selected.style} variant={selected.variant} busy={!!loading} onVariant={(v) => tryVariant(selected.style, v)} />
    ) : null;

  return (
    <div className="mx-auto grid max-w-[1180px] gap-5 px-4 pb-10 md:px-10 lg:grid-cols-[minmax(320px,400px)_1fr] lg:gap-10">
      {/* Mirror column */}
      <div className="space-y-4 lg:self-start">
        <MirrorStage
          original={passport.photo}
          current={current?.image ?? null}
          loadingLabel={loading}
          saved={isSaved}
          sampleNotice={api.mode === "mock" && !passport.isDemo}
          onToggleSave={() => {
            if (!current) return;
            if (isSaved) {
              unsave(current.id);
              toast("Removed from your looks.");
            } else {
              save(current.id, "keep");
              toast("Saved to your looks.", { label: "View", onClick: () => router.push("/studio/saved") });
            }
          }}
        />
        {report && <FitCard report={report} measuring={rendered.measuring} />}
      </div>

      {/* Controls column */}
      <div className="min-w-0 space-y-4">
        <div role="tablist" aria-label="What to try" className="relative grid grid-cols-4 rounded-full bg-ivory-deep p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                "relative h-10 rounded-full text-[13px] font-semibold transition-colors sm:text-small",
                tab === t.id ? "text-mulberry" : "text-mulberry-soft",
              )}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-full bg-paper shadow-lift"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>

        {error && <p className="text-small text-rose-deep">{error}</p>}

        {tab === "wigs" && (
          <>
            <div className="flex items-center gap-2">
              <div className="grid flex-1 grid-cols-2 rounded-full p-1 ring-1 ring-line" role="radiogroup" aria-label="Match mode">
                {(["match", "new"] as const).map((m) => (
                  <button
                    key={m}
                    role="radio"
                    aria-checked={mode === m}
                    onClick={() => setMode(m)}
                    className={clsx(
                      "h-8 rounded-full text-[13px] font-medium transition-colors",
                      mode === m ? "bg-mulberry text-ivory" : "text-mulberry-soft hover:text-mulberry",
                    )}
                  >
                    {m === "match" ? "Match my hair" : "Something new"}
                  </button>
                ))}
              </div>
              <label className="relative shrink-0">
                <span className="sr-only">Length</span>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value as HairLength | "all")}
                  className="h-10 appearance-none rounded-full bg-paper pr-8 pl-4 text-[13px] font-medium ring-1 ring-line outline-none focus-visible:ring-2 focus-visible:ring-rose-deep"
                >
                  <option value="all">Any length</option>
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
                <CaretDown size={13} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2" />
              </label>
            </div>
            {styles ? (
              wigItems.length ? (
                <StyleRail
                  items={wigItems}
                  selectedStyleId={selected?.style.id ?? null}
                  triedVariantIds={tried}
                  onPick={(i) => tryVariant(i.style, i.variant)}
                  showMatch
                />
              ) : (
                <p className="py-8 text-center text-small text-mulberry-soft">No styles in that length yet. Try another length.</p>
              )
            ) : (
              <RailSkeleton />
            )}
            {panel}
          </>
        )}

        {tab === "wraps" && (
          <>
            <p className="text-[13px] text-mulberry-soft">Soft turbans and scarves, for sleeping, resting and everything in between.</p>
            {styles ? (
              <StyleRail
                items={wrapItems}
                selectedStyleId={selected && selected.style.kind === "wrap" ? `${selected.style.id}::${selected.variant.id}` : null}
                triedVariantIds={tried}
                onPick={(i) => tryVariant(i.style, i.variant)}
                showMatch={false}
              />
            ) : (
              <RailSkeleton />
            )}
            {panel}
          </>
        )}

        {tab === "brows" && <BrowPicker passport={passport} selectedId={browId} onPick={tryBrow} busy={!!loading} />}

        {tab === "finish" && (
          <FinishPicker
            bases={hairResults}
            base={activeFinishBase}
            palette={palette}
            necklace={necklace}
            busy={!!loading}
            onBase={(b) => {
              setFinishBase(b);
              compose(b, palette, necklace);
            }}
            onPalette={(p) => {
              setPalette(p);
              if (activeFinishBase) compose(activeFinishBase, p, necklace);
            }}
            onNecklace={(n) => {
              setNecklace(n);
              if (activeFinishBase) compose(activeFinishBase, palette, n);
            }}
            onTryBase={async (variantId) => {
              const f = findVariant(styles, variantId);
              if (!f) return;
              const r = await tryVariant(f.style, f.variant);
              if (r) {
                setFinishBase(r);
                compose(r, palette, necklace);
              }
            }}
          />
        )}

        <SharePrompt />
      </div>
    </div>
  );
}

function SharePrompt() {
  const saved = useBloom((s) => s.saved.length);
  if (saved < 2) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] bg-rose-wash p-4">
      <p className="text-small">
        <span className="font-semibold">{saved} looks saved.</span> <span className="text-mulberry-soft">Ready to ask someone you love?</span>
      </p>
      <ButtonLink href="/studio/saved" size="sm">
        Choose together
      </ButtonLink>
    </div>
  );
}

function RailSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden" aria-busy="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="aspect-[4/5] w-[112px] shrink-0 animate-pulse rounded-[20px] bg-ivory-deep" />
      ))}
    </div>
  );
}

function NoPassport() {
  const setPassport = useBloom((s) => s.setPassport);
  return (
    <div className="mx-auto max-w-[560px] px-4 py-10 text-center">
      <h2 className="type-studio text-h2">First, your hair passport</h2>
      <p className="mx-auto mt-3 max-w-[40ch] text-body text-mulberry-soft">
        Every look is matched to your measured colour and tried on your own photo. It takes about two minutes.
      </p>
      <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <ButtonLink href="/studio/passport/new">Make my passport</ButtonLink>
        <Button variant="outline" onClick={() => setPassport(demoPassport())}>
          Use the sample face
        </Button>
      </div>
    </div>
  );
}
