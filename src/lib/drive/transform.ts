// Per-supplier image fixes applied on the way into Drive (owner, 2026-09-13).
//
//   "rotate first image by 90 degrees that is coming from https://karavanrug.com/"
//   "remove background of the first image from both karavan and ecarpet gallery"
//   "the first photo scraped from KV cropped to a 2:3 ratio after rotating -90 degrees" (2026-09-27)
//   "apply the remove bg ... for all vendors" (2026-09-28): the studio's own store as well
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
import type { Supplier } from '../scrape/types.ts';

/** What can be done to a supplier photo before it is stored. */
export type ImageTransform = 'rotate90' | 'removeBackground' | 'crop2x3';

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

/** The vendors whose cover gets its backdrop removed: all three the scraper reads. */
const BACKGROUND_VENDORS: ReadonlySet<string> = new Set<Supplier>([
  'karavanrug',
  'ecarpetgallery',
  'serioludere',
]);

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
  // Every vendor's cover photo: both suppliers (owner, 2026-09-18) and the studio's own store
  // (2026-09-28). Switchable in src/lib/features.ts; off, the cover is stored exactly as the supplier
  // sent it (rotation aside). Owned stock and unknown hosts are never touched.
  if (FEATURES.backgroundRemoval && BACKGROUND_VENDORS.has(supplier)) out.push('removeBackground');
  // Last, and after the backdrop is gone (owner, 2026-09-27): backdropOf needs most of the border to
  // be plain white, and a cover cropped tight first would lose exactly that border.
  if (coverCrops(supplier)) out.push('crop2x3');
  return out;
}

/** Whether src/lib/features.ts has the 2:3 cover crop on for this supplier. */
function coverCrops(supplier: string): boolean {
  return (FEATURES.coverCrop2x3 as Readonly<Record<string, boolean>>)[supplier] === true;
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
  // ~6 MB as PNG. Alpha is stored losslessly so the soft edge survives.
  const out = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toBuffer();
  return new Uint8Array(out);
}

/* ---------- 2:3 cover crop (owner, 2026-09-27) ---------- */

/** Width over height of a stored cover: the 2:3 box the product card shows (ProductCard.astro). */
export const COVER_RATIO = 2 / 3;
/** Backdrop left around the rug, as a share of its longer side, so the frame does not touch it. */
const CROP_MARGIN = 0.04;
/**
 * A row or column belongs to the rug only when at least this share of it is rug. A few specks of JPEG
 * noise in the backdrop must not stretch the frame out to the edge of the photo.
 */
const LINE_SHARE = 0.005;
/** Below this alpha a pixel of an already cut-out cover is backdrop. */
const ALPHA_FLOOR = 128;

/** A rectangle in pixels. A crop frame may reach outside the photo: that part is padded. */
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** What surrounds the rug: nothing (already cut out), or a plain studio colour. */
type Backdrop = { kind: 'transparent' } | { kind: 'colour'; rgb: [number, number, number] };

function backdropAround(px: Uint8Array | Uint8ClampedArray, w: number, h: number): Backdrop | undefined {
  let n = 0;
  let clear = 0;
  const visit = (x: number, y: number): void => {
    n++;
    if (px[(y * w + x) * 4 + 3]! < ALPHA_FLOOR) clear++;
  };
  for (let x = 0; x < w; x++) {
    visit(x, 0);
    if (h > 1) visit(x, h - 1);
  }
  for (let y = 1; y < h - 1; y++) {
    visit(0, y);
    if (w > 1) visit(w - 1, y);
  }
  if (n > 0 && clear / n >= BORDER_WHITE_SHARE) return { kind: 'transparent' };
  const rgb = backdropOf(px, w, h);
  return rgb ? { kind: 'colour', rgb } : undefined;
}

/**
 * The rug's bounding box: every opaque pixel that is not backdrop, over rows and columns that carry
 * enough of it to be more than noise. Undefined when nothing stands out from the backdrop.
 */
export function subjectBox(
  px: Uint8Array | Uint8ClampedArray,
  w: number,
  h: number,
  bg: Backdrop,
): Box | undefined {
  const rows = new Uint32Array(h);
  const cols = new Uint32Array(w);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (px[i + 3]! < ALPHA_FLOOR) continue;
      if (bg.kind === 'colour') {
        const [r, g, b] = bg.rgb;
        const d = Math.max(Math.abs(px[i]! - r), Math.abs(px[i + 1]! - g), Math.abs(px[i + 2]! - b));
        if (d <= BG_TOLERANCE) continue;
      }
      rows[y]!++;
      cols[x]!++;
    }
  }
  const span = (counts: Uint32Array, min: number): [number, number] | undefined => {
    let first = -1;
    let last = -1;
    for (let i = 0; i < counts.length; i++) {
      if (counts[i]! < min) continue;
      if (first < 0) first = i;
      last = i;
    }
    return first < 0 ? undefined : [first, last];
  };
  // A row is `w` pixels long and a column `h`, so each is measured against its own length.
  const ys = span(rows, Math.max(2, Math.ceil(w * LINE_SHARE)));
  const xs = span(cols, Math.max(2, Math.ceil(h * LINE_SHARE)));
  if (!ys || !xs) return undefined;
  return { left: xs[0], top: ys[0], width: xs[1] - xs[0] + 1, height: ys[1] - ys[0] + 1 };
}

