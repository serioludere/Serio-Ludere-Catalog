// @vitest-environment happy-dom
// /admin/rugs client filter (docs/ADMIN_SPEC.md §8.3): the collection tabs and the search box toggle
// `hidden` on the server-rendered cards; the count and the two empty states follow.
//
// Owner, 2026-09-16: the status chips are gone (every status is listed at once) and the collections
// moved from a single select to a multi-select tab row, so two or more can be shown together.
import { beforeEach, describe, expect, it } from 'vitest';
import { initRugList, matches } from '../../../src/scripts/admin/rug-list.ts';

const card = (id: string, collection: string, status: string, search: string): string =>
  `<a class="card" data-card data-id="${id}" data-collection="${collection}" data-collections="${collection}" data-status="${status}" data-search="${search}" href="/admin/rugs/${id}">${id}</a>`;

const chip = (value: string, label: string, on = false): string =>
  `<button type="button" class="chip${on ? ' on' : ''}" data-value="${value}" aria-pressed="${on}">${label}</button>`;

beforeEach(() => {
  document.body.innerHTML = `
    <input id="q" />
    <div id="collectionChips" class="chips" data-multi="true">
      ${chip('*', 'All', true)}
      ${chip('kilims', 'Kilims')}
      ${chip('tulu', 'Tulu')}
      ${chip('__none', 'No collection')}
    </div>
    <p id="count"></p>
    <div id="empty-first" hidden></div>
    <div id="empty-none" hidden></div>
    <div id="grid">
      ${card('SL-021', 'kilims', 'active', 'winks sl-021 1389 winks')}
      ${card('SL-022', 'kilims', 'draft', 'yellow sl-022  yellow')}
      ${card('SL-023', '', 'active', 'door sl-023  door')}
      ${card('SL-024', 'tulu', 'archived', 'bloom sl-024  bloom')}
    </div>`;
});

const press = (value: string): void => {
  document.querySelector<HTMLButtonElement>(`#collectionChips [data-value="${value}"]`)!.click();
};

const visible = (): string[] =>
  [...document.querySelectorAll<HTMLElement>('[data-card]')]
    .filter((c) => !c.hidden)
    .map((c) => c.dataset.id!);

describe('matches()', () => {
  const c = { collections: 'kilims', status: 'active', search: 'winks sl-021 1389' };

  it('treats an empty collection list as "every collection"', () => {
    expect(matches(c, { collections: [], q: '' })).toBe(true);
    expect(matches({ collections: '', status: 'draft', search: '' }, { collections: [], q: '' })).toBe(true);
  });

  it('ORs the chosen collections together', () => {
    expect(matches(c, { collections: ['kilims'], q: '' })).toBe(true);
    expect(matches(c, { collections: ['tulu'], q: '' })).toBe(false);
    expect(matches(c, { collections: ['tulu', 'kilims'], q: '' })).toBe(true);
  });

  it('matches rugs filed under no collection through __none', () => {
    const none = { collections: '', status: 'active', search: '' };
    expect(matches(none, { collections: ['__none'], q: '' })).toBe(true);
    expect(matches(none, { collections: ['kilims'], q: '' })).toBe(false);
    expect(matches(c, { collections: ['__none'], q: '' })).toBe(false);
    // …and __none sits alongside the real ones rather than replacing them.
    expect(matches(c, { collections: ['__none', 'kilims'], q: '' })).toBe(true);
  });

  it('applies the search needle case-insensitively', () => {
    expect(matches(c, { collections: [], q: 'WINKS' })).toBe(true);
    expect(matches(c, { collections: [], q: '1389' })).toBe(true);
    expect(matches(c, { collections: [], q: 'zzz' })).toBe(false);
  });

  it('no longer filters on status — every status is listed at once', () => {
    const draft = { collections: 'kilims', status: 'draft', search: '' };
    const archived = { collections: 'kilims', status: 'archived', search: '' };
    expect(matches(draft, { collections: [], q: '' })).toBe(true);
    expect(matches(archived, { collections: [], q: '' })).toBe(true);
    expect(matches(archived, { collections: ['kilims'], q: '' })).toBe(true);
  });
});

describe('initRugList()', () => {
  it('opens on every rug, whatever its status', () => {
    const list = initRugList();
    expect(visible()).toEqual(['SL-021', 'SL-022', 'SL-023', 'SL-024']);
    expect(document.getElementById('count')?.textContent).toBe('4 rugs shown');
    expect(list.filter()).toEqual({ collections: [], q: '' });
  });

  it('filters on one collection, then on several at once', () => {
    const list = initRugList();
    press('kilims');
    expect(visible()).toEqual(['SL-021', 'SL-022']);
    expect(list.filter()).toEqual({ collections: ['kilims'], q: '' });
    press('tulu');
    expect(visible()).toEqual(['SL-021', 'SL-022', 'SL-024']);
    expect(list.filter()).toEqual({ collections: ['kilims', 'tulu'], q: '' });
    expect(document.getElementById('count')?.textContent).toBe('3 rugs shown');
  });

  it('releases "All" when a collection is picked, and returns to it when the last one is released', () => {
    initRugList();
    const all = document.querySelector<HTMLButtonElement>('#collectionChips [data-value="*"]')!;
    expect(all.getAttribute('aria-pressed')).toBe('true');
    press('kilims');
    expect(all.getAttribute('aria-pressed')).toBe('false');
    press('kilims'); // releasing the last collection falls back to All rather than showing nothing
    expect(all.getAttribute('aria-pressed')).toBe('true');
    expect(visible()).toEqual(['SL-021', 'SL-022', 'SL-023', 'SL-024']);
  });

  it('pressing "All" clears the individual collections', () => {
    initRugList();
    press('kilims');
    press('tulu');
    press('*');
    const pressed = [...document.querySelectorAll<HTMLButtonElement>('#collectionChips .chip')]
      .filter((b) => b.getAttribute('aria-pressed') === 'true')
      .map((b) => b.dataset.value);
    expect(pressed).toEqual(['*']);
    expect(visible()).toEqual(['SL-021', 'SL-022', 'SL-023', 'SL-024']);
  });

  it('combines the tabs with the search box and shows the no-results state', () => {
    const list = initRugList();
    press('__none');
    expect(visible()).toEqual(['SL-023']);
    const q = document.getElementById('q') as HTMLInputElement;
    q.value = 'yellow';
    q.dispatchEvent(new Event('input'));
    expect(visible()).toEqual([]);
    // Cards exist but none match: the no-results state, not the first-run one.
    expect(document.getElementById('empty-none')?.hidden).toBe(false);
    expect(document.getElementById('empty-first')?.hidden).toBe(true);
    press('*');
    expect(visible()).toEqual(['SL-022']);
    expect(document.getElementById('empty-none')?.hidden).toBe(true);
    expect(document.getElementById('empty-first')?.hidden).toBe(true);
    expect(list.filter()).toEqual({ collections: [], q: 'yellow' });
  });
});
