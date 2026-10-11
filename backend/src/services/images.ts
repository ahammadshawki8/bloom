import crypto from "node:crypto";
import sharp from "sharp";

export class InputError extends Error {
  constructor(
    message: string,
    public readonly code = "bad_input",
  ) {
    super(message);
  }
}

const MAX_BYTES = 9 * 1024 * 1024;

/** Decodes a data URL (what the browser sends) into bytes. */
export function decodeDataUrl(dataUrl: string): Buffer {
  const m = /^data:image\/(png|jpe?g|webp);base64,(.+)$/i.exec(dataUrl ?? "");
  if (!m) throw new InputError("Please send the photo as a JPEG, PNG or WebP image.", "bad_photo");
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length > MAX_BYTES) throw new InputError("That photo is too large. Try one under 9 MB.", "photo_too_large");
  return bytes;
}

/**
 * Normalises a photo for the YouCam hair and makeup APIs: JPEG, upright,
 * long side at most 1024 px (their documented limit).
 */
export async function normalisePhoto(bytes: Buffer): Promise<Buffer> {
  try {
    return await sharp(bytes).rotate().resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer();
  } catch {
    throw new InputError("We couldn't read that image. Try another photo.", "bad_photo");
  }
}

export const sha256 = (bytes: Buffer | string) => crypto.createHash("sha256").update(bytes).digest("hex");

export const newId = (prefix = "") => `${prefix}${crypto.randomBytes(9).toString("base64url")}`;
