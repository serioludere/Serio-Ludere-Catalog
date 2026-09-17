// @vitest-environment happy-dom
// /admin/rugs client filter (docs/ADMIN_SPEC.md §8.3): the collection tabs and the search box toggle
// `hidden` on the server-rendered cards; the count, the pager and the two empty states follow.
//
// Owner, 2026-09-16: the status chips are gone — every product is listed whatever its sheet row once
// said. Owner, 2026-09-17: the collection tabs select ONE collection at a time, and the list pages at
// 20. The pager is keyed on `data-id`, which the table row and the gallery card share.
import { beforeEach, describe, expect, it } from 'vitest';
import { initRugList, matches } from '../../../src/scripts/admin/rug-list.ts';

const card = (id: string, collection: string, search: string): string =>
  `<a class="card" data-card data-id="${id}" data-collection="${collection}" data-collections="${collection}" data-search="${search}" href="/admin/rugs/${id}">${id}</a>`;

const chip = (value: string, label: string, on = false): string =>
  `<button type="button" class="chip${on ? ' on' : ''}" data-value="${value}" aria-pressed="${on}">${label}</button>`;

const pager = (): string =>
  `<nav id="rugPager" hidden>
     <button type="button" data-page="prev"></button>
     <p data-page="label"></p>
     <button type="button" data-page="next"></button>
   </nav>`;

/** The four-rug fixture the filter tests use; too small to page. */
const mount = (cards: string): void => {
  document.body.innerHTML = `
    <input id="q" />
    <div id="collectionChips" class="chips" data-multi="false">
      ${chip('*', 'All', true)}
      ${chip('kilims', 'Kilims')}
      ${chip('tulu', 'Tulu')}
      ${chip('__none', 'No collection')}
    </div>
    <p id="count"></p>
    <div id="empty-first" hidden></div>
    <div id="empty-none" hidden></div>
    <div id="grid">${cards}</div>
    ${pager()}`;
};

beforeEach(() => {
  mount(
    [
      card('SL-021', 'kilims', 'winks sl-021 1389 winks'),
      card('SL-022', 'kilims', 'yellow sl-022  yellow'),
      card('SL-023', '', 'door sl-023  door'),
      card('SL-024', 'tulu', 'bloom sl-024  bloom'),
    ].join(''),
  );
});

const press = (value: string): void => {
  document.querySelector<HTMLButtonElement>(`#collectionChips [data-value="${value}"]`)!.click();
};

const visible = (): string[] =>
  [...document.querySelectorAll<HTMLElement>('[data-card]')]
    .filter((c) => !c.hidden)
    .map((c) => c.dataset.id!);

const count = (): string => document.getElementById('count')?.textContent ?? '';

describe('matches()', () => {
  const c = { collections: 'kilims', search: 'winks sl-021 1389' };

  it('treats "*" as every collection', () => {
    expect(matches(c, { collection: '*', q: '' })).toBe(true);
    expect(matches({ collections: '', search: '' }, { collection: '*', q: '' })).toBe(true);
  });

  it('matches one collection at a time', () => {
    expect(matches(c, { collection: 'kilims', q: '' })).toBe(true);
    expect(matches(c, { collection: 'tulu', q: '' })).toBe(false);
  });

  it('matches rugs filed under no collection through __none', () => {
    const none = { collections: '', search: '' };
    expect(matches(none, { collection: '__none', q: '' })).toBe(true);
    expect(matches(none, { collection: 'kilims', q: '' })).toBe(false);
    expect(matches(c, { collection: '__none', q: '' })).toBe(false);
  });

  it('applies the search needle case-insensitively', () => {
    expect(matches(c, { collection: '*', q: 'WINKS' })).toBe(true);
    expect(matches(c, { collection: '*', q: '1389' })).toBe(true);
    expect(matches(c, { collection: '*', q: 'zzz' })).toBe(false);
  });

  it('ignores status entirely — a row that still reads draft is an ordinary product', () => {
    const draft = { collections: 'kilims', status: 'draft', search: '' };
    const archived = { collections: 'kilims', status: 'archived', search: '' };
    expect(matches(draft, { collection: '*', q: '' })).toBe(true);
    expect(matches(archived, { collection: 'kilims', q: '' })).toBe(true);
  });
});

