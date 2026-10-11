"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import clsx from "clsx";
import { MirrorStage } from "./MirrorStage";
import { StyleRail, type RailItem } from "./StyleRail";
import { StylePanel } from "./StylePanel";
import { BrowPicker } from "./BrowPicker";
import { Chip } from "@/components/ui/Chip";
import { ButtonLink, Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { api, ApiError } from "@/lib/api";
import { useCatalog, findVariant } from "@/lib/catalog/useCatalog";
import { rankLooks, closestVariant, type MatchMode } from "@/lib/match";
import { deltaE2000 } from "@/lib/color";
import { useBloom } from "@/lib/store";
import { demoPassport } from "@/lib/passport/demo";
import { useRenderedColour } from "@/lib/vision/useRenderedColour";
import type { BrowPreset, HairLength, Passport, Style, TryOnResult, Variant } from "@/lib/types";

type Tab = "wigs" | "wraps" | "brows";
const TABS: { id: Tab; label: string }[] = [
  { id: "wigs", label: "Wigs" },
  { id: "wraps", label: "Wraps" },
  { id: "brows", label: "Brows" },
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
  const reqId = useRef(0);

  // Latest result per variant, for this passport kind (demo vs own)
  const byVariant = useMemo(() => {
    const m = new Map<string, TryOnResult>();
    for (const r of Object.values(results).sort((a, b) => a.createdAt.localeCompare(b.createdAt))) m.set(r.variantId, r);
    return m;
  }, [results]);
  const tried = useMemo(() => new Set(byVariant.keys()), [byVariant]);

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
        return;
      }
      const id = ++reqId.current;
      setLoading(label);
      try {
        const r = await job();
        if (id !== reqId.current) return;
        addResult(r);
        setCurrent(r);
      } catch (e) {
        const err = e as ApiError;
        toast(err.hint ?? err.message ?? "That try-on didn't work. Please try again.");
      } finally {
        if (id === reqId.current) setLoading(null);
      }
    },
    [byVariant, addResult],
  );

  const tryVariant = (style: Style, variant: Variant) => {
    const realStyle = style.id.includes("::") ? (styles ?? []).find((s) => s.id === style.id.split("::")[0]) ?? style : style;
    setSelected({ style: realStyle, variant });
    useBloom.getState().setLastStyle(realStyle.id);
    run(`Trying on ${realStyle.name}${realStyle.variants.length > 1 ? ` in ${variant.colorName}` : ""}…`, () => api.tryOn({ passport, style: realStyle, variant }), variant.id);
  };

  const tryBrow = (p: BrowPreset) => {
    setBrowId(p.id);
    run(`Drawing ${p.label.toLowerCase()} brows…`, () => api.brows({ passport, preset: p }), p.id);
  };

  const rendered = useRenderedColour(current && current.kind === "wig" ? current.image : null, passport.hair.lab);
  const isSaved = !!current && saved.some((s) => s.resultId === current.id);
  const selectedReasons = selected ? (wigItems.find((w) => w.style.id === selected.style.id)?.reasons ?? []) : [];

  const panel =
    selected && ((tab === "wigs" && selected.style.kind === "wig") || (tab === "wraps" && selected.style.kind === "wrap")) ? (
      <StylePanel
        style={selected.style}
        variant={selected.variant}
        passport={passport}
        busy={!!loading}
        reasons={selected.style.kind === "wig" ? selectedReasons : []}
        rendered={selected.style.kind === "wig" && current?.variantId === selected.variant.id ? rendered : null}
        onVariant={(v) => tryVariant(selected.style, v)}
      />
    ) : null;

  return (
    <div className="mx-auto grid max-w-[1180px] gap-6 px-4 pb-10 md:px-10 lg:grid-cols-[minmax(340px,440px)_1fr] lg:gap-12">
      {/* Mirror column */}
      <div className="lg:self-start">
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
        {panel && <div className="mt-8 hidden lg:block">{panel}</div>}
      </div>

      {/* Controls column */}
      <div className="min-w-0">
        <div role="tablist" aria-label="What to try" className="relative grid grid-cols-3 rounded-full bg-ivory-deep p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={clsx("relative h-11 rounded-full text-small font-semibold transition-colors", tab === t.id ? "text-mulberry" : "text-mulberry-soft")}
            >
              {tab === t.id && <motion.span layoutId="tab-bg" className="absolute inset-0 rounded-full bg-paper shadow-lift" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>

        {error && <p className="mt-6 text-small text-rose-deep">{error}</p>}

        {tab === "wigs" && (
          <div className="mt-5">
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
              <Chip selected={mode === "match"} onClick={() => setMode("match")}>
                Match my hair
              </Chip>
              <Chip selected={mode === "new"} onClick={() => setMode("new")}>
                Something new
              </Chip>
              <span className="mx-1 w-px shrink-0 bg-line" aria-hidden />
              {(["all", "short", "medium", "long"] as const).map((l) => (
                <Chip key={l} selected={length === l} onClick={() => setLength(l)}>
                  {l === "all" ? "Any length" : l[0].toUpperCase() + l.slice(1)}
                </Chip>
              ))}
            </div>
            <p className="mt-4 mb-3 text-micro text-mulberry-soft">
              {mode === "match" ? "Closest to your measured colour first, then length and texture." : "A clear but wearable change from your colour."}
            </p>
            {styles ? (
              wigItems.length ? (
                <StyleRail items={wigItems} selectedStyleId={selected?.style.id ?? null} triedVariantIds={tried} onPick={(i) => tryVariant(i.style, i.variant)} showMatch />
              ) : (
                <p className="py-8 text-center text-small text-mulberry-soft">No styles in that length yet. Try another length.</p>
              )
            ) : (
              <RailSkeleton />
            )}
            {panel && <div className="mt-4 lg:hidden">{panel}</div>}
          </div>
        )}

        {tab === "wraps" && (
          <div className="mt-5">
            <p className="mb-3 text-small text-mulberry-soft">Soft turbans and scarves, for sleeping, resting and everything in between.</p>
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
            {panel && <div className="mt-4 lg:hidden">{panel}</div>}
          </div>
        )}

        {tab === "brows" && (
          <div className="mt-5">
            <BrowPicker passport={passport} selectedId={browId} onPick={tryBrow} busy={!!loading} />
          </div>
        )}

        <ClosestHint passport={passport} styles={styles} />
      </div>
    </div>
  );
}

