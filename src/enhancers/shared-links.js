// Enhancer #2 — Assets > Shared Links (`mylinkshares`).
//
// Every row just says "Link share" with no idea which asset/folder was shared, and the genuinely
// useful details (who created it, when, expiry, who it was shared with) are buried in the share-node
// JSON. We replace the row's ITEM cell with:
//   - the shared item filename(s) as links (single: "name ↗"; a few: comma-separated; many: the
//     first two + "… N more", with the full list in the info box), and
//   - an info icon whose hover popover shows the full item list plus the share details (created by,
//     dates, permissions, message) fetched from the JSON.
// Separately, hovering the USERS icon/count (only when it is > 0) shows a popup listing the emails
// the link was shared with.
// Some rows (folders, and some single assets) have an empty `data-shared-paths`; for those we source
// the path(s) from the JSON instead, so folder shares render details too.

import { register } from '../core/registry.js';
import { markOnce, assetsUrl, splitMultiPath, h, link } from '../core/dom.js';
import { attachHoverPopover } from '../core/popover.js';

const ID = 'shared-links';
const ROW_SELECTOR = 'tr.foundation-collection-item[data-shared-paths]';
const INLINE_LIMIT = 2; // show this many filenames inline before collapsing to "… N more"

const fileName = (path) => path.split('/').filter(Boolean).pop() || path;

function pathsFromJson(json) {
  const p = json && json.path;
  if (Array.isArray(p)) return p.filter(Boolean);
  if (typeof p === 'string' && p) return [p];
  return [];
}

function fmtDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

// Lazily fetch + cache the share record JSON on the row (used for the info box, and for the inline
// name when `data-shared-paths` is empty).
function loadShare(row) {
  if (!row.__tbShare) {
    const sharePath = row.getAttribute('data-path');
    row.__tbShare = fetch(`${sharePath}.1.json`, { headers: { Accept: 'application/json' } }).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    });
  }
  return row.__tbShare;
}

// Render the inline filename links into `container`, collapsing long lists. Returns the "… N more"
// element (a hover trigger for the full list) or null.
function renderFiles(container, paths) {
  container.textContent = '';
  if (!paths.length) {
    container.appendChild(document.createTextNode('(no items)'));
    return null;
  }
  const shown = paths.slice(0, INLINE_LIMIT);
  shown.forEach((p, i) => {
    if (i > 0) container.appendChild(document.createTextNode(', '));
    container.appendChild(link(assetsUrl(p), paths.length === 1 ? `${fileName(p)} ↗` : fileName(p)));
  });
  if (paths.length > INLINE_LIMIT) {
    container.appendChild(document.createTextNode(', '));
    const more = h('span', { class: 'aem-tb-more', tabindex: '0', text: `… ${paths.length - INLINE_LIMIT} more` });
    container.appendChild(more);
    return more;
  }
  return null;
}

function kv(label, valueOrNode) {
  if (valueOrNode == null || valueOrNode === '') return null;
  return h('div', { class: 'aem-tb-kv' }, [
    h('span', { class: 'aem-tb-k', text: label }),
    typeof valueOrNode === 'string' ? h('span', { class: 'aem-tb-v', text: valueOrNode }) : valueOrNode,
  ]);
}

function buildInfoBox(json) {
  const box = h('div', { class: 'aem-tb-infobox' });

  // Full list of shared items (the "… N more" expansion, and folder/asset details).
  const paths = pathsFromJson(json);
  if (paths.length) {
    const list = h(
      'div',
      { class: 'aem-tb-item-list aem-tb-v' },
      paths.map((p) => h('div', {}, [link(assetsUrl(p), fileName(p) + ' ↗')])),
    );
    box.appendChild(kv(`Shared item${paths.length > 1 ? `s (${paths.length})` : ''}`, list));
  }

  [
    kv('Created by', json['jcr:createdBy']),
    kv('Created', fmtDate(json['jcr:created'])),
    kv('Expires', fmtDate(json.expirationDate)),
    kv('Original download', json.allowOriginal == null ? null : json.allowOriginal ? 'Yes' : 'No'),
    kv('Renditions', json.allowRenditions == null ? null : json.allowRenditions ? 'Yes' : 'No'),
    kv('Message', json.shareJobMessage),
  ]
    .filter(Boolean)
    .forEach((el) => box.appendChild(el));

  if (!box.childNodes.length) box.appendChild(h('div', { text: 'No additional details.' }));
  return box;
}

// Separate popup for the USERS icon: just the emails the link was shared with.
function buildEmailsBox(json) {
  const emails = Array.isArray(json.emails) ? json.emails.filter(Boolean) : [];
  const box = h('div', { class: 'aem-tb-infobox' }, [
    h('div', { class: 'aem-tb-emails-title', text: `Shared with (${emails.length})` }),
  ]);
  box.appendChild(
    emails.length
      ? h('div', { class: 'aem-tb-item-list' }, emails.map((e) => h('div', { text: e })))
      : h('div', { class: 'aem-tb-pop-loading', text: 'No email addresses recorded.' }),
  );
  return box;
}

// A hover trigger should not also select/deselect the underlying row.
function stopSelection(el) {
  for (const t of ['pointerdown', 'mousedown', 'click']) el.addEventListener(t, (e) => e.stopPropagation());
}

register({
  id: ID,
  appliesTo() {
    return !!document.querySelector(ROW_SELECTOR);
  },
  enhance() {
    document.querySelectorAll(ROW_SELECTOR).forEach((row) => {
      if (!markOnce(row, ID)) return;
      const cell = row.querySelector('td.foundation-collection-item-title');
      if (!cell) return;

      const files = h('span', { class: 'aem-tb-files' });
      const info = h('span', {
        class: 'aem-tb-info-icon',
        tabindex: '0',
        role: 'button',
        'aria-label': 'Share details',
        text: 'ⓘ',
      });
      stopSelection(info);
      attachHoverPopover(info, () => loadShare(row).then(buildInfoBox));

      cell.textContent = '';
      cell.appendChild(h('span', { class: 'aem-tb-share-prefix', text: 'Share Link: ' }));
      cell.appendChild(files);
      cell.appendChild(document.createTextNode(' '));
      cell.appendChild(info);

      const wireMore = (moreEl) => {
        if (!moreEl) return;
        stopSelection(moreEl);
        attachHoverPopover(moreEl, () => loadShare(row).then(buildInfoBox));
      };

      const attrPaths = splitMultiPath(row.getAttribute('data-shared-paths'));
      if (attrPaths.length) {
        wireMore(renderFiles(files, attrPaths));
      } else {
        // Folder / empty row: source the path(s) from the JSON.
        files.appendChild(h('span', { class: 'aem-tb-pop-loading', text: 'loading…' }));
        loadShare(row)
          .then((json) => wireMore(renderFiles(files, pathsFromJson(json))))
          .catch(() => {
            files.textContent = '';
            files.appendChild(document.createTextNode('(details unavailable)'));
          });
      }

      // Separate emails popup on the USERS icon/count, only when there are users.
      const usersEl = row.querySelector('[data-num-users]');
      const count = usersEl ? parseInt(usersEl.getAttribute('data-num-users'), 10) : 0;
      if (usersEl && count > 0) {
        usersEl.classList.add('aem-tb-users-hover');
        attachHoverPopover(usersEl, () => loadShare(row).then(buildEmailsBox));
      }
    });
  },
});
