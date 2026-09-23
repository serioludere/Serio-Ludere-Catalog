// @vitest-environment happy-dom
// The inline pre-paint step (src/scripts/prepaint.js) is plain JS inlined by Layout.astro; it must
// make deep links, saved votes and the saved unit/currency correct before the deferred modules run.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/scripts/prepaint.js'), 'utf8');
const run = (): void => {
  new Function(source)();
};

const dom = `
  <script type="application/json" id="sl-rates">{"rates":{"USD":1,"MXN":17.5},"symbols":{"USD":"$","MXN":"$"}}</script>
  <div class="toggle" id="unitTog"><button data-u="cm" class="on" aria-pressed="true">cm</button><button data-u="ft" aria-pressed="false">ft</button></div>
  <select class="cur" id="cur"><option>USD</option><option>MXN</option></select>
  <nav id="nav"><button data-collection="classics" class="on" aria-selected="true" tabindex="0">Classics</button>
  <button data-collection="kilims" class="" aria-selected="false" tabindex="-1">Kilims</button></nav>
  <div data-card data-collection="classics">
    <button data-vote="like" data-rug="SL-1" aria-pressed="false"></button>
    <button data-vote="dislike" data-rug="SL-1" aria-pressed="false"></button>
    <li data-dims data-w="135" data-l="190">135 × 190 cm</li>
    <div class="price" data-price data-usd="576">$576</div>
  </div>
  <div data-card data-collection="kilims" hidden>
    <li data-dims data-w="" data-l="" hidden></li>
    <div class="price" data-price data-usd="" hidden></div>
  </div>`;

const real = Intl.DateTimeFormat.prototype.resolvedOptions;

