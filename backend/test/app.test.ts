import { afterAll, beforeAll, describe, expect, it } from "vitest";
process.env.LOG_LEVEL = "silent";
import path from "node:path";
import pg from "pg";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import type { FastifyInstance } from "fastify";
import { demoPassport, type GuideEvent, type Share } from "@bloom/shared";

// Integration tests against real Postgres semantics (PGlite) through the real `pg`
// driver, with no LLM keys so the guide uses its rule-based planner.
process.env.GROQ_API_KEY = "";
process.env.OPENROUTER_KEY = "";
process.env.CATALOG_PATH = path.resolve(import.meta.dirname, "../../frontend/public/fixtures/catalog.json");

let db: PGlite;
let server: PGLiteSocketServer;
let pool: pg.Pool;
let app: FastifyInstance;

beforeAll(async () => {
  db = await PGlite.create();
  server = new PGLiteSocketServer({ db, port: 5544, host: "127.0.0.1" });
  await server.start();
  pool = new pg.Pool({ connectionString: "postgresql://postgres@127.0.0.1:5544/postgres", max: 1 });
  const { migrate, seedCatalog } = await import("../src/db/migrate");
  const { buildApp } = await import("../src/app");
  await migrate(pool);
  await seedCatalog(pool, process.env.CATALOG_PATH!);
  app = await buildApp({ db: pool });
});

afterAll(async () => {
  await app?.close();
  await pool?.end();
  await server?.stop();
  await db?.close();
});

describe("health and catalogue", () => {
  it("reports healthy", async () => {
    const r = await app.inject({ method: "GET", url: "/health" });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ ok: true, agent: "rules" });
  });

  it("serves the seeded catalogue", async () => {
    const r = await app.inject({ method: "GET", url: "/catalog" });
    const styles = r.json().styles;
    expect(styles.length).toBeGreaterThan(10);
    expect(styles[0].variants[0].lab).toHaveLength(3);
  });
});

describe("try-on", () => {
  it("returns pre-rendered results for the sample passport (no units)", async () => {
    const r = await app.inject({ method: "POST", url: "/tryon", payload: { isDemo: true, styleId: "tracy-short-wig", variantId: "tracy-short-wig--copper-glaze" } });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toMatchObject({ kind: "wig", source: "demo", image: "/fixtures/tryon/tracy-short-wig--copper-glaze.webp", renderLength: "short hair" });
  });

  it("rejects unknown styles", async () => {
    const r = await app.inject({ method: "POST", url: "/tryon", payload: { isDemo: true, styleId: "x", variantId: "nope" } });
    expect(r.statusCode).toBe(400);
  });

  it("asks for a photo for a real passport", async () => {
    const r = await app.inject({ method: "POST", url: "/tryon", payload: { styleId: "tracy-short-wig", variantId: "tracy-short-wig--copper-glaze" } });
    expect(r.statusCode).toBe(400);
    expect(r.json().code).toBe("no_photo");
  });

  it("serves lashes and brows for the sample passport", async () => {
    const lash = await app.inject({ method: "POST", url: "/lashes", payload: { isDemo: true, presetId: "lash--wispy" } });
    expect(lash.json()).toMatchObject({ kind: "lash", image: "/fixtures/tryon/lash--wispy.webp" });
    const brow = await app.inject({ method: "POST", url: "/brows", payload: { isDemo: true, presetId: "brow--straight" } });
    expect(brow.json()).toMatchObject({ kind: "brow" });
  });
});

describe("passport", () => {
  it("returns the stored YouCam analysis for the sample face", async () => {
    const r = await app.inject({ method: "POST", url: "/passport/read", payload: { isDemo: true } });
    expect(r.json()).toMatchObject({ face: { shape: "Square" }, hairLengthTerm: "short hair or longer" });
  });
});

describe("family links", () => {
  let share: Share;
  it("creates a share", async () => {
    const r = await app.inject({
      method: "POST",
      url: "/shares",
      payload: {
        ownerName: "Sara",
        message: "Which one?",
        items: [
          { resultId: "a", image: "/fixtures/tryon/tracy-short-wig--copper-glaze.webp", title: "Tracy" },
          { resultId: "b", image: "/fixtures/tryon/bamboo-turban--navy.webp", title: "Turban" },
        ],
      },
    });
    expect(r.statusCode).toBe(201);
    share = r.json();
    expect(share.items).toHaveLength(2);
  });

  it("refuses images from elsewhere", async () => {
    const r = await app.inject({ method: "POST", url: "/shares", payload: { items: [{ resultId: "a", image: "https://evil.example/x.jpg", title: "x" }] } });
    expect(r.statusCode).toBe(400);
  });

  it("records up and down votes with a note", async () => {
    const r = await app.inject({
      method: "POST",
      url: `/shares/${share.id}/votes`,
      payload: { name: "Mum", note: "The first one!", votes: [{ itemIndex: 0, value: 1 }, { itemIndex: 1, value: -1 }] },
    });
    const s: Share = r.json();
    expect(s.votes).toHaveLength(2);
    expect(s.votes.find((v) => v.itemIndex === 1)?.value).toBe(-1);
    expect(s.votes[0].note).toBe("The first one!");
    expect(new Set(s.votes.map((v) => v.at)).size).toBe(1);
  });

  it("404s for unknown links", async () => {
    expect((await app.inject({ method: "GET", url: "/shares/nope" })).statusCode).toBe(404);
  });
});

describe("guide", () => {
  it("streams a plan and picks", async () => {
    const r = await app.inject({ method: "POST", url: "/agent", payload: { prompt: "short and easy for summer, close to my colour", passport: demoPassport() } });
    const events: GuideEvent[] = r.body
      .split("\n\n")
      .filter((l) => l.startsWith("data: "))
      .map((l) => JSON.parse(l.slice(6)));
    expect(events.some((e) => e.type === "tool" && e.name === "search_styles")).toBe(true);
    const picks = events.find((e) => e.type === "picks");
    expect(picks && picks.type === "picks" && picks.picks.length).toBeGreaterThan(0);
    expect(events.at(-1)).toMatchObject({ type: "done", planner: "rules" });
  });
});
