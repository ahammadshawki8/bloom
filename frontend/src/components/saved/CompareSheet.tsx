"use client";

import Image from "next/image";
import Link from "next/link";
import { Sheet } from "@/components/ui/Sheet";
import { useBloom } from "@/lib/store";
import { useCatalog } from "@/lib/catalog/useCatalog";
import { describeLook } from "@/lib/catalog/describe";
import { deltaE2000, describeDeltaE } from "@/lib/color";
import { wornLab } from "@/lib/match";

/** Two or three looks side by side, with her own hair as the reference. */
export function CompareSheet({ open, ids, onClose }: { open: boolean; ids: string[]; onClose: () => void }) {
  const results = useBloom((s) => s.results);
  const passport = useBloom((s) => s.passport);
  const { styles } = useCatalog();
  const looks = ids.map((id) => results[id]).filter(Boolean);

  return (
    <Sheet open={open} onClose={onClose} title="Side by side" wide>
      <div className="-mx-5 no-scrollbar flex snap-x gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-4 md:px-0">
        {passport && (
          <figure className="w-[44%] shrink-0 snap-start md:w-auto">
            <div className="relative aspect-[4/5] arch bg-ivory-deep">
              <Image src={passport.photo} alt="Your own hair" fill sizes="220px" className="object-cover" />
            </div>
            <figcaption className="mt-2 text-small font-medium">Your own hair</figcaption>
            <p className="text-[12px] text-mulberry-soft">{passport.hair.name}</p>
          </figure>
        )}
        {looks.map((r) => {
          const info = describeLook(r, styles);
          const dE = passport && info.variant && info.style?.kind === "wig" ? deltaE2000(passport.hair.lab, wornLab(info.variant)) : null;
          return (
            <figure key={r.id} className="w-[44%] shrink-0 snap-start md:w-auto">
              <div className="relative aspect-[4/5] arch bg-ivory-deep">
                <Image src={r.image} alt={info.title} fill sizes="220px" className="object-cover" />
              </div>
              <figcaption className="mt-2 truncate text-small font-medium">{info.title}</figcaption>
              <p className="truncate text-[12px] text-mulberry-soft">{dE !== null ? describeDeltaE(dE).label : info.subtitle}</p>
              <Link
                href={`/studio/pack?result=${encodeURIComponent(r.id)}`}
                className="mt-2 inline-block rounded-full bg-mulberry px-3 py-1.5 text-[12px] font-medium text-ivory"
              >
                Choose this one
              </Link>
            </figure>
          );
        })}
      </div>
      <p className="mt-5 text-micro text-mulberry-soft">Previews show style and colour; fit and exact shade can vary in person.</p>
    </Sheet>
  );
}
