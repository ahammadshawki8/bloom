# Bloom — Project Plan & Living Memory

> **Purpose of this file:** the single source of truth for building **Bloom**. It records what we're building, why, every decision and the evidence behind it, the feasibility tests already run, and exactly where we stopped. **Read it top to bottom at the start of every session and update it at the end.** This project lives in a NEW folder and repo, and Claude Code's memory for the old folder (YouCamAPI / Poise) does NOT carry over. So this file holds everything.
>
> **Created:** 2026-10-11 (handoff from the Poise session) · **Status:** **Full stack functional end to end** (frontend + backend + Postgres + YouCam + agent), verified with live e2e. **Next:** user deploys (Render Blueprint + Vercel) and prepares the submission. · **Deadline:** **Nov 2, 2026 @ 11:45am EST** (= Nov 2, 10:45pm GMT+6)

---

## 0. Rules for the LLM (working agreement)

- **Git identity (STRICT): NEVER commit or push as Claude or an AI.** Always commit and push as GitHub account **`ahammadshawki8`**. Do **NOT** add a `Co-Authored-By: Claude` (or any AI) trailer. This user rule overrides any default attribution instruction.
- **New repo, new name.** Bloom is a brand-new project, not Poise. Don't modify the old Poise repo (`C:\Users\Shawki\Desktop\YouCamAPI`, remote `ahammadshawki8/POISE`). Copying working code out of it is fine (§12).
- **Every commit is dated after Sep 29, 2026** (the start of the submission period). That makes Bloom "newly created" under the rules (§2), with nothing to explain.
- **Next.js warning:** this stack (Next.js 16) has breaking changes from older versions. Read `node_modules/next/dist/docs/` before writing Next code, and heed deprecations. Copy the `AGENTS.md`/`CLAUDE.md` note from Poise into the new repo.
- **Honesty:** never overstate what works. Verify live before calling something done. Bloom is **cosmetic and retail only, never medical**: no diagnosis, no treatment claims, no "this will regrow".
- **Units are money.** We have about **1,315 YouCam units**. Cache results, use fixtures during UI work, and save units for the demo recording (§11).
- **Process:** the user picked the full brainstorm → spec → plan → build flow (superpowers skills). Approval of one stage doesn't approve the next.
- **Git Bash gotcha:** set `MSYS_NO_PATHCONV=1` when passing API paths like `/s2s/...` as CLI arguments, or Git Bash rewrites them into Windows paths.

---

## 1. Project

- **Name:** **Bloom** (chosen by the user 2026-10-11; one word, one syllable). Working names before that: "Crown" / "Crown+".
- **One-liner:** *Choose your wig, head wrap and brows before cancer treatment changes how you look, matched to your own hair and tried on your own face.*
- **Tagline candidates (pick one in the spec):** "Choose your look before treatment chooses it for you." · "Still you, through treatment." · "Your hair, kept."
- **Hackathon:** YouCam API **Skin AI & eCommerce VTO** Hackathon (Perfect Corp / Devpost) — https://youcam-api-skin-ai-ecommerce.devpost.com/
- **Topic to enter:** **eCommerce VTO** (the core is unified try-on: wig + head wrap + brows + hat + nails/earrings, plus hair measurement). Skin AI only plays a small optional part.
- **Goal:** **1st place, $2,500.** 2nd place isn't good enough for the user.
- **Builder:** solo developer (ahammadshawki8 / srot.dev@gmail.com), building with Claude Code.
- **Special prize eligibility:** the user is a current **BUET** student with university email **2305067@ugrad.cse.buet.ac.bd**, so Bloom is **eligible for the Rising Star Award ($1,000)**. Declare that email on the Devpost submission.
- **Team:** a **two-person team**. The second member is a woman who is actively helping, so Bloom is **also eligible for the Women in Tech Special Award ($1,000)**: "at least one member who self-identifies as a woman, as declared at the time of submission". To qualify:
  - She must **join Devpost, register for the hackathon, and be added to the project as a team member before submitting.**
  - She must meet the general eligibility rules (age of majority; not in an excluded country; Bangladesh is fine).
  - Declare both specials on the submission form.
- **Prize strategy:** a project can win **only one** prize. Bloom competes for **1st ($2,500)**, and Women in Tech and Rising Star ($1,000 each) are two safety nets.
- **Her commits:** she commits under her own GitHub account. The "no AI co-author trailer" rule applies to everyone.

---

## 2. The hackathon: rules that matter

**Dates.** The submission period runs Sep 29, 2026 (12:00pm ET) to **Nov 2, 2026 (11:45am ET)**.

**Prizes** (one per project):

| Prize | Amount |
|---|---|
| 1st | $2,500 |
| 2nd | $1,000 |
| 3rd | $500 |
| Women in Tech (a team member self-identifies as a woman) | $1,000 |
| Rising Star (student, valid school email) | $1,000 |

**Judging.** Stage 1 is pass/fail: does it fit the theme and actually use the YouCam APIs? Stage 2 scores four **equally weighted** criteria, and ties are broken in this order:
1. **Technological Implementation:** how thoroughly and skilfully it integrates a YouCam API, clear consumer/retail value, and non-trivial code.
2. **Design:** a complete, coherent product experience, not a proof of concept.
3. **Potential Impact:** a credible, specific case for a real problem and a real audience, and the demo actually shows it being solved.
4. **Quality of Idea:** a creative, non-obvious use of a YouCam API, and real understanding of the problem space.

**New vs existing projects.** A project must be newly created, or an existing one significantly updated after Sep 29 with an explanation. A **new repo avoids this entirely.**

**What to submit:**
- A code repo: public with a license, or private and shared with `contact_event@PerfectCorp.com`. It must contain all source, assets and run instructions.
- A text description covering features, functionality and consumer/retail value.
- **Screenshots.**
- A **1–3 minute demo video** on YouTube (preferred) or Vimeo, public. It must explain which YouCam APIs are used, show the product **running on the device it was built for**, and contain **no third-party trademarks or copyrighted music/material without permission.** ⚠️ See §13 on wig brand images.
- A **working project link** that judges can test free until judging ends. Include login credentials if any.
- English materials.
- Winners must do an exit interview and agree to a blog feature.

