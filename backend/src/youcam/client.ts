import crypto from "node:crypto";
import { env } from "../env";

// YouCam API (Perfect Corp) S2S client: auth, file upload, task start, polling.
// Units are consumed only when a task succeeds.

const BASE = "https://yce-api-01.perfectcorp.com";

export class YouCamError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 502,
  ) {
    super(message);
  }
}

let bearer: string | null = null;
let legacyUntil = 0;

async function legacyToken(): Promise<string> {
  const pub = crypto.createPublicKey({ key: Buffer.from(env.youcamSecret, "base64"), format: "der", type: "spki" });
  const id_token = crypto
    .publicEncrypt({ key: pub, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(`client_id=${env.youcamKey}&timestamp=${Date.now()}`))
    .toString("base64");
  const r = await fetch(`${BASE}/s2s/v1.0/client/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: env.youcamKey, id_token }),
  });
  const j = (await r.json().catch(() => null)) as { result?: { access_token?: string }; data?: { access_token?: string } } | null;
  const token = j?.result?.access_token ?? j?.data?.access_token;
  if (!token) throw new YouCamError("YouCam authentication failed", "youcam_auth");
  legacyUntil = Date.now() + 110 * 60_000;
  return token;
}

async function call<T = unknown>(method: "GET" | "POST", path: string, body?: unknown, retried = false): Promise<{ status: number; json: T }> {
  if (!env.youcamKey || !env.youcamSecret) throw new YouCamError("YouCam keys are not configured", "youcam_unconfigured", 503);
  if (!bearer || (bearer !== env.youcamKey && Date.now() > legacyUntil)) bearer = env.youcamKey;
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401 && !retried) {
    bearer = await legacyToken();
    return call(method, path, body, true);
  }
  return { status: r.status, json: (await r.json().catch(() => null)) as T };
}

interface FileInit {
  data?: { files?: { file_id: string; requests?: { url: string; method?: string; headers?: Record<string, string> }[] }[] };
}

/** Uploads image bytes through the File API (presigned PUT). Returns a file_id. */
export async function uploadImage(bytes: Buffer, mime = "image/jpeg"): Promise<string> {
  const ext = mime === "image/png" ? "png" : "jpg";
  const init = await call<FileInit>("POST", "/s2s/v2.0/file", { files: [{ content_type: mime, file_name: `bloom.${ext}`, file_size: bytes.length }] });
  const f = init.json?.data?.files?.[0];
  const req = f?.requests?.[0];
  if (!f || !req) throw new YouCamError("Could not start the photo upload", "youcam_upload");
  const put = await fetch(req.url, { method: req.method ?? "PUT", headers: req.headers ?? { "Content-Type": mime }, body: new Uint8Array(bytes) });
  if (!put.ok) throw new YouCamError("The photo upload failed", "youcam_upload");
  return f.file_id;
}

interface TaskStatus {
  data?: { task_id?: string; task_status?: string; error?: string; error_message?: string; results?: Record<string, unknown> };
  error?: string;
  error_code?: string;
}

/** Starts a task and polls until it succeeds or fails. Returns `data.results`. */
export async function runTask<R = Record<string, unknown>>(path: string, body: unknown, { intervalMs = 2000, timeoutMs = 90_000 } = {}): Promise<R> {
  const start = await call<TaskStatus>("POST", path, body);
  const id = start.json?.data?.task_id;
  if (!id) throw new YouCamError(start.json?.error ?? "YouCam rejected the request", start.json?.error_code ?? "youcam_rejected", start.status === 400 ? 400 : 502);
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const s = await call<TaskStatus>("GET", `${path}/${encodeURIComponent(id)}`);
    const st = s.json?.data?.task_status;
    if (st === "running" || st === "pending") continue;
    if (st === "success") return (s.json?.data?.results ?? {}) as R;
    const code = s.json?.data?.error ?? "youcam_task_error";
    throw new YouCamError(s.json?.data?.error_message ?? code, code, 422);
  }
  throw new YouCamError("YouCam took too long", "youcam_timeout", 504);
}

export async function download(url: string): Promise<{ bytes: Buffer; mime: string }> {
  const r = await fetch(url);
  if (!r.ok) throw new YouCamError("Could not fetch the result image", "youcam_download");
  return { bytes: Buffer.from(await r.arrayBuffer()), mime: r.headers.get("content-type") ?? "image/jpeg" };
}

export const resultUrl = (results: Record<string, unknown>): string | undefined =>
  (results.url as string | undefined) ?? (results.urls as string[] | undefined)?.[0];

/** Plain-language fixes for YouCam's photo errors. */
export const FRIENDLY: Record<string, string> = {
  error_no_shoulder: "We need to see your shoulders. Step back a little and try again.",
  error_hair_too_short: "This works best with hair down to at least the chin. A photo from before is perfect.",
  error_large_face_angle: "Look straight at the camera and try again.",
  error_face_pose: "Keep your head level and look straight ahead.",
  error_insufficient_landmarks: "We couldn't see your whole face. Try a clearer, well-lit photo.",
  error_insufficient_lighting: "The photo is a little dark. Try facing a window.",
  error_face_angle_invalid: "Look straight at the camera, keeping your head level.",
  error_no_face: "We couldn't find a face in that photo.",
};
