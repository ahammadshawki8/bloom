import {
  fitSummary,
  findVariantIn,
  lengthWords,
  planWithRules,
  searchStyles,
  suggestBrowsAndLashes,
  type GuideEvent,
  type GuidePick,
  type Passport,
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
- Each pick's "why" must cite tool results (e.g. "Very close to your colour (ΔE 2.4), soft waves suit a square face"). One sentence, plain words, no jargon beyond ΔE.
- Only use variant_ids returned by search_styles.
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
            items: { type: "object", properties: { variant_id: { type: "string" }, why: { type: "string" } }, required: ["variant_id", "why"] },
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

export async function* runGuide(prompt: string, passport: Passport, styles: Style[]): AsyncGenerator<GuideEvent> {
  if (!llmConfigured()) {
    yield* planWithRules(prompt, passport, styles);
    return;
  }

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content: prompt.slice(0, 500) || "Find me three looks close to my own hair." },
  ];
  const known = new Set<string>();
  let model = "";
  let brows: ReturnType<typeof suggestBrowsAndLashes> | undefined;

  try {
    for (let step = 0; step < 8; step++) {
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
              texture: ["straight", "wavy"].includes(String(a0.texture)) ? a0.texture : undefined,
              bangs: a0.bangs === true ? true : undefined,
              max_price: typeof a0.max_price === "number" && a0.max_price > 0 ? a0.max_price : undefined,
              colour_family: ["match", "new", "blonde", "brown", "black", "red", "grey"].includes(String(a0.colour_family)) ? a0.colour_family : undefined,
              limit: typeof a0.limit === "number" ? Math.min(10, Math.max(1, a0.limit)) : 8,
            };
            args = clean as Record<string, unknown>;
            const rows = searchStyles(styles, passport, clean);
            rows.forEach((r) => known.add(r.variant_id));
            result = rows;
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
          case "suggest_brows_and_lashes":
            brows = suggestBrowsAndLashes(passport);
            result = brows;
            yield { type: "tool", name: "suggest_brows_and_lashes", label: "Matched brows and lashes", detail: `${brows.brow_label} brows, ${brows.lash_label.toLowerCase()} lashes` };
            break;
          case "shortlist": {
            const raw = (args.picks as { variant_id: string; why: string }[]) ?? [];
            const picks: GuidePick[] = [];
            for (const p of raw) {
              const f = findVariantIn(styles, p.variant_id);
              if (!f || !known.has(p.variant_id) || picks.some((x) => x.variant_id === p.variant_id)) continue;
              picks.push({
                variant_id: f.variant.id,
                style_id: f.style.id,
                title: `${f.style.name}, ${f.variant.colorName}`,
                why: String(p.why).slice(0, 220),
                overall: f.style.kind === "wig" ? fitSummary(styles, passport, f.variant.id)?.overall : undefined,
              });
            }
            if (!picks.length) throw new Error("model returned no valid picks");
            yield { type: "picks", picks: picks.slice(0, 4), brows: brows ?? suggestBrowsAndLashes(passport), note: String(args.note ?? "Here are a few looks to start with.").slice(0, 200) };
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
    yield* planWithRules(prompt, passport, styles);
  }
}