describe('initRugList()', () => {
  it('opens on every rug, whatever its status', () => {
    const list = initRugList();
    expect(visible()).toEqual(['SL-021', 'SL-022', 'SL-023', 'SL-024']);
    expect(count()).toBe('4 rugs shown');
    expect(list.filter()).toEqual({ collection: '*', q: '' });
  });

  it('shows one collection at a time — picking a second replaces the first', () => {
    const list = initRugList();
    press('kilims');
    expect(visible()).toEqual(['SL-021', 'SL-022']);
    expect(list.filter()).toEqual({ collection: 'kilims', q: '' });
    press('tulu');
    expect(visible()).toEqual(['SL-024']);
    expect(list.filter()).toEqual({ collection: 'tulu', q: '' });
    expect(count()).toBe('1 rug shown');
  });

  it('keeps exactly one tab pressed, and "All" is the way back to everything', () => {
    initRugList();
    const pressedValues = (): Array<string | undefined> =>
      [...document.querySelectorAll<HTMLButtonElement>('#collectionChips .chip')]
        .filter((b) => b.getAttribute('aria-pressed') === 'true')
        .map((b) => b.dataset.value);
    expect(pressedValues()).toEqual(['*']);
    press('kilims');
    expect(pressedValues()).toEqual(['kilims']);
    // Pressing the pressed tab does not release it: a list filtered to nothing by an invisible
    // filter is the state this avoids.
    press('kilims');
    expect(pressedValues()).toEqual(['kilims']);
    press('*');
    expect(pressedValues()).toEqual(['*']);
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
    expect(list.filter()).toEqual({ collection: '*', q: 'yellow' });
  });

  it('hides the pager when everything fits on one page', () => {
    initRugList();
    expect(document.getElementById('rugPager')?.hidden).toBe(true);
  });
});

describe('paging the list at 20 (owner, 2026-09-16)', () => {
  /** 25 rugs, all in one collection, so only the pager decides what is on screen. */
  const many = (n: number): string =>
    Array.from({ length: n }, (_, i) => {
      const id = `SL-${String(100 + i)}`;
      return card(id, 'kilims', `${id.toLowerCase()} rug ${i}`);
    }).join('');

  beforeEach(() => mount(many(25)));

  const nav = (): HTMLElement => document.getElementById('rugPager')!;
  const label = (): string => nav().querySelector('[data-page="label"]')!.textContent ?? '';
  const next = (): HTMLButtonElement => nav().querySelector<HTMLButtonElement>('[data-page="next"]')!;
  const prev = (): HTMLButtonElement => nav().querySelector<HTMLButtonElement>('[data-page="prev"]')!;

  it('shows the first 20 and offers the rest', () => {
    initRugList();
    expect(visible()).toHaveLength(20);
    expect(visible()[0]).toBe('SL-100');
    expect(visible()[19]).toBe('SL-119');
    expect(nav().hidden).toBe(false);
    expect(label()).toBe('Page 1 of 2');
    expect(prev().disabled).toBe(true);
    expect(next().disabled).toBe(false);
    // The count reports the whole result, and how much of it is on screen.
    expect(count()).toBe('20 of 25 rugs shown');
  });

  it('pages forward and back', () => {
    initRugList();
    next().click();
    expect(label()).toBe('Page 2 of 2');
    expect(visible()).toHaveLength(5);
    expect(visible()[0]).toBe('SL-120');
    expect(next().disabled).toBe(true);
    expect(count()).toBe('5 of 25 rugs shown');
    prev().click();
    expect(label()).toBe('Page 1 of 2');
    expect(visible()[0]).toBe('SL-100');
  });

  it('returns to page 1 when the filter changes, so a search never lands on an empty page', () => {
    initRugList();
    next().click();
    expect(label()).toBe('Page 2 of 2');
    const q = document.getElementById('q') as HTMLInputElement;
    q.value = 'sl-101';
    q.dispatchEvent(new Event('input'));
    expect(label()).toBe('Page 1 of 1');
    expect(visible()).toEqual(['SL-101']);
    expect(nav().hidden).toBe(true); // one page of results needs no pager
    expect(count()).toBe('1 rug shown');
  });

  it('counts a rug once even though the page renders it twice', () => {
    // The real page renders every rug as a table row AND as a gallery card, sharing one data-id.
    const rows = Array.from({ length: 25 }, (_, i) => card(`SL-${String(100 + i)}`, 'kilims', 'x')).join('');
    mount(rows + rows);
    initRugList();
    // 20 ids on the page, each present twice.
    expect(visible()).toHaveLength(40);
    expect(new Set(visible()).size).toBe(20);
    expect(count()).toBe('20 of 25 rugs shown');
    expect(label()).toBe('Page 1 of 2');
  });
});