/** Pins what the currency guess reads: the browser's time zone and its language list. */
function visitor(timeZone: string, languages: string[] = ['en']): void {
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockImplementation(function (
    this: Intl.DateTimeFormat,
  ) {
    return { ...real.call(this), timeZone };
  });
  Object.defineProperty(navigator, 'languages', { value: languages, configurable: true });
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = dom;
  document.documentElement.removeAttribute('data-cur-guess');
  // A neutral visitor unless a test says otherwise: the machine running the suite must not decide.
  visitor('UTC');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('prepaint.js', () => {
  it('leaves the server render untouched for a first-time visitor (cm, USD, no votes)', () => {
    run();
    expect(document.querySelector('[data-dims]')?.textContent).toBe('135 × 190 cm');
    expect(document.querySelector('[data-price]')?.textContent).toBe('$576');
    expect(document.querySelector('button[data-u="cm"]')?.classList.contains('on')).toBe(true);
    expect(document.querySelector<HTMLSelectElement>('#cur')?.value).toBe('USD');
    expect(document.querySelector('button[data-vote="like"]')?.getAttribute('aria-pressed')).toBe('false');
  });
  it('restores the saved unit, currency and votes before first paint, exactly as prefs.ts renders them', () => {
    localStorage.setItem('sl-unit', 'ft');
    localStorage.setItem('sl-cur', 'MXN');
    localStorage.setItem('sl-saved', JSON.stringify({ 'SL-1': 'disliked' }));
    run();
    expect(document.querySelector('[data-dims]')?.textContent).toBe(`4' 5" × 6' 3"`);
    expect(document.querySelector('[data-price]')?.textContent).toMatch(/^\$10[,.\s]?080$/);
    expect(document.querySelector('button[data-u="ft"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('button[data-u="cm"]')?.classList.contains('on')).toBe(false);
    expect(document.querySelector<HTMLSelectElement>('#cur')?.value).toBe('MXN');
    expect(document.querySelector('button[data-vote="dislike"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('button[data-vote="like"]')?.getAttribute('aria-pressed')).toBe('false');
    // Cards without dims or price stay hidden.
    const hidden = document.querySelectorAll('[data-card]')[1]!;
    expect(hidden.querySelector<HTMLElement>('[data-dims]')?.hidden).toBe(true);
    expect(hidden.querySelector<HTMLElement>('[data-price]')?.hidden).toBe(true);
  });
  it('falls back to USD when the saved currency is not offered or has no rate', () => {
    localStorage.setItem('sl-cur', 'EUR');
    run();
    expect(document.querySelector<HTMLSelectElement>('#cur')?.value).toBe('USD');
    expect(document.querySelector('[data-price]')?.textContent).toBe('$576');
  });
  it('survives corrupt storage and a missing rates block', () => {
    localStorage.setItem('sl-saved', '{not json');
    localStorage.setItem('sl-unit', 'ft');
    document.getElementById('sl-rates')?.remove();
    expect(run).not.toThrow();
    expect(document.querySelector('[data-dims]')?.textContent).toBe(`4' 5" × 6' 3"`); // USD default still renders
    expect(document.querySelector('[data-price]')?.textContent).toBe('$576');
  });
});

describe('prepaint.js — the currency a first-time visitor sees (owner, 2026-09-23)', () => {
  const everyCurrency = `
    <script type="application/json" id="sl-rates">{"rates":{"USD":1,"MXN":17.5,"EUR":0.92,"GBP":0.79,"CAD":1.37,"AED":3.67,"SAR":3.75},"symbols":{"USD":"$","MXN":"MX$","EUR":"€","GBP":"£","CAD":"CA$","AED":"AED ","SAR":"SAR "}}</script>
    <div id="unitTog"><button data-u="cm" class="on" aria-pressed="true">cm</button><button data-u="ft" aria-pressed="false">ft</button></div>
    <select id="cur"><option>USD</option><option>EUR</option><option>GBP</option><option>CAD</option><option>MXN</option><option>AED</option><option>SAR</option></select>
    <div data-unit-toggle><button data-u="cm" class="on" aria-pressed="true">cm</button><button data-u="ft" aria-pressed="false">ft</button></div>
    <select data-cur><option>USD</option><option>EUR</option><option>GBP</option><option>CAD</option><option>MXN</option><option>AED</option><option>SAR</option></select>
    <div class="price" data-price data-usd="1000">$1,000</div>`;
  const shown = (): string => document.querySelector<HTMLSelectElement>('#cur')!.value;
  const guessFor = (timeZone: string, languages: string[] = ['en']): string => {
    document.body.innerHTML = everyCurrency;
    visitor(timeZone, languages);
    run();
    return shown();
  };

  it.each([
    ['America/Mexico_City', 'MXN'],
    ['America/Tijuana', 'MXN'],
    ['America/Cancun', 'MXN'],
    ['America/Toronto', 'CAD'],
    ['America/Vancouver', 'CAD'],
    ['America/New_York', 'USD'],
    ['America/Indiana/Indianapolis', 'USD'],
    ['Pacific/Honolulu', 'USD'],
    ['Europe/London', 'GBP'],
    ['Europe/Paris', 'EUR'],
    ['Europe/Berlin', 'EUR'],
    ['Europe/Madrid', 'EUR'],
    ['Atlantic/Canary', 'EUR'],
    ['Europe/Zurich', 'EUR'],
    ['Europe/Stockholm', 'EUR'],
    ['Asia/Dubai', 'AED'],
    ['Asia/Riyadh', 'SAR'],
    ['Europe/Moscow', 'USD'],
    ['Asia/Tokyo', 'USD'],
    ['America/Bogota', 'USD'],
    ['UTC', 'USD'],
  ])('%s → %s', (zone, currency) => {
    expect(guessFor(zone)).toBe(currency);
  });

  it('falls back to the region of the browser language when the zone says nothing', () => {
    expect(guessFor('UTC', ['es-MX', 'es'])).toBe('MXN');
    expect(guessFor('Asia/Tokyo', ['en', 'fr-CA'])).toBe('CAD');
    expect(guessFor('UTC', ['de-DE'])).toBe('EUR');
    expect(guessFor('UTC', ['en-GB'])).toBe('GBP');
    expect(guessFor('UTC', ['ar-AE'])).toBe('AED');
    expect(guessFor('UTC', ['zh-Hant-TW'])).toBe('USD');
  });

  it('trusts the clock over the language: a Mexican phone set to Los Angeles pays in dollars', () => {
    expect(guessFor('America/Los_Angeles', ['es-MX'])).toBe('USD');
    expect(guessFor('Europe/Madrid', ['es-MX'])).toBe('EUR');
  });

  it('paints the guessed price and both copies of the picker, and saves nothing', () => {
    expect(guessFor('America/Mexico_City')).toBe('MXN');
    expect(document.querySelector<HTMLSelectElement>('select[data-cur]')!.value).toBe('MXN');
    expect(document.querySelector('[data-price]')?.textContent).toMatch(/^MX\$17[,.\s]?500$/);
    expect(document.documentElement.getAttribute('data-cur-guess')).toBe('MXN');
    expect(localStorage.getItem('sl-cur')).toBeNull();
  });

  it('never overrides a saved choice', () => {
    localStorage.setItem('sl-cur', 'GBP');
    expect(guessFor('America/Mexico_City')).toBe('GBP');
  });

  it('skips a guess the sheet cannot price and tries the next one', () => {
    document.body.innerHTML = dom; // USD and MXN only
    visitor('Europe/Paris', ['es-MX']);
    run();
    expect(document.documentElement.getAttribute('data-cur-guess')).toBe('EUR MXN');
    expect(document.querySelector<HTMLSelectElement>('#cur')!.value).toBe('MXN');
  });

  it('sets the unit on both copies of the toggle', () => {
    localStorage.setItem('sl-unit', 'ft');
    guessFor('UTC');
    for (const b of document.querySelectorAll('button[data-u="ft"]'))
      expect(b.getAttribute('aria-pressed')).toBe('true');
  });

  it('survives a browser with no Intl time zone', () => {
    document.body.innerHTML = everyCurrency;
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('no Intl');
    });
    Object.defineProperty(navigator, 'languages', { value: ['en-CA'], configurable: true });
    expect(run).not.toThrow();
    expect(shown()).toBe('CAD');
  });
});
