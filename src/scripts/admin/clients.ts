// /admin/clients (docs/ADMIN_SPEC.md §6, §8.3): generate a unique link (name → code → link + Copy),
// rename, revoke / restore and delete rows, and the saves report (most saved + per-client lists) from
// GET /api/admin/clients/report. Everything rendered as text nodes.
import { get, post, type ApiOptions } from './api.ts';
import { byId, clear, el, readJson } from './dom.ts';
import { hide, msg } from './msg.ts';

export interface ClientLike {
  row: number;
  code: string;
  name: string;
  note: string;
  status: 'active' | 'revoked';
  createdAt: string;
  createdBy: string;
  link: string;
  version: string;
}

interface RugRef {
  rugId: string;
  name: string;
  slug: string;
  /** False once the liked product has been deleted from the sheet: named, but no longer linkable. */
  known: boolean;
}

export interface ReportLike {
  generatedAt: string;
  mostSaved: Array<RugRef & { saves: number; dislikes: number }>;
  byClient: Array<{
    code: string;
    name: string;
    known: boolean;
    status?: string;
    liked: RugRef[];
    disliked: RugRef[];
  }>;
  rowsRead: number;
  rowsDropped: number;
}

/**
 * The Copy-link control, cloned from the `#copyTpl` template the page renders with `CopyButton`.
 *
 * This used to be hand-rolled here as a bare <button> with a single <span> — no icons, no
 * `data-copied-label` — so `copy.ts` could swap the label but the `.copy__icon--default` →
 * `.copy__icon--copied` rule had nothing to act on, and the caption printed directly under the table
 * ("the control changes icon, label and colour for 2 seconds") described behaviour the page did not
 * have. Rebuilding a row after a toggle also quietly replaced the server's correct markup with this
 * poorer copy. Cloning the template keeps both paths identical by construction.
 */
function copyControl(link: string, doc: Document): HTMLElement {
  const tpl = doc.getElementById('copyTpl');
  if (tpl instanceof HTMLTemplateElement) {
    const node = tpl.content.firstElementChild?.cloneNode(true);
    if (node instanceof HTMLElement) {
      node.setAttribute('data-copy', link);
      return node;
    }
  }
  // No template (an older page, or a test fixture): the plain control still copies.
  return el(
    'button',
    { type: 'button', class: 'copy', 'data-copy': link, 'data-label': 'Copy link' },
    el('span', { 'data-copy-label': '' }, 'Copy link', doc),
    doc,
  );
}

export function clientRow(c: ClientLike, doc: Document = document): HTMLTableRowElement {
  const active = c.status === 'active';
  return el(
    'tr',
    { 'data-code': c.code, 'data-version': c.version, 'data-status': c.status },
    [
      // F5 (Figma 52:1207) is reachable from the name: the row already carries everything else the
      // owner needs, so the name is the one cell that means "show me this buyer".
      el('td', {}, el('a', { href: `/admin/clients/${encodeURIComponent(c.code)}` }, c.name, doc), doc),
      el(
        'td',
        { class: 'mono' },
        el('a', { href: c.link, target: '_blank', rel: 'noopener' }, c.link, doc),
        doc,
      ),
      el('td', {}, dayText(c.createdAt), doc),
      el(
        'td',
        {},
        el(
          'label',
          { class: 'toggle' },
          [
            el(
              'input',
              {
                type: 'checkbox',
                role: 'switch',
                class: 'toggle__track',
                'data-act': 'toggle',
                'aria-label': `Link active for ${c.name}`,
                ...(active ? { checked: 'checked' } : {}),
              },
              [],
              doc,
            ),
          ],
          doc,
        ),
        doc,
      ),
      el(
        'td',
        { class: 'acts' },
        [
          // "Copy-link is the most-used action here — the control changes icon, label and colour for
          // 2 seconds. A toast alone is missable when copying several in a row." (52:1114)
          copyControl(c.link, doc),
          el('button', { type: 'button', class: 'btn btn--secondary', 'data-act': 'rename' }, 'Rename', doc),
          el(
            'button',
            { type: 'button', class: 'btn btn--destructive', 'data-act': 'delete' },
            'Delete',
            doc,
          ),
        ],
        doc,
      ),
    ],
    doc,
  );
}

