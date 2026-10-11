# Bloom — Tiered Implementation Plan

Spec: `docs/superpowers/specs/2026-10-11-bloom-design.md`. Execution: inline, tier by tier. Frontend tiers F0–F6 are built first against the mock API, then the user reviews; backend tiers B1–B5 follow.

Each tier ends with: typecheck + lint + unit tests green, a Playwright screenshot pass at 390×844 and 1440×900, and a commit (as `ahammadshawki8`, no AI trailer).

---

## F0 — Foundation
- [ ] Scaffold `frontend/` with Next.js 16 (App Router, TS, Tailwind v4, `src/`). Read `node_modules/next/dist/docs/` for: fonts, metadata/manifest, PWA, view transitions, images, route groups. Copy `AGENTS.md` note into `frontend/`.
- [ ] Design tokens in `globals.css` (`@theme`): colours, radii, shadows, type scale; Fraunces + Figtree via `next/font`.
- [ ] Primitives: `Button`, `IconButton`, `Chip`, `Sheet`, `Toast`, `HeartToggle`, `ArchMirror`. Icon set: Phosphor (light/regular).
- [ ] `lib/api/`: `BloomApi` interface, `mockApi`, `httpApi` stub, mode switch.
- [ ] Fixture assets: spike renders, demo passport, catalogue JSON (real Shopify wigs + wraps, images downloaded locally), try-on fixtures.
- [ ] `lib/store/`: IndexedDB wrapper + Zustand stores (passport, results, collection).
- [ ] Vitest + Playwright configured. PWA manifest + icons.

## F1 — Landing (atelier) + waking flow
- [ ] Hero with arched mirror cycling natural → wig → wrap renders; headline, CTAs.
- [ ] Why now (sourced truths + footnotes), How it works (3 steps), Choose together, Kept private, Footer.
- [ ] Portrait photography sourced (Unsplash), optimised, credited in `CREDITS.md`.
- [ ] `useBackendWake` + `WakingToast`; warm ping on mount; `?wake=slow` simulation.
- [ ] View Transition morph: hero mirror → studio mirror.

## F2 — Studio shell + Home
- [ ] `(studio)` layout: bottom nav (mobile), left rail (desktop), safe-area insets.
- [ ] Home: greeting, passport status, four category tiles, "pick up where you left off".
- [ ] Privacy page with delete-everything.

## F3 — Hair Passport
- [ ] `color/` module: Lab, ΔE2000, colour naming, ΔE phrasing (TDD).
- [ ] `vision/`: MediaPipe FaceDetector framing checks + hair segmenter colour sampling (self-hosted wasm/models).
- [ ] Capture flow: consent → front (camera with arch guide + live checks, or upload) → optional sides → optional top → reading → reveal.
- [ ] Passport card + print stylesheet; "use demo passport".

## F4 — Fitting room
- [ ] `match/` ranking (TDD) with human reasons.
- [ ] Mirror with compare slider / press-and-hold; bloom-wipe reveal on new result.
- [ ] Tabs Wigs / Wraps / Brows; filter chips; swatch rail with match ring; product sheet/side panel.
- [ ] Try-on action via `api.tryOn` (loading state in the mirror), save Keep/Maybe, retailer link.
- [ ] Brows: shape presets + intensity, shade from passport.

## F5 — Collect, decide, share
- [ ] Saved board (Keep/Maybe), compare two side by side.
- [ ] Ask family: create share → copy/share sheet (Web Share API).
- [ ] `/s/[id]` family page: looks, hearts, note, sent state.
- [ ] Decision sheet + Insurance pack printable page.

## F6 — Polish & quality
- [ ] Service worker (offline passport/saved), install prompt.
- [ ] Accessibility pass (focus, labels, contrast, reduced motion), claim linter test.
- [ ] Desktop layouts reviewed for every screen; empty/error states everywhere.
- [ ] Lighthouse (PWA, a11y ≥ 95, perf), Playwright journey test. → **Hand to user for review.**

---

## B1–B5 — Backend (after frontend review)
- B1 Fastify scaffold, `/health`, env, Drizzle + Render Postgres, deploy to Render.
- B2 YouCam client (port Poise auth/client), upload, task/poll, fixtures recorder.
- B3 Try-on + brows + passport (hair type/length/density, optional tones) routes; result cache; budget guard.
- B4 Catalogue ingest + sharp colour measurement; `/catalog` with ranking inputs.
- B5 Shares + votes; switch frontend to `live`; end-to-end on a real phone.
