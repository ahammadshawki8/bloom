import clsx from "clsx";

/** Five-petal mark: the bloom, drawn as overlapping arches. */
export function PetalMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      {[0, 72, 144, 216, 288].map((d, i) => (
        <path
          key={d}
          d="M16 16c-3.2-2.6-4.3-6.6-2.6-9.6C14.4 4.7 16 4 16 4s1.6.7 2.6 2.4c1.7 3-.6 7-2.6 9.6Z"
          transform={`rotate(${d} 16 16)`}
          fill={i % 2 ? "var(--color-sage)" : "var(--color-rose)"}
          fillOpacity={0.85}
        />
      ))}
      <circle cx="16" cy="16" r="2.2" fill="var(--color-mulberry)" />
    </svg>
  );
}

export function Wordmark({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  return (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      <PetalMark size={size === "lg" ? 28 : 22} />
      <span className={clsx("type-studio italic leading-none", size === "lg" ? "text-[1.75rem]" : "text-[1.4rem]")} style={{ fontVariationSettings: '"opsz" 72, "SOFT" 100, "WONK" 1' }}>
        bloom
      </span>
    </span>
  );
}
