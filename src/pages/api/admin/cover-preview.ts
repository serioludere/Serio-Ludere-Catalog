// GET /api/admin/cover-preview?url=<supplier photo>&supplier=<vendor> — the add form's first photo as
// it will be stored (owner, 2026-09-28: "apply the remove bg for the admin too for all vendors").
//
// After a Fetch the form shows the supplier's own photographs, straight off their CDN: a white
// backdrop, and a Karavan cover still lying on its side. What lands in Drive is different — turned,
// cut out, cropped to 2:3 (src/lib/drive/transform.ts) — so the studio was approving one picture and
// saving another. This runs the very same `applyTransforms` on the very same download and answers
// with the bytes, so the preview IS the stored cover, not an imitation of it.
//
// It stores nothing and writes no audit row: nothing changes until the form is saved, and the save
// runs the import exactly as before. The download is the Drive import's own (https, the photo-host
// allow-list, image/*, no photo size limit), so this cannot be pointed anywhere the import could not
// already reach.
export const prerender = false;

import { CoverPreviewQuery } from '../../../lib/admin/dto.ts';
import { AdminError, adminGet, methodNotAllowed } from '../../../lib/admin/http.ts';
import { applyTransforms } from '../../../lib/drive/transform.ts';
import { DownloadError } from '../../../lib/drive/upload.ts';
import { getAdminDeps } from '../../../lib/runtime.ts';
import { consoleLogger } from '../../../lib/sheets/errors.ts';

/** Status for a download that failed: the caller's mistake (4xx) or the supplier's (502). */
const DOWNLOAD_STATUS: Record<DownloadError['code'], number> = {
  unsupported_host: 400,
  not_image: 415,
  too_large: 413,
  download_failed: 502,
};

export const GET = adminGet(async ({ context }) => {
  const query = CoverPreviewQuery.safeParse({
    url: context.url.searchParams.get('url') ?? '',
    supplier: context.url.searchParams.get('supplier') ?? '',
  });
  if (!query.success) throw new AdminError(400, 'invalid query', 'url (https) and supplier are required');
  const { url, supplier } = query.data;

  let downloaded;
  try {
    downloaded = await getAdminDeps().downloadImage(url);
  } catch (e) {
    const code = e instanceof DownloadError ? e.code : 'download_failed';
    throw new AdminError(DOWNLOAD_STATUS[code], code, e instanceof Error ? e.message : undefined);
  }

  // Never fails: a photo sharp cannot handle comes back as the original, which is still the right
  // thing to show — it is exactly what the import would store.
  const fixed = await applyTransforms(downloaded, { supplier, index: 0 });
  if (fixed.skipped) consoleLogger.warn('cover preview: transform skipped', { detail: fixed.skipped });

  return new Response(new Uint8Array(fixed.bytes), {
    status: 200,
    headers: {
      'content-type': fixed.contentType,
      // Like every admin response (admin/gate.ts sets it again on the way out).
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'x-cover-transforms': fixed.applied.join(',') || 'none',
    },
  });
}, 'preview');

export const ALL = methodNotAllowed('GET');
