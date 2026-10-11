# Bloom

**Choose your hair before treatment does.** Bloom is a gentle try-on studio for the weeks before chemotherapy. While her hair is still her own, Bloom records a *hair passport* (colour measured on the phone, plus face shape, length, curl and fullness from YouCam's analysis APIs), matches real wigs to it, lets her try wigs, head wraps, brows and lashes on her own face, and lets family vote on her favourites through a private link. A Bloom guide (an AI agent) can do the searching for her.

Built for the YouCam API Skin AI & eCommerce VTO Hackathon, during the submission period (from 2026-10-11).

## YouCam APIs used

| API | Where | What it does in Bloom |
|---|---|---|
| AI Hairstyle (hair transfer) | Fitting room | Wigs and head wraps rendered on her own photo |
| AI Hair Length Detection | Passport + every wig try-on | Her length; and the length of each wig *measured on the render* ("on you, it ends at your shoulders") |
| AI Face Attributes & Ratio Analyzer | Passport | Face shape → face-fit score; natural brow shape → closest brow preset |
| AI Hair Type Detection | Passport (optional side photos) | Curl pattern |
| AI Hair Density Detection | Passport (optional top photo) | Fullness baseline |
| AI Makeup VTO | Brows & lashes | Brows in her passport shade, lash styles |

On-device (no upload): MediaPipe face framing and hair segmentation → median CIELAB hair colour; CIEDE2000 colour distance on both product and rendered try-on.

## Repository

| Folder | What | Hosting |
|---|---|---|
| `frontend/` | Next.js 16 PWA (React 19, Tailwind v4, MediaPipe in the browser) | Vercel |
| `backend/` | Fastify API + Postgres: YouCam calls, result cache, unit budget, catalogue, family links, the Bloom guide agent | Render |
| `shared/` | Domain logic used by both: types, colour science, matching, fit scoring, guide tools | (library) |
| `docs/` | Design spec, implementation plan, feasibility spike | |
| `tools/` | Catalogue builder and fixture renderers | |

npm workspaces: run `npm install` once at the repo root.

## Run locally

```bash
npm install
cp backend/.env.example backend/.env        # add YouCam (and optionally Groq/OpenRouter) keys
cp frontend/.env.example frontend/.env.local

npm run db:dev -w backend        # terminal 1: real Postgres on :6544 (embedded binaries, no Docker)
npm run dev -w backend           # terminal 2: API on :8787 (migrates + seeds the catalogue)
npm run dev -w frontend          # terminal 3: http://localhost:3000
```

No keys? Set `NEXT_PUBLIC_API_MODE=mock` in `frontend/.env.local` and skip the backend: the whole journey runs on real YouCam renders pre-made on a sample face (`frontend/public/fixtures`).

The **sample face** ("Look around with a sample face") is served from those pre-rendered results in live mode too, so judges can explore without spending API units. A real passport uses the live APIs, capped by the unit circuit breaker (`BUDGET_TOTAL`, `BUDGET_SESSION`).

## Checks

```bash
npm test -w frontend      # unit tests: colour science, matching, fit, framing, claim linter
npm test -w backend       # API integration tests (Postgres semantics via PGlite)
npm run typecheck -w frontend && npm run typecheck -w backend

# Full stack, end to end (throwaway Postgres + backend + Playwright on phone and desktop)
npm run build -w frontend
cd backend && npx tsx --env-file=../.env scripts/e2e-live.ts e2e/journey.spec.ts
# Also exercise the real YouCam APIs with a real photo (spends ~16 units):
LIVE_YOUCAM=1 npx tsx --env-file=../.env scripts/e2e-live.ts e2e/live-youcam.spec.ts --project=desktop
```

## Deploy

**Backend + database (Render).** New → Blueprint → this repository (`render.yaml`). It creates `bloom-db` (Postgres) and `bloom-api` (web service, health check `/health`). Fill the secrets: `YOUCAM_API_KEY`, `YOUCAM_SECRET_KEY`, `GROQ_API_KEY` (and/or `OPENROUTER_KEY`), and `CORS_ORIGINS` = your Vercel URL. Tables are created and the catalogue seeded on boot. Note: Render's free Postgres expires after 30 days; upgrade it before judging ends.

**Frontend (Vercel).** Import the repository, set **Root Directory = `frontend`**, framework Next.js. Environment variables:
`NEXT_PUBLIC_API_MODE=live`, `NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com`, `NEXT_PUBLIC_SITE_URL=https://<your-vercel-domain>`.

Render's free tier sleeps after ~15 idle minutes. The landing page pings `/health` as soon as it opens, and if someone taps into the studio before the server is awake, a gentle "getting your studio ready" toast waits and continues automatically.

## Honesty

Bloom is cosmetic. It never diagnoses, treats or predicts anything about health, and a test (`frontend/src/lib/claims`) fails the build if user-facing copy makes a medical claim. Every number has a stated source (measured on the phone, measured by a YouCam API, or a stated styling rule); the guide's model reads facts from tools and never invents them. When an analysis can't be read from a photo, the passport says so instead of guessing. Photos stay on the device except when sent for a try-on or analysis, or deliberately shared; family links expire after 7 days.

## Credits

See [CREDITS.md](CREDITS.md). MIT licensed.