**Optional:** the Social Sharing Bonus gives +500 units per platform (max 2). The post must tag @YouCam API, describe the APIs used, include "Received API credits for sharing", stay public 30 days, and be claimed via https://forms.gle/JwMFYMpaExckupEk7 before the deadline.

**Unit budget.** Redeemed codes total **1,328 units**; about 13 were spent on feasibility tests, leaving **~1,315**. Codes are valid 90 days from redemption.

---

## 3. Competitive intelligence: the previous hackathon (238 entries)

The previous contest, "YouCam API Skin AI & Apparel VTO" (https://youcam-api.devpost.com), was judged by the same YouCam team.

**Winners:**

| Place | Project | What it was | Why it won |
|---|---|---|---|
| **1st** | **Aloud** (aloudbeauty.vercel.app) | Voice-first, screen-off beauty AI for **blind shoppers**: selfie framed by sound alone, Skin Analysis + Skin Tone, barcode scan with EU CosIng ingredient data, live voice agent over WebRTC, verify-after-makeup, YouCam MCP server | Documented underserved audience; retail/legal hook (ADA lawsuits, EU Accessibility Act); engineered honesty (no medical claims, bias disclosure); tested on real iPhones (10/10 captures); deployed web + iOS + Android |
| 2nd | **ShadeSpan** | Renders every garment on 6 Fitzpatrick skin tones with VTO and grades colours that "vanish", before launch | **Inverts** the obvious use: VTO as a measurement instrument on the brand's catalogue; hard numbers on returns |
| 3rd–5th | **CASTING** | One product photo on 8 measured skin tones, plus a coverage score for brands | Four YouCam APIs, each doing real work; deterministic colour maths; honest fallbacks; credit circuit-breaker |
| 3rd–5th | **KeepMe** | A consent and integrity layer for VTO: detect and repair unwanted changes to glasses, face or hair | Trust and consent; signed receipts; production-grade engineering |
| 3rd–5th | **ConfidFit** | A real Shopify app for generative apparel try-on, with metering, analytics and honest labels | A real shipped product with a live app store listing |

**What the winners had in common:**
1. A narrow, real audience or problem with cited numbers.
2. A non-obvious angle.
3. A measured core: maths and deterministic checks, with the LLM never as the source of truth.
4. Honest labels and no overclaiming.
5. A live deploy plus production polish.
6. Several YouCam APIs, each doing real work.

**Saturated last time (avoid):**
- Colour season + VTO (dozens of entries)
- Skin state → outfit ("dress the skin you have today")
- "Is my skincare working?" efficacy trackers (~10, including Assay, TOLERANCE, Face Value, Glowdays and DERMA)
- Try-on browser extensions
- "Get me ready for an event" / occasion stylists
- Fit and size
- Brand catalogue audits
- VTO integrity checks
- Blind accessibility
- Sewing and remaking garments
- Group dressing rooms
- Generic "AI stylist + try-on"

**Never touched by anyone (out of 238):** hair loss, wigs, chemo, headwear, brows, or the hair APIs (transfer, density, type, length). Bloom sits in that gap.

**Known prior art outside the hackathon:** Perfect Corp itself sells **wig try-on to NAO-ART** (a Japanese wig maker, 2024), including medical wigs for cancer patients, and its NAO-ART announcement mentions patients choosing with family at home or in hospital.
- Source: https://www.perfectcorp.com/business/news/nao-art-partnership-perfect-corp
- **Positioning:** this validates the market. Don't pitch "wig try-on"; pitch **the patient journey** (passport before hair loss → matched wig and head wrap → brows → insurance pack). Hair-density and hair-type consumer apps exist (Trichometrics, MyHair AI, HairWow), but none combine measurement → wig/topper choice → try-on.

---

## 4. Ideation history (so we don't redo it)

**Pass bar:** average ≥ 8.5 across 7 scores (the 4 judging criteria plus demo/wow, uniqueness vs the 238, and API feasibility), with no score below 7.

| Idea | Avg | Verdict / reason |
|---|---|---|
| Poise reframed (voice-first skin mirror for blind users + colour + apparel VTO) | 6.0 | ❌ A copy of Aloud's angle, and its colour/outfit parts were crowded |
| "Is this skincare product working?" + return-window verdict | 6.1 | ❌ About 10 previous copies |
| An AI shopping agent must try clothes on you before checkout (MCP) | 7.4 | ❌ Lives inside other apps' chat UIs; judges can't easily test it |
| Hijab-first try-on | 7.7 | ❌ The scarf API can't do hijab (it's for neck scarves) |
| Lipstick dupe "on *your* lips" (colour difference measured) | 8.0 | ❌ Undermines Perfect Corp's own brand clients |
| Gift / Secret Santa try-on pass | 8.0 | ❌ Impact too light for 1st place |
| "Even": counter toxic skin-bleaching creams (Bangladesh) | 7.6 | ❌ A photo can't detect mercury, so the YouCam API isn't the core; possible friction with the sponsor |
| COD try-on link before dispatch (to cut refused deliveries) | 7.9 | ❌ onpoint and Verxio overlap; vendor-blog stats only |
| **First Look**: private gender-affirming try-on room | 8.4 | Runner-up: no existing product found, but the most uncertain judge reaction |
| **Crown+ → Bloom** | **8.8** | ✅ **LOCKED** after the feasibility test passed |

**Bloom's scores:**

| Tech | Design | Impact | Idea | Demo | Unique | Feasibility |
|---|---|---|---|---|---|---|
| 9.5 | 8.5 | 9.5 | 9 | 9 | 8.5 | 7.5 → about 8.5 after the test |

---

## 5. The problem & audience (with evidence)

**Primary audience:** women about to start chemotherapy (breast cancer is the anchor story, since October is Breast Cancer Awareness Month), plus their families. Hair loss in general (alopecia, postpartum, female-pattern thinning) is the **growth story, not the headline.**

