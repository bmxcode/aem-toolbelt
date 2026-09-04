// Enhancer #3 — Assets > Metadata Schemas list (`metadataschema`).
//
// The schema list shows each form by its display *title* only. But the actual node name (what you
// need for CRXDE, packages, and the Remove-from-Folder wizard) and the full path are hidden on the
// row. For every schema row we append to the title cell:
//   - the full schema path as read-only text,
//   - a "View JSON" link to the node's infinity JSON (schemas live under /conf, not /content/dam, so
//     we link to `<path>.-1.json` rather than the Assets console), and
//   - a small `node: <name>` chip, shown *only* when the node name differs from the visible title.
//
// The clean values come from `data-granite-collection-item-id` (full path) and
// `data-foundation-collection-item-id` (`/<node-name>`); the row's `data-path`/`data-name` are
// double-encoded here, so we avoid them.

import { register } from '../core/registry.js';
import { markOnce, h, link, infinityJsonUrl } from '../core/dom.js';

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
      const cell = row.querySelector('td.foundation-collection-item-title');
      if (!cell) return;
      const path = row.getAttribute('data-granite-collection-item-id');
      if (!path) return;
      if (!markOnce(row, ID)) return;

      const title = cell.querySelector('a')?.textContent.trim() || '';
      const nodeName = row.getAttribute('data-foundation-collection-item-id')?.replace(/^\//, '');

      const details = h('div', { class: 'aem-tb-path-info' }, [
        h('span', { class: 'aem-tb-path', title: path, text: path }),
        link(infinityJsonUrl(path), 'View JSON'),
      ]);
      if (nodeName && nodeName !== title) {
        details.appendChild(h('span', { class: 'aem-tb-node', text: `node: ${nodeName}` }));
      }
      cell.appendChild(details);
    });
  },
});
