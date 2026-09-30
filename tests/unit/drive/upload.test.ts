import { describe, expect, it } from 'vitest';
import { DRIVE_UPLOAD_API, createDriveHttp } from '../../../src/lib/drive/client.ts';
import { DownloadError, createUploader, defaultDownload } from '../../../src/lib/drive/upload.ts';
import { MAX_DOWNLOAD_BYTES, MULTIPART_MAX_BYTES, type Downloader } from '../../../src/lib/drive/types.ts';
import { silentLogger } from '../../../src/lib/sheets/errors.ts';

const FOLDER = '1B97RZtgjHCLNePWf40j2a1h8vPtaU6ee';
const FILE_ID = '1U8FwNPCdm-n8RUvSNRcJLBA_27u-Pjkb';
const UPLOAD_URL = `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id%2Cname%2CmimeType`;
const OPEN_URL = `${DRIVE_UPLOAD_API}/files?uploadType=resumable&fields=id%2Cname%2CmimeType`;
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);

interface Call {
  method: string;
  url: string;
  init: RequestInit;
}

function mockFetch(handler: (c: Call, n: number) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fn = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const call: Call = { method: init?.method ?? 'GET', url, init: init ?? {} };
    calls.push(call);
    return handler(call, calls.length);
  }) as unknown as typeof fetch;
  return { fn, calls };
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function image(bytes: Uint8Array | ArrayBuffer, type = 'image/jpeg', headers: Record<string, string> = {}) {
  return new Response(bytes as BodyInit, { status: 200, headers: { 'content-type': type, ...headers } });
}

const okDownload: Downloader = async () => ({ bytes: JPEG, contentType: 'image/jpeg' });

function uploader(
  fetchImpl: typeof fetch,
  opts: { download?: Downloader; ensureFolder?: () => Promise<string>; sleeps?: number[] } = {},
) {
  const http = createDriveHttp({
    getAccessToken: async () => 'tok',
    fetchImpl,
    logger: silentLogger,
    sleep: async (ms) => {
      opts.sleeps?.push(ms);
    },
  });
  return createUploader(http, {
    download: opts.download ?? okDownload,
    ensureFolder: opts.ensureFolder ?? (async () => FOLDER),
  });
}

