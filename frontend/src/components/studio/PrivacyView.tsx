"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { DeviceMobile, CloudArrowUp, Prohibit, Trash } from "@phosphor-icons/react";
import { PageHeader } from "@/components/studio/PageHeader";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { useBloom } from "@/lib/store";

export function PrivacyView() {
  const passport = useBloom((s) => s.passport);
  const results = useBloom((s) => s.results);
  const saved = useBloom((s) => s.saved);
  const shares = useBloom((s) => s.shares);
  const clearAll = useBloom((s) => s.clearAll);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  const stored = [
    passport ? (passport.isDemo ? "A sample passport" : "Your hair passport and its photos") : null,
    Object.keys(results).length ? `${Object.keys(results).length} try-on images` : null,
    saved.length ? `${saved.length} saved looks` : null,
    shares.length ? `${shares.length} share links` : null,
  ].filter(Boolean) as string[];

  return (
    <>
      <PageHeader back={{ href: "/studio", label: "Home" }} title="Privacy & your data" />
      <main className="mx-auto max-w-[760px] px-4 pb-12 md:px-10">
        <p className="text-lead text-mulberry-soft">Bloom is built so that your photos stay yours. Here is exactly what happens to them.</p>

        <div className="mt-8 space-y-3">
          <Row icon={<DeviceMobile size={22} />} tone="bg-sage-wash" title="On this phone">
            {stored.length ? (
              <ul className="mt-1 list-inside list-disc text-small text-mulberry-soft">
                {stored.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-small text-mulberry-soft">
                Nothing yet. When you make a passport or try a look, it&apos;s kept here, in this browser only.
              </p>
            )}
          </Row>
          <Row icon={<CloudArrowUp size={22} />} tone="bg-lilac-wash" title="Sent only when you ask">
            <p className="mt-1 text-small text-mulberry-soft">
              When you try a look, your passport photo goes to our server and the YouCam API to render it, and the result comes back to you. When you share with
              family, the looks you pick are stored behind a private link that closes after seven days.
            </p>
          </Row>
          <Row icon={<Prohibit size={22} />} tone="bg-rose-wash" title="Never">
            <p className="mt-1 text-small text-mulberry-soft">
              No accounts, no advertising, no selling or training on your photos. Bloom never guesses anything about your health and gives no medical advice.
            </p>
          </Row>
        </div>

        <section className="mt-10 rounded-[var(--radius-card)] bg-paper p-5 ring-1 ring-line md:p-6">
          <h2 className="type-studio text-h3">Delete everything</h2>
          <p className="mt-2 text-small text-mulberry-soft">
            Removes your passport, photos, try-ons, saved looks and share history from this phone. This can&apos;t be undone.
          </p>
          <AnimatePresence mode="wait" initial={false}>
            {confirming ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-5 flex flex-wrap items-center gap-3"
              >
                <Button
                  className="bg-rose-deep hover:bg-[#7d434b]"
                  icon={<Trash size={18} />}
                  onClick={async () => {
                    await clearAll();
                    setConfirming(false);
                    toast("Everything has been deleted from this phone.");
                    router.push("/studio");
                  }}
                >
                  Yes, delete everything
                </Button>
                <Button variant="quiet" onClick={() => setConfirming(false)}>
                  Keep my things
                </Button>
              </motion.div>
            ) : (
              <motion.div key="ask" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5">
                <Button variant="outline" icon={<Trash size={18} />} onClick={() => setConfirming(true)} disabled={!stored.length}>
                  Delete everything
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </>
  );
}

function Row({ icon, tone, title, children }: { icon: React.ReactNode; tone: string; title: string; children: React.ReactNode }) {
  return (
    <div className={`flex gap-4 rounded-[var(--radius-card)] p-5 ${tone}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <h2 className="type-studio text-[1.2rem]">{title}</h2>
        {children}
      </div>
    </div>
  );
}
