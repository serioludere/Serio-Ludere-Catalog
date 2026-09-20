// The photo half of a product commit (brief §12), pure enough to test without Drive.
//
// The brief's order is the whole point, and it is the reverse of what this project did before:
//
//     validate the id → write the row `pending` → create the folders → upload (four at a time)
//   → update the row and mark it `complete`
//
// The old order uploaded first and wrote the row afterwards, so a failure part-way left images in
// Drive that no row pointed at — invisible, unreferenced and impossible to retry. Writing the row
// first inverts the failure: what you are left with is a visible row marked `pending`, which the
// products list can show and a Retry button can finish.
//
// Nothing here throws. Every outcome is reported, because a half-finished import must leave the row
// in a state the admin can act on rather than a stack trace.
import type { Logger } from '../sheets/errors.ts';
import { serializeError } from '../sheets/errors.ts';
import type { ProductFolders } from './folder.ts';
import type { DriveClient, UploadResult } from './types.ts';

export interface PhotoOutcome {
  url: string;
  id?: string;
  name?: string;
  error?: string;
  detail?: string;
  /** The file was already in `All Images` under this name, so nothing was uploaded for it. */
  reused?: boolean;
}

export interface CommitPhotosInput {
  productId: string;
  productName: string;
  /** Source image URLs, in order. The first is the primary and is duplicated into the rug's folder. */
  urls: readonly string[];
  /** Filename stem; the index and extension are appended. */
  namePrefix: string;
  /**
   * Retry mode. Lists `All Images` first and skips any photo whose target filename is already there,
   * so pressing "Finish photo import" twice uploads nothing the second time. Off for a first import,
   * where the folder is new and the listing would be a wasted call.
   */
  reuseExisting?: boolean;
  /**
   * Which supplier these photos came from, so the first image gets that supplier's fixes
   * (src/lib/drive/transform.ts, owner 2026-09-13). Blank for owned stock — no fixes apply.
   */
  supplier?: string;
}

export interface CommitPhotosResult {
  /** One entry per input url, in the same order. */
  photos: PhotoOutcome[];
  /** Drive ids that uploaded cleanly, in order — what goes into the row. */
  ids: string[];
  folders?: ProductFolders;
  /** True when every url landed; the row may be marked complete. */
  complete: boolean;
  /** Set when the folders could not be made, in which case nothing was uploaded. */
  folderError?: string;
}

export interface CommitDeps {
  drive: Pick<DriveClient, 'ensureProductFolders' | 'uploadFromUrl' | 'copyFile' | 'listFolder'>;
  logger?: Logger;
}

/** `01-primary`, `02`, `03`… so the folder sorts in the order the studio chose. */
export function photoName(prefix: string, index: number, primary: boolean): string {
  const n = String(index + 1).padStart(2, '0');
  return primary ? `${n}-primary` : `${prefix}-${n}`;
}

/** How many photos transfer at once. Drive 429/503s are retried with backoff by drive/client.ts. */
export const UPLOAD_CONCURRENCY = 4;

/**
 * Creates the rug's folders, uploads the photos into `All Images`, and copies the first one up into
 * the rug folder as `01-primary`.
 *
 * Four at a time (owner, 2026-09-17: a ten-photo save took ~30 s one by one). Order is not lost: every
 * result is written back to its own index, and the filenames carry the position (`01-primary`,
 * `<prefix>-02`…), so the row and the Drive folder read in the studio's order either way. A failure
 * part-way still leaves a set the retry can finish, because the retry skips names already present.
 */
export async function commitPhotos(input: CommitPhotosInput, deps: CommitDeps): Promise<CommitPhotosResult> {
  const photos: PhotoOutcome[] = new Array<PhotoOutcome>(input.urls.length);
  let folders: ProductFolders;
  try {
    folders = await deps.drive.ensureProductFolders(input.productId, input.productName);
  } catch (e) {
    const safe = serializeError(e);
    deps.logger?.error('photo commit: folders unavailable', { error: safe });
    return {
      photos: input.urls.map((url) => ({ url, error: 'folder_failed', detail: safe.message })),
      ids: [],
      complete: false,
      folderError: safe.message,
    };
  }

  // What a previous, interrupted run already managed to upload. A failure to list is not fatal: the
  // worst case is the duplicate this lookup exists to avoid, which is better than refusing the retry.
  let existing = new Map<string, string>();
  if (input.reuseExisting) {
    try {
      existing = await deps.drive.listFolder(folders.allImagesId);
    } catch (e) {
      deps.logger?.warn('photo commit: could not list All Images', { error: serializeError(e) });
    }
  }

  let primaryCopy: Promise<void> | undefined;
  const one = async (i: number): Promise<void> => {
    const url = input.urls[i]!;
    const name = photoName(input.namePrefix, i, i === 0);
    const already = existing.get(name);
    if (already) {
      photos[i] = { url, id: already, name, reused: true };
      return;
    }
    const result: UploadResult = await deps.drive.uploadFromUrl(url, name, folders.allImagesId, {
      supplier: input.supplier ?? '',
      index: i,
    });
    if ('error' in result) {
      photos[i] = { url, error: result.error, detail: result.detail };
      return;
    }
    photos[i] = { url, id: result.id, name: result.name };
    // The primary is duplicated into the rug's own folder so the studio sees it without opening
    // "All Images". Started without holding up the pool, awaited before returning. A failure here is
    // not a failed import: the photo itself is safely stored.
    if (i === 0) {
      primaryCopy = deps.drive.copyFile(result.id, `01-primary`, folders.productId).then((copy) => {
        if ('error' in copy)
          deps.logger?.warn('photo commit: primary not duplicated', { detail: copy.detail });
      });
    }
  };

  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < input.urls.length) await one(next++);
  };
  await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, input.urls.length) }, worker));
  await primaryCopy;

  const ids = photos.filter((p) => p.id && !p.error).map((p) => p.id!);
  return { photos, ids, folders, complete: ids.length === input.urls.length && input.urls.length > 0 };
}
