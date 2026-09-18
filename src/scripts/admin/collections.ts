// /admin/collections (docs/ADMIN_SPEC.md §8.3): inline edit + Save (version-guarded; 409 → refresh
// from the API), an add form, and Delete. Rows are rebuilt from API answers as text.
//
// Owner, 2026-09-18: the ▲/▼ reorder pair and the whole tag half of this page are gone. Tags are
// assigned on the product form and nowhere else, so there was nothing here to manage; the reorder
// endpoint went with its controls.
import { get, issuesText, post, type ApiOptions } from './api.ts';
import { byId, clear, el, readJson } from './dom.ts';
import { hide, msg } from './msg.ts';

export interface CollectionLike {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder?: number;
  row: number;
  version: string;
  rugs?: number;
}

export function collectionRow(c: CollectionLike, index: number, doc: Document = document): HTMLElement {
  const input = (field: string, value: string, label: string): HTMLInputElement =>
    el('input', { 'data-field': field, value, 'aria-label': label, class: 'input' }, [], doc);

  const ghost = (act: string, label: string, aria?: string): HTMLButtonElement =>
    el(
      'button',
      { type: 'button', class: 'btn btn--ghost', 'data-act': act, ...(aria ? { 'aria-label': aria } : {}) },
      label,
      doc,
    );

  const description = c.description ?? '';

  const head = el(
    'div',
    { class: 'crow__head' },
    [
      el('span', { class: 'crow__name' }, c.name, doc),
      el('span', { class: 'crow__rule' }, [], doc),
      el(
        'span',
        { class: 'crow__count' },
        `${c.rugs ?? 0} ${(c.rugs ?? 0) === 1 ? 'product' : 'products'}`,
        doc,
      ),
      el('button', { type: 'button', class: 'btn btn--secondary', 'data-act': 'edit' }, 'Edit', doc),
    ],
    doc,
  );

  const children: HTMLElement[] = [head];

  if (description) {
    children.push(el('p', { class: 'crow__description' }, description, doc));
    // "See more expands that row in place; it never navigates away, so comparing two collections'
    // descriptions is a matter of expanding both."
    children.push(
      el('button', { type: 'button', class: 'crow__more', 'data-act': 'expand' }, 'See more', doc),
    );
  }

  children.push(
    el(
      'div',
      { class: 'crow__edit', hidden: 'hidden' },
      [
        input('name', c.name, `Name of ${c.name}`),
        input('description', description, `Description of ${c.name}`),
        el('button', { type: 'button', class: 'btn btn--primary', 'data-act': 'save' }, 'Save', doc),
        ghost('cancel', 'Cancel'),
        el(
          'button',
          { type: 'button', class: 'btn btn--destructive', 'data-act': 'delete' },
          'Delete',
          doc,
        ),
      ],
      doc,
    ),
  );

  return el(
    'li',
    {
      class: 'crow',
      'data-id': c.id,
      'data-version': c.version,
      'data-name': c.name,
      'data-order': String(c.sortOrder ?? index + 1),
      'data-slug': c.slug,
    },
    children,
    doc,
  );
}

/** `confirmImpl` replaces window.confirm so the delete paths are testable. */
export interface CollectionsOptions extends ApiOptions {
  confirmImpl?: (text: string) => boolean;
}

export interface CollectionsPage {
  saveCollection(id: string): Promise<void>;
  deleteCollection(id: string): Promise<void>;
  addCollection(): Promise<void>;
  refresh(): Promise<void>;
}

