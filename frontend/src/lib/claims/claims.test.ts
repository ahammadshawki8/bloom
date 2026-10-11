import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Claim linter: Bloom is a cosmetic tool. User-facing copy must never promise a
// medical outcome. Some words are allowed only when negated ("never diagnoses").
// A reviewed exception is written on the line above as: // claims-ok: <reason>

const ROOT = path.resolve(import.meta.dirname, "../..");
const FORBIDDEN: { re: RegExp; why: string }[] = [
  { re: /\bcur(e|es|ed|ing)\b/i, why: "cure claims" },
  { re: /\bheal(s|ing|ed)?\b/i, why: "healing claims" },
  { re: /\bregrow(s|th)?\b/i, why: "regrowth claims" },
  { re: /\bprevents? hair loss\b/i, why: "prevention claims" },
  { re: /\bstops? hair loss\b/i, why: "prevention claims" },
  { re: /\bclinically (proven|tested)\b/i, why: "clinical claims" },
];
const ONLY_NEGATED: RegExp[] = [/\bdiagnos(e|es|is|ing)\b/i, /\bmedical advice\b/i, /\bguarantee/i, /\btreats?\b(?!ment)/i];
const NEGATION = /\b(no|not|never|without|nor)\b|n['’]t\b/i;

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "claims" ? [] : files(p);
    return /\.(tsx?|mdx?)$/.test(e.name) && !e.name.endsWith(".test.ts") ? [p] : [];
  });
}

export function lintSource(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const problems: string[] = [];
  lines.forEach((raw, i) => {
    const line = raw.replace(/&apos;|&#39;/g, "'");
    if (/^\s*(import|\/\/|\*)/.test(line)) return;
    if (/claims-ok: \S/.test(lines[i - 1] ?? "")) return;
    for (const { re, why } of FORBIDDEN) if (re.test(line)) problems.push(`${i + 1} ${why}: ${line.trim()}`);
    for (const re of ONLY_NEGATED) if (re.test(line) && !NEGATION.test(line)) problems.push(`${i + 1} un-negated "${re.source}": ${line.trim()}`);
  });
  return problems;
}

describe("claim linter", () => {
  it("catches a medical claim and allows a negated one", () => {
    expect(lintSource(`<p>Our serum helps hair regrowth.</p>`)).toHaveLength(1);
    expect(lintSource(`<p>Bloom doesn&apos;t diagnose anything.</p>`)).toHaveLength(0);
    expect(lintSource(`<p>We diagnose your scalp.</p>`)).toHaveLength(1);
  });

  it("finds no medical claims in the app's copy", () => {
    const sources = files(ROOT);
    expect(sources.length).toBeGreaterThan(20);
    const problems = sources.flatMap((f) => lintSource(fs.readFileSync(f, "utf8")).map((p) => `${path.relative(ROOT, f)}:${p}`));
    expect(problems).toEqual([]);
  });
});