function rugLine(r: RugRef, doc: Document): HTMLElement {
  const label = `${r.name}${r.rugId !== r.name ? ` (${r.rugId})` : ''}`;
  // A liked product that is no longer a row — deleted since the like — is named but not linked.
  return r.known && r.slug
    ? el('a', { href: `/admin/rugs/${encodeURIComponent(r.rugId)}` }, label, doc)
    : el('span', { class: 'rug-gone' }, label, doc);
}

export function renderReport(out: HTMLElement, report: ReportLike, doc: Document = document): void {
  clear(out);
  out.classList.add('report');
  const most = el('div', { class: 'stack' }, [el('h3', {}, 'Most liked', doc)], doc);
  if (report.mostSaved.length === 0)
    most.appendChild(el('p', { class: 'hint' }, 'No saves logged yet.', doc));
  else {
    const table = el(
      'table',
      {},
      [el('thead', {}, el('tr', {}, [el('th', {}, 'Rug', doc), el('th', {}, 'Likes', doc)], doc), doc)],
      doc,
    );
    const tbody = el('tbody', {}, [], doc);
    for (const r of report.mostSaved) {
      tbody.appendChild(
        el(
          'tr',
          {},
          [el('td', {}, rugLine(r, doc), doc), el('td', { class: 'n' }, String(r.saves), doc)],
          doc,
        ),
      );
    }
    table.appendChild(tbody);
    most.appendChild(el('div', { class: 'table-wrap' }, table, doc));
  }
  out.appendChild(most);
  for (const c of report.byClient) {
    const title = c.code === 'anon' ? 'anonymous' : c.known ? c.name : `unknown code ${c.code}`;
    const suffix = c.status === 'revoked' ? ' · revoked' : '';
    const block = el(
      'div',
      { class: 'stack' },
      [el('h3', {}, `${title} — ${c.liked.length} liked${suffix}`, doc)],
      doc,
    );
    const ul = el('ul', { class: 'hint' }, [], doc);
    for (const r of c.liked) ul.appendChild(el('li', {}, [rugLine(r, doc)], doc));
    block.appendChild(ul);
    out.appendChild(block);
  }
  out.appendChild(el('p', { class: 'hint' }, `Updated ${whenText(report.generatedAt)}`, doc));
}

/** "9 Sep, 14:32" in the reader's own locale; the raw ISO stays in the title attribute. */
/** "1 Sep 2026" — the day only, for the Created column. */
export function dayText(iso: string, locale = 'en-GB'): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  return new Date(t).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function whenText(iso: string, locale?: string): string {
  if (!iso) return 'never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'never';
  return d.toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}


/** `confirmImpl` replaces window.confirm so the delete path is testable. */
export interface ClientsOptions extends ApiOptions {
  confirmImpl?: (text: string) => boolean;
}

export interface ClientsPage {
  generate(): Promise<void>;
  setStatus(code: string, status: 'active' | 'revoked'): Promise<void>;
  rename(code: string, name: string): Promise<void>;
  remove(code: string): Promise<void>;
  loadReport(): Promise<void>;
}

