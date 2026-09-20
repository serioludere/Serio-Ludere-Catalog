// Per-supplier image fixes applied on the way into Drive (owner, 2026-09-13).
//
//   "rotate first image by 90 degrees that is coming from https://karavanrug.com/"
//   "remove background of the first image from both karavan and ecarpet gallery"
//
// Applied to the BYTES at import, not with a CSS transform at display. The rug's photos are the
// studio's own asset afterwards — they are re-used in exports, sent to buyers, and opened straight
// out of Drive — so a file that is correct only inside this website is not actually correct. It also
// means the fix happens once per photo rather than on every page view.
//
// This is deliberately separate from the existing `rotate` flag (ADR D6), which is a DISPLAY hint
// for portrait plates and applies to the whole rug. That flag answers "how should this rug be shown
// in its plate"; this module answers "did the supplier hand us the file the wrong way up".

import { FEATURES } from '../features.ts';

/** What can be done to a supplier photo before it is stored. */
export type ImageTransform = 'rotate90' | 'removeBackground';

/**
 * The media type without its parameters.
 *
 * Duplicated from upload.ts's `mimeOf` rather than imported: upload.ts imports THIS module, and a
 * two-line normaliser is a far smaller cost than a circular import between them.
 */
function bareMime(contentType: string | null | undefined): string {
  return (contentType ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
}

/** Formats sharp can decode and re-encode losslessly enough to be worth rewriting. */
const TRANSFORMABLE = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/tiff']);

/**
 * The transforms a given photo earns.
 *
 * `index` is the photo's position in the import, so "first image" means exactly that — the one the
 * card shows. Everything after it is left as the supplier sent it.
 */
export function transformsFor(supplier: string, index: number): ImageTransform[] {
  if (index !== 0) return [];
  const out: ImageTransform[] = [];
  if (supplier === 'karavanrug') out.push('rotate90');
  // Both suppliers' cover photos (owner, 2026-09-18). Switchable in src/lib/features.ts; off, the
  // cover is stored exactly as the supplier sent it (rotation aside).
  if (FEATURES.backgroundRemoval && (supplier === 'karavanrug' || supplier === 'ecarpetgallery'))
    out.push('removeBackground');
  return out;
}

/**
 * Rotates a quarter turn ANTI-clockwise (owner, 2026-09-20: "to the left, not to the right").
 *
 * It turned clockwise from 2026-09-13, which was a guess made when the direction had not been said.
 * The name is kept: it is the transform's identity across the sheet, the audit log and every caller,
 * and "rotate90" says how far, not which way.
 *
 * sharp is imported dynamically: it is a native module that Astro already pulls in, and loading it
 * eagerly would drag it into every context that touches Drive, tests included.
 */
export async function rotate90(bytes: Uint8Array): Promise<Uint8Array> {
  const { default: sharp } = await import('sharp');
  // `withMetadata()` keeps the EXIF orientation flag consistent with the pixels we just moved;
  // without it a viewer that honours EXIF would helpfully rotate the image back again.
  const out = await sharp(bytes).rotate(270).withMetadata().toBuffer();
  return new Uint8Array(out);
}

/* ---------- background removal (owner, 2026-09-18) ---------- */

/**
 * A pixel within this distance of the backdrop colour (largest per-channel difference, 0-255) is
 * backdrop. Loose enough for JPEG noise on a white sweep; tight enough that cream wool is not.
 */
export const BG_TOLERANCE = 26;
/** Between the tolerance and this, an outline pixel is part-transparent: a soft edge, not a jagged one. */
const BG_SOFT = 60;
/** Share of the photo's border that must be plain near-white before anything is removed at all. */
const BORDER_WHITE_SHARE = 0.6;
/** A border pixel this bright on every channel counts as studio white. */
const WHITE_FLOOR = 225;

/**
 * The backdrop colour, when the photo has a plain light studio backdrop: the average of the
 * near-white pixels on its border, if they are most of the border. Anything else — a room shot, a
 * photo cropped tight to the rug, a dark sweep — returns undefined and the photo is left alone.
 */
export function backdropOf(
  px: Uint8Array | Uint8ClampedArray,
  w: number,
  h: number,
): [number, number, number] | undefined {
  let n = 0;
  let white = 0;
  let r = 0;
  let g = 0;
  let b = 0;
  const visit = (x: number, y: number): void => {
    const i = (y * w + x) * 4;
    n++;
    if (Math.min(px[i]!, px[i + 1]!, px[i + 2]!) >= WHITE_FLOOR) {
      white++;
      r += px[i]!;
      g += px[i + 1]!;
      b += px[i + 2]!;
    }
  };
  for (let x = 0; x < w; x++) {
    visit(x, 0);
    if (h > 1) visit(x, h - 1);
  }
  for (let y = 1; y < h - 1; y++) {
    visit(0, y);
    if (w > 1) visit(w - 1, y);
  }
  if (n === 0 || white / n < BORDER_WHITE_SHARE) return undefined;
  return [r / white, g / white, b / white];
}

/**
 * Makes the backdrop transparent, in place, on RGBA pixels. Returns how many pixels were cleared.
 *
 * A flood fill from the border, not a colour key: only backdrop CONNECTED to the edge of the photo
 * goes, so white motifs inside the rug — which never touch the edge — stay. Pixels just past the
 * tolerance on the rug's outline get partial alpha, so the edge is soft rather than stair-stepped.
 */
export function clearBackdrop(
  px: Uint8Array | Uint8ClampedArray,
  w: number,
  h: number,
  bg: readonly [number, number, number],
): number {
  const total = w * h;
  const dist = (p: number): number => {
    const i = p * 4;
    return Math.max(Math.abs(px[i]! - bg[0]), Math.abs(px[i + 1]! - bg[1]), Math.abs(px[i + 2]! - bg[2]));
  };
  const cleared = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;
  const take = (p: number): void => {
    if (!cleared[p] && dist(p) <= BG_TOLERANCE) {
      cleared[p] = 1;
      queue[tail++] = p;
    }
  };
  for (let x = 0; x < w; x++) {
    take(x);
    take((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    take(y * w);
    take(y * w + w - 1);
  }
  while (head < tail) {
    const p = queue[head++]!;
    const x = p % w;
    if (x > 0) take(p - 1);
    if (x < w - 1) take(p + 1);
    if (p >= w) take(p - w);
    if (p < total - w) take(p + w);
  }
  for (let p = 0; p < total; p++) {
    if (cleared[p]) {
      px[p * 4 + 3] = 0;
      continue;
    }
    const x = p % w;
    const outline =
      (x > 0 && cleared[p - 1]) ||
      (x < w - 1 && cleared[p + 1]) ||
      (p >= w && cleared[p - w]) ||
      (p < total - w && cleared[p + w]);
    if (!outline) continue;
    const d = dist(p);
    if (d < BG_SOFT) {
      const a = Math.round(((d - BG_TOLERANCE) / (BG_SOFT - BG_TOLERANCE)) * 255);
      px[p * 4 + 3] = Math.min(px[p * 4 + 3]!, Math.max(0, a));
    }
  }
  return tail;
}

/**
 * Background removal for a rug shot on a plain light studio backdrop — which is how both suppliers
 * photograph their covers. Free, local and instant: sharp plus a flood fill, no model, no service.
 *
 * It removes a plain backdrop, not any background. A photo without one (see backdropOf) comes back
 * unchanged, and so does one where the fill would clear almost nothing or almost everything — both
 * mean the photo is not what this was built for. "Unchanged" is the same bytes object, which is how
 * applyTransforms knows nothing happened. The output is WebP with transparency.
 */
export async function removeBackground(bytes: Uint8Array): Promise<Uint8Array> {
  const { default: sharp } = await import('sharp');
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const bg = backdropOf(data, w, h);
  if (!bg) return bytes;
  const share = clearBackdrop(data, w, h, bg) / (w * h);
  if (share < 0.01 || share > 0.97) return bytes;
  // WebP, not PNG: it keeps the transparency at a fraction of the size — a 2048px Karavan cover is
  // ~6 MB as PNG, over the 5 MB upload cap. Alpha is stored losslessly so the soft edge survives.
  const out = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toBuffer();
  return new Uint8Array(out);
}

export interface TransformInput {
  bytes: Uint8Array;
  contentType: string;
}

export interface TransformOutcome extends TransformInput {
  /** What actually ran — `removeBackground` is omitted while it is a no-op. */
  applied: ImageTransform[];
  /** Set when a transform was wanted but could not run; the ORIGINAL bytes are returned. */
  skipped?: string;
}

/**
 * Runs the transforms this photo earns, and never fails the import.
 *
 * A photo that cannot be rotated is still a photo the owner wants in Drive. Losing an import because
 * sharp could not decode an unusual file — or is not installed on the host at all — would trade a
 * cosmetic problem for a missing product image, so every failure falls back to the original bytes
 * and reports itself through `skipped`.
 */
export async function applyTransforms(
  input: TransformInput,
  opts: { supplier: string; index: number },
): Promise<TransformOutcome> {
  const wanted = transformsFor(opts.supplier, opts.index);
  if (wanted.length === 0) return { ...input, applied: [] };

  const mime = bareMime(input.contentType);
  if (!TRANSFORMABLE.has(mime)) {
    return { ...input, applied: [], skipped: `cannot transform ${mime || 'unknown type'}` };
  }

  let bytes = input.bytes;
  let contentType = input.contentType;
  const applied: ImageTransform[] = [];
  try {
    for (const t of wanted) {
      if (t === 'rotate90') {
        bytes = await rotate90(bytes);
        applied.push(t);
      } else if (t === 'removeBackground') {
        const next = await removeBackground(bytes);
        // Only claim it ran if it actually changed something: a photo without a plain backdrop
        // comes back as the same bytes, still in its original format.
        if (next !== bytes) {
          bytes = next;
          contentType = 'image/webp';
          applied.push(t);
        }
      }
    }
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return { ...input, applied: [], skipped: detail };
  }
  return { bytes, contentType, applied };
}