/** Where a frame of `size` starts along an edge of `extent`, centred on `centre`. */
function place(centre: number, size: number, extent: number): number {
  const start = Math.round(centre - size / 2);
  // It fits: slide it inside the photo rather than pad. Sliding never uncovers the rug — the frame is
  // at least as big as the rug, and it only moves towards the photo's own edge.
  if (size <= extent) return Math.min(Math.max(start, 0), extent - size);
  // It does not: padding is unavoidable, so keep the rug in the middle of it.
  return start;
}

/**
 * The 2:3 frame for a `w`×`h` photo whose rug sits in `box`: the rug plus a margin, widened or
 * heightened to exactly 2:3. The rug is always entirely inside it. Without a box, the plain centred
 * 2:3 crop of the whole photo.
 */
export function coverFrame(w: number, h: number, box?: Box): Box {
  if (!box) {
    if (w / h > COVER_RATIO) {
      const width = Math.round(h * COVER_RATIO);
      return { left: Math.floor((w - width) / 2), top: 0, width, height: h };
    }
    const height = Math.round(w / COVER_RATIO);
    return { left: 0, top: Math.floor((h - height) / 2), width: w, height };
  }
  const m = Math.round(Math.max(box.width, box.height) * CROP_MARGIN);
  let width = box.width + 2 * m;
  let height = box.height + 2 * m;
  if (width / height > COVER_RATIO) height = Math.round(width / COVER_RATIO);
  else width = Math.round(height * COVER_RATIO);
  return {
    left: place(box.left + box.width / 2, width, w),
    top: place(box.top + box.height / 2, height, h),
    width,
    height,
  };
}

/**
 * Crops a cover to 2:3 portrait around the rug (owner, 2026-09-27).
 *
 * Framed around the rug, never through it: spare backdrop is trimmed, and a rug too wide for 2:3 at
 * the photo's full height gets backdrop added at the top and bottom instead of losing its sides. The
 * padding is transparent on a cover whose backdrop was already removed, and the backdrop's own colour
 * otherwise. A photo with no plain backdrop, where the rug cannot be told apart, gets the plain
 * centred 2:3 crop.
 *
 * The format is kept. A frame that is already the whole photo returns the same bytes object, which is
 * how applyTransforms knows nothing happened.
 */
export async function cropTo2x3(bytes: Uint8Array, contentType: string): Promise<Uint8Array> {
  const { default: sharp } = await import('sharp');
  // Oriented first, in both passes, so the frame is measured on the pixels a viewer actually sees.
  const { data, info } = await sharp(bytes)
    .autoOrient()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const bg = backdropAround(data, w, h);
  const frame = coverFrame(w, h, bg && subjectBox(data, w, h, bg));
  if (frame.left === 0 && frame.top === 0 && frame.width === w && frame.height === h) return bytes;

  const left = Math.max(0, frame.left);
  const top = Math.max(0, frame.top);
  const right = Math.min(w, frame.left + frame.width);
  const bottom = Math.min(h, frame.top + frame.height);
  let img = sharp(bytes)
    .autoOrient()
    .extract({ left, top, width: right - left, height: bottom - top });
  const pad = {
    top: top - frame.top,
    bottom: frame.top + frame.height - bottom,
    left: left - frame.left,
    right: frame.left + frame.width - right,
  };
  if (pad.top || pad.bottom || pad.left || pad.right) {
    const background =
      bg?.kind === 'colour'
        ? { r: Math.round(bg.rgb[0]), g: Math.round(bg.rgb[1]), b: Math.round(bg.rgb[2]), alpha: 1 }
        : { r: 0, g: 0, b: 0, alpha: 0 };
    img = img.extend({ ...pad, background });
  }
  // WebP exactly as removeBackground writes it, alpha lossless, so the soft edge of a cut-out
  // survives the second encode.
  const mime = bareMime(contentType);
  if (mime === 'image/webp') img = img.webp({ quality: 90, alphaQuality: 100 });
  else if (mime === 'image/jpeg') img = img.jpeg({ quality: 90 });
  else if (mime === 'image/png') img = img.png();
  return new Uint8Array(await img.toBuffer());
}

export interface TransformInput {
  bytes: Uint8Array;
  contentType: string;
}

export interface TransformOutcome extends TransformInput {
  /** What actually ran — `removeBackground` and `crop2x3` are omitted when they were no-ops. */
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
      } else if (t === 'crop2x3') {
        // Same rule: a cover that is already a tight 2:3 comes back as the same bytes, unclaimed.
        const next = await cropTo2x3(bytes, contentType);
        if (next !== bytes) {
          bytes = next;
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
