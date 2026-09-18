// Per-supplier image fixes on the way into Drive (owner, 2026-09-13).
//
// The policy half is pure and cheap to test. The rotation half is tested against REAL sharp on a
// real image, because "did the pixels actually move" is the only question worth asking of it — a
// mocked sharp would prove nothing except that the call was made.
import { describe, expect, it } from 'vitest';
import {
  applyTransforms,
  removeBackground,
  rotate90,
  transformsFor,
} from '../../../src/lib/drive/transform.ts';
import { FEATURES } from '../../../src/lib/features.ts';

/** A 60×30 landscape PNG — deliberately not square, so a rotation is visible in the dimensions. */
async function landscapePng(): Promise<Uint8Array> {
  const { default: sharp } = await import('sharp');
  const buf = await sharp({
    create: { width: 60, height: 30, channels: 3, background: { r: 200, g: 40, b: 40 } },
  })
    .png()
    .toBuffer();
  return new Uint8Array(buf);
}

async function sizeOf(bytes: Uint8Array): Promise<{ width?: number; height?: number }> {
  const { default: sharp } = await import('sharp');
  const { width, height } = await sharp(bytes).metadata();
  return { width, height };
}

describe('transformsFor', () => {
  it('rotates only the FIRST Karavan photo', () => {
    expect(transformsFor('karavanrug', 0)).toContain('rotate90');
    expect(transformsFor('karavanrug', 1)).toEqual([]);
    expect(transformsFor('karavanrug', 7)).toEqual([]);
  });

  it('never rotates ecarpetgallery — only Karavan sends them the wrong way up', () => {
    expect(transformsFor('ecarpetgallery', 0)).not.toContain('rotate90');
  });

  it('asks for background removal on both suppliers first image', () => {
    expect(transformsFor('karavanrug', 0)).toContain('removeBackground');
    expect(transformsFor('ecarpetgallery', 0)).toContain('removeBackground');
  });

  it('drops background removal — and only that — when the feature is switched off', () => {
    const flags = FEATURES as { backgroundRemoval: boolean };
    flags.backgroundRemoval = false;
    try {
      expect(transformsFor('karavanrug', 0)).toEqual(['rotate90']);
      expect(transformsFor('ecarpetgallery', 0)).toEqual([]);
    } finally {
      flags.backgroundRemoval = true;
    }
  });

  it('leaves owned stock and unknown suppliers completely alone', () => {
    expect(transformsFor('', 0)).toEqual([]);
    expect(transformsFor('somewhere-else', 0)).toEqual([]);
  });
});

describe('rotate90', () => {
  it('actually turns the image a quarter turn', async () => {
    const before = await landscapePng();
    expect(await sizeOf(before)).toMatchObject({ width: 60, height: 30 });
    const after = await rotate90(before);
    // 60×30 landscape becomes 30×60 portrait. This is the whole point of the feature.
    expect(await sizeOf(after)).toMatchObject({ width: 30, height: 60 });
  });
});

/**
 * A "studio shot": an 80×60 white sweep with a red 40×30 rug in the middle, and a white motif in the
 * middle of the rug — white that does NOT touch the edge and so must survive the fill.
 */
async function rugOnWhite(): Promise<Uint8Array> {
  const { default: sharp } = await import('sharp');
  const w = 80;
  const h = 60;
  const px = Buffer.alloc(w * h * 3, 250); // slightly off-white, like a real sweep
  for (let y = 15; y < 45; y++)
    for (let x = 20; x < 60; x++) {
      const inMotif = x >= 38 && x < 42 && y >= 28 && y < 32;
      const i = (y * w + x) * 3;
      px[i] = inMotif ? 255 : 180;
      px[i + 1] = inMotif ? 255 : 30;
      px[i + 2] = inMotif ? 255 : 40;
    }
  return new Uint8Array(
    await sharp(px, { raw: { width: w, height: h, channels: 3 } })
      .png()
      .toBuffer(),
  );
}

async function alphaAt(bytes: Uint8Array, x: number, y: number): Promise<number> {
  const { default: sharp } = await import('sharp');
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return data[(y * info.width + x) * 4 + 3]!;
}

describe('removeBackground', () => {
  it('makes a plain white studio backdrop transparent and keeps the rug, white motifs included', async () => {
    const out = await removeBackground(await rugOnWhite());
    expect(await alphaAt(out, 2, 2)).toBe(0); // corner: backdrop
    expect(await alphaAt(out, 10, 30)).toBe(0); // left of the rug: backdrop
    expect(await alphaAt(out, 25, 20)).toBe(255); // the rug
    expect(await alphaAt(out, 40, 30)).toBe(255); // white motif INSIDE the rug stays
    expect(await sizeOf(out)).toMatchObject({ width: 80, height: 60 });
  });

  it('leaves a photo without a plain light backdrop alone — the very same bytes', async () => {
    // Solid red edge to edge: no studio white on the border, so there is nothing it should touch.
    const bytes = await landscapePng();
    expect(await removeBackground(bytes)).toBe(bytes);
  });
});

