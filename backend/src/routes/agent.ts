import type { FastifyInstance } from "fastify";
import { cleanSaved, type GuideEvent, type Passport } from "@bloom/shared";
import type { Db } from "../db/pool";
import { sessionOf } from "../services/session";
import { loadCatalog } from "../services/catalog";
import { InputError } from "../services/images";
import { runGuide } from "../agent/run";

interface Body {
  prompt?: string;
  passport?: Passport;
  /** Her saved looks (ids, layers and family vote counts only). */
  saved?: unknown;
}

export async function agentRoutes(app: FastifyInstance, db: Db) {
  // Streams the guide's steps as Server-Sent Events. The passport arrives without
  // the photo: the agent only needs measured facts (colour, face shape, length).
  app.post<{ Body: Body }>("/agent", async (req, reply) => {
    const passport = req.body?.passport;
    if (!passport?.hair?.lab || passport.hair.lab.length !== 3) throw new InputError("Make your hair passport first.", "no_passport");
    const prompt = String(req.body?.prompt ?? "").slice(0, 500);
    const styles = await loadCatalog(db);

    reply.hijack();
    const origin = req.headers.origin;
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      ...(origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
    });
    const send = (e: GuideEvent) => reply.raw.write(`data: ${JSON.stringify(e)}\n\n`);

    let planner = "rules";
    let picks: unknown = null;
    try {
      for await (const e of runGuide(prompt, { ...passport, photo: "" }, styles, cleanSaved(req.body?.saved))) {
        if (e.type === "picks") picks = e.picks;
        if (e.type === "done") planner = e.planner;
        send(e);
      }
    } catch (err) {
      req.log.error(err);
      send({ type: "error", text: "The guide couldn't finish. Please try again." });
    }
    reply.raw.end();
    await db
      .query(`insert into agent_runs (session, prompt, planner, picks) values ($1, $2, $3, $4)`, [sessionOf(req), prompt, planner, JSON.stringify(picks)])
      .catch(() => {});
  });
}
