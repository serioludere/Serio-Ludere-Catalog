// @vitest-environment happy-dom
// The two client modules the redesigned preview adds: the filter strip (Figma 53:42) and the
// thumbnail strip on the product detail page (Figma 57:242).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindFilters } from '../../src/scripts/filters.ts';
import { bindPreviewGallery } from '../../src/scripts/preview-gallery.ts';

function page(html: string): void {
  document.body.innerHTML = html;
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

const STRIP = `
  <nav class="pv-filters">
    <button class="pv-chip is-on" data-filter="all" aria-pressed="true">All</button>
    <button class="pv-chip" data-filter="kilims" aria-pressed="false">Kilims</button>
    <button class="pv-chip" data-filter="gabbeh" aria-pressed="false">Gabbeh</button>
  </nav>
  <div data-card data-rug="SL-1" data-collections="kilims antique"></div>
  <div data-card data-rug="SL-2" data-collections="gabbeh"></div>
  <div data-card data-rug="SL-3" data-collections="more"></div>
  <p data-grid-empty hidden></p>`;

/** A window stand-in: filters.ts reads the query string and rewrites it with replaceState. */
const fakeWin = (search = '') => {
  const replaceState = vi.fn();
  return {
    win: {
      location: { href: `http://localhost/hala${search}`, search },
      history: { replaceState },
    } as unknown as Window,
    replaceState,
  };
};

const shown = (): string[] =>
  [...document.querySelectorAll<HTMLElement>('[data-card]')]
    .filter((c) => !c.hidden)
    .map((c) => c.dataset.rug!);

describe('filters.ts', () => {
  let unbind: (() => void) | undefined;
  afterEach(() => {
    unbind?.();
    unbind = undefined;
  });

  it('shows everything under All and narrows to one collection on click', () => {
    page(STRIP);
    const { win, replaceState } = fakeWin();
    unbind = bindFilters({ win });
    expect(shown()).toEqual(['SL-1', 'SL-2', 'SL-3']);

    document.querySelector<HTMLButtonElement>('[data-filter="kilims"]')!.click();
    expect(shown()).toEqual(['SL-1']);
    expect(document.querySelector('[data-filter="kilims"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('[data-filter="all"]')?.getAttribute('aria-pressed')).toBe('false');
    // The choice survives a reload and the Back button.
    expect(String(replaceState.mock.calls.at(-1)?.[2])).toContain('collection=kilims');

    document.querySelector<HTMLButtonElement>('[data-filter="all"]')!.click();
    expect(shown()).toEqual(['SL-1', 'SL-2', 'SL-3']);
    expect(String(replaceState.mock.calls.at(-1)?.[2])).not.toContain('collection=');
  });

  it('honours ?collection= on load and ignores one that is not on the page', () => {
    page(STRIP);
    unbind = bindFilters({ win: fakeWin('?collection=gabbeh').win });
    expect(shown()).toEqual(['SL-2']);
    unbind();

    page(STRIP);
    unbind = bindFilters({ win: fakeWin('?collection=nothing-like-this').win });
    expect(shown()).toEqual(['SL-1', 'SL-2', 'SL-3']);
  });

  it('matches a rug in several collections under each of them', () => {
    page(STRIP.replace('data-collections="gabbeh"', 'data-collections="gabbeh kilims"'));
    unbind = bindFilters({ win: fakeWin().win });
    document.querySelector<HTMLButtonElement>('[data-filter="kilims"]')!.click();
    expect(shown()).toEqual(['SL-1', 'SL-2']);
    document.querySelector<HTMLButtonElement>('[data-filter="gabbeh"]')!.click();
    expect(shown()).toEqual(['SL-2']);
  });

  it('announces an empty result instead of leaving a blank band', () => {
    page(STRIP.replace('data-collections="gabbeh"', 'data-collections="kilims"'));
    unbind = bindFilters({ win: fakeWin().win });
    const empty = document.querySelector<HTMLElement>('[data-grid-empty]')!;
    expect(empty.hidden).toBe(true);
    document.querySelector<HTMLButtonElement>('[data-filter="gabbeh"]')!.click();
    expect(shown()).toEqual([]);
    expect(empty.hidden).toBe(false);
  });

  it('does nothing on a page with no strip', () => {
    page('<p>no filters here</p>');
    expect(() => bindFilters()()).not.toThrow();
  });
});

describe('preview-gallery.ts', () => {
  let unbind: (() => void) | undefined;
  afterEach(() => {
    unbind?.();
    unbind = undefined;
  });

  const GALLERY = `
    <img data-hero-img src="/a.jpg" alt="Kashan" />
    <div data-thumbs>
      <button class="pv-thumb is-on" data-full="/a.jpg" data-alt="Kashan, photograph 1" aria-current="true"></button>
      <button class="pv-thumb" data-full="/b.jpg" data-alt="Kashan, photograph 2"></button>
    </div>`;

  it('swaps the hero and moves the current marker', () => {
    page(GALLERY);
    unbind = bindPreviewGallery();
    const [first, second] = document.querySelectorAll<HTMLButtonElement>('.pv-thumb');
    second!.click();
    const hero = document.querySelector<HTMLImageElement>('[data-hero-img]')!;
    expect(hero.getAttribute('src')).toBe('/b.jpg');
    expect(hero.getAttribute('alt')).toBe('Kashan, photograph 2');
    expect(second!.getAttribute('aria-current')).toBe('true');
    expect(second!.classList.contains('is-on')).toBe(true);
    // Exactly one is current at a time, and it is announced rather than shown by colour alone.
    expect(first!.getAttribute('aria-current')).toBeNull();
    expect(first!.classList.contains('is-on')).toBe(false);
  });

  it('does nothing without a strip or without a hero', () => {
    page('<img data-hero-img src="/a.jpg" />');
    expect(() => bindPreviewGallery()()).not.toThrow();
    page('<div data-thumbs><button data-full="/b.jpg"></button></div>');
    expect(() => bindPreviewGallery()()).not.toThrow();
  });
});
