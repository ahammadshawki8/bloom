import {
  fitSummary,
  findVariantIn,
  lengthWords,
  planWithRules,
  deltaE2000,
  wornLab,
  readIntent,
  savedLooks,
  savedPick,
  savedWhy,
  factualWhy,
  whyContradicts,
  honoursRequest,
  searchStyles,
  suggestBrowsAndLashes,
  type GuideEvent,
  type GuidePick,
  type Passport,
  type SavedLookInput,
  type SearchArgs,
  type Style,
} from "@bloom/shared";
import { chat, llmConfigured, type ChatMessage, type ToolSpec } from "./llm";

// The Bloom guide: an agent that plans with an LLM and acts through Bloom's own
// deterministic tools. The model never invents colour distances or fit scores;
// it only reads them from tool results.

const SYSTEM = `You are the Bloom guide, a warm, concise styling assistant inside a cosmetic try-on studio for women preparing for chemotherapy hair loss.
Rules:
- Cosmetic only. Never give medical advice, never comment on illness, treatment or health.
- Always use tools for facts. Start with get_passport, then search_styles (more than once if useful), then fit_report on promising candidates, then call shortlist exactly once with 3 picks (or 2 wigs + 1 wrap if she asks about wraps).
- Only describe features the tool results show (texture, bangs, length). Never add filters she didn't ask for.
- Her stated wishes (colour, length, texture) come first; fit score only ranks looks that meet them. If she names a colour, pass it as colour_family and only shortlist results from that search.
- Each pick's "why" must cite tool results (e.g. "Very close to your colour (ΔE 2.4), soft waves suit a square face"). One sentence, plain words, no jargon beyond ΔE.
- If she asks about looks she already saved (which suits her, comparing them, choosing between them): call get_passport, then get_saved_looks, then shortlist every saved look (up to 4) best first using result_id (not variant_id), and say in the note which one suits her best and why. Compare them with the fit, colour, face-shape and family-vote facts the tool returns. Don't search the catalogue unless she also asks for new ideas. If she has none saved, say so in the note and shortlist nothing.
- Only use variant_ids returned by search_styles, and result_ids returned by get_saved_looks.
- In the note and reasons, name looks by their title (e.g. "Jenna in Cappucino"), never by an id.
- Keep any text you write between tool calls to one short sentence describing your next step.`;