describe('defaultDownload', () => {
  it('rejects non-https, userinfo, ports and hosts outside the allow-list before any fetch', async () => {
    const m = mockFetch(() => image(JPEG));
    for (const bad of [
      'http://cdn.shopify.com/a.jpg',
      'https://user:pw@cdn.shopify.com/a.jpg',
      'https://cdn.shopify.com:8443/a.jpg',
      'https://evil.example/a.jpg',
      'https://cdn.shopify.com.evil.example/a.jpg',
      'https://127.0.0.1/a.jpg',
      'not a url',
    ]) {
      await expect(defaultDownload(bad, m.fn)).rejects.toMatchObject({ code: 'unsupported_host' });
    }
    expect(m.calls).toHaveLength(0);
  });

  it('downloads an allow-listed image with manual redirects and an image Accept header', async () => {
    const m = mockFetch((c) => {
      expect(c.init.redirect).toBe('manual');
      expect((c.init.headers as Record<string, string>).accept).toBe('image/*');
      return image(JPEG, 'image/jpeg; charset=binary');
    });
    const out = await defaultDownload('https://images.ecarpetwholesale.com/x/full.jpg', m.fn);
    expect(out.contentType).toBe('image/jpeg');
    expect(Array.from(out.bytes)).toEqual(Array.from(JPEG));
  });

  it('follows at most 3 redirects, re-validating every hop', async () => {
    const hop = (to: string) => new Response(null, { status: 302, headers: { location: to } });
    const m = mockFetch((_c, n) =>
      n === 1
        ? hop('/cdn/shop/files/a.jpg?width=1600')
        : n === 2
          ? hop('https://cdn.shopify.com/s/a.jpg')
          : image(JPEG),
    );
    const out = await defaultDownload('https://karavanrug.com/products/a.jpg', m.fn);
    expect(out.contentType).toBe('image/jpeg');
    expect(m.calls.map((c) => c.url)).toEqual([
      'https://karavanrug.com/products/a.jpg',
      'https://karavanrug.com/cdn/shop/files/a.jpg?width=1600',
      'https://cdn.shopify.com/s/a.jpg',
    ]);

    const offsite = mockFetch(() => hop('https://evil.example/a.jpg'));
    await expect(defaultDownload('https://cdn.shopify.com/a.jpg', offsite.fn)).rejects.toMatchObject({
      code: 'unsupported_host',
    });

    const loop = mockFetch(() => hop('https://cdn.shopify.com/a.jpg'));
    await expect(defaultDownload('https://cdn.shopify.com/a.jpg', loop.fn)).rejects.toMatchObject({
      code: 'download_failed',
      message: 'too many redirects',
    });
    expect(loop.calls).toHaveLength(4);

    const noLocation = mockFetch(() => new Response(null, { status: 301 }));
    await expect(defaultDownload('https://cdn.shopify.com/a.jpg', noLocation.fn)).rejects.toMatchObject({
      code: 'download_failed',
    });
  });

  it('rejects non-image bodies, SVG and HTTP errors', async () => {
    const html = mockFetch(
      () => new Response('<html>', { status: 200, headers: { 'content-type': 'text/html' } }),
    );
    await expect(defaultDownload('https://cdn.shopify.com/a.jpg', html.fn)).rejects.toMatchObject({
      code: 'not_image',
    });
    const svg = mockFetch(() => image(JPEG, 'image/svg+xml'));
    await expect(defaultDownload('https://cdn.shopify.com/a.svg', svg.fn)).rejects.toMatchObject({
      code: 'not_image',
    });
    const missing = mockFetch(() => new Response(JPEG, { status: 200 }));
    await expect(defaultDownload('https://cdn.shopify.com/a.jpg', missing.fn)).rejects.toMatchObject({
      code: 'not_image',
    });
    const notFound = mockFetch(() => new Response('nope', { status: 404 }));
    await expect(defaultDownload('https://cdn.shopify.com/a.jpg', notFound.fn)).rejects.toMatchObject({
      code: 'download_failed',
      message: 'HTTP 404',
    });
  });

  it('stops only at the safety ceiling, by content-length and while streaming', async () => {
    const declared = mockFetch(() =>
      image(JPEG, 'image/jpeg', { 'content-length': String(MAX_DOWNLOAD_BYTES + 1) }),
    );
    await expect(defaultDownload('https://cdn.shopify.com/a.jpg', declared.fn)).rejects.toMatchObject({
      code: 'too_large',
    });

    // A server that never stops sending: the same 1 MB chunk over and over, past the ceiling.
    const chunk = new Uint8Array(1024 * 1024);
    let sent = 0;
    const endless = new ReadableStream<Uint8Array>({
      pull(c) {
        sent += chunk.byteLength;
        if (sent > MAX_DOWNLOAD_BYTES + chunk.byteLength) c.close();
        else c.enqueue(chunk);
      },
    });
    const streamed = mockFetch(() => image(endless as unknown as ArrayBuffer));
    await expect(defaultDownload('https://cdn.shopify.com/a.jpg', streamed.fn)).rejects.toMatchObject({
      code: 'too_large',
    });
  });

  it('has no photo size limit: the studio’s 7 MB cut-out cover comes in whole (owner, 2026-09-30)', async () => {
    const heavy = new Uint8Array(7 * 1024 * 1024);
    const m = mockFetch(() => image(heavy, 'image/png', { 'content-length': String(heavy.byteLength) }));
    const out = await defaultDownload('https://cdn.shopify.com/a.png', m.fn);
    expect(out.bytes.byteLength).toBe(heavy.byteLength);
  });

  it('wraps network failures as download_failed with a scrubbed message', async () => {
    const m = mockFetch(() => {
      throw new TypeError('fetch failed: authorization: Bearer ya29.secret');
    });
    const err = await defaultDownload('https://cdn.shopify.com/a.jpg', m.fn).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DownloadError);
    expect((err as DownloadError).code).toBe('download_failed');
    expect((err as Error).message).not.toContain('ya29');
  });
});

