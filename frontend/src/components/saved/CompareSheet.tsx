"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ThumbsDown } from "@phosphor-icons/react";
import { Sheet } from "@/components/ui/Sheet";
import { useBloom } from "@/lib/store";
import { useCatalog } from "@/lib/catalog/useCatalog";
import { describeLook } from "@/lib/catalog/describe";
import { deltaE2000, describeDeltaE } from "@/lib/color";
import { wornLab } from "@/lib/match";
import { fitReport, lengthWords } from "@/lib/match/fit";
import { useShareTallies } from "@/lib/shares/useTallies";
import type { TryOnResult } from "@/lib/types";

const LENGTH = { short: "Short", medium: "Medium", long: "Long" } as const;
const KIND = { wig: "Wig", wrap: "Head wrap", brow: "Brows", lash: "Lashes" } as const;

/** Side by side, in detail: her own hair as the reference column, then each chosen look. */
export function CompareSheet({ open, ids, onClose }: { open: boolean; ids: string[]; onClose: () => void }) {
  const results = useBloom((s) => s.results);
  const passport = useBloom((s) => s.passport);
  const { styles } = useCatalog();
  const { byResult } = useShareTallies();
  const looks = ids.map((id) => results[id]).filter(Boolean);

  if (!passport) return null;

  const info = (r: TryOnResult) => describeLook(r, styles);

  const rows: { label: string; you: ReactNode; cell: (r: TryOnResult) => ReactNode }[] = [
    { label: "Type", you: "Natural hair", cell: (r) => KIND[r.kind] },
    {
      label: "Colour",
      you: <Swatch hex={passport.hair.hex} text={passport.hair.name} />,
      cell: (r) => {
        const i = info(r);
        return i.variant ? <Swatch hex={i.variant.hex} text={i.variant.colorName} /> : "—";
      },
    },
    {
      label: "Colour distance",
      you: "Reference",
      cell: (r) => {
        const i = info(r);
        if (!i.variant || i.style?.kind !== "wig") return "—";
        const d = deltaE2000(passport.hair.lab, wornLab(i.variant));
        return (
          <>
            <span className="font-medium">ΔE {d.toFixed(1)}</span>
            <span className="block text-[11px] text-mulberry-soft">{describeDeltaE(d).label}</span>
          </>
        );
      },
    },
    {
      label: "Fit score",
      you: "—",
      cell: (r) => {
        const i = info(r);
        if (!i.variant || !i.style || i.style.kind !== "wig") return "—";
        return <span className="font-semibold">{fitReport(passport, i.style, i.variant).overall} / 100</span>;
      },
    },
    {
      label: "Face shape fit",
      you: passport.face ? passport.face.shape : "Not analysed",
      cell: (r) => {
        const i = info(r);
        if (!i.variant || !i.style || i.style.kind !== "wig") return "—";
        return fitReport(passport, i.style, i.variant).metrics.find((m) => m.key === "face")?.display ?? "—";
      },
    },
    {
      label: "Length on you",
      you: passport.hairLengthTerm ? lengthWords(passport.hairLengthTerm) : passport.length ? LENGTH[passport.length] : "—",
      cell: (r) => {
        const i = info(r);
        return i.variant?.renderLength ? lengthWords(i.variant.renderLength) : i.style?.kind === "wig" ? "Not readable" : "—";
      },
    },
    {
      label: "Style",
      you: passport.texture ? (passport.texture === "wavy" ? "Wavy" : "Straight") : "—",
      cell: (r) => {
        const s = info(r).style;
        if (!s || s.kind !== "wig") return "—";
        return [s.length && LENGTH[s.length], s.texture === "wavy" ? "wavy" : "straight", s.bangs ? "bangs" : null, s.laceFront ? "lace front" : null]
          .filter(Boolean)
          .join(", ");
      },
    },
    {
      label: "Price",
      you: "—",
      cell: (r) => {
        const i = info(r);
        return i.variant ? `$${i.variant.price.toFixed(0)}` : "—";
      },
    },
    {
      label: "Returns",
      you: "—",
      cell: (r) => {
        const s = info(r).style;
        if (!s) return "—";
        return s.finalSale ? "Final sale" : s.kind === "wig" ? "Usually not once worn" : "Often final sale";
      },
    },
    {
      label: "Family votes",
      you: "—",
      cell: (r) => {
        const t = byResult[r.id];
        if (!t || t.up + t.down === 0) return <span className="text-mulberry-soft">None yet</span>;
        return (
          <span className="flex items-center gap-2.5 font-medium tabular-nums">
            <span className="flex items-center gap-1 text-rose-deep">
              <Heart size={14} weight="fill" /> {t.up}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsDown size={14} /> {t.down}
            </span>
          </span>
        );
      },
    },
  ];

  return (
    <Sheet open={open} onClose={onClose} title="Side by side" wide>
      <div className="-mx-5 no-scrollbar overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
        <table className="w-full min-w-[520px] border-separate border-spacing-0 text-left text-[13px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-28 bg-ivory" aria-label="Attribute" />
              <th className="px-2 pb-3 align-bottom font-normal">
                <Thumb src={passport.photo} />
                <span className="mt-2 block font-semibold">Your own hair</span>
              </th>
              {looks.map((r) => (
                <th key={r.id} className="px-2 pb-3 align-bottom font-normal">
                  <Thumb src={r.image} />
                  <span className="mt-2 block truncate font-semibold">{describeLook(r, styles).title}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="sticky left-0 z-10 border-t border-line bg-ivory py-2.5 pr-3 align-top text-[12px] font-medium text-mulberry-soft">
                  {row.label}
                </th>
                <td className="border-t border-line px-2 py-2.5 align-top">{row.you}</td>
                {looks.map((r) => (
                  <td key={r.id} className="border-t border-line px-2 py-2.5 align-top">
                    {row.cell(r)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th className="sticky left-0 bg-ivory" />
              <td />
              {looks.map((r) => (
                <td key={r.id} className="px-2 pt-3">
                  <Link
                    href={`/studio/pack?result=${encodeURIComponent(r.id)}`}
                    className="inline-block rounded-full bg-mulberry px-3 py-1.5 text-[12px] font-medium text-ivory"
                  >
                    Choose this one
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-micro text-mulberry-soft">Colour and length are measured on the try-on renders; fit and exact shade can vary in person.</p>
    </Sheet>
  );
}

function Thumb({ src }: { src: string }) {
  return (
    <span className="relative block aspect-[4/5] w-full max-w-[150px] arch overflow-hidden bg-ivory-deep">
      <Image src={src} alt="" fill sizes="150px" className="object-cover" />
    </span>
  );
}

function Swatch({ hex, text }: { hex: string; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-3.5 shrink-0 rounded-full ring-1 ring-white" style={{ background: hex }} />
      <span className="truncate">{text}</span>
    </span>
  );
}
