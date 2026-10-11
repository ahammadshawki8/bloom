import type { FastifyInstance } from "fastify";
import type { Share } from "@bloom/shared";
import type { Db } from "../db/pool";
import { env } from "../env";
import { InputError, newId } from "../services/images";

interface CreateBody {
  ownerName?: string;
  message?: string;
  items?: { resultId: string; image: string; title: string; subtitle?: string }[];
}
interface VoteBody {
  votes?: { itemIndex: number; value: number }[];
  name?: string;
  note?: string;
}

const clip = (s: unknown, n: number) => (typeof s === "string" ? s.trim().slice(0, n) : undefined) || undefined;
// Share images must be Bloom's own: a pre-rendered fixture or a stored result.
const allowedImage = (img: string) => img.startsWith("/fixtures/") || img.startsWith(`${env.publicUrl}/results/`);

async function readShare(db: Db, id: string): Promise<Share | null> {
  const s = await db.query<{ id: string; owner_name: string | null; message: string | null; created_at: Date; expires_at: Date }>(
    `select id, owner_name, message, created_at, expires_at from shares where id = $1 and expires_at > now()`,
    [id],
  );
  if (!s.rows[0]) return null;
  const items = await db.query<{ result_id: string; image: string; title: string; subtitle: string }>(
    `select result_id, image, title, subtitle from share_items where share_id = $1 order by idx`,
    [id],
  );
  const votes = await db.query<{ item_index: number; value: number; name: string | null; note: string | null; created_at: Date }>(
    `select item_index, value, name, note, created_at from share_votes where share_id = $1 order by id`,
    [id],
  );
  const row = s.rows[0];
  return {
    id: row.id,
    ownerName: row.owner_name ?? undefined,
    message: row.message ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
    expiresAt: new Date(row.expires_at).toISOString(),
    items: items.rows.map((i) => ({ resultId: i.result_id, image: i.image, title: i.title, subtitle: i.subtitle })),
    votes: votes.rows.map((v) => ({
      itemIndex: v.item_index,
      value: v.value === -1 ? -1 : 1,
      name: v.name ?? undefined,
      note: v.note ?? undefined,
      at: new Date(v.created_at).toISOString(),
    })),
  };
}

export async function shareRoutes(app: FastifyInstance, db: Db) {
  app.post<{ Body: CreateBody }>("/shares", async (req, reply) => {
    const items = (req.body?.items ?? []).slice(0, 3);
    if (!items.length) throw new InputError("Pick at least one look to share.", "no_items");
    for (const it of items) if (!it.resultId || !it.title || !allowedImage(it.image)) throw new InputError("One of those looks can't be shared.", "bad_item");
    const id = newId();
    await db.query(`insert into shares (id, owner_name, message, expires_at) values ($1, $2, $3, now() + ($4 || ' days')::interval)`, [
      id,
      clip(req.body?.ownerName, 40) ?? null,
      clip(req.body?.message, 160) ?? null,
      String(env.shareTtlDays),
    ]);
    for (const [idx, it] of items.entries()) {
      await db.query(`insert into share_items (share_id, idx, result_id, image, title, subtitle) values ($1, $2, $3, $4, $5, $6)`, [
        id,
        idx,
        it.resultId.slice(0, 120),
        it.image,
        it.title.slice(0, 80),
        (it.subtitle ?? "").slice(0, 80),
      ]);
    }
    reply.code(201);
    return readShare(db, id);
  });

  app.get<{ Params: { id: string } }>("/shares/:id", async (req, reply) => {
    const share = await readShare(db, req.params.id);
    if (!share) return reply.code(404).send({ code: "not_found", message: "This link has closed." });
    return share;
  });

  app.post<{ Params: { id: string }; Body: VoteBody }>("/shares/:id/votes", async (req, reply) => {
    const share = await readShare(db, req.params.id);
    if (!share) return reply.code(404).send({ code: "not_found", message: "This link has closed." });
    const votes = (req.body?.votes ?? []).filter((v) => Number.isInteger(v.itemIndex) && v.itemIndex >= 0 && v.itemIndex < share.items.length && (v.value === 1 || v.value === -1));
    if (!votes.length) throw new InputError("Choose love it or not for me on at least one look.", "no_votes");
    const name = clip(req.body?.name, 40) ?? null;
    const note = clip(req.body?.note, 200) ?? null;
    // One statement per submission: the rows share a timestamp, so a submission counts as one reply.
    const params: unknown[] = [share.id, name];
    const rows = votes.map((v, i) => {
      params.push(v.itemIndex, v.value, i === 0 ? note : null);
      const n = params.length;
      return `($1, $${n - 2}, $${n - 1}, $2, $${n})`;
    });
    await db.query(`insert into share_votes (share_id, item_index, value, name, note) values ${rows.join(", ")}`, params);
    return readShare(db, share.id);
  });
}
