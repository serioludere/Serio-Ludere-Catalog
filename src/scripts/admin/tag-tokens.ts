// The product form's tags (owner, 2026-09-18), replacing the toggle chips that were driven by a
// Tags registry.
//
// Tags are plain strings on the product now. They are not a filter, not a collection and not rows in
// a tab of their own: what you see here IS the list, and the only place it is edited is this form.
// So there is no pressed/unpressed state — a tag is either on the product or it is not — and each
// token carries an × that removes it. The × is always in the DOM (CSS reveals it on hover) because a
// control that only exists on hover cannot be reached by keyboard.
//
// The API deliberately mirrors the `ChipGroup` this replaced, so rug-form.ts reads the same either
// way: `values()` is every tag present, and `add()` appends one rather than pressing an existing one.
import { el } from './dom.ts';

export interface TagTokensOptions {
  onChange?: (values: string[]) => void;
}

export interface TagTokens {
  el: HTMLElement;
  /** Every tag on the product, in the order shown. */
  values(): string[];
  set(values: readonly string[]): void;
  /** Appends the tag unless it is already there (case-insensitive); returns false when it was. */
  add(value: string): boolean;
  has(value: string): boolean;
  remove(value: string): void;
}

const TOKEN = '[data-tag]';

/** Case-insensitive, whitespace-trimmed: "Kilim" and " kilim " are the same tag. */
const key = (value: string): string => value.trim().toLowerCase();

export function initTagTokens(container: HTMLElement, opts: TagTokensOptions = {}): TagTokens {
  const doc = container.ownerDocument;
  const tokens = (): HTMLElement[] => [...container.querySelectorAll<HTMLElement>(TOKEN)];
  const values = (): string[] => tokens().map((t) => t.dataset.tag ?? '');

  const render = (value: string): HTMLElement => {
    const token = el('span', { class: 'tagtoken', 'data-tag': value }, [], doc);
    token.append(el('span', { class: 'tagtoken__label' }, value, doc));
    token.append(
      el(
        'button',
        {
          type: 'button',
          class: 'tagtoken__x',
          'data-remove': value,
          // The name says which tag, so a screen reader hears "Remove Kilim" and not five "Remove"s.
          'aria-label': `Remove ${value}`,
        },
        '×',
        doc,
      ),
    );
    return token;
  };

  const set = (wanted: readonly string[], notify = false): void => {
    container.replaceChildren();
    const seen = new Set<string>();
    for (const raw of wanted) {
      const value = raw.trim();
      if (!value || seen.has(key(value))) continue;
      seen.add(key(value));
      container.append(render(value));
    }
    if (notify) opts.onChange?.(values());
  };

  const has = (value: string): boolean => values().some((v) => key(v) === key(value));

  const add = (value: string): boolean => {
    const clean = value.trim();
    if (!clean || has(clean)) return false;
    container.append(render(clean));
    opts.onChange?.(values());
    return true;
  };

  const remove = (value: string): void => {
    for (const token of tokens()) {
      if (key(token.dataset.tag ?? '') === key(value)) token.remove();
    }
    opts.onChange?.(values());
  };

  container.addEventListener('click', (e) => {
    const x = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-remove]');
    if (!x || !container.contains(x)) return;
    e.preventDefault();
    // Focus does not survive removing the element it is on, so it moves to the next ×, or to the
    // container, rather than falling back to <body> and losing the keyboard user's place.
    const all = tokens();
    const i = all.findIndex((t) => t.contains(x));
    remove(x.dataset.remove ?? '');
    const next = tokens()[Math.min(i, tokens().length - 1)];
    next?.querySelector<HTMLButtonElement>('button[data-remove]')?.focus();
  });

  // Whatever the server rendered is the starting state; nothing is re-rendered on load.
  return { el: container, values, set: (v) => set(v, false), add, has, remove };
}
