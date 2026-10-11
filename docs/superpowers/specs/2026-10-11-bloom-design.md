# Bloom — Design Spec

**Date:** 2026-10-11 · **Status:** approved direction (user delegated remaining design calls) · **Source of truth for product context:** `planBloom.md` (§1–§7 still hold).

---

## 1. Shared understanding

**Outcome.** Win the YouCam API Skin AI & eCommerce VTO hackathon (grand prize), with Women in Tech and Rising Star as safety nets. Judges score Tech, Design, Impact, Idea equally; the user believes design polish and emotional impact are the biggest levers.

**Who it's for.** A woman a few weeks from starting chemotherapy (breast cancer is the anchor story), and the family helping her. Growth story: anyone facing hair loss.

**What it does.** While she still has her hair, Bloom captures a *Hair Passport* (colour, curl, length, density), matches real wigs to it, lets her try wigs, head wraps and brows on her own face, collect favourites, ask family to vote, and leave with an insurance-ready summary.

**Said by the user (2026-10-11):**
- Two folders: `frontend/` (Vercel) and `backend/` (Render, with Render Postgres; user will upgrade the DB before the free tier's 30-day expiry).
- PWA, mobile-first, and a first-class desktop layout.
- Landing = intimate modern beauty atelier: warm ivory, muted sage, muted rose, elegant serif headlines, authentic portrait photography.
- App = interactive beauty playground (create, customise, explore, compare, collect, experiment). Qualities: playful, highly interactive, visually delightful, functional, reassuring. Tone: **"gentle play"** (option A).
- The two visual worlds must transition into each other seamlessly.
- Professional, paid-studio quality. No generic AI look.
- Cold-start: a gentle toast on the landing page while the Render backend wakes; poll until healthy, then continue to the requested page.

**Assumed (not yet contradicted):** no accounts; photos stay on device except when sent for a try-on or deliberately shared; share links expire after 7 days.

**Success criteria.** A judge on a phone can, within 2 minutes and with no instructions: build a passport (or use the demo passport), see matched wigs, try one on, save it, and open a share link. Every screen works at 360px wide and on a 1440px desktop. Lighthouse PWA installable; accessibility ≥ 95.

---

## 2. Architecture

```
bloom/
├── frontend/   Next.js 16 · React 19 · TypeScript · Tailwind v4 · PWA  → Vercel
├── backend/    Fastify · TypeScript · Drizzle · Postgres                → Render
├── shared/     API contract types (copied into both at build; no workspace coupling)
└── docs/       specs, plans, spike
```

- **Frontend talks to the backend only through `frontend/src/lib/api/`**, a typed client implementing a `BloomApi` interface. Two implementations: `mockApi` (fixtures in `public/fixtures`, simulated latency, deterministic) and `httpApi` (real backend). Selected by `NEXT_PUBLIC_API_MODE=mock|live`. The whole frontend is built and reviewed against `mockApi` first.
- **On-device state:** IndexedDB (`idb-keyval`-style thin wrapper) for passport, photos, try-on results, collection. Zustand for UI state hydrated from IndexedDB.
- **Backend responsibilities:** YouCam auth/upload/task/poll; try-on result cache keyed by `sha256(source)+refId+params`; global unit budget + per-session cap with fixture fallback; wig catalogue ingest (Shopify `products.json`) with server-measured hair colour; share links + votes; `/health`.
- **DB tables:** `wigs`, `result_cache`, `budget_ledger`, `shares`, `share_items`, `votes`.

### Cold-start ("waking") flow
1. Landing page mounts → fire-and-forget `GET /health` (warms Render while she reads).
2. On any CTA into the app: if the last health check succeeded within 60s, navigate. Otherwise show the **waking toast** ("Bloom is getting ready. This can take a minute the first time.") with a soft progress bloom, poll `/health` every 4s (max ~3 min), then navigate to the requested route automatically. A "Explore the demo instead" link uses fixtures immediately.
3. In mock mode the check resolves instantly (toast testable via `?wake=slow`).

---

## 3. Visual system

### 3.1 The bridge concept: the vanity mirror
One object exists in both worlds: an **arched vanity mirror** (a tall rectangle with a semicircular top; also reads as a petal). On the landing page it frames portraits and the hero transformation. In the app it is the fitting-room viewport where her try-ons appear. Pressing "Open your studio" morphs the hero mirror into the studio mirror with a View Transition (`view-transition-name: mirror`), so the user physically sees herself walk from the atelier into the playground. This is the single "spend your boldness here" moment.

Secondary bridges: the same typeface (with different axis settings), the same ivory ground, and the landing's muted sage/rose becoming the app's tinted surfaces.

### 3.2 Colour tokens
| Token | Hex | Role |
|---|---|---|
| `ivory` | `#FBF6F2` | page ground (slightly rose-leaning, not the generic cream) |
| `ivory-deep` | `#F3EAE3` | sunken areas, image wells |
| `mulberry` | `#43293A` | ink: text, primary buttons (replaces black) |
| `mulberry-soft` | `#7A6170` | secondary text |
| `rose` | `#C98E8E` | brand accent, active states, hearts |
| `rose-wash` | `#F4DEDC` | rose surface |
| `sage` | `#8FA08A` | calm/confirm states, "matches you" |
| `sage-wash` | `#E3EADF` | sage surface |
| `lilac-wash` | `#E7E1F0` | playground surface (wigs) |
| `butter-wash` | `#F7EBCB` | playground surface (brows & beauty) |

Landing uses ivory/mulberry/rose/sage only. The app adds the four washes as category colours (wigs = lilac, wraps = sage, passport = rose, brows = butter), exactly as in the user's mockup. Contrast: all text on washes uses `mulberry` (≥ 7:1).

### 3.3 Type
- **Fraunces** (variable: `opsz`, `wght`, `SOFT`, `WONK`). Landing headlines: `opsz 144, wght 340, SOFT 30`, refined and editorial. App headings: `opsz 48–72, wght 480, SOFT 100`, rounder and friendlier. Same family, two moods: the typographic bridge.
- **Figtree** for UI and body (friendly geometric sans; good at small sizes on phones).
- Scale (1.25 minor third on mobile, 1.333 on desktop): 13 / 15 / 17 (body) / 21 / 26 / 33 / 41 / 52 / 72px. Body line-height 1.55; serif display 1.05–1.15. Measure ≤ 66ch.
- No all-caps eyebrows, no single-italic-word headline accents, no `→` glued onto buttons.

### 3.4 Shape, depth, motion
- Radius has hierarchy: mirror = arch; image cards 28px; controls 999px pills; chips 12px. Not one radius everywhere.
- Depth from tone (wash surfaces), not grey shadows; a single soft warm shadow (`0 18px 40px -24px rgb(67 41 58 / .35)`) reserved for floating elements (sheets, the active swatch).
- Motion (Motion for React): spring-based and user-triggered — swatch pick, mirror reveal (a soft radial "bloom" wipe as a try-on lands), heart pop on save, sheet drags. One orchestrated page-load moment per world: the hero transformation on landing; the greeting on studio home. Everything respects `prefers-reduced-motion`.
- Micro-celebrations are words + small motion, never confetti: "This one feels like you."

### 3.5 Photography
- Landing: authentic, warm, natural-light portraits of diverse women, including women wearing head wraps and short/regrowing hair (Unsplash licence, credited in `CREDITS.md`). No stocky studio-smile shots.
- App: her own photos; catalogue product images (link back to retailer); demo passport uses Perfect Corp's sample face from the spike.

---

## 4. Information architecture

### Landing (`/`)
1. **Hero:** headline "Choose your hair before treatment does." Subline about trying wigs, wraps and brows on your own face. The arched mirror cycles her natural hair → matched wig → head wrap (real spike renders), with a small caption naming each. CTAs: "Open your studio" (primary), "See how it works".
2. **Why now:** editorial split. Three sourced truths: hair loss usually starts 2–4 weeks after the first infusion; many wigs can't be returned once opened; the best match is made while your own hair is still there. Citations as footnotes.
3. **How it works:** a real sequence (so numbered): Make your hair passport → Try looks on your own face → Choose together.
4. **Choose together:** the family vote, shown as a phone with hearts on three looks.
5. **Kept private:** what stays on the phone, what never happens (no diagnosis, no selling data), delete anytime.
6. **Footer:** cosmetic-not-medical note, credits, built-with-YouCam-API note.

### Studio app (`/studio/*`) — bottom nav on mobile, left rail on desktop: Home · Passport · Studio · Saved
- **Home** `/studio`: greeting ("A little space, just for you."), passport status card, four category tiles (Try a new look / Head wraps / My hair passport / Brows & beauty), "Pick up where you left off" strip.
- **Passport** `/studio/passport`: if none → guided capture flow; if exists → Passport card (photo in arch, colour swatch with name + hex, curl type, length, density level, measured-on date), actions: retake, print / save PDF, use demo passport.
  - Capture flow `/studio/passport/new`: consent → front photo (live camera with arch guide + MediaPipe checks: one face, head & shoulders in frame, face straight, light OK; or upload from camera roll) → optional side photos (for curl) → optional top-down photo (density) → "Reading your hair…" → reveal.
- **Studio** `/studio/try`: the fitting room. Arched mirror (her photo / current try-on, press-and-hold or drag-slider to compare with her own hair); tabs Wigs / Wraps / Brows; filter chips (Match my hair · Something new · Length · Texture); horizontal swatch rail of products with a match ring; product sheet (name, price, length, cap, returnable flag, "On you, this reads very close to your natural colour (ΔE 2.1)"); actions: Save (Keep / Maybe), Compare, View at retailer.
- **Saved** `/studio/saved`: collection board split Keep / Maybe; compare two side by side; "Ask family to help choose" → creates share link; "I've decided" → decision sheet with retailer link + insurance pack.
- **Insurance pack** `/studio/pack`: printable summary ("cranial hair prosthesis" wording, doctor-letter template, invoice checklist, chosen item).
- **Privacy** `/studio/privacy`: what's stored, delete everything.
- **Share** `/s/[id]` (no app chrome, works for family on any phone): her chosen looks, tap a heart, optional note, send.

---

## 5. Components (frontend)
`ArchMirror`, `CompareSlider`, `SwatchRail`, `MatchRing`, `ProductSheet` (bottom sheet mobile / side panel desktop), `CategoryTile`, `PassportCard`, `ColourSwatch`, `CaptureGuide` (camera + overlay + checks), `StepFlow`, `WakingToast`, `Toast`, `Chip`, `Button`, `IconButton`, `HeartToggle`, `Sheet`, `EmptyState`, `AppNav` (bottom bar / rail), `Footnote`.

Each component: one file, typed props, no data fetching inside presentational components.

## 6. Domain logic (frontend, unit-tested)
- `color/`: sRGB↔CIELAB, ΔE2000, hex naming ("soft chestnut"), human phrasing of ΔE bands.
- `vision/`: MediaPipe FaceDetector framing checks (reuse Poise `faceDetect.ts`), ImageSegmenter hair mask → median Lab of hair pixels.
- `match/`: ranking (colour ΔE weight, texture, length, mode toggle) returning reasons.
- `claims/`: forbidden-medical-words linter run in tests over all copy.

## 7. Error and empty states
- Capture failures map from YouCam/MediaPipe errors to plain fixes ("We need to see your shoulders. Step back a little.").
- Try-on failure: keep previous image, gentle toast with retry; budget exhausted → labelled demo result.
- Empty Saved: "Nothing saved yet. Tap the heart on any look you like."
- Offline (PWA): passport and saved looks remain viewable.

## 8. Testing
Vitest + Testing Library for logic and components; Playwright smoke for the main journey at 390×844 and 1440×900; screenshot review during build; claim linter in CI.

## 9. Out of scope (now)
Accounts, payments, medical advice, regrowth prediction, nail/earring VTO, skin analysis, LLM guide (all stretch, after backend).
