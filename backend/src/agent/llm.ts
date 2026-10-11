import { env } from "../env";

// OpenAI-compatible chat completions with tool calling. Groq is the primary
// provider (fast, free tier); OpenRouter is the fallback.

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}
export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}
export interface ToolSpec {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

interface Provider {
  name: string;
  url: string;
  key: string;
  model: string;
}

function providers(): Provider[] {
  const list: Provider[] = [];
  if (env.groqKey) list.push({ name: "groq", url: "https://api.groq.com/openai/v1/chat/completions", key: env.groqKey, model: env.agentModel });
  if (env.openrouterKey) list.push({ name: "openrouter", url: "https://openrouter.ai/api/v1/chat/completions", key: env.openrouterKey, model: env.agentFallbackModel });
  return list;
}

export const llmConfigured = () => providers().length > 0;

export async function chat(messages: ChatMessage[], tools: ToolSpec[]): Promise<{ message: ChatMessage; model: string }> {
  let lastError: unknown = new Error("No LLM provider configured");
  for (const p of providers()) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 25_000);
      const r = await fetch(p.url, {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.key}`, "X-Title": "Bloom" },
        body: JSON.stringify({ model: p.model, messages, tools, tool_choice: "auto", temperature: 0.3, max_tokens: 900 }),
      });
      clearTimeout(timer);
      if (!r.ok) throw new Error(`${p.name} ${r.status}: ${(await r.text()).slice(0, 200)}`);
      const j = (await r.json()) as { choices?: { message: ChatMessage }[] };
      const message = j.choices?.[0]?.message;
      if (!message) throw new Error(`${p.name}: empty response`);
      return { message, model: `${p.name}/${p.model}` };
    } catch (e) {
      if (process.env.DEBUG_AGENT) console.error(`[guide] ${p.name} failed:`, (e as Error).message);
      lastError = e;
    }
  }
  throw lastError;
}