const TOOLS: ToolSpec[] = [
  { type: "function", function: { name: "get_passport", description: "Her hair passport: measured hair colour, face shape (YouCam Face Analyzer), length, texture.", parameters: { type: "object", properties: {} } } },
  {
    type: "function",
    function: {
      name: "search_styles",
      description: "Search the wig and head-wrap catalogue. Results are ordered by the colour family requested and include delta_e (colour distance to her hair; under 6 reads as her own colour).",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["wig", "wrap"] },
          length: { type: "string", enum: ["short", "medium", "long"] },
          texture: { type: "string", enum: ["straight", "wavy"] },
          bangs: { type: "boolean" },
          max_price: { type: "number" },
          colour_family: { type: "string", enum: ["match", "new", "blonde", "brown", "black", "red", "grey"] },
          limit: { type: "integer", minimum: 1, maximum: 10 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fit_report",
      description: "Fit score (0-100) for one wig variant: colour closeness, face-shape fit and the hair length YouCam measured on its try-on.",
      parameters: { type: "object", properties: { variant_id: { type: "string" } }, required: ["variant_id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_saved_looks",
      description:
        "The looks she saved in Bloom, each with its layers (wig or wrap, brows, lashes), fit score 0-100 for wigs (colour and face shape), length on her, price and her family's votes. Ordered best fit first.",
      parameters: { type: "object", properties: {} },
    },
  },
  { type: "function", function: { name: "suggest_brows_and_lashes", description: "The brow and lash presets closest to her own, from the face analysis.", parameters: { type: "object", properties: {} } } },
  {
    type: "function",
    function: {
      name: "shortlist",
      description: "Finish: return the final picks to her.",
      parameters: {
        type: "object",
        properties: {
          picks: {
            type: "array",
            maxItems: 4,
            items: {
              type: "object",
              properties: {
                variant_id: { type: "string", description: "A catalogue variant from search_styles." },
                result_id: { type: "string", description: "One of her saved looks from get_saved_looks." },
                why: { type: "string" },
              },
              required: ["why"],
            },
          },
          note: { type: "string", description: "One warm sentence to her." },
        },
        required: ["picks"],
      },
    },
  },
];

function passportFacts(p: Passport) {
  return {
    hair_colour: `${p.hair.name} (${p.hair.hex})`,
    face_shape: p.face?.shape ?? "not analysed",
    natural_brows: p.face?.browShape ?? "unknown",
    length: p.hairLengthTerm ? lengthWords(p.hairLengthTerm) : (p.length ?? "unknown"),
    texture: p.texture ?? "unknown",
  };
}

export async function* runGuide(prompt: string, passport: Passport, styles: Style[], saved: SavedLookInput[] = []): AsyncGenerator<GuideEvent> {
  if (!llmConfigured()) {
    yield* planWithRules(prompt, passport, styles, saved);
    return;
  }

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content: prompt.slice(0, 500) || "Find me three looks close to my own hair." },
  ];
  const known = new Set<string>();
  const savedRows = savedLooks(styles, passport, saved);
  const wish = readIntent(prompt);
  let readSaved = false;
  let model = "";
  let brows: ReturnType<typeof suggestBrowsAndLashes> | undefined;

  try {
    for (let step = 0; step < 10; step++) {
      // Long runs cost tokens (each step resends the conversation); ask it to wrap up.
      if (step === 6) messages.push({ role: "user", content: "Please call shortlist now with the best picks you have found." });
      const res = await chat(messages, TOOLS);
      model = res.model;
      const msg = res.message;
      messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: msg.tool_calls });
      if (msg.content?.trim() && msg.tool_calls?.length) yield { type: "thinking", text: msg.content.trim().slice(0, 200) };
      if (!msg.tool_calls?.length) break;

      for (const call of msg.tool_calls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          /* model sent bad JSON; treat as empty */
        }
        let result: unknown;
        switch (call.function.name) {
          case "get_passport":
            result = passportFacts(passport);
            yield { type: "tool", name: "get_passport", label: "Checked your passport", detail: Object.values(passportFacts(passport)).slice(0, 3).join(" · ") };
            break;
          case "search_styles": {
            const a0 = args as SearchArgs;
            // Keep only well-formed filters; models sometimes send nulls or invented values.
            const clean: SearchArgs = {
              kind: a0.kind === "wig" || a0.kind === "wrap" ? a0.kind : undefined,
              length: ["short", "medium", "long"].includes(String(a0.length)) ? a0.length : undefined,
              // Texture and bangs only when she mentioned them; models tend to invent "straight".
              texture: wish.texture && ["straight", "wavy"].includes(String(a0.texture)) ? a0.texture : undefined,
              bangs: wish.bangs && a0.bangs === true ? true : undefined,
              max_price: typeof a0.max_price === "number" && a0.max_price > 0 ? a0.max_price : undefined,
              colour_family: ["match", "new", "blonde", "brown", "black", "red", "grey"].includes(String(a0.colour_family)) ? a0.colour_family : undefined,
              limit: typeof a0.limit === "number" ? Math.min(8, Math.max(1, a0.limit)) : 6,
            };
            args = clean as Record<string, unknown>;
            const rows = searchStyles(styles, passport, clean);
            rows.forEach((r) => known.add(r.variant_id));
            // Only what the model needs to choose; ids and prices stay exact.
            result = rows.map(({ style_id: _sid, ...r }) => r);
            const a = args as SearchArgs;
            const what = [a.kind === "wrap" ? "head wraps" : "wigs", a.length, a.texture, a.colour_family && a.colour_family !== "match" ? `${a.colour_family} shades` : null].filter(Boolean).join(", ");
            yield { type: "tool", name: "search_styles", label: `Searched ${what}`, detail: `${rows.length} found` };
            break;
          }
          case "fit_report": {
            const id = String(args.variant_id ?? "");
            const fit = fitSummary(styles, passport, id);
            result = fit ?? { error: "unknown variant_id" };
            const f = findVariantIn(styles, id);
            if (fit && f) yield { type: "tool", name: "fit_report", label: `Checked fit: ${f.style.name}, ${f.variant.colorName}`, detail: `${fit.overall}/100` };
            break;
          }
          case "get_saved_looks":
            readSaved = true;
            result = savedRows.length ? savedRows : { saved: [], note: "She hasn't saved any looks yet." };
            yield { type: "tool", name: "get_saved_looks", label: "Read your saved looks", detail: savedRows.length ? `${savedRows.length} saved, each scored for colour and face fit` : "None saved yet" };
            break;
          case "suggest_brows_and_lashes":
            brows = suggestBrowsAndLashes(passport);
            result = brows;
            yield { type: "tool", name: "suggest_brows_and_lashes", label: "Matched brows and lashes", detail: `${brows.brow_label} brows, ${brows.lash_label.toLowerCase()} lashes` };
            break;
          case "shortlist": {
            const raw = Array.isArray(args.picks) ? (args.picks as { variant_id?: string; result_id?: string; why: string }[]) : [];
            const picks: GuidePick[] = [];
            for (const p of raw) {
              if (p.result_id) {
                const row = readSaved ? savedRows.find((r) => r.result_id === p.result_id) : undefined;
                if (!row || picks.some((x) => x.result_id === row.result_id)) continue;
                const hair = findVariantIn(styles, saved.find((x) => x.result_id === row.result_id)?.variant_id ?? "");
                const why = String(p.why).slice(0, 220);
                const dE = hair ? deltaE2000(passport.hair.lab, wornLab(hair.variant)) : null;
                picks.push(savedPick(row, saved, hair && whyContradicts(hair.style, why, dE) ? savedWhy(row) : why));
                continue;
              }
              const f = findVariantIn(styles, String(p.variant_id ?? ""));
              if (!f || !known.has(f.variant.id) || picks.some((x) => !x.result_id && x.variant_id === f.variant.id)) continue;
              // Drop picks that ignore the colour or length she asked for.
              if (!honoursRequest(prompt, f.style, f.variant)) continue;
              picks.push({
                variant_id: f.variant.id,
                style_id: f.style.id,
                title: `${f.style.name}, ${f.variant.colorName}`,
                // Keep the model's words only when they agree with the catalogue.
                why: whyContradicts(f.style, String(p.why), deltaE2000(passport.hair.lab, wornLab(f.variant))) ? factualWhy(styles, passport, f.variant.id) : String(p.why).slice(0, 220),
                overall: f.style.kind === "wig" ? fitSummary(styles, passport, f.variant.id)?.overall : undefined,
              });
            }
            // Answering about saved looks: show all of them (up to 4), in rank order.
            if (picks.length && picks.every((x) => x.result_id))
              for (const row of savedRows) if (picks.length < 4 && !picks.some((x) => x.result_id === row.result_id)) picks.push(savedPick(row, saved, savedWhy(row)));
            // An empty shortlist is honest only when she has nothing saved to compare.
            if (!picks.length && !(readSaved && !savedRows.length)) throw new Error("model returned no valid picks");
            // New-look requests deserve a real choice; a thin answer goes to the fixed plan.
            if (picks.length && !picks[0].result_id && picks.length < 2) throw new Error("model returned too few picks");
            yield { type: "picks", picks: picks.slice(0, 4), brows: brows ?? (readSaved ? undefined : suggestBrowsAndLashes(passport)), note: String(args.note ?? "Here are a few looks to start with.").slice(0, 200) };
            yield { type: "done", planner: "llm", model };
            return;
          }
          default:
            result = { error: "unknown tool" };
        }
        messages.push({ role: "tool", tool_call_id: call.id, name: call.function.name, content: JSON.stringify(result).slice(0, 6000) });
      }
    }
    throw new Error("agent did not finish");
  } catch (err) {
    if (process.env.DEBUG_AGENT) console.error("[guide] llm path failed:", err);
    // The model failed or wandered: fall back to the same tools in a fixed plan.
    yield { type: "thinking", text: "Switching to the step-by-step planner to finish your shortlist." };
    yield* planWithRules(prompt, passport, styles, saved);
  }
}