describe('applyTransforms', () => {
  it('rotates the primary Karavan photo and reports what it did', async () => {
    const bytes = await landscapePng();
    const out = await applyTransforms(
      { bytes, contentType: 'image/png' },
      { supplier: 'karavanrug', index: 0 },
    );
    expect(out.applied).toEqual(['rotate90']);
    expect(out.skipped).toBeUndefined();
    expect(await sizeOf(out.bytes)).toMatchObject({ width: 30, height: 60 });
  });

  it('does not claim removeBackground ran on a photo it left alone', async () => {
    const bytes = await landscapePng();
    const out = await applyTransforms(
      { bytes, contentType: 'image/png' },
      { supplier: 'karavanrug', index: 0 },
    );
    // transformsFor asks for it; applyTransforms must not report work that did not happen.
    expect(transformsFor('karavanrug', 0)).toContain('removeBackground');
    expect(out.applied).not.toContain('removeBackground');
    expect(out.contentType).toBe('image/png');
  });

  it('cuts out a studio-shot cover — rotated first for Karavan — and stores it as WebP', async () => {
    const kv = await applyTransforms(
      { bytes: await rugOnWhite(), contentType: 'image/jpeg' },
      { supplier: 'karavanrug', index: 0 },
    );
    expect(kv.applied).toEqual(['rotate90', 'removeBackground']);
    expect(kv.contentType).toBe('image/webp');
    expect(await sizeOf(kv.bytes)).toMatchObject({ width: 60, height: 80 });
    expect(await alphaAt(kv.bytes, 1, 1)).toBe(0);

    const ecg = await applyTransforms(
      { bytes: await rugOnWhite(), contentType: 'image/jpeg' },
      { supplier: 'ecarpetgallery', index: 0 },
    );
    expect(ecg.applied).toEqual(['removeBackground']);
    expect(ecg.contentType).toBe('image/webp');
  });

  it('never cuts out anything but the cover', async () => {
    const bytes = await rugOnWhite();
    const out = await applyTransforms(
      { bytes, contentType: 'image/png' },
      { supplier: 'ecarpetgallery', index: 1 },
    );
    expect(out.bytes).toBe(bytes);
  });

  it('passes a non-primary photo straight through, untouched and un-re-encoded', async () => {
    const bytes = await landscapePng();
    const out = await applyTransforms(
      { bytes, contentType: 'image/png' },
      { supplier: 'karavanrug', index: 2 },
    );
    expect(out.applied).toEqual([]);
    expect(out.bytes).toBe(bytes); // the same object: nothing was decoded or re-encoded
  });

  it('passes an ecarpetgallery primary through unchanged, since only removal was asked for', async () => {
    const bytes = await landscapePng();
    const out = await applyTransforms(
      { bytes, contentType: 'image/png' },
      { supplier: 'ecarpetgallery', index: 0 },
    );
    expect(out.applied).toEqual([]);
    expect(await sizeOf(out.bytes)).toMatchObject({ width: 60, height: 30 });
  });

  it('keeps the original when the format cannot be transformed, rather than failing the import', async () => {
    const bytes = new Uint8Array([0, 1, 2]);
    const out = await applyTransforms(
      { bytes, contentType: 'image/gif' },
      { supplier: 'karavanrug', index: 0 },
    );
    expect(out.bytes).toBe(bytes);
    expect(out.applied).toEqual([]);
    expect(out.skipped).toMatch(/image\/gif/);
  });

  it('keeps the original when the bytes are not a decodable image', async () => {
    // A photo that cannot be rotated is still a photo the studio wants in Drive.
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    const out = await applyTransforms(
      { bytes, contentType: 'image/png' },
      { supplier: 'karavanrug', index: 0 },
    );
    expect(out.bytes).toBe(bytes);
    expect(out.applied).toEqual([]);
    expect(out.skipped).toBeTruthy();
  });

  it('reads the content type with its parameters attached', async () => {
    const bytes = await landscapePng();
    const out = await applyTransforms(
      { bytes, contentType: 'image/png; charset=binary' },
      { supplier: 'karavanrug', index: 0 },
    );
    expect(out.applied).toEqual(['rotate90']);
  });
});
