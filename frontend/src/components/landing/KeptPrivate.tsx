const GROUPS = [
  {
    title: "Stays on your phone",
    tone: "bg-sage-wash",
    items: ["Your photos", "Your hair passport", "The looks you save"],
  },
  {
    title: "Leaves only when you ask",
    tone: "bg-lilac-wash",
    items: ["A photo sent to render a try-on", "A share link you create, which expires in 7 days"],
  },
  {
    title: "Never happens",
    tone: "bg-rose-wash",
    // claims-ok: listed under the heading "Never happens"
    items: ["Diagnosis or medical advice", "Selling or training on your photos", "Guessing anything about your health"],
  },
];

export function KeptPrivate() {
  return (
    <section id="private" className="scroll-mt-8 bg-paper">
      <div className="mx-auto max-w-[1240px] px-5 py-20 md:px-10 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div>
            <h2 className="type-atelier text-h1 md:text-display">Kept private, kept kind.</h2>
            <p className="mt-5 max-w-[34ch] text-lead text-mulberry-soft">
              Bloom is a cosmetic tool. It helps you see options; it never tells you anything about your body.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {GROUPS.map((g) => (
              <div key={g.title} className={`rounded-[var(--radius-card)] p-6 ${g.tone}`}>
                <h3 className="type-studio text-[1.25rem] leading-tight">{g.title}</h3>
                <ul className="mt-4 space-y-2.5 text-small">
                  {g.items.map((i) => (
                    <li key={i} className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-mulberry/40" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-10 text-small text-mulberry-soft lg:ml-[calc(33.333%+1.33rem)]">
          You can delete everything Bloom has stored, any time, from one button in the studio.
        </p>
      </div>
    </section>
  );
}
