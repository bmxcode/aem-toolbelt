// Enhancer #2 — Assets > Shared Links (`mylinkshares`).
//
// Every row just says "Link share" with no idea which asset was shared, and the genuinely useful
// details (who created it, when, expiry, who it was shared with) are buried in the share-node JSON.
// We replace the row's ITEM cell with:
//   - the shared asset filename(s) as links (↗ opens the asset in a new tab; multiple assets render
//     as a comma-separated list of filenames), and
//   - an info icon whose hover popover shows the share details fetched from the JSON, including the
//     shared-with emails behind the USERS count.

import { register } from '../core/registry.js';
import { markOnce, assetsUrl, splitMultiPath, h, link } from '../core/dom.js';
import { attachHoverPopover } from '../core/popover.js';

const ID = 'shared-links';
const ROW_SELECTOR = 'tr.foundation-collection-item[data-shared-paths]';

const fileName = (path) => path.split('/').filter(Boolean).pop() || path;

function fmtDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

// Lazily fetch + cache the share record JSON on the row (only on first hover).
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

function kv(label, value) {
  if (value == null || value === '') return null;
  return h('div', { class: 'aem-tb-kv' }, [
    h('span', { class: 'aem-tb-k', text: label }),
    h('span', { class: 'aem-tb-v', text: value }),
  ]);
}

function buildInfoBox(json) {
  const emails = Array.isArray(json.emails) ? json.emails.filter(Boolean) : [];
  const rows = [
    kv('Created by', json['jcr:createdBy']),
    kv('Created', fmtDate(json['jcr:created'])),
    kv('Expires', fmtDate(json.expirationDate)),
    kv('Original download', json.allowOriginal == null ? null : json.allowOriginal ? 'Yes' : 'No'),
    kv('Renditions', json.allowRenditions == null ? null : json.allowRenditions ? 'Yes' : 'No'),
    kv('Message', json.shareJobMessage),
  ].filter(Boolean);

  const box = h('div', { class: 'aem-tb-infobox' }, rows);

  if (emails.length) {
    box.appendChild(
      h('div', { class: 'aem-tb-kv' }, [
        h('span', { class: 'aem-tb-k', text: `Shared with (${emails.length})` }),
        h('span', { class: 'aem-tb-v' }, emails.map((e) => h('div', { text: e }))),
      ]),
    );
  }
  if (!rows.length && !emails.length) box.appendChild(h('div', { text: 'No additional details.' }));
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

      const assetPaths = splitMultiPath(row.getAttribute('data-shared-paths'));
      const cell = row.querySelector('td.foundation-collection-item-title');
      if (!cell) return;

      // Filename links: single -> "name ↗"; multiple -> "a.png, b.png, c.png".
      const files = h('span', { class: 'aem-tb-files' });
      assetPaths.forEach((p, i) => {
        if (i > 0) files.appendChild(document.createTextNode(', '));
        files.appendChild(link(assetsUrl(p), assetPaths.length === 1 ? `${fileName(p)} ↗` : fileName(p)));
      });

      // Info icon with hover popover of the share details.
      const info = h('span', {
        class: 'aem-tb-info-icon',
        tabindex: '0',
        role: 'button',
        'aria-label': 'Share details',
        text: 'ⓘ',
      });
      stopSelection(info);
      attachHoverPopover(info, () => loadShare(row).then((json) => buildInfoBox(json)));

      // Replace the cell's "Link share" text with a "Share Link:" prefix + filenames + info icon.
      cell.textContent = '';
      cell.appendChild(h('span', { class: 'aem-tb-share-prefix', text: 'Share Link: ' }));
      cell.appendChild(files);
      cell.appendChild(document.createTextNode(' '));
      cell.appendChild(info);
    });
  },
});