export function initCollections(doc: Document = document, opts: CollectionsOptions = {}): CollectionsPage {
  const { confirmImpl: confirmOpt, ...api } = opts;
  const confirmImpl =
    confirmOpt ?? ((text: string) => (typeof confirm === 'function' ? confirm(text) : true));
  const data = readJson<{ collections: CollectionLike[] }>('admin-data', doc);
  const rugCounts = new Map(data.collections.map((c) => [c.id, c.rugs ?? 0]));
  let collections = new Map(data.collections.map((c) => [c.id, c]));

  const list = byId('collectionList', doc);
  const m5 = byId('m5', doc);
  const m6 = byId('m6', doc);
  const cName = byId<HTMLInputElement>('c_name', doc);
  const cDescription = byId<HTMLInputElement>('c_description', doc);
  const addCollectionBtn = byId<HTMLButtonElement>('btnAddCollection', doc);

  const ordered = (): CollectionLike[] =>
    [...collections.values()].sort(
      (a, b) => (a.sortOrder ?? 1e9) - (b.sortOrder ?? 1e9) || a.name.localeCompare(b.name),
    );

  const renderCollections = (): void => {
    clear(list);
    ordered().forEach((c, i) =>
      list.appendChild(collectionRow({ ...c, rugs: rugCounts.get(c.id) ?? 0 }, i, doc)),
    );
  };

  const refresh = async (): Promise<void> => {
    const c = await get<{ collections: CollectionLike[] }>('/api/admin/collections', api);
    if (c.ok) {
      collections = new Map(c.data.collections.map((x) => [x.id, x]));
      renderCollections();
    }
  };

  const rowInputs = (tr: HTMLElement): { name: string; description: string } => {
    const v = (field: string): string =>
      tr.querySelector<HTMLInputElement>(`input[data-field="${field}"]`)?.value.trim() ?? '';
    return { name: v('name'), description: v('description') };
  };

  const saveCollection = async (id: string): Promise<void> => {
    const tr = list.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`);
    const current = collections.get(id);
    if (!tr || !current) return;
    const { name, description } = rowInputs(tr);
    if (!name) {
      msg(m5, 'A collection needs a name.', 'err');
      return;
    }
    const buttons = tr.querySelectorAll<HTMLButtonElement>('button');
    buttons.forEach((b) => (b.disabled = true));
    msg(m5, `Saving ${current.name}…`, 'busy');
    const r = await post<{
      collection: CollectionLike;
      audit?: { row: number };
      detached?: number;
      unchanged?: boolean;
    }>(
      `/api/admin/collections/${encodeURIComponent(id)}`,
      { name, description, version: tr.dataset.version ?? current.version },
      api,
    );
    buttons.forEach((b) => (b.disabled = false));
    if (!r.ok) {
      msg(m5, r.status === 400 ? issuesText(r) : r.message, 'err');
      if (r.status === 409) await refresh();
      return;
    }
    if (r.data.unchanged) {
      msg(m5, 'Nothing changed.', 'busy');
      return;
    }
    collections.set(id, r.data.collection);
    renderCollections();
    const detached = r.data.detached ?? 0;
    msg(
      m5,
      `Saved ${r.data.collection.name}.` +
        (detached > 0
          ? ` ${detached} rug${detached === 1 ? '' : 's'} still store the old name "${current.name}".`
          : ''),
      detached > 0 ? 'busy' : 'ok',
    );
  };

  const addCollection = async (): Promise<void> => {
    const name = cName.value.trim();
    if (!name) {
      msg(m6, 'Give the collection a name.', 'err');
      return;
    }
    addCollectionBtn.disabled = true;
    msg(m6, 'Adding…', 'busy');
    const r = await post<{ collection: CollectionLike; audit: { row: number } }>(
      '/api/admin/collections',
      { name, description: cDescription.value.trim() },
      api,
    );
    addCollectionBtn.disabled = false;
    if (!r.ok) {
      msg(m6, r.status === 400 ? issuesText(r) : r.message, 'err');
      return;
    }
    collections.set(r.data.collection.id, r.data.collection);
    rugCounts.set(r.data.collection.id, 0);
    renderCollections();
    cName.value = '';
    cDescription.value = '';
    msg(m6, `Added ${r.data.collection.name}.`, 'ok');
  };

  /**
   * Deleting is permanent (owner, 2026-09-16), so it asks first and names what is going.
   *
   * It no longer takes the products with it, and no longer refuses while they exist (owner,
   * 2026-09-18): the rugs keep the collection's NAME, which is what the buyer's side groups on, so
   * they stay together under that heading — what they lose is the description. The confirm says so
   * when there are any, because that is the part the studio cannot see from here.
   */
  const deleteCollection = async (id: string): Promise<void> => {
    const tr = list.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`);
    const current = collections.get(id);
    if (!tr || !current) return;
    const n = rugCounts.get(id) ?? 0;
    const keep =
      n > 0
        ? ` ${n} product${n === 1 ? '' : 's'} stay${n === 1 ? 's' : ''} in "${current.name}" and keep${n === 1 ? 's' : ''} the name; the description is lost.`
        : '';
    if (!confirmImpl(`Delete "${current.name}"? This removes the row from the sheet for good.${keep}`))
      return;
    const buttons = tr.querySelectorAll<HTMLButtonElement>('button');
    buttons.forEach((b) => (b.disabled = true));
    msg(m5, `Deleting ${current.name}…`, 'busy');
    const r = await post<{ id: string; products?: number; audit?: { row: number } }>(
      `/api/admin/collections/${encodeURIComponent(id)}/delete`,
      { version: tr.dataset.version ?? current.version },
      api,
    );
    buttons.forEach((b) => (b.disabled = false));
    if (!r.ok) {
      msg(m5, r.status === 400 ? issuesText(r) : r.message, 'err');
      if (r.status === 409 && r.body?.error === 'version mismatch') await refresh();
      return;
    }
    collections.delete(id);
    rugCounts.delete(id);
    renderCollections();
    const kept = r.data.products ?? 0;
    msg(
      m5,
      `Deleted ${current.name}.` +
        (kept > 0 ? ` ${kept} product${kept === 1 ? '' : 's'} still carry the name.` : ''),
      'ok',
    );
  };

  list.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-act]');
    const tr = b?.closest<HTMLElement>('[data-id]');
    if (!b || !tr?.dataset.id) return;
    const id = tr.dataset.id;
    const act = b.dataset.act;
    if (act === 'save') void saveCollection(id);
    else if (act === 'delete') void deleteCollection(id);
    else if (act === 'edit' || act === 'cancel') {
      const panel = tr.querySelector<HTMLElement>('.crow__edit');
      if (!panel) return;
      const opening = panel.hidden;
      panel.hidden = !opening;
      if (opening) panel.querySelector<HTMLInputElement>('input')?.focus();
      else b.closest<HTMLElement>('.crow')?.querySelector<HTMLButtonElement>('[data-act="edit"]')?.focus();
    } else if (act === 'expand') {
      // The clamp is released in place and the label follows, so the control always says what it
      // will do next rather than what it just did.
      const expanded = tr.classList.toggle('crow--expanded');
      b.textContent = expanded ? 'See less' : 'See more';
    }
  });
  list.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !(e.target instanceof HTMLInputElement)) return;
    const tr = e.target.closest<HTMLElement>('[data-id]');
    if (!tr?.dataset.id) return;
    e.preventDefault();
    void saveCollection(tr.dataset.id);
  });
  addCollectionBtn.addEventListener('click', () => void addCollection());
  cName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void addCollection();
    }
  });
  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') doc.querySelectorAll<HTMLElement>('.msg.on').forEach(hide);
  });

  return { saveCollection, deleteCollection, addCollection, refresh };
}
