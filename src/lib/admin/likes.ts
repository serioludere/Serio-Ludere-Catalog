// The admin read plus each product's current like count (owner, 2026-09-15: "add like counts for
// each product for admin view").
//
// The admin snapshot never counted reactions — the Products tab's own likes column is a formula the
// site does not trust — so the count comes from the Reactions tab, read in the same batchGet and
// reduced by the saves report: distinct customers currently liking each rug, exactly what the
// Customers screen's "Most saved" already shows. The exact number is an admin figure; the buyer-facing
// threshold lives in src/lib/likes.ts.
import type { SheetsClient } from '../sheets/client.ts';
import { type Logger, serializeError } from '../sheets/errors.ts';
import { ADMIN_READ_RANGES, parseAdminSnapshot, type AdminSnapshot } from './read.ts';
import { buildSavesReport, SAVES_READ_RANGE } from './saves.ts';

export interface AdminSnapshotWithLikes {
  snapshot: AdminSnapshot;
  /** Product id → distinct customers currently liking it. Absent when nobody has. */
  likesById: Map<string, number>;
}

export async function fetchAdminSnapshotWithLikes(
  client: Pick<SheetsClient, 'batchGet'>,
  opts: { now?: () => number; logger?: Logger } = {},
): Promise<AdminSnapshotWithLikes> {
  const ranges = await client.batchGet([...ADMIN_READ_RANGES, SAVES_READ_RANGE]);
  const snapshot = parseAdminSnapshot(ranges.slice(0, ADMIN_READ_RANGES.length), opts);
  const likesById = new Map<string, number>();
  try {
    const report = buildSavesReport(
      ranges[ADMIN_READ_RANGES.length]?.values,
      snapshot.rugs,
      snapshot.clients,
    );
    for (const entry of report.mostSaved) if (entry.saves > 0) likesById.set(entry.rugId, entry.saves);
  } catch (e) {
    // A Reactions tab that is missing or malformed must not take the Products screen down with it:
    // the counts simply read as none until the tab is repaired.
    opts.logger?.warn('like counts unavailable', { error: serializeError(e) });
  }
  return { snapshot, likesById };
}
