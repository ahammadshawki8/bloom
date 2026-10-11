// An anonymous, per-browser id so the backend can apply a fair per-visit try-on
// limit. Not an account; it carries no personal data.
let cached: string | null = null;

export function sessionId(): string {
  if (cached) return cached;
  try {
    cached = localStorage.getItem("bloom.session");
    if (!cached) {
      cached = crypto.randomUUID().replace(/-/g, "");
      localStorage.setItem("bloom.session", cached);
    }
  } catch {
    cached ??= Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  return cached;
}
