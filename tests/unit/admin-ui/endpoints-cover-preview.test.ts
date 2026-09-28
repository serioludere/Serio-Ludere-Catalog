// GET /api/admin/cover-preview (owner, 2026-09-28): the add form's first photo as it will be stored.
// The downloader is replaced; the transforms are the real ones, on real sharp, because "does the
// preview match what the import stores" is only answered by running the import's own code.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { APIContext } from 'astro';
import { apiContext } from './fake-sheets.ts';
import { RateLimiter } from '../../../src/lib/votes/ratelimit.ts';

const state = vi.hoisted(() => ({ download: vi.fn() }));

vi.mock('astro:env/server', async () => ({ ...(await import('./fake-sheets.ts')).ENV_MOCK }));
vi.mock('../../../src/lib/runtime.ts', () => ({
  getAdminDeps: () => ({ downloadImage: (url: string) => state.download(url) }),
}));

import { newSession } from '../../../src/lib/admin/auth.ts';
import { ADMIN_RATES, adminRuntime } from '../../../src/lib/admin/http.ts';
import { DownloadError } from '../../../src/lib/drive/upload.ts';
import { GET } from '../../../src/pages/api/admin/cover-preview.ts';

const session = newSession('owner', Date.now());
const PHOTO = 'https://cdn.shopify.com/s/files/1/0759/3807/0707/files/cover.jpg?v=1&width=1600';

const get = (query: Record<string, string>, withSession = true): Promise<Response> =>
  GET(
    apiContext({
      path: `/api/admin/cover-preview?${new URLSearchParams(query).toString()}`,
      ...(withSession ? { session } : {}),
    }) as unknown as APIContext,
  ) as Promise<Response>;

/** An 80×60 studio shot: a red 40×30 rug on an off-white sweep, as a PNG. */
async function studioShot(): Promise<Uint8Array> {
  const { default: sharp } = await import('sharp');
  const w = 80;
  const h = 60;
  const px = Buffer.alloc(w * h * 3, 250);
  for (let y = 15; y < 45; y++) for (let x = 20; x < 60; x++) px.set([180, 30, 40], (y * w + x) * 3);
  return new Uint8Array(
    await sharp(px, { raw: { width: w, height: h, channels: 3 } })
      .png()
      .toBuffer(),
  );
}

async function sizeOf(res: Response): Promise<{ width?: number; height?: number; format?: string }> {
  const { default: sharp } = await import('sharp');
  const { width, height, format } = await sharp(new Uint8Array(await res.arrayBuffer())).metadata();
  return { width, height, format };
}

beforeEach(() => {
  adminRuntime.limiter = new RateLimiter({ maxKeys: 1000 });
  state.download.mockReset();
});

describe('GET /api/admin/cover-preview', () => {
  it('answers with the Karavan cover exactly as the import stores it: turned, cut out, 2:3', async () => {
    state.download.mockResolvedValue({ bytes: await studioShot(), contentType: 'image/png' });
    const res = await get({ url: PHOTO, supplier: 'karavanrug' });
    expect(res.status).toBe(200);
    expect(state.download).toHaveBeenCalledWith(PHOTO);
    expect(res.headers.get('content-type')).toBe('image/webp');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-cover-transforms')).toBe('rotate90,removeBackground,crop2x3');
    // 80×60 turned to 60×80, then framed around the 30×40 rug: the same 34×51 the import makes.
    expect(await sizeOf(res)).toMatchObject({ width: 34, height: 51, format: 'webp' });
  });

  it('cuts out an ecarpetgallery or own-store cover without turning or cropping it', async () => {
    for (const supplier of ['ecarpetgallery', 'serioludere']) {
      state.download.mockResolvedValue({ bytes: await studioShot(), contentType: 'image/png' });
      const res = await get({ url: PHOTO, supplier });
      expect(res.status).toBe(200);
      expect(res.headers.get('x-cover-transforms')).toBe('removeBackground');
      expect(await sizeOf(res)).toMatchObject({ width: 80, height: 60, format: 'webp' });
    }
  });

  it('shows a photo it cannot transform as it is, rather than failing', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    state.download.mockResolvedValue({ bytes, contentType: 'image/png' });
    const res = await get({ url: PHOTO, supplier: 'karavanrug' });
    expect(res.status).toBe(200);
    expect(res.headers.get('x-cover-transforms')).toBe('none');
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(bytes);
  });

  it('refuses a request without an https photo or a known vendor, and downloads nothing', async () => {
    const queries: Array<Record<string, string>> = [
      { supplier: 'karavanrug' },
      { url: PHOTO },
      { url: PHOTO, supplier: '' },
      { url: PHOTO, supplier: 'somewhere-else' },
      { url: 'http://cdn.shopify.com/a.jpg', supplier: 'karavanrug' },
    ];
    for (const query of queries) {
      const res = await get(query);
      expect(res.status).toBe(400);
    }
    expect(state.download).not.toHaveBeenCalled();
  });

  it("maps the downloader's refusals to their statuses", async () => {
    const cases: Array<[unknown, number, string]> = [
      [
        new DownloadError('unsupported_host', 'host "evil.test" is not allow-listed'),
        400,
        'unsupported_host',
      ],
      [new DownloadError('not_image', 'text/html'), 415, 'not_image'],
      [new DownloadError('too_large', 'body exceeds'), 413, 'too_large'],
      [new DownloadError('download_failed', 'HTTP 404'), 502, 'download_failed'],
      [new Error('socket hang up'), 502, 'download_failed'],
    ];
    for (const [error, status, code] of cases) {
      state.download.mockRejectedValueOnce(error);
      const res = await get({ url: PHOTO, supplier: 'karavanrug' });
      expect(res.status).toBe(status);
      expect(((await res.json()) as { error: string }).error).toBe(code);
    }
  });

  it('is for a signed-in admin only', async () => {
    const res = await get({ url: PHOTO, supplier: 'karavanrug' }, false);
    expect(res.status).toBe(401);
    expect(state.download).not.toHaveBeenCalled();
  });

  it('has its own budget, heavier than a read', async () => {
    state.download.mockRejectedValue(new DownloadError('download_failed', 'HTTP 404'));
    for (let i = 0; i < ADMIN_RATES.preview.limit; i++) {
      expect((await get({ url: PHOTO, supplier: 'karavanrug' })).status).toBe(502);
    }
    expect((await get({ url: PHOTO, supplier: 'karavanrug' })).status).toBe(429);
  });
});