describe('uploadFromUrl', () => {
  it('downloads, posts a multipart/related body into the folder and returns the id straight away', async () => {
    const m = mockFetch((c) => {
      if (c.url === UPLOAD_URL) {
        expect(c.method).toBe('POST');
        const h = c.init.headers as Record<string, string>;
        expect(h.authorization).toBe('Bearer tok');
        expect(h['content-type']).toMatch(/^multipart\/related; boundary=sl_[0-9a-f]{32}$/);
        const body = new TextDecoder().decode(c.init.body as Uint8Array);
        expect(body).toContain(
          JSON.stringify({ name: 'khal-1.jpg', parents: [FOLDER], mimeType: 'image/jpeg' }),
        );
        expect(body).toContain('Content-Type: image/jpeg\r\n\r\n');
        return json(200, { id: FILE_ID, name: 'khal-1.jpg', mimeType: 'image/jpeg' });
      }
      return json(500, { error: { message: `unexpected ${c.url}` } });
    });
    const out = await uploader(m.fn)('https://cdn.shopify.com/s/a.jpg', 'khal-1.jpg');
    expect(out).toEqual({ id: FILE_ID, name: 'khal-1.jpg' });
    expect(m.calls.map((c) => `${c.method} ${c.url}`)).toEqual([`POST ${UPLOAD_URL}`]);
    // No lh3 wait (owner, 2026-09-17): pages read photos through the Drive API, not lh3.
  });

  it('fixes the extension to the downloaded type', async () => {
    const m = mockFetch((c) => {
      if (c.url === UPLOAD_URL) {
        const body = new TextDecoder().decode(c.init.body as Uint8Array);
        expect(body).toContain('"name":"khal-2.png"');
        return json(200, { id: FILE_ID });
      }
      return new Response(null, { status: 200, headers: { 'content-type': 'image/png' } });
    });
    const png: Downloader = async () => ({ bytes: JPEG, contentType: 'image/png' });
    expect(await uploader(m.fn, { download: png })('https://cdn.shopify.com/s/a.png', 'khal-2.jpg')).toEqual({
      id: FILE_ID,
      name: 'khal-2.png',
    });
  });

  it('stores a photo over the 5 MB multipart limit whole, as a resumable upload (owner, 2026-09-30)', async () => {
    // Aile's cover: a 5.02 MB PNG, refused outright before. It must land byte for byte.
    const png = new Uint8Array(MULTIPART_MAX_BYTES + 20_000);
    for (let i = 0; i < png.length; i++) png[i] = (i * 31) & 0xff;
    const SESSION = `${DRIVE_UPLOAD_API}/files?uploadType=resumable&upload_id=ABC123`;
    let put: { bytes: Uint8Array; type: string; auth: string } | undefined;
    const m = mockFetch((c) => {
      const h = c.init.headers as Record<string, string>;
      if (c.method === 'POST' && c.url === OPEN_URL) {
        expect(h['x-upload-content-type']).toBe('image/png');
        expect(h['x-upload-content-length']).toBe(String(png.byteLength));
        expect(JSON.parse(String(c.init.body))).toEqual({
          name: 'aile-01.png',
          parents: [FOLDER],
          mimeType: 'image/png',
        });
        return new Response(null, { status: 200, headers: { location: SESSION } });
      }
      if (c.method === 'PUT' && c.url === SESSION) {
        put = { bytes: c.init.body as Uint8Array, type: h['content-type']!, auth: h.authorization! };
        return json(200, { id: FILE_ID, name: 'aile-01.png', mimeType: 'image/png' });
      }
      return json(500, { error: { message: `unexpected ${c.method} ${c.url}` } });
    });
    const heavy: Downloader = async () => ({ bytes: png, contentType: 'image/png' });
    const out = await uploader(m.fn, { download: heavy })('https://cdn.shopify.com/a.png', 'aile-01');
    expect(out).toEqual({ id: FILE_ID, name: 'aile-01.png' });
    expect(m.calls.map((c) => c.method)).toEqual(['POST', 'PUT']);
    expect(put!.type).toBe('image/png');
    expect(put!.auth).toBe('Bearer tok');
    expect(Buffer.from(put!.bytes).equals(Buffer.from(png))).toBe(true);
  });

  it('never sends the bytes, or the token, to a resumable session outside Drive', async () => {
    const m = mockFetch((c) =>
      c.method === 'POST'
        ? new Response(null, { status: 200, headers: { location: 'https://evil.example/upload' } })
        : json(200, { id: FILE_ID }),
    );
    const heavy: Downloader = async () => ({
      bytes: new Uint8Array(MULTIPART_MAX_BYTES + 1),
      contentType: 'image/png',
    });
    expect(await uploader(m.fn, { download: heavy })('https://cdn.shopify.com/a.png', 'a')).toMatchObject({
      error: 'upload_failed',
    });
    expect(m.calls.map((c) => c.method)).toEqual(['POST']);
  });

  it('guards the safety ceiling and type even when the injected downloader is lenient', async () => {
    const m = mockFetch(() => json(500, {}));
    const big: Downloader = async () => ({
      bytes: new Uint8Array(MAX_DOWNLOAD_BYTES + 1),
      contentType: 'image/jpeg',
    });
    expect(await uploader(m.fn, { download: big })('https://cdn.shopify.com/a.jpg', 'a.jpg')).toMatchObject({
      error: 'too_large',
    });
    const html: Downloader = async () => ({ bytes: JPEG, contentType: 'text/html; charset=utf-8' });
    expect(await uploader(m.fn, { download: html })('https://cdn.shopify.com/a.jpg', 'a.jpg')).toMatchObject({
      error: 'not_image',
    });
    const empty: Downloader = async () => ({ bytes: new Uint8Array(0), contentType: 'image/jpeg' });
    expect(await uploader(m.fn, { download: empty })('https://cdn.shopify.com/a.jpg', 'a.jpg')).toMatchObject(
      {
        error: 'download_failed',
      },
    );
    expect(m.calls).toHaveLength(0);
  });

  it('maps downloader failures to their code and never throws', async () => {
    const m = mockFetch(() => json(500, {}));
    const hostErr: Downloader = async () => {
      throw new DownloadError('unsupported_host', 'host "x" is not allow-listed');
    };
    expect(await uploader(m.fn, { download: hostErr })('https://x/a.jpg', 'a.jpg')).toEqual({
      error: 'unsupported_host',
      detail: 'host "x" is not allow-listed',
    });
    const foreign: Downloader = async () => {
      throw new Error('blocked address 10.0.0.1 (refresh_token=abc)');
    };
    const out = await uploader(m.fn, { download: foreign })('https://cdn.shopify.com/a.jpg', 'a.jpg');
    expect(out).toMatchObject({ error: 'download_failed' });
    expect((out as { detail?: string }).detail).not.toContain('abc');
    expect(m.calls).toHaveLength(0);
  });

  it('reports drive_not_authorised on 401/403 from Drive and folder_failed otherwise', async () => {
    const forbidden = mockFetch(() =>
      json(403, {
        error: { message: 'Insufficient Permission', errors: [{ reason: 'insufficientPermissions' }] },
      }),
    );
    expect(await uploader(forbidden.fn)('https://cdn.shopify.com/a.jpg', 'a.jpg')).toMatchObject({
      error: 'drive_not_authorised',
      detail: 'Insufficient Permission',
    });

    const m = mockFetch(() => json(500, {}));
    const folderDown = async () => {
      throw new Error('list failed');
    };
    expect(
      await uploader(m.fn, { ensureFolder: folderDown })('https://cdn.shopify.com/a.jpg', 'a.jpg'),
    ).toMatchObject({
      error: 'folder_failed',
    });
    expect(m.calls).toHaveLength(0);
  });

  it('retries the upload on 503 (but not after a network error) and reports upload_failed on 5xx', async () => {
    const sleeps: number[] = [];
    const flaky = mockFetch((c, n) => {
      if (c.url === UPLOAD_URL)
        return n === 1 ? json(503, { error: { message: 'backend' } }) : json(200, { id: FILE_ID });
      return new Response(null, { status: 200, headers: { 'content-type': 'image/jpeg' } });
    });
    expect(await uploader(flaky.fn, { sleeps })('https://cdn.shopify.com/a.jpg', 'a.jpg')).toEqual({
      id: FILE_ID,
      name: 'a.jpg',
    });
    expect(flaky.calls.filter((c) => c.url === UPLOAD_URL)).toHaveLength(2);
    expect(sleeps).toHaveLength(1);

    const network = mockFetch(() => {
      throw new TypeError('fetch failed');
    });
    expect(await uploader(network.fn)('https://cdn.shopify.com/a.jpg', 'a.jpg')).toMatchObject({
      error: 'upload_failed',
    });
    expect(network.calls).toHaveLength(1);

    const broken = mockFetch(() => json(500, { error: { message: 'Internal Error' } }));
    expect(await uploader(broken.fn)('https://cdn.shopify.com/a.jpg', 'a.jpg')).toEqual({
      error: 'upload_failed',
      detail: 'Internal Error',
    });
  });

  it('rejects an unexpected id shape, and never waits on lh3 once Drive has returned an id', async () => {
    const odd = mockFetch(() => json(200, { id: 'x' }));
    expect(await uploader(odd.fn)('https://cdn.shopify.com/a.jpg', 'a.jpg')).toMatchObject({
      error: 'upload_failed',
    });

    const sleeps: number[] = [];
    const dark = mockFetch((c) =>
      c.url === UPLOAD_URL ? json(200, { id: FILE_ID }) : new Response(null, { status: 500 }),
    );
    const out = await uploader(dark.fn, { sleeps })('https://cdn.shopify.com/a.jpg', 'a.jpg');
    expect(out).toEqual({ id: FILE_ID, name: 'a.jpg' });
    expect(dark.calls.filter((c) => c.method === 'HEAD')).toHaveLength(0);
    expect(sleeps).toEqual([]);
  });
});