function ClosestHint({ passport, styles }: { passport: Passport; styles: Style[] | null }) {
  const saved = useBloom((s) => s.saved.length);
  if (!styles || saved < 2) return null;
  const best = styles
    .filter((s) => s.kind === "wig")
    .map((s) => ({ s, ...closestVariant(passport, s) }))
    .sort((a, b) => a.deltaE - b.deltaE)[0];
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] bg-rose-wash p-5">
      <p className="text-small">
        <span className="font-semibold">You have {saved} looks saved.</span> <span className="text-mulberry-soft">Ready to ask someone you love?</span>
      </p>
      <ButtonLink href="/studio/saved" size="sm">
        Choose together
      </ButtonLink>
      <span className="sr-only">Closest colour in the collection: {best?.s.name}, ΔE {best ? deltaE2000(passport.hair.lab, best.variant.lab).toFixed(1) : ""}</span>
    </div>
  );
}

function RailSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden" aria-busy="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="aspect-[4/5] w-[132px] shrink-0 animate-pulse rounded-[22px] bg-ivory-deep" />
      ))}
    </div>
  );
}

function NoPassport() {
  const setPassport = useBloom((s) => s.setPassport);
  return (
    <div className="mx-auto max-w-[560px] px-4 py-10 text-center">
      <h2 className="type-studio text-h2">First, your hair passport</h2>
      <p className="mx-auto mt-3 max-w-[40ch] text-body text-mulberry-soft">Every look is matched to your measured colour and tried on your own photo. It takes about two minutes.</p>
      <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <ButtonLink href="/studio/passport/new">Make my passport</ButtonLink>
        <Button variant="outline" onClick={() => setPassport(demoPassport())}>
          Use the sample face
        </Button>
      </div>
    </div>
  );
}
