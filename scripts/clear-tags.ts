// Clears every tag in the sheet (owner, 2026-09-18): the Tags tab's rows, and the `tags` cell on
// every product.
//
//   npm run tags:clear -- --dry-run     report what would change, write nothing
//   npm run tags:clear                  do it
//
// Why this exists. Tags used to be two things at once: rows in a Tags tab that acted as a registry,
// and the words on each product that referenced them. They are now ONE thing — plain strings on the
// product, added and removed on the product form and nowhere else — so the registry has no job left,
// and the owner asked to start that model from empty rather than inherit the old vocabulary.
//
// This is a one-off, and destructive in the way a migration is: there is no undo, and the words are
// not recorded anywhere else. It is a script rather than an admin button for exactly that reason —
// it should be hard to do twice by accident. Run `--dry-run` first; it prints the counts and the
// distinct tags that are about to go.
//
// The Signed / Antique badges on customer cards are derived from tag words (view.ts `badgesFor`), so
// they disappear with them until those tags are typed back onto the products that should carry them.
// The owner was told this and chose it.
import { SheetsClient } from '../src/lib/sheets/client.ts';
import { authFromEnv, sheetIdFromEnv } from '../src/lib/sheets/config.ts';
import { PRODUCT_COLS, PRODUCT_LAST_COL, TABS } from '../src/lib/sheets/contract.ts';
import { consoleLogger } from '../src/lib/sheets/errors.ts';
import { flag } from './lib/env.ts';

async function main(): Promise<void> {
  const dryRun = flag('dry-run') === 'true';
  const client = new SheetsClient({
    spreadsheetId: sheetIdFromEnv(process.env),
    auth: authFromEnv(process.env),
    logger: consoleLogger,
  });

  const [products, tags] = await client.batchGet([
    `${TABS.products}!A2:${PRODUCT_LAST_COL}`,
    `${TABS.tags}!A2:D`,
  ]);
  const productRows = products?.values ?? [];
  const tagRows = (tags?.values ?? []).filter((r) => r.some((c) => String(c ?? '').trim()));

  // Which product rows actually carry a tag; the rest are left completely untouched.
  const carrying: Array<{ row: number; id: string; tags: string }> = [];
  const distinct = new Set<string>();
  productRows.forEach((row, i) => {
    const cell = String(row[PRODUCT_COLS.tags] ?? '').trim();
    if (!cell) return;
    carrying.push({ row: i + 2, id: String(row[PRODUCT_COLS.productId] ?? ''), tags: cell });
    for (const t of cell.split(/[|,]/)) if (t.trim()) distinct.add(t.trim());
  });

  console.log(`Tags tab:  ${tagRows.length} row(s)`);
  console.log(`Products:  ${carrying.length} of ${productRows.length} carry tags`);
  console.log(`Distinct:  ${[...distinct].sort((a, b) => a.localeCompare(b)).join(', ') || '(none)'}`);

  if (tagRows.length === 0 && carrying.length === 0) {
    console.log('Nothing to clear.');
    return;
  }
  if (dryRun) {
    console.log('\n--dry-run: nothing was written.');
    return;
  }

  const sheetIds = {
    products: await client.sheetIdByTitle(TABS.products),
    tags: await client.sheetIdByTitle(TABS.tags),
  };
  const requests: unknown[] = [];

  // One blank cell per product that has tags — not a blanket rewrite of the column, so a row that
  // never had a tag is not touched at all and its modified-time does not move.
  for (const p of carrying) {
    requests.push({
      updateCells: {
        start: { sheetId: sheetIds.products, rowIndex: p.row - 1, columnIndex: PRODUCT_COLS.tags },
        rows: [{ values: [{ userEnteredValue: { stringValue: '' } }] }],
        fields: 'userEnteredValue',
      },
    });
  }
  // The Tags tab keeps its header row; only the data below it goes.
  if (tagRows.length > 0) {
    requests.push({
      deleteDimension: {
        range: {
          sheetId: sheetIds.tags,
          dimension: 'ROWS',
          startIndex: 1,
          endIndex: 1 + tagRows.length,
        },
      },
    });
  }

  await client.batchUpdate(requests);
  console.log(
    `\nCleared ${carrying.length} product tag cell(s) and ${tagRows.length} Tags row(s).` +
      `\nThe Signed / Antique badges are gone with them until those words are typed back on.`,
  );
}

await main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exitCode = 1;
});
