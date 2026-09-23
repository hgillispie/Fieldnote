import { v2 as cloudinary } from "cloudinary";

/**
 * ENTERPRISE PATTERN: DAM COEXISTENCE (Cloudinary + Builder Asset Manager)
 *
 * Server-only setup logic — this file uses `CLOUDINARY_API_SECRET`, which
 * must never reach a client bundle (unlike `CLOUDINARY_CLOUD_NAME`, which is
 * safe to expose — see `.env.example`). It's only ever imported from
 * `scripts/setup-cloudinary.ts`, a one-time/idempotent setup script, never
 * from anything that ships to the browser.
 *
 * Ensures the unsigned upload preset the Cloudinary picker plugin depends on
 * (`src/lib/cloudinary/builder-plugin.tsx`) exists before that plugin is
 * ever used, without needing anyone to click through the Cloudinary console
 * by hand. Safe to run repeatedly — it checks for the preset first and only
 * creates it if missing, so re-running this script in CI or a fresh
 * environment never fails or duplicates the preset.
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const CLOUDINARY_UPLOAD_PRESET = "fieldnote_unsigned";
export const CLOUDINARY_UPLOAD_FOLDER = "fieldnote-demo";

interface CloudinaryApiError {
  http_code?: number;
  error?: { http_code?: number; message?: string };
}

export async function ensureUploadPreset(): Promise<{ created: boolean }> {
  try {
    await cloudinary.api.upload_preset(CLOUDINARY_UPLOAD_PRESET);
    return { created: false };
  } catch (error) {
    const apiError = error as CloudinaryApiError;
    const httpCode = apiError.http_code ?? apiError.error?.http_code;
    if (httpCode !== 404) {
      throw error;
    }

    // ENTERPRISE PATTERN: DAM COEXISTENCE — unsigned upload preset
    //
    // `unsigned: true` is what makes it safe for the Cloudinary Upload
    // Widget to run entirely in the browser, inside Builder's Visual
    // Editor, with no server round-trip and no secret anywhere in the
    // client bundle. An unsigned preset is a named, admin-configured set of
    // upload rules (destination folder, allowed formats, transformations)
    // that Cloudinary enforces on its end — the browser only ever sends the
    // cloud name (public) and this preset's name (also fine to expose), never
    // the API key/secret pair used below to create it.
    //
    // The alternative, a SIGNED upload, requires computing an HMAC signature
    // with the API secret for every upload request — which means that
    // signing must happen server-side (e.g. a Route Handler the browser
    // calls first to get a signature), because doing it in the browser
    // would mean shipping the secret to every visitor. Signed uploads buy
    // tighter per-upload control (arbitrary transformations/params chosen
    // at request time, expiring signatures) at the cost of that extra
    // server round-trip; unsigned presets trade some of that flexibility
    // for a simpler, fully client-side picker — the right trade for an
    // internal content-editor tool like this one, where the upload
    // destination and rules are the same on every use.
    await cloudinary.api.create_upload_preset({
      name: CLOUDINARY_UPLOAD_PRESET,
      unsigned: true,
      folder: CLOUDINARY_UPLOAD_FOLDER,
    });
    return { created: true };
  }
}
