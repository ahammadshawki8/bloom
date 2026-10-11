import Fastify from "fastify";
import cors from "@fastify/cors";
import { env, youcamConfigured } from "./env";
import type { Db } from "./db/pool";
import { InputError } from "./services/images";
import { BudgetError, spent } from "./services/budget";
import { FRIENDLY, YouCamError } from "./youcam/client";
import { tryOnRoutes } from "./routes/tryon";
import { passportRoutes } from "./routes/passport";
import { shareRoutes } from "./routes/shares";
import { agentRoutes } from "./routes/agent";
import { loadCatalog } from "./services/catalog";
import { llmConfigured } from "./agent/llm";

export interface AppDeps {
  db: Db;
}

export async function buildApp({ db }: AppDeps) {
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? "info" }, bodyLimit: 28 * 1024 * 1024, trustProxy: true });

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || env.corsOrigins.includes(origin) || /\.vercel\.app$/.test(new URL(origin).hostname)) cb(null, true);
      else cb(new Error("Origin not allowed"), false);
    },
    methods: ["GET", "POST", "OPTIONS"],
  });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof InputError) return reply.code(400).send({ code: err.code, message: err.message, hint: err.message });
    if (err instanceof BudgetError) return reply.code(429).send({ code: err.code, message: err.message, hint: err.message });
    if (err instanceof YouCamError) {
      const hint = FRIENDLY[err.code] ?? (err.status >= 500 ? "The try-on service is busy. Please try again in a moment." : err.message);
      return reply.code(err.status).send({ code: err.code, message: err.message, hint });
    }
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    if (status >= 500) app.log.error(err);
    return reply.code(status).send({ code: "error", message: status >= 500 ? "Something went wrong on our side." : (err as Error).message });
  });

  app.get("/health", async () => {
    await db.query("select 1");
    const s = await spent(db);
    return { ok: true, youcam: youcamConfigured(), agent: llmConfigured() ? "llm" : "rules", budget: { spent: s.total, cap: env.budgetTotal } };
  });

  app.get("/catalog", async (_req, reply) => {
    reply.header("Cache-Control", "public, max-age=300");
    return { styles: await loadCatalog(db) };
  });

  app.get<{ Params: { id: string } }>("/results/:id", async (req, reply) => {
    const r = await db.query<{ mime: string; bytes: Buffer }>(`select mime, bytes from results where id = $1`, [req.params.id]);
    if (!r.rows[0]) return reply.code(404).send({ code: "not_found", message: "That image has expired." });
    reply.header("Content-Type", r.rows[0].mime).header("Cache-Control", "public, max-age=31536000, immutable");
    return reply.send(r.rows[0].bytes);
  });

  await tryOnRoutes(app, db);
  await passportRoutes(app, db);
  await shareRoutes(app, db);
  await agentRoutes(app, db);
  return app;
}
