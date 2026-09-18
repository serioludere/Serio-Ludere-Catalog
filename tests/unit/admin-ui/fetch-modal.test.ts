// @vitest-environment happy-dom
// The fetch modal's states — Figma P5 (81:1865), P6 (81:1974), P9 (85:2652).
//
// P7/P8, the read-only summary with "Use these", are gone (owner, 2026-09-18): the form below the
// modal is the editable preview, so the steps hand the fields straight to it rather than showing the
// same values twice, once uneditable. What is left to guard is the reveal order — the photo lands
// before the modal closes, and Cancel is available throughout, costing nothing.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FetchModalView, fetchModalParts } from '../../../src/scripts/admin/fetch-modal.ts';

/** happy-dom implements <dialog> only partially. */
function stubDialog(el: HTMLElement): void {
  const d = el as HTMLDialogElement & { showModal: () => void; close: () => void };
  d.showModal = () => d.setAttribute('open', '');
  d.close = () => {
    d.removeAttribute('open');
    d.dispatchEvent(new Event('close'));
  };
}

const on = {
  onCancel: vi.fn(),
  onUse: vi.fn(),
  onManual: vi.fn(),
  onRetry: vi.fn(),
};

let view: FetchModalView;

beforeEach(() => {
  document.body.innerHTML = `
    <dialog id="fetch-result" class="fetch">
      <h2 class="fetch__title" data-fetch-title>Fetching</h2>
      <div class="fetch__bar" role="progressbar" data-fetch-bar hidden></div>
      <div class="fetch__body" data-fetch-body></div>
      <div class="fetch__footer" data-fetch-footer></div>
    </dialog>`;
  stubDialog(document.getElementById('fetch-result')!);
  const parts = fetchModalParts(document)!;
  expect(parts).toBeTruthy();
  view = new FetchModalView(parts, on, document);
});

afterEach(() => {
  for (const fn of Object.values(on)) fn.mockReset();
});

const title = (): string => document.querySelector('[data-fetch-title]')!.textContent!.trim();
const body = (): string => document.querySelector('[data-fetch-body]')!.textContent!.replace(/\s+/g, ' ');
const footerLabels = (): string[] =>
  [...document.querySelectorAll('[data-fetch-footer] button')].map((b) => b.textContent!.trim());
const isOpen = (): boolean => document.getElementById('fetch-result')!.hasAttribute('open');


describe('P5 · fetching', () => {
  it('names the product and the host, and lists the three stages in order', () => {
    view.fetching('SL-0413', 'supplier.example');
    expect(title()).toBe('Fetching SL-0413');
    expect(body()).toContain('Waiting for the first photo…');
    const steps = [...document.querySelectorAll('[data-step] .step__label')].map((s) => s.textContent);
    expect(steps).toEqual(['Reaching supplier.example', 'Parsing the page', 'Resolving images']);
  });

  it('shows the indeterminate bar — a scrape has no honest percentage', () => {
    view.fetching('SL-0413', 'supplier.example');
    const bar = document.querySelector<HTMLElement>('[data-fetch-bar]')!;
    expect(bar.hidden).toBe(false);
    expect(bar.getAttribute('role')).toBe('progressbar');
    // Never a value: the stage labels carry the real information.
    expect(bar.hasAttribute('aria-valuenow')).toBe(false);
  });

  it('offers Cancel and nothing else, and says why that is free', () => {
    view.fetching('SL-0413', 'supplier.example');
    expect(footerLabels()).toEqual(['Cancel']);
    expect(body()).toContain('nothing has been written yet');
    document.querySelector<HTMLButtonElement>('[data-fetch-footer] button')!.click();
    expect(on.onCancel).toHaveBeenCalled();
  });

  it('advances the stages without re-mounting the rows', () => {
    view.fetching('SL-0413', 'supplier.example');
    const before = document.querySelector('[data-step="reaching"]');
    view.stage('parsing', '0.8s');
    // Same node: a row that re-mounts interrupts a screen reader mid-announcement.
    expect(document.querySelector('[data-step="reaching"]')).toBe(before);
    expect(document.querySelector('[data-step="reaching"]')!.classList.contains('step--done')).toBe(true);
    expect(document.querySelector('[data-step="parsing"]')!.classList.contains('step--active')).toBe(true);
    expect(document.querySelector('[data-step="parsing"] [data-step-detail]')!.textContent).toBe('0.8s');
  });
});

describe('P6 · photo revealed before the fields', () => {
  it('puts the photo FIRST in the body, ahead of everything else', () => {
    view.fetching('SL-0413', 'supplier.example');
    view.photo('https://img.test/a.jpg');
    // This ordering is the feature: the wrong rug is recognised from the picture, and cancelled
    // before a single field has been read.
    expect(document.querySelector('[data-fetch-body]')!.firstElementChild).toHaveProperty(
      'dataset.fetchPhoto',
    );
    expect(body()).toContain('Is this the right rug?');
  });

  it('survives the photo arriving twice', () => {
    view.fetching('SL-0413', 'supplier.example');
    view.photo('https://img.test/a.jpg');
    view.photo('https://img.test/a.jpg');
    expect(document.querySelectorAll('[data-fetch-photo]')).toHaveLength(1);
  });

  it('keeps the photo as the stages advance', () => {
    view.fetching('SL-0413', 'supplier.example');
    view.photo('https://img.test/a.jpg');
    view.stage('parsing');
    expect(document.querySelectorAll('[data-fetch-photo]')).toHaveLength(1);
  });
});

describe('P9 · fetch failed, manual fallback', () => {
  beforeEach(() => view.failed('blocked the request.', 'supplier.example'));

  it('names who refused and reassures that nothing was lost', () => {
    expect(title()).toBe("Couldn't fetch that page");
    expect(body()).toContain('supplier.example blocked the request.');
    // Load-bearing: after a failure the natural assumption is that the typing is gone.
    expect(body()).toContain('Your ID, name and link are still in the panel behind this.');
    expect(body()).toContain('The link is kept as source attribution either way.');
  });

  it('offers manual entry and a retry, and neither is destructive', () => {
    expect(footerLabels()).toEqual(['Enter it manually instead', 'Try fetching again']);
    const [manual, retry] = [...document.querySelectorAll<HTMLButtonElement>('[data-fetch-footer] button')];
    manual!.click();
    expect(on.onManual).toHaveBeenCalled();
    view.failed('blocked the request.', 'supplier.example');
    [...document.querySelectorAll<HTMLButtonElement>('[data-fetch-footer] button')][1]!.click();
    expect(on.onRetry).toHaveBeenCalled();
    expect(retry).toBeTruthy();
  });
});

describe('the dialog itself', () => {
  it('opens on the first state and closes on demand', () => {
    expect(isOpen()).toBe(false);
    view.fetching('SL-0413', 'supplier.example');
    expect(isOpen()).toBe(true);
    view.close();
    expect(isOpen()).toBe(false);
  });

  it('does not re-open an already-open dialog when the state changes', () => {
    view.fetching('SL-0413', 'supplier.example');
    const dialog = document.getElementById('fetch-result') as HTMLDialogElement;
    const spy = vi.spyOn(dialog, 'showModal');
    view.failed('supplier.example refused the request', 'supplier.example');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('a page without the modal', () => {
  it('reports no parts, so the caller can fall back to applying directly', () => {
    document.body.innerHTML = '<div></div>';
    expect(fetchModalParts(document)).toBeUndefined();
  });
});
