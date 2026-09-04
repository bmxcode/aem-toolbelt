// Enhancer #1 — "Remove from Folder(s)" wizard (`removeppwizard`).
//
// The folder cards show only the folder title + "FOLDER", never the path. The path is sitting on
// each card as `data-foundation-collection-item-id`. This one enhancer covers every Assets Tool
// that reuses this wizard: Metadata Schemas, Folder Metadata Schemas, Metadata Profiles,
// Processing Profiles, Image Profiles, and Video Profiles.

import { register } from '../core/registry.js';
import { markOnce, assetsUrl, h, link } from '../core/dom.js';

const ID = 'remove-from-folder';
const ITEM_SELECTOR =
  'coral-masonry-item.foundation-collection-item[data-foundation-collection-item-id^="/content/dam"]';

register({
  id: ID,
  appliesTo() {
    return !!document.querySelector(ITEM_SELECTOR);
  },
  enhance() {
    document.querySelectorAll(ITEM_SELECTOR).forEach((item) => {
      if (!markOnce(item, ID)) return;
      const path = item.getAttribute('data-foundation-collection-item-id');
      if (!path) return;

      const info = h('div', { class: 'aem-tb-path-info aem-tb-card-path' }, [
        h('span', { class: 'aem-tb-path', title: path, text: path }),
        link(assetsUrl(path), 'Open folder ↗'),
      ]);

      // Drop it inside the (dark) card body so it reads as part of the folder tile.
      const card = item.querySelector('coral-card') || item;
      card.appendChild(info);
    });
  },
});
