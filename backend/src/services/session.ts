import type { FastifyRequest } from "fastify";

/** The session a request belongs to: a random id the browser keeps (no accounts). */
export function sessionOf(req: FastifyRequest): string {
  const h = req.headers["x-bloom-session"];
  const s = Array.isArray(h) ? h[0] : h;
  return s && /^[\w-]{8,64}$/.test(s) ? s : `anon:${req.ip}`;
}
