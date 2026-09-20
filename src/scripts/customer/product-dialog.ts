// The product popup on the customer grid (owner, 2026-09-20). See ProductDialog.astro for why the
// content is cloned from a server-rendered <template> rather than fetched.
//
// The cards remain ordinary links, so middle-click, ⌘/Ctrl-click, "open in new tab" and a browser
// without JavaScript all still reach `/{slug}/{id}`. Only a plain left click is intercepted.
import { bindPreviewGallery } from '../preview-gallery.ts';
import { paint, readSaved } from '../votes.ts';

export interface ProductDialogBindings {
  doc?: Document;
}

/** A rug's own page, `/{slug}/{id}` with an optional `?collection=`. `id` is what keys the template. */
function rugIdOf(link: HTMLAnchorElement): string | undefined {
  const card = link.closest<HTMLElement>('[data-card][data-rug]');
  const id = card?.dataset.rug;
  if (!id) return undefined;
  // Only links that go to this rug's own page — a reaction button or a future link out is not it.
  const href = link.getAttribute('href') ?? '';
  return href.includes(encodeURIComponent(id)) || href.includes(id) ? id : undefined;
}

export function bindProductDialog(opts: ProductDialogBindings = {}): () => void {
  const doc = opts.doc ?? document;
  const dialog = doc.querySelector<HTMLDialogElement>('dialog[data-product-dialog]');
  const body = dialog?.querySelector<HTMLElement>('[data-product-body]');
  if (!dialog || !body || typeof dialog.showModal !== 'function') return () => {};

  const view = doc.defaultView;
  const customer = doc.documentElement.dataset.customer || undefined;
  let releaseGallery: (() => void) | undefined;
  /** Where the grid was before the dialog took over the address bar; restored on close. */
  let returnTo: string | undefined;

  const open = (id: string, href: string): boolean => {
    const template = doc.querySelector<HTMLTemplateElement>(`template[data-detail="${CSS.escape(id)}"]`);
    if (!template) return false; // no content for this rug: let the link navigate as it always did
    releaseGallery?.();
    body.replaceChildren(template.content.cloneNode(true));
    dialog.showModal();

    // The thumbnail strip is bound per open, because the strip it binds is the one just cloned in.
    releaseGallery = bindPreviewGallery({ doc });
    // Sizes and prices are rendered in the visitor's chosen unit and currency by prefs.ts, which
    // paints on load and on change — so the freshly cloned nodes are told to catch up.
    doc.getElementById('cur')?.dispatchEvent(new Event('change', { bubbles: true }));
    // A rug this buyer has already liked opens showing it (votes.ts owns the click itself).
    const saved = readSaved(view?.localStorage ?? localStorage, customer)[id];
    if (saved) paint(id, saved, doc);

    // The address bar follows the rug, so Back closes the dialog and the link can still be copied.
    if (view?.history) {
      returnTo = view.location.pathname + view.location.search;
      view.history.pushState({ slProduct: id }, '', href);
    }
    return true;
  };

  const onClick = (e: MouseEvent): void => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href]');
    if (!link || link.target === '_blank' || !doc.contains(link)) return;
    const id = rugIdOf(link);
    if (!id) return;
    if (open(id, link.getAttribute('href') ?? '')) e.preventDefault();
  };

  const onClose = (): void => {
    releaseGallery?.();
    releaseGallery = undefined;
    body.replaceChildren();
    // Only rewind the history entry this dialog pushed; a Back press has already done it itself.
    if (returnTo && view?.history.state?.slProduct) view.history.back();
    returnTo = undefined;
  };

  // Back/forward while it is open: close rather than leave the dialog over a changed page.
  const onPopState = (): void => {
    if (dialog.open) {
      returnTo = undefined;
      dialog.close();
    }
  };

  const onDialogClick = (e: MouseEvent): void => {
    if ((e.target as HTMLElement).closest('[data-product-close]')) {
      dialog.close();
      return;
    }
    // Click outside the content box — the backdrop — dismisses, as it does elsewhere in the panel.
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      dialog.close();
  };

  doc.addEventListener('click', onClick);
  dialog.addEventListener('click', onDialogClick);
  dialog.addEventListener('close', onClose);
  view?.addEventListener('popstate', onPopState);

  return () => {
    doc.removeEventListener('click', onClick);
    dialog.removeEventListener('click', onDialogClick);
    dialog.removeEventListener('close', onClose);
    view?.removeEventListener('popstate', onPopState);
    releaseGallery?.();
  };
}

export function initProductDialog(): void {
  if (typeof document === 'undefined') return;
  bindProductDialog();
}
