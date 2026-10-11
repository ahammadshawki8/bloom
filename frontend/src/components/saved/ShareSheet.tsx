"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, ShareNetwork, Check, ArrowSquareOut } from "@phosphor-icons/react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { useBloom } from "@/lib/store";
import { useCatalog } from "@/lib/catalog/useCatalog";
import { describeLook } from "@/lib/catalog/describe";
import type { Share } from "@/lib/types";

interface Props {
  open: boolean;
  ids: string[];
  onClose: () => void;
  onShared: () => void;
}

export function ShareSheet({ open, ids, onClose, onShared }: Props) {
  const results = useBloom((s) => s.results);
  const addShare = useBloom((s) => s.addShare);
  const { styles } = useCatalog();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("Which one feels most like me?");
  const [busy, setBusy] = useState(false);
  const [share, setShare] = useState<Share | null>(null);
  const [copied, setCopied] = useState(false);

  const looks = ids.map((id) => results[id]).filter(Boolean);
  const url = share ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${share.id}` : "";

  async function create() {
    setBusy(true);
    try {
      const s = await api.createShare({
        ownerName: name.trim() || undefined,
        message: message.trim() || undefined,
        items: looks.map((r) => {
          const info = describeLook(r, styles);
          return { resultId: r.id, image: r.image, title: info.title, subtitle: info.subtitle };
        }),
      });
      addShare({ id: s.id, createdAt: s.createdAt, expiresAt: s.expiresAt, resultIds: looks.map((r) => r.id) });
      setShare(s);
      onShared();
    } catch {
      toast("We couldn't create the link. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Copy didn't work here. Press and hold the link to copy it.");
    }
  }

  function close() {
    onClose();
    setTimeout(() => {
      setShare(null);
      setCopied(false);
    }, 300);
  }

  return (
    <Sheet open={open} onClose={close} title={share ? "Your link is ready" : "Ask someone you love"}>
      {!share ? (
        <div>
          <div className="flex gap-2">
            {looks.map((r) => (
              <div key={r.id} className="relative aspect-[4/5] w-20 shrink-0 arch bg-ivory-deep">
                <Image src={r.image} alt="" fill sizes="80px" className="object-cover" />
              </div>
            ))}
          </div>
          <label className="mt-6 block">
            <span className="text-small font-medium">Your first name</span>
            <span className="ml-2 text-micro text-mulberry-soft">so they know it&apos;s you</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Sara"
              className="mt-2 h-12 w-full rounded-2xl bg-paper px-4 text-body ring-1 ring-line outline-none placeholder:text-mulberry-faint focus:ring-2 focus:ring-rose-deep"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-small font-medium">A note</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={160}
              rows={2}
              className="mt-2 w-full resize-none rounded-2xl bg-paper px-4 py-3 text-body ring-1 ring-line outline-none focus:ring-2 focus:ring-rose-deep"
            />
          </label>
          <p className="mt-3 text-micro text-mulberry-soft">
            Anyone with the link can see these {looks.length === 1 ? "look" : `${looks.length} looks`} and leave a heart. It closes by itself after 7 days. Your
            passport stays private.
          </p>
          <Button size="lg" className="mt-5 w-full" onClick={create} disabled={busy || !looks.length}>
            {busy ? "Creating your link…" : "Create a private link"}
          </Button>
        </div>
      ) : (
        <div>
          <p className="text-body text-mulberry-soft">Send it however you usually talk: a message, WhatsApp, email.</p>
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-paper p-2 pl-4 ring-1 ring-line">
            <span className="min-w-0 flex-1 truncate text-small" title={url}>
              {url}
            </span>
            <Button size="sm" variant="soft" onClick={copy} icon={copied ? <Check size={16} /> : <Copy size={16} />}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {typeof navigator !== "undefined" && "share" in navigator && (
              <Button icon={<ShareNetwork size={18} />} onClick={() => navigator.share({ title: "Help me choose", text: message, url }).catch(() => {})}>
                Share
              </Button>
            )}
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full px-5 text-small font-medium ring-1 ring-line hover:ring-mulberry/40"
            >
              See what they&apos;ll see <ArrowSquareOut size={16} />
            </a>
          </div>
          <p className="mt-5 text-micro text-mulberry-soft">
            Closes on {new Date(share.expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "long" })}. Hearts will show up on your Looks page.
          </p>
        </div>
      )}
    </Sheet>
  );
}
