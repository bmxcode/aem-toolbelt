// Enhancer #3 — Tools > Assets > Metadata Schema Forms list.
//
// The list shows only each schema's display *title*, but the actual node name (what you need for
// CRXDE, packages, and the Remove-from-Folder wizard) and the full path are hidden on the row.
// Note AEM double-encodes `data-path`/`data-name` here (e.g. "B&amp;R"), so we read the clean
// values from `data-granite-collection-item-id` (full path) and `data-foundation-collection-item-id`
// (leading-slash + node name) instead.

import { register } from '../core/registry.js';
import { markOnce, infinityJsonUrl, h, link } from '../core/dom.js';

const ID = 'metadata-schema-list';
const ROW_SELECTOR =
  'tr.foundation-collection-item[data-granite-collection-item-id*="/adminui-extension/metadataschema/"]';

register({
  id: ID,
  appliesTo() {
    return !!document.querySelector(ROW_SELECTOR);
  },
  enhance() {
    document.querySelectorAll(ROW_SELECTOR).forEach((row) => {
      if (!markOnce(row, ID)) return;

      const path = row.getAttribute('data-granite-collection-item-id');
      if (!path) return;
      const nodeName = (row.getAttribute('data-foundation-collection-item-id') || '').replace(/^\//, '');

      const cell = row.querySelector('td.foundation-collection-item-title') || row;
      // The visible title lives in the cell's link; read it before we append anything.
      const title = ((cell.querySelector('a') || cell).textContent || '').trim();

      const info = h('div', { class: 'aem-tb-path-info' }, [
        // Only call out the node name when it differs from the visible title (the useful reveal).
        nodeName && nodeName !== title
          ? h('span', { class: 'aem-tb-tag', text: `node: ${nodeName}` })
          : null,
        h('span', { class: 'aem-tb-path', title: path, text: path }),
        link(infinityJsonUrl(path), 'View JSON ↗'),
      ]);

      cell.appendChild(info);
    });
  },
});