export function initClients(doc: Document = document, opts: ClientsOptions = {}): ClientsPage {
  const { confirmImpl: confirmOpt, ...api } = opts;
  const confirmImpl =
    confirmOpt ?? ((text: string) => (typeof confirm === 'function' ? confirm(text) : true));
  const data = readJson<{ clients: ClientLike[]; siteOrigin: string }>('admin-data', doc);
  const name = byId<HTMLInputElement>('cl_name', doc);
  const generate = byId<HTMLButtonElement>('btnGenerate', doc);
  const m8 = byId('m8', doc);
  const linkOut = byId('linkOut', doc);
  /** The create form inside the modal; hidden when the panel is opened from a row (a reset). */
  const fields = doc.querySelector<HTMLElement>('#new-client .modal__fields > .row');
  const linkCode = byId('linkCode', doc);
  const linkNote = byId('linkNote', doc);
  // F4 (Figma 52:1115): the Credential Panel replaces the two readonly inputs and their two separate
  // copy buttons. src/scripts/ui/copy.ts drives every [data-copy] and reads the attribute at CLICK
  // time, so filling these in here is all the wiring the panel needs.
  const credUrl = doc.querySelector<HTMLElement>('[data-credential-url]')!;
  const credCopies = Array.from(doc.querySelectorAll<HTMLElement>('.credential [data-copy]'));
  const tbody = byId<HTMLTableElement>('clientTable', doc).querySelector('tbody')!;
  const m9 = byId('m9', doc);
  const reportBtn = byId<HTMLButtonElement>('btnReport', doc);
  const m10 = byId('m10', doc);
  const reportOut = byId('reportOut', doc);
  const clients = new Map(data.clients.map((c) => [c.code, c]));

  // Re-opening the create form after a link has been shown: without this, the next "New customer
  // link" would open a modal still showing the previous customer's panel.
  const opener = doc.querySelector<HTMLElement>('[data-open="new-client"]');
  opener?.addEventListener('click', () => {
    fields?.removeAttribute('hidden');
    linkOut.hidden = true;
  });

  const showLink = (c: ClientLike): void => {
    credUrl.textContent = c.link;
    linkCode.textContent = c.code;
    linkNote.textContent = `Their likes are recorded under ${c.name}.`;
    // Every control on the panel copies the same one thing now that there is no password beside it.
    for (const el of credCopies) el.setAttribute('data-copy', c.link);
    linkOut.hidden = false;
  };

  const doGenerate = async (): Promise<void> => {
    const n = name.value.trim();
    if (!n) {
      msg(m8, 'Give the client a name first.', 'err');
      return;
    }
    generate.disabled = true;
    msg(m8, 'Generating…', 'busy');
    const r = await post<{ client: ClientLike; audit: { row: number } }>(
      '/api/admin/clients',
      { name: n },
      api,
    );
    generate.disabled = false;
    if (!r.ok) {
      msg(m8, r.message, 'err');
      return;
    }
    const c = r.data.client;
    clients.set(c.code, c);
    tbody.insertBefore(clientRow(c, doc), tbody.firstChild);
    showLink(c);
    msg(m8, `Link ready for ${c.name} — copy it below.`, 'ok');
    name.value = '';
    // Focus the copy control: it is the only thing worth doing on this panel.
    doc.querySelector<HTMLElement>('.credential [data-copy-what="both"]')?.focus();
  };

  const setStatus = async (code: string, status: 'active' | 'revoked'): Promise<void> => {
    const current = clients.get(code);
    const tr = tbody.querySelector<HTMLTableRowElement>(`tr[data-code="${CSS.escape(code)}"]`);
    if (!current || !tr) return;
    const b = tr.querySelector<HTMLInputElement>('[data-act="toggle"]');
    if (b) b.disabled = true;
    msg(m9, `${status === 'revoked' ? 'Pausing' : 'Resuming'} ${current.name}…`, 'busy');
    const r = await post<{ client: ClientLike; audit: { row: number } }>(
      `/api/admin/clients/${encodeURIComponent(code)}/status`,
      { status, version: current.version },
      api,
    );
    if (!r.ok) {
      if (b) b.disabled = false;
      msg(
        m9,
        r.status === 409 ? 'This customer was changed elsewhere — reload the page and try again.' : r.message,
        'err',
      );
      return;
    }
    clients.set(code, r.data.client);
    tr.replaceWith(clientRow(r.data.client, doc));
    msg(
      m9,
      `${r.data.client.name}'s link is now ${r.data.client.status === 'active' ? 'active' : 'paused'}.`,
      'ok',
    );
  };

  /** Renaming leaves the code — and so the link already sent to the buyer — untouched. */
  const rename = async (code: string, newName: string): Promise<void> => {
    const current = clients.get(code);
    const tr = tbody.querySelector<HTMLTableRowElement>(`tr[data-code="${CSS.escape(code)}"]`);
    if (!current || !tr) return;
    msg(m9, `Renaming ${current.name}…`, 'busy');
    const r = await post<{ client: ClientLike; audit?: { row: number }; unchanged?: boolean }>(
      `/api/admin/clients/${encodeURIComponent(code)}`,
      { name: newName, version: current.version },
      api,
    );
    if (!r.ok) {
      msg(
        m9,
        r.status === 409 ? 'This customer was changed elsewhere — reload the page and try again.' : r.message,
        'err',
      );
      return;
    }
    clients.set(code, r.data.client);
    tr.replaceWith(clientRow(r.data.client, doc));
    msg(m9, r.data.unchanged ? 'Nothing changed.' : `Renamed to ${r.data.client.name}.`, 'ok');
  };

  /** Permanent (owner, 2026-09-16): the row goes and the buyer's link stops resolving. */
  const remove = async (code: string): Promise<void> => {
    const current = clients.get(code);
    const tr = tbody.querySelector<HTMLTableRowElement>(`tr[data-code="${CSS.escape(code)}"]`);
    if (!current || !tr) return;
    if (
      !confirmImpl(
        `Delete ${current.name}? Their link stops working and the row leaves the sheet for good. Their likes are kept.`,
      )
    ) {
      return;
    }
    msg(m9, `Deleting ${current.name}…`, 'busy');
    const r = await post<{ code: string; audit?: { row: number } }>(
      `/api/admin/clients/${encodeURIComponent(code)}/delete`,
      { version: current.version },
      api,
    );
    if (!r.ok) {
      msg(
        m9,
        r.status === 409 ? 'This customer was changed elsewhere — reload the page and try again.' : r.message,
        'err',
      );
      return;
    }
    clients.delete(code);
    tr.remove();
    msg(m9, `Deleted ${current.name}.`, 'ok');
  };

  const loadReport = async (): Promise<void> => {
    reportBtn.disabled = true;
    msg(m10, 'Reading the votes…', 'busy');
    const r = await get<ReportLike>('/api/admin/clients/report', { timeoutMs: 30_000, ...api });
    reportBtn.disabled = false;
    if (!r.ok) {
      msg(m10, r.message, 'err');
      return;
    }
    renderReport(reportOut, r.data, doc);
    hide(m10);
  };

  /**
   * The rename dialog, re-using the control the password reset used to own. A per-row input would
   * clutter the table and a browser prompt cannot be styled or validated, so the name is typed in a
   * real <dialog>.
   */
  const renameDialog = byId<HTMLDialogElement>('renameDialog', doc);
  const renameDialogTitle = byId('renameDialogTitle', doc);
  const renameDialogInput = byId<HTMLInputElement>('renameDialogInput', doc);
  const renameDialogErr = byId('renameDialogErr', doc);
  const renameDialogForm = byId<HTMLFormElement>('renameDialogForm', doc);
  const renameDialogCancel = byId<HTMLButtonElement>('renameDialogCancel', doc);
  let renameTarget = '';

  const askRename = (code: string): void => {
    const current = clients.get(code);
    renameTarget = code;
    renameDialogInput.value = current?.name ?? '';
    // hide() strips the tone classes msg() added; the attribute goes back on top of that, or a stale
    // error would be re-revealed the next time the dialog opens.
    hide(renameDialogErr);
    renameDialogErr.hidden = true;
    renameDialogTitle.textContent = `Rename ${current?.name ?? code}`;
    if (typeof renameDialog.showModal === 'function') renameDialog.showModal();
    renameDialogInput.focus();
    renameDialogInput.select();
  };

  // Bound on the FORM, not the button: Enter in the field and a click on Save then arrive through
  // the same path. preventDefault stops the navigation the submit implies.
  renameDialogForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const typed = renameDialogInput.value.trim();
    if (!typed) {
      renameDialogErr.hidden = false;
      msg(renameDialogErr, 'A customer needs a name.', 'err');
      renameDialogInput.focus();
      return;
    }
    renameDialog.close();
    void rename(renameTarget, typed);
  });
  renameDialogCancel.addEventListener('click', () => renameDialog.close());

  generate.addEventListener('click', () => void doGenerate());
  name.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void doGenerate();
    }
  });
  tbody.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-act]');
    const tr = b?.closest<HTMLTableRowElement>('tr[data-code]');
    if (!b || !tr?.dataset.code) return;
    if (b.dataset.act === 'rename') {
      askRename(tr.dataset.code);
      return;
    }
    if (b.dataset.act === 'delete') {
      void remove(tr.dataset.code);
      return;
    }
    void setStatus(tr.dataset.code, b.dataset.act === 'revoke' ? 'revoked' : 'active');
  });

  /* The Active column is a switch (Figma F1). It is a real checkbox, so it changes rather than
     clicks — and if the write fails, setStatus puts the row back, which means the switch must
     follow the SERVER's answer, never its own optimistic flip. */
  tbody.addEventListener('change', (e) => {
    const input = e.target;
    if (!(input instanceof HTMLInputElement) || input.dataset.act !== 'toggle') return;
    const tr = input.closest<HTMLTableRowElement>('tr[data-code]');
    if (!tr?.dataset.code) return;
    void setStatus(tr.dataset.code, input.checked ? 'active' : 'revoked');
  });
  reportBtn.addEventListener('click', () => void loadReport());
  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') doc.querySelectorAll<HTMLElement>('.msg.on').forEach(hide);
  });
  return { generate: doGenerate, setStatus, rename, remove, loadReport };
}