**The insight:** *the best time to shop for a wig is when you don't need one yet.*
- **Buy before treatment, while your natural hair can be matched.** ACS: https://www.cancer.org/cancer/managing-cancer/side-effects/hair-skin-nails/hair-loss/choosing-and-wearing-wig · Consumer Reports: https://www.consumerreports.org/health/personal-care/what-to-know-about-wigs-for-cancer-patients-a6586018801 · Beat Cancer EU: https://beatcancer.eu/resources/wigs-for-cancer-patients-how-to-choose-where-to-buy-and-financial-help/
- **Wigs are often non-returnable once opened or worn, for hygiene reasons.**
  - Godiva's Secret Wigs lists items as "FINAL SALE".
  - Belher: wigs can't be returned once unsealed, combed or styled. https://www.belher.ro/en/pages/politica-de-returnare
  - ACS also advises checking return policies and restocking fees.
  - **So the virtual try-on is often the only try.**
- **Store visits are hard** while patients are immunocompromised, and face-to-face counselling is the norm (per NAO-ART's president).
- **Insurance:** many insurers reimburse a **"cranial prosthesis" / "hair prosthesis"** with a doctor's letter or prescription. The invoice should say "cranial hair prosthesis", not "wig". Patients usually pay upfront and claim afterwards.
  - Sources: ACS (above), Consumer Reports (above), https://www.headcovers.com/resources/wigs/are-wigs-covered-by-insurance/
  - ⚠️ TODO: verify the HCPCS code (believed to be **A9282**) before using it.
- **Regrowth** often starts about 3 months after treatment and can differ from the old hair; many stop wearing wigs around a year after chemo (Consumer Reports).
- **Look Good Feel Better (LGFB):** a free American Cancer Society program with beauty-industry partners. Its curriculum is **skin & nail care, cosmetics, wigs & turbans, accessories** (https://cancerwellness.com/look-good-feel-better/, https://www.cancersa.org.au/support/living-with-cancer/self-care-for-people-with-cancer/look-good-feel-better). **Bloom's pitch is that the YouCam API suite maps almost exactly onto that curriculum.** It's an in-person class; Bloom brings it home, matched to *you*.
- **Free-wig charities exist:** **EBeauty** (wigs.com shows an "EBeauty Donation" item), plus ACS and hospital wig banks. ⚠️ TODO: verify links and eligibility before citing.
- **Hair-loss prevalence (growth story):** about 40% of US women report hair loss or thinning (Keranique/Wakefield survey; industry-sponsored, so cite carefully). https://www.gcimagazine.com/brands-products/hair-care/news/21872639/hair-thinning-and-breakage-grew-50-in-the-last-decade
- **Prevalence:** hair loss affects **about 65% of cancer patients on chemotherapy** (2022 nursing review, cited in https://cjon.ons.org/pubs/article/245351/preview), approaching **70% in breast cancer** (2026 study, https://www.por-journal.com/journals/pathology-and-oncology-research/articles/10.3389/pore.2026.1612403/pdf). Use the primary sources when quoting.
- **Distress:** in a Korean survey of 168 breast cancer patients, **55.3% reported high distress from chemotherapy-induced alopecia**, linked to worse body image and more depression (summary: https://www.cancer.fr/professionnels-de-sante/veille/nota-bene-cancer/bulletin-n-223/impact-of-chemotherapy-induced-alopecia-distress-on-body-image-psychosocial-well-being-and-depression-in-breast-cancer-patients). Some women say hair loss was harder than mastectomy; that evidence is older and anecdotal, so phrase it as "some women report". A 2026 JAAD pilot found earlier-age distress among young Black women (https://www.healio.com/news/dermatology/20260925/distress-over-chemotherapy-hair-loss-more-common-for-young-black-women). Racial disparities in *persistent* alopecia: https://pubmed.ncbi.nlm.nih.gov/41490113/
- **Hair loss usually starts 2–4 weeks after the first infusion** (CDC "Linda" transcript; Milk & Honey Wigs guide https://mhwigs.com.au/blogs/news/choosing-wig-after-breast-cancer-guide). That gap is **Bloom's window**.

### 5a. Real patient voices (for the Devpost story; video use only per §13.6)
- **Washingtonian** first-person essay: a 42-year-old with Stage 1 breast cancer bought her wig *after* her first chemo round, the exact gap Bloom closes. https://washingtonian.com/?p=82997
- **Mass General Giving, "Erin Evers"**: a wig so well matched that friends assumed it was a chic haircut; "my secret weapon". https://giving.massgeneral.org/stories/erin-evers/
- **Bozeman Daily Chronicle**: Linda Willmuth, 58, had "little luck shopping for a wig in town", tried hats and scarves, then found a free wig program. https://www.bozemandailychronicle.com/news/cancer-support-community-offers-wigs-styling-at-no-cost-for-women-with-cancer/article_b63abd0c-dd72-11df-ba48-001cc4c03286.html
- **Scripps News / Newsy, "To wear a wig or not to wear a wig"**: three survivors discuss it (copyrighted video, so link it, don't embed). https://www.scrippsnews.com/health/medicine/to-wear-a-wig-or-not-to-wear-a-wig
- **Facing Our Risk**: written personal story about coping with hair loss. https://www.facingourrisk.org/XRAY/chemotherapy-induced-hair-loss
- **Public-domain footage candidates:** CDC breast cancer resources and **Bring Your Brave** (real young survivors) https://www.cdc.gov/breast-cancer/resources/index.html · CDC reuse policy https://cdc.gov/other/agencymaterials.html · CDC B-roll https://www.cdc.gov/media/b-roll/index.html
- TODO in the build phase: shortlist 2–3 specific public-domain clips, record their URLs and licence status here, and gather more stories (Reddit r/breastcancer threads can be paraphrased and linked; don't show usernames).

---

## 6. YouCam APIs: confirmed contracts & costs

**Base host:** `https://yce-api-01.perfectcorp.com` (the docs show `yce-api-01.makeupar.com`; treat them as aliases).

**Auth.** We tried `Authorization: Bearer <YOUCAM_API_KEY>` first and fell back to the legacy token flow on a 401. The calls succeeded with the code in §8, which handles both:
- Legacy flow: `POST /s2s/v1.0/client/auth`, body `{ client_id, id_token }`.
- `id_token` = RSA PKCS1 v1.5 encryption of `client_id=<key>&timestamp=<ms>`, using the Base64-decoded `YOUCAM_SECRET_KEY` as an SPKI public key.
- The returned `result.access_token` is valid for 2 hours.

**Generic task pattern (v2.x).**
- Start: `POST /s2s/v2.x/task/<feature>` with a **flat** JSON body → `data.task_id`.
- Poll: `GET /s2s/v2.x/task/<feature>/<task_id>` → `data.task_status` (`running|success|error`) and, on success, `data.results.url`.
- Inputs can be **public URLs** (`src_file_url`, `ref_file_url`) or uploaded file ids:
  - `POST /s2s/v2.0/file` (or `/file/<feature>`) with `{files:[{content_type,file_name,file_size}]}`, then **PUT the bytes** to the returned presigned `requests[].url` with the given headers.
  - **`file_size` is required.**
- Units are consumed **only on success.** Results are kept about 24h, so download them.

| API | Endpoint | Units | Bloom use | Tested? |
|---|---|---|---|---|
| **AI Hairstyle / hair transfer** | `/s2s/v2.1/task/hair-transfer` (`src_file_url` + `ref_file_url`, or `template_id` from `/s2s/v2.1/task/template/hair-transfer`) | 2 | **Wig try-on AND head-wrap try-on** | ✅ (§7) |
| AI Makeup VTO | `/s2s/v2.0/task/makeup-vto` (`effects[]`, `version:"1.0"`) | 1 | Brow recreation (`category:"eyebrows"`); maybe lashes | ✅ brows |
| AI Hat VTO | `/s2s/v2.0/task/hat` (`ref_file_url`, `gender`, `style`) | 2 | Optional "styled look" with a beanie/sun hat (regenerates the scene) | ✅ (§7) |
| AI Scarf VTO | `/s2s/v2.0/task/scarf` | 2 | **Not usable** (neck scarves only) | ❌ (§7) |
| AI Facial Color Tones | `/s2s/v2.0/task/skin-tone-analysis` (upload with file_size; result `data.results.color` = `{skin_color, eye_color, lip_color, eyebrow_color, hair_color, hair_color_name}` hex) | **20 (expensive!)** | At most once per hair passport (hair + brow colour) | ✅ in Poise |
| AI Hair Type Detection | `/s2s/v2.0/task/hair-type-detection` (**3 photos: front, ±45° yaw**) | 2 | Passport: curl pattern (10 curl shapes, 9 types) | not yet |
| AI Hair Length Detection | `/s2s/v2.0/task/hair-length-detection` | 2 | Passport: length (to match wig length) | not yet |
| AI Hair Density Detection | `/s2s/v2.0/task/hair-density-detection` | 1 | Passport baseline; regrowth tracking (levels 1–4) | not yet |
| AI Nail VTO | `/s2s/v2.0/task/nail-vto` (back-of-hand photo) | 1 | Stretch: polish shades to cover nail discolouration | not yet |
| AI Earrings VTO | `/s2s/v2.0/task/2d-vto/earring` (`ref_file_ids/urls`) | 1 (2 stacked) | Stretch: statement earrings with headwear | not yet |
| Skin Analysis (v2.1) | `/s2s/v2.1/task/skin-analysis` (flat body `{src_file_id, dst_actions[], format:"json"}`; SD dark-circle token is `dark_circle_v2`; higher score = healthier) | ~7–12 | Optional: gentle cosmetic dryness/redness check (LGFB "skin care"); **never medical** | ✅ in Poise |
| YouCam MCP server / Skills | https://docs.perfectcorp.com/develop/mcp.md, https://docs.perfectcorp.com/develop/agent_skills.md | — | Optional "agentic" angle (Aloud used the MCP server) | no |

**Full API catalogue:** https://docs.perfectcorp.com/llms.txt. Per-API docs are at `https://docs.perfectcorp.com/reference/description/<slug>.md`, e.g. `hair_style_task`, `ai_scarf`, `ai_hat`, `ai_makeup_vto`, `ai_face_tone_analyzer`, `ai_hair_type`, `ai_hair_length`, `ai_hair_density_detection`, `nail_vto_task`, `ai_2d_vto_earring`, `skin_simulation_task`, `ai_face_analyzer`. Fetch them with `curl` (plain WebFetch gets a 403 on Devpost; docs.perfectcorp.com is fine).

**Hair-transfer constraints (they shape the product):**
- Long side ≤ 1024px; face width ≥ 128px.
- Pose: pitch ±10°, yaw ±45°, roll ±15°; a single face with the full face visible.
- JPG under 10MB.
- Errors:
  - `error_no_shoulder`: **shoulders must be visible**
  - `error_hair_too_short`: **the source can't be bald or very short-haired**
  - `error_large_face_angle`, `error_insufficient_landmarks`, `error_face_pose`
- **So the technology itself requires capturing the user before hair loss.** This is the strongest proof of the core insight; put it in the pitch.

**Hat/scarf styles.**
- Hat styles: `style_sporty_casual`, `style_urban_fashion`, `style_vacation_casual`, `style_warm_cozy`, `style_bohemian`.
- Scarf styles: `style_french_elegance`, `style_light_luxury`, `style_cottagecore`, `style_modern_chic`, `style_bohemian`.
- Either API also accepts `"random"`.
- Both are **generative lifestyle shoots** that change the background and outfit; they are not a faithful mirror.

---

## 7. Feasibility test results (2026-10-11): DONE, don't redo

All files are in the handoff folder **`bloom-handoff/`**, which sits next to this file. Move it into the new repo, e.g. as `docs/spike/`.
- `spike-run.mjs`: a throwaway runner. Usage:
  ```bash
  MSYS_NO_PATHCONV=1 node spike-run.mjs /s2s/v2.1/task/hair-transfer '{"src_file_url":"…","ref_file_url":"…"}' outname
  ```
  It reads `YOUCAM_API_KEY` / `YOUCAM_SECRET_KEY` from `./.env` (or `ENV_FILE=...`) and writes `spike/out/<outname>.jpg`.
- `spike-inputs/`: the source face and the wig and head-wrap reference images.
- `spike-results/`: all 6 outputs.

**Source face:** Perfect Corp's own sample image `https://plugins-media.makeupar.com/strapi/assets/face_reshape_01_85c8ffc055.jpg` (a woman with medium-length brown hair, head and shoulders just visible). Note: the sample `selfie_03_cccd5d4803.jpeg` linked in the docs **no longer exists** (S3 NoSuchKey).

| # | Test | Reference image | Result | Time | Units |
|---|---|---|---|---|---|
| 1 | Wig, **on-model** product photo | wigs.com "Carrie Large" (blonde, wavy, shoulder length) `https://cdn.shopify.com/s/files/1/1410/9094/files/resized-Carrie_Large_24BT18S8_SLHH_079_Main.jpg` | ✅ **Photoreal; face identical.** ⚠️ The model's **hoop earrings leaked** into the result | 10.3s | 2 |
| 2 | Wig, **mannequin-head** product photo | Godiva's Secret "Kim Petite – Frosted Taupe" (FINAL SALE) `https://cdn.shopify.com/s/files/1/0594/1274/2349/files/KimTaupe_2632c32b-a3b6-4809-9396-5e2120153a5a.jpg` | ✅ **Excellent; no leakage** | 7.4s | 2 |
| 3 | **Chemo head wrap through hair transfer** (person wearing it) | Suburban Turban floral head scarf `https://suburbanturban.com/wp-content/uploads/2024/07/headscarf-floral-front.jpg` | ✅ **Faithful print and knot; face identical.** Key finding: hair transfer handles head wraps | 10.1s | 2 |
| 4 | Brows, makeup VTO | `eyebrows`, pattern `Arrow1`, curvature 20, thickness 30, definition 70, `#4a3426` at 70% matte | ✅ Applied; subtle (needs a test on a sparse-brow face) | 7.2s | 1 |
| 5 | Hat API (beanie, `style:"random"`) | Brixton "Heist Beanie – Walnut Brown" `https://cdn.shopify.com/s/files/1/0415/3819/1512/files/21576bcf8115499196fdf040c1e1393232313b66.jpg` | ⚠️ The beanie is right and the face is kept, but **the whole photo became a street scene with a new outfit** | 12.9s | 2 |
| 6 | Scarf API (long red scarf) | wigs.com "Amore Mantra Scarf" | ❌ **No scarf visible**; lifestyle scene regenerated | 13.2s | 2 |

**Total: about 13 units spent.**

**Design decisions from the test:**
- **Wigs and head wraps both go through hair transfer**, the strongest and most faithful API.
- **Prefer mannequin-head / product-only reference images.** Where only on-model photos exist, run an **accessory-leak check** (compare ear and neck regions of the source and the result) and warn or retry.
- **Drop the scarf API.** The hat API is optional and gets an honest "styled look" label.
- **Brows:** test on a sparse-brow face, and use the passport's `eyebrow_color` for the shade.

---

## 8. Product design (PROPOSED: confirm section by section in the new session)

### 8.1 Core journey: "the first 30 days after diagnosis"
1. **Welcome & consent.** Plain words: cosmetic, not medical. Photos are processed for this session and stored on your device only. Nothing about identity or health is inferred.
2. **Hair Passport** (the hero concept). This is a guided capture *while you still have your hair*, using MediaPipe framing that checks the head and shoulders are in frame, the face is straight, and the light is good.
   - **Front photo** → hair colour, measured **locally** with MediaPipe hair segmentation + CIELAB (free). Optionally Facial Color Tones once (20 units) for hair, brow and skin colour.
   - **3 photos (front, ±45°)** → Hair Type (curl pattern).
   - Hair Length.
   - **Top-down photo** → Hair Density baseline.
   - Output: a **Passport card**. On screen it shows your hair photo, measured colour swatch (hex + name), curl type, length and density level. It's exportable as a PDF to take to a wig shop.
3. **Matched wigs.**
   - **Catalogue:** a store-agnostic adapter over Shopify `/products.json`. Verified live: wigs.com (`https://wigs.com/products.json?limit=250&page=N`) and godivassecretwigs.com.
   - **Wig attributes:** colour (measured from the product image's hair region, the same local segmentation), length and texture (from title/tags/product_type), cap type, price, and a **returnability flag** (FINAL SALE / hygiene policy).
   - **Deterministic ranking:** ΔE2000 between wig colour and your passport colour, texture match, length match, plus a "match my hair" vs "try something new" toggle. Show the reasons as numbers.
   - **Try-on:** the top N go through hair transfer on your passport photo, shown side by side with your real hair.
   - **Verification loop (technical depth):** measure the **rendered** hair colour in each try-on result with the local segmenter. Report "on you, this wig reads ΔE x from your natural colour", so the claim is measured on the render, not assumed.
   - Run the accessory-leak check on every result.
4. **Head wraps & hats.** Head wraps via hair transfer from photos of a person wearing them (proven in test #3). A hat is an optional "styled look" via the hat API, clearly labelled as a generated scene.
5. **Brows.** Brow recreation with makeup VTO using your passport `eyebrow_color` and shape presets. Lashes too if the API has a category (TODO check `eye_lashes` in the makeup docs).
6. **Decide & buy.**
   - A shortlist and a link out to the retailer's product page.
   - An **insurance pack**: a printable summary using "cranial hair prosthesis" wording, a doctor-letter template, an invoice checklist, and the HCPCS code once verified.
   - **Free-wig resources** (EBeauty, ACS) once verified.
7. **Stretch, in priority order:**
   - (a) A regrowth tracker: hair density level and hair type over months ("hair often grows back different").
   - (b) Nail shades with nail VTO.
   - (c) Statement earrings with earring VTO.
   - (d) Gentle skin check with Skin Analysis (cosmetic only).
   - (e) A conversational "Bloom guide" agent (Groq) and/or the YouCam MCP server for the "agentic" angle.
   - (f) A family share link ("help me choose").

### 8.2 Non-goals
- Medical advice, diagnosis, or predicting how hair will regrow.
- Selling wigs ourselves or handling payments.
- Accounts, unless judging requires them.
- Brand-side analytics.

### 8.3 Ethics & safety
- Cosmetic language only.
- A claim linter for forbidden medical words (Aloud did this in CI, and it's cheap credibility).
- No photo leaves the device except to YouCam for the requested task.
- A "delete everything" button.
- Honest labels on generated images ("a preview, not a guarantee of fit or exact colour").

---

## 9. Tech stack & architecture (PROPOSED)

**Frontend:**
- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4.
- Mobile-first PWA, deployed on **Vercel**.
- **Storage:** IndexedDB on the device for the passport, results and shortlist. No server database.

**Server:**
- Next.js route handlers hold the YouCam keys; the browser never sees them.
- A **unit budget guard / circuit breaker**: check the balance via the YouCam credit API if one exists (TODO), cap units per session, and fall back to labelled demo fixtures.
- **Result caching**, keyed by a hash of the source and reference images.

**Image maths:**
- `sharp` on the server for crops and region pixel statistics.
- **MediaPipe Tasks Vision** in the browser:
  - FaceDetector / FaceLandmarker for capture framing and pose.
  - **ImageSegmenter, hair model**, for hair-colour sampling.
- CIELAB + **ΔE2000** in a small, unit-tested TypeScript module.

**LLM:** optional and only for warm copy. Groq `llama-3.3-70b-versatile` (free), with a deterministic fallback. Only numbers are sent, never photos.

**Testing:**
- Unit tests for colour maths, ranking, catalogue parsing and the claim linter.
- **Recorded API fixtures** (JSON + images) so the UI and tests run without spending units.
- One live smoke script (based on `spike-run.mjs`).

**Env vars:** `YOUCAM_API_KEY`, `YOUCAM_SECRET_KEY`, `GROQ_API_KEY` (optional). Copy them from Poise's `.env`. **Never commit `.env*`**; add a `.env.example`.

---

## 10. Phased roadmap (to refine in the implementation plan)

| Phase | Work |
|---|---|
| 0 | New repo `bloom` (GitHub `ahammadshawki8/bloom`), scaffold Next 16, copy reusable code (§12), `.env`, LICENSE (MIT), README skeleton, first deploy to Vercel |
| 1 | YouCam client (auth, upload, task, poll), fixtures, unit budget guard |
| 2 | Hair Passport capture (framing, multi-angle, top-down) plus the hair type, length and density calls and local hair colour |
| 3 | Wig catalogue adapter, colour maths, ranking, hair-transfer try-on, verification loop, leak check |
| 4 | Head wraps, brows, hat "styled look" |
| 5 | Decide & buy: shortlist, insurance pack PDF, resources |
| 6 | Polish: design system, accessibility, the honesty layer, real-phone testing; stretch items if time allows |
| 7 | Submission: README with a "built during the submission period" note, screenshots, Devpost text, 1–3 min video, social bonus, submit **by Nov 1** (a day of buffer) |

---

## 11. Unit budget (~1,315 available)

| Item | Cost |
|---|---|
| One full passport (hair type 2 + length 2 + density 1, optionally Facial Color Tones 20) | 5 (or 25) |
| Each wig or head-wrap try-on | 2 |
| Each brow render | 1 |
| Each hat styled look | 2 |
| **One full demo session** (passport + 6 wigs + 2 wraps + 2 brows + 1 hat) | **about 30 (about 50 with Tones)** |

**Plan:** about 300 for development and live checks, about 150 for demo recording and rehearsal, and a reserve of about 400 for judges testing the live app (cap units per session). Fixtures cover everything else.

---

## 12. Reusable code from Poise (copy, don't import)

**Already copied into `bloom-handoff/poise-reuse/`** (same relative paths), so nothing needs fetching from the old repo. Poise's full plan, with more API contract detail, is in `bloom-handoff/poise-plan-reference.md`. `.env` is already in the Bloom root; it holds `YOUCAM_API_KEY`, `YOUCAM_SECRET_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY` and `OPENROUTER_KEY`, and must never be committed. All of the following was verified working in July 2026:
- `src/lib/youcam/config.ts`, `auth.ts`, `client.ts`: base URL, RSA id_token auth (PKCS1 v1.5, OAEP fallback), token cache, `authedFetch` with refresh on 401, and the `envelope()` helper that handles both `data` and `result`.
- `src/lib/youcam/skinTone.ts`: the Facial Color Tones flow (upload with file_size → task → poll).
- `src/lib/youcam/skin.ts`: the Skin Analysis v2.1 flow (only if the skin stretch is built).
- `src/lib/client/faceDetect.ts` + `public/mediapipe/` + `public/models/`: self-hosted MediaPipe FaceDetector, face-box crop and brightness checks.
- `src/lib/client/speech.ts`: optional TTS/STT.
- `src/lib/llm/groq.ts`: an OpenAI-compatible Groq call with fallback (optional).
- `bloom-handoff/poise-plan-reference.md` §6b–6d holds more API contract detail.

**Don't carry over** Poise's 2,206-line `PoiseApp.tsx` monolith, its half-finished `backend/` (Express/Postgres), or the colour-season code. Keep files small and focused.

---

## 13. Risks & open questions

1. **Trademarks in the demo video. DECIDED (2026-10-11): blur brand names and logos** wherever real products appear in the video and screenshots (store names, logos, labels). Inside the live app, product images are fetched from public catalogues with links back to the retailer.
2. **Wig colour from product photos.** Lighting and backgrounds vary; the segmenter has to work on mannequin shots. Measure several pixels, use the median, and show confidence.
3. **Hair-transfer limits.** Short hair or no visible shoulders make the call fail. The capture UI must enforce framing. People who've already lost their hair can use an older photo as the source (a "from your camera roll" path). Test whether an older photo works.
4. **Hair-type API** needs 3 angles, which adds capture friction. Make it optional and skippable.
5. **Medical boundary:** copy review plus the claim linter.
6. **Real users. DECIDED (2026-10-11): no live user recruitment for now.** Show real patient voices with sourced material instead (§5a). ⚠️ **Rule constraint:** the official rules say the demo video *"must not include third party trademarks, or copyrighted music or other material unless the Entrant has permission"*. Crediting the source or being non-commercial does **not** satisfy this; only permission or public-domain/licensed material does, and a breach risks disqualification. So:
   - **In the video:** use only **public-domain** footage, e.g. CDC "Bring Your Brave" real young breast-cancer survivor stories (US-government work). CDC requires credit ("Source: CDC") plus a no-endorsement disclaimer, the CDC logo must not be used, and each video's licence must be checked, because some CDC material is contractor-made. Creative Commons (CC BY) footage with attribution is also fine. Short on-screen *paraphrases* with a citation are fine too.
   - **In the Devpost text and README (not the video):** quote and link news articles, interviews and studies with full credit. Linking is always safe.
   - Copyrighted documentaries or news clips go in the video **only** with written permission from the owner.
7. **Special prizes:** check whether the user qualifies for Rising Star (school email) or has a team member eligible for Women in Tech. A project can win only one prize.
8. **Open:** is there a credit-balance API for the budget guard? Is there an eyelashes category in makeup VTO? Is a head wrap through hair transfer reliable across different wrap styles (test 3–4 more)?

---

## 14. Demo video outline (1–3 minutes, draft)

| Time | Beat |
|---|---|
| 0:00–0:15 | Hook: "Every guide says choose your wig before chemo. But you can't try one on, and you can't return it." Show a FINAL SALE tag (blurred brand). |
| 0:15–0:45 | Hair Passport: guided capture, then the passport card with measured colour, curl and density |
| 0:45–1:30 | Matched wigs: ranked with ΔE reasons; tap → **you, in the wig**, next to your real hair; then the verification number |
| 1:30–1:55 | Head wrap on you (the hair-transfer finding); brows recreated |
| 1:55–2:20 | Decide: shortlist → insurance pack ("cranial hair prosthesis") → free-wig resources |
| 2:20–2:45 | Name the APIs used, the honesty layer, and the LGFB-curriculum mapping. Close: "Bloom. Still you, through treatment." |

---

## 15. Submission checklist

- [ ] Public repo `ahammadshawki8/bloom` with an MIT LICENSE, README (setup, env, run, test, deploy) and a "Built during the submission period (from 2026-10-11)" note
- [ ] Live URL on Vercel; judges can use it free with no login, and there's a capped demo mode with fixtures
- [ ] Devpost text: problem with citations, features, APIs used, consumer and retail value, honesty layer, what we learned
- [ ] Screenshots (passport, matches, try-on side by side, head wrap, insurance pack)
- [ ] 1–3 min YouTube video: on a real phone, names each YouCam API, no unlicensed trademarks or music
- [ ] Social Sharing Bonus post(s) + form
- [ ] Both team members registered on Devpost and added to the project. Women in Tech (team member) and Rising Star (BUET email) both declared on the form
- [ ] Submit by **Nov 1** (buffer before the Nov 2 11:45am EST deadline)

---

## 16. Reference links

- New hackathon: https://youcam-api-skin-ai-ecommerce.devpost.com/ (rules: `/rules`, resources: `/resources`)
- Previous hackathon and gallery: https://youcam-api.devpost.com/project-gallery. Winners: https://devpost.com/software/aloud-lxqr70, https://devpost.com/software/shadespan, https://devpost.com/software/casting, https://devpost.com/software/keepme, https://devpost.com/software/confidfit
- YouCam docs: https://docs.perfectcorp.com/llms.txt · console/keys: https://yce.perfectcorp.com/ai-api · playground: https://yce.perfectcorp.com/api-console/en/api-playground/
- Perfect Corp × NAO-ART wig VTO: https://www.perfectcorp.com/business/news/nao-art-partnership-perfect-corp
- Perfect Corp hair density product: https://www.perfectcorp.com/business/products/hair-density-test-analysis
- Breastcancer.org wigs: https://www.breastcancer.org/treatment-side-effects/hair-loss/wigs
- Fetch tip: Devpost blocks WebFetch (403), so use `curl -A "Mozilla/5.0 …"` and strip the HTML. Shopify stores expose `/products.json?limit=250&page=N`.

---

## 17. Progress log

- **2026-10-11 (frontend build session).** User decisions: two folders (`frontend/` → Vercel, `backend/` → Render + Render Postgres; user will upgrade the DB before the free tier's 30-day expiry). PWA, mobile-first + desktop. Landing = atelier (ivory, sage, rose, serif, real portraits); app = **"gentle play"** playground; the two worlds must connect. Cold start = gentle waking toast + polling. User delegated remaining design calls and asked to build the full frontend, then pause for review.
  - Docs: `docs/superpowers/specs/2026-10-11-bloom-design.md`, `docs/superpowers/plans/2026-10-11-bloom-implementation.md` (tiers F0–F6 frontend, B1–B5 backend).
  - **Frontend tiers F0–F6 DONE** (mock API mode). Landing, waking toast, studio shell/home, hair passport (live MediaPipe framing + on-device hair colour), fitting room (wigs/wraps/brows, compare, verification loop), saved board, compare, family share links + vote page, decision + insurance pack, privacy/delete-all, PWA (manifest, icons, SW, offline page), claim linter, Playwright journey (phone + desktop), Lighthouse a11y/BP/SEO 100 (landing, home), LCP 310 ms.
  - Bridge concept: the **arched vanity mirror** shared between landing and studio (React `<ViewTransition name="mirror">`); Fraunces (two axis moods) + Figtree; tokens in `frontend/src/app/globals.css`.
  - Catalogue: 11 wig styles × 4 colours + 6 bamboo turbans (Godiva's Secret Wigs, public Shopify JSON) + floral scarf; built by `tools/build_catalog.py`. **55 real YouCam renders** on the demo face via `tools/render_fixtures.mjs` (~108 units spent → **~1,207 left**). Each wig variant also has `renderLab` (colour measured on its render) so ranking reflects worn colour.
  - Verified facts: **HCPCS A9282 = "Wig, any type, each"** (aapc.com/codes/hcpcs-codes/A9282); coverage varies by plan (BCBS VT, TRICARE, BCBS RI). **EBeauty** free wigs need a note from doctor/nurse/social worker and ask for photos of hair from before hair loss (wtop.com 2024-04 article) → the passport is that photo.
  - Landing photos: Unsplash licence, credited in `CREDITS.md`.
  - **Next:** user reviews the frontend → then backend B1–B5 → switch `NEXT_PUBLIC_API_MODE=live`.

- **2026-10-11 (review round 1).** User review: hydration warning (browser extension `vsc-initialized`, fixed with `suppressHydrationWarning`), MediaPipe INFO logs (filtered), landing needs charts + scroll animation, passport page centring, detailed compare, compact studio with more YouCam metrics, and "use their API more extensively". Brief re-read: eCommerce VTO wants **beauty + fashion VTO working as one**, plus agentic bonus.
  - User approved: **complete-the-look pipeline**, **Face Analyzer in passport**, **hair APIs as a measuring instrument**; agentic "Bloom guide" **after the backend**.
  - Verified API contracts (via `tools/yc.mjs`): `face-attr-analysis` needs `features[]` (≤5 = 10 units); `hair-length-detection` takes one front image (`src_file_url`/`src_file_id`) → `results.hair_length.term`; `2d-vto/*` needs inputs flat AND as `source_info{name,…}` + `object_infos[{name, ref_file_urls}]`; earrings fail when earlobes are covered ("earlobe alignment not confident") → switched the fashion piece to **necklace VTO** (works with every look).
  - Fixtures: sample-face analysis (Square face, Soft Angled/Straight brows, Almond eyes, flat cheekbones; length "short hair or longer"); `renderLength` for 39 of 44 wig renders (5 failed "insufficient lighting", shown honestly); 27 complete looks = 3 bases × 3 lip/blush palettes × (none/pearl/shell) via makeup VTO (brows + lashes + lip + blush in one call) → necklace VTO.
  - Units this round ≈ 125 → **≈233 spent, ≈1,095 left**.
  - Frontend: landing "numbers" section (sourced 65% / 55% stats, timeline, live ΔE chart), scroll motion system (rise text, curtain image reveals with parallax, count-ups, ivory→mulberry section), fit card (score + colour / face shape / length meters with sources), Finish tab (pipeline), brow suggestion from face analysis, detailed compare table, passport face section. Tests: 35 unit, 6 e2e.

- **2026-10-11 (setup).**
  - Created `C:\Users\Shawki\Desktop\Bloom`. Moved `planBloom.md` and `bloom-handoff/` there. Copied `.env`, `AGENTS.md` and `CLAUDE.md`. Copied the reusable Poise code and MediaPipe models into `bloom-handoff/poise-reuse/`, and Poise's plan into `bloom-handoff/poise-plan-reference.md`. **Not yet a git repo.**
  - Decisions: the user is eligible for **Rising Star** (BUET email); **blur brands** in video and screenshots; **real-user voices come from sourced material** (public domain in the video, cited links in the text; see §13.6).
  - Added hair-loss prevalence and distress stats plus patient stories (§5, §5a).
  - The team is 2 people; the second member is a woman, so Bloom is also **eligible for Women in Tech** (§1).

- **2026-10-11 (Poise session → handoff).**
  - Studied the new rules, the previous winners and all 238 previous entries.
  - Scored 10 ideas; Crown+ passed. Ran a feasibility test with 6 YouCam calls (~13 units): **wig and head-wrap try-on via hair transfer is photoreal and keeps the face; the scarf API is unusable; the hat API makes lifestyle scenes; brows work.**
  - Name locked: **Bloom**. Decided on a new repo.
  - Wrote this file and the `bloom-handoff/` folder (test script, inputs, results).
  - **Next session:** create the repo → confirm the §8 design sections with the user → write the spec (`docs/superpowers/specs/2026-10-xx-bloom-design.md`) → writing-plans → build Phase 0.

- **2026-10-11 (review round 2 + backend).** User: drop the finish-look makeup/jewellery (off-mission), keep wigs/wraps/brows/lashes; family links need up AND down votes with tallies; Saved needs sort/filter by votes and metrics; add the agentic system; build the backend on Postgres and make everything work end to end; user will deploy and do submission material.
  - Removed complete-look pipeline (code, fixtures, test). Added **lashes** (3 real makeup-VTO renders: Natural1, UpperDense1, Wispies1; 3 units).
  - **Monorepo** (npm workspaces): `shared/` (types, colour, match, fit, presets, guide tools), `frontend/`, `backend/`.
  - **Backend** (Fastify + pg + sharp): `/health`, `/catalog` (seeded from fixtures), `/tryon` (hair transfer + length measured on the render), `/brows`, `/lashes`, `/passport/read` (face analyzer, length, type, density; unreadable analyses reported as notes), `/shares` + `/votes` (±1, one statement per submission), `/results/:id` (bytea), `/agent` (SSE). Unit circuit breaker (BUDGET_TOTAL 600 / BUDGET_SESSION 60), result cache keyed by photo hash, sample passport served from fixtures (0 units).
  - **Bloom guide**: OpenAI-compatible tool calling. Groq's `llama-3.3-70b-versatile` is no longer available on this account → default `openai/gpt-oss-120b` on Groq, OpenRouter llama as fallback, rule-based planner last. Tools are deterministic; face-fit explanations now only cite features the style really has (caught the model claiming "soft waves" for a straight wig).
  - Local DB: PGlite socket crashes on messages >64 KB (bytea) → dev/e2e use **embedded-postgres** (real Postgres binaries, port 6544 dev / 6545 e2e); PGlite kept for small integration tests. Windows refused port 5433.
  - Verified: 36 frontend unit, 12 backend integration, 8 live e2e (phone+desktop, real backend + Postgres + Groq agent), and a real-photo live YouCam e2e (16 units). Production bundle smoke-tested (`scripts/smoke-dist.ts`).
  - Units this round ≈ 3 (lashes) + ~14 (crashed run) + 16 (live e2e) ≈ 33 → **≈266 spent, ≈1,060 left**.
  - Deploy: `render.yaml` (bloom-db + bloom-api), Vercel root `frontend` with `NEXT_PUBLIC_API_MODE=live`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`. README has the steps.
