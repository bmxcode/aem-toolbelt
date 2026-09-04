// Enhancer #2 — Assets > Shared Links (`mylinkshares`).
//
// Every row just says "Link share" with no indication of which asset was shared. The row carries:
//   data-shared-paths        the shared asset path(s) (comma-separated for multi-asset shares)
//   data-shared-assets-title the asset filename
//   data-path                the share record node, /var/dam/share/<id>
// We surface the asset filename + path (with an Open-in-Assets link) and a link to the share
// record's infinity JSON — replacing the DevTools + hand-built `.-1.json` workflow.

import { register } from '../core/registry.js';
import { markOnce, assetsUrl, infinityJsonUrl, splitMultiPath, h, link } from '../core/dom.js';

const ID = 'shared-links';
const ROW_SELECTOR = 'tr.foundation-collection-item[data-shared-paths]';

register({
  id: ID,
  appliesTo() {
    return !!document.querySelector(ROW_SELECTOR);
  },
  enhance() {
    document.querySelectorAll(ROW_SELECTOR).forEach((row) => {
      if (!markOnce(row, ID)) return;

      const assetPaths = splitMultiPath(row.getAttribute('data-shared-paths'));
      const title = row.getAttribute('data-shared-assets-title') || '';
      const shareNode = row.getAttribute('data-path'); // /var/dam/share/<id>

      const list = h('div', { class: 'aem-tb-share-list' });

      if (assetPaths.length) {
        assetPaths.forEach((path, i) => {
          list.appendChild(
            h('div', { class: 'aem-tb-path-info' }, [
              h('span', { class: 'aem-tb-path', title: path, text: (assetPaths.length > 1 || !title) ? path : title }),
              link(assetsUrl(path), 'Open in Assets ↗'),
            ]),
          );
        });
      }

      if (shareNode) {
        list.appendChild(
          h('div', { class: 'aem-tb-path-info' }, [
            h('span', { class: 'aem-tb-path', title: shareNode, text: shareNode }),
            link(infinityJsonUrl(shareNode), 'View share JSON ↗'),
          ]),
        );
      }

      // The ITEM column cell (holds the "Link share" label).
      const cell = row.querySelector('td.foundation-collection-item-title') || row;
      cell.appendChild(list);
    });
  },
});
