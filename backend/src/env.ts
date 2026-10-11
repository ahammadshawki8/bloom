import path from "node:path";

const num = (v: string | undefined, d: number) => (v && !Number.isNaN(Number(v)) ? Number(v) : d);

export const env = {
  port: num(process.env.PORT, 8787),
  host: process.env.HOST ?? "0.0.0.0",
  /** Render Postgres in production; the PGlite dev server (npm run db:dev) locally. */
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:6544/postgres",
  poolMax: num(process.env.PG_POOL_MAX, process.env.DATABASE_URL ? 10 : 1),
  publicUrl: (process.env.PUBLIC_URL ?? process.env.RENDER_EXTERNAL_URL ?? "http://localhost:8787").replace(/\/$/, ""),
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:3100,http://localhost:3300").split(",").map((s) => s.trim()),
  youcamKey: process.env.YOUCAM_API_KEY ?? "",
  youcamSecret: process.env.YOUCAM_SECRET_KEY ?? "",
  groqKey: process.env.GROQ_API_KEY ?? "",
  openrouterKey: process.env.OPENROUTER_KEY ?? process.env.OPENROUTER_API_KEY ?? "",
  agentModel: process.env.AGENT_MODEL ?? "openai/gpt-oss-120b",
  agentFallbackModel: process.env.AGENT_FALLBACK_MODEL ?? "meta-llama/llama-3.3-70b-instruct",
  /** Unit circuit breaker: total units this deployment may spend, and per browser session. */
  budgetTotal: num(process.env.BUDGET_TOTAL, 600),
  budgetSession: num(process.env.BUDGET_SESSION, 60),
  shareTtlDays: num(process.env.SHARE_TTL_DAYS, 7),
  catalogPath: process.env.CATALOG_PATH ?? path.resolve(process.cwd(), "../frontend/public/fixtures/catalog.json"),
};

export const youcamConfigured = () => Boolean(env.youcamKey && env.youcamSecret);
