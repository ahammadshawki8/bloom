# Bloom

**Choose your hair before treatment does.** Bloom is a gentle try-on studio for the weeks before chemotherapy. While her hair is still her own, Bloom records a *hair passport* (colour measured on the phone, plus length, curl and fullness), matches real wigs to it, lets her try wigs, head wraps and brows on her own face with the YouCam API, and lets her choose together with family through a private link.

Built for the YouCam API Skin AI & eCommerce VTO Hackathon. Built during the submission period (from 2026-10-11).

## Repository

| Folder | What | Hosting |
|---|---|---|
| `frontend/` | Next.js 16 PWA (React 19, Tailwind v4, MediaPipe in the browser) | Vercel |
| `backend/` | API for YouCam calls, result cache, unit budget, catalogue, family links (Postgres) | Render |
| `docs/` | Design spec, implementation plan, feasibility spike | |
| `tools/` | Catalogue builder and try-on fixture renderer | |

## Run the frontend

```bash
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_MODE=mock runs without a backend
npm install
npm run dev                  # http://localhost:3000
```

Preview (`mock`) mode uses real YouCam renders pre-made on a sample face (`public/fixtures/tryon`), so the whole journey works with no backend and no API units.

## Checks

```bash
npm run typecheck && npm run lint && npm test   # unit tests incl. colour science and the claim linter
npm run build && npm run e2e                    # Playwright journey on phone + desktop
```

## Honesty

Bloom is cosmetic. It never diagnoses, treats or predicts anything about health, and a test (`src/lib/claims`) fails the build if user-facing copy makes a medical claim. Try-ons are previews, not a guarantee of fit or exact colour. Photos stay on the device except when sent to render a try-on or deliberately shared.

## Credits

See [CREDITS.md](CREDITS.md). Licensed under MIT.
