// @vitest-environment happy-dom
// The 20-per-page control (owner, 2026-09-16), shared by the admin's product list and the buyer's
// catalogue. Since 2026-10-08 the buyer's grid, whose pager sits UNDER it, hands the scroll after a
// page turn to `reveal`, which takes the reader back to the top of the grid.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initPager } from '../../src/scripts/ui/paginate.ts';

function setup(count: number, reveal?: () => void) {
  const cards = Array.from({ length: count }, (_, i) => `<div data-card data-rug="SL-${i + 1}"></div>`);
  document.body.innerHTML = `
    <div id="grid">${cards.join('')}</div>
    <nav id="pager" hidden>
      <button data-page="prev">Previous</button>
      <p data-page="label"></p>
      <button data-page="next">Next</button>
    </nav>`;
  const root = document.getElementById('pager')!;
  const scrollIntoView = vi.fn();
  root.scrollIntoView = scrollIntoView;
  const items = [...document.querySelectorAll<HTMLElement>('[data-card]')];
  initPager({
    items,
    elements: {
      root,
      prev: root.querySelector<HTMLButtonElement>('[data-page="prev"]')!,
      next: root.querySelector<HTMLButtonElement>('[data-page="next"]')!,
      label: root.querySelector<HTMLElement>('[data-page="label"]')!,
    },
    reveal,
  }).apply(() => true);
  return {
    root,
    scrollIntoView,
    shown: () => items.filter((el) => !el.hidden).map((el) => el.dataset.rug),
    turn: () => root.querySelector<HTMLButtonElement>('[data-page="next"]')!.click(),
  };
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('initPager', () => {
  it('shows 20 at a time, and stays out of sight when everything fits on one page', () => {
    expect(setup(20).root.hidden).toBe(true);

    const long = setup(23);
    expect(long.root.hidden).toBe(false);
    expect(long.shown()).toHaveLength(20);
    long.turn();
    expect(long.shown()).toEqual(['SL-21', 'SL-22', 'SL-23']);
    expect(long.root.querySelector('[data-page="label"]')?.textContent).toBe('Page 2 of 2');
  });

  it('scrolls the pager into view after a page turn by default (the admin)', () => {
    const { turn, scrollIntoView } = setup(23);
    turn();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('hands that scroll to `reveal` when it is given one (the buyer, owner 2026-10-08)', () => {
    const reveal = vi.fn();
    const { turn, scrollIntoView } = setup(23, reveal);
    turn();
    expect(reveal).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
