// The detail page's thumbnail strip (Figma 57:242).
//
// Six 96×120 thumbnails; the selected one carries a 2px ink border where the rest carry a hairline.
// Clicking one swaps the hero image. That is the whole behaviour — the design draws no lightbox, no
// zoom and nothing that suggests the hero itself is clickable, so none of that is invented here.
//
// The thumbnails are real buttons in a toolbar, so the strip is reachable by keyboard and the
// current one is announced through `aria-current` rather than by colour alone.
//
// `role="toolbar"` is a promise about keyboard behaviour, not a label: ARIA's toolbar pattern is ONE
// tab stop with the arrow keys moving between the controls inside it. The role shipped without that
// for a while, which is the worst of both worlds — a screen reader announced a toolbar and then the
// arrow keys did nothing, while every thumbnail sat in the tab order. Both halves are implemented
// here: a roving tabindex (exactly one thumbnail is tabbable, always the selected one) plus
// Arrow/Home/End. Selecting through the keyboard swaps the hero as clicking does, because for this
// widget moving IS choosing — there is nothing else to activate.
export interface GalleryBindings {
  doc?: Document;
}

export function bindPreviewGallery(opts: GalleryBindings = {}): () => void {
  const doc = opts.doc ?? document;
  const strip = doc.querySelector<HTMLElement>('[data-thumbs]');
  const hero = doc.querySelector<HTMLImageElement>('[data-hero-img]');
  if (!strip || !hero) return () => {};

  const thumbs = (): HTMLButtonElement[] => [
    ...strip.querySelectorAll<HTMLButtonElement>('button[data-full]'),
  ];

  const select = (btn: HTMLButtonElement): void => {
    const src = btn.dataset.full;
    if (!src) return;
    hero.src = src;
    const alt = btn.dataset.alt;
    if (alt) hero.alt = alt;
    thumbs().forEach((b) => {
      const on = b === btn;
      b.classList.toggle('is-on', on);
      if (on) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
      // The roving tabindex: the selected thumbnail is the strip's single tab stop.
      b.tabIndex = on ? 0 : -1;
    });
  };

  const onClick = (e: Event): void => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-full]');
    if (btn) select(btn);
  };

  const onKeydown = (e: KeyboardEvent): void => {
    const all = thumbs();
    if (all.length === 0) return;
    const from = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-full]');
    const at = from ? all.indexOf(from) : -1;
    if (at < 0) return;
    // Wraps at both ends, which is what the toolbar pattern specifies for a short, cyclic strip.
    const to =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? (at + 1) % all.length
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? (at - 1 + all.length) % all.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? all.length - 1
              : -1;
    if (to < 0) return;
    // Only now, so Tab, Enter and Space keep their meanings.
    e.preventDefault();
    const next = all[to];
    if (!next) return;
    select(next);
    next.focus();
  };

  // The server renders every thumbnail tabbable and marks the first one current; collapse that to a
  // single tab stop on load so the strip starts in the state the role claims.
  const current = strip.querySelector<HTMLButtonElement>('button[data-full][aria-current="true"]');
  const first = current ?? thumbs()[0];
  thumbs().forEach((b) => {
    b.tabIndex = b === first ? 0 : -1;
  });

  strip.addEventListener('click', onClick);
  strip.addEventListener('keydown', onKeydown);
  return () => {
    strip.removeEventListener('click', onClick);
    strip.removeEventListener('keydown', onKeydown);
  };
}

export function initPreviewGallery(): void {
  bindPreviewGallery();
}
