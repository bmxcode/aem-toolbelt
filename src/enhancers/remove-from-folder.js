// Enhancer #1 — "Remove from Folder(s)" wizard (`removeppwizard`).
//
// Two gaps, same wizard:
//  1. The header only says "Select Folder(s)" — it never says *what* you're removing. We add a
//     banner naming it, e.g. "Removing Schema test-b" (label from the profile type, name from the
//     wizard URL).
//  2. The folder cards show only a title + "FOLDER", never the path. It's on each card as
//     `data-foundation-collection-item-id`; we surface it + an Open folder link.
//
// This one enhancer covers every Assets Tool that reuses the wizard: Metadata Schemas, Folder
// Metadata Schemas, Metadata Profiles, Processing Profiles, Image Profiles, and Video Profiles.

import { register } from '../core/registry.js';
import { markOnce, assetsUrl, h, link } from '../core/dom.js';

const ID = 'remove-from-folder';
const WIZARD_SELECTOR = 'form.remove-folder-wizard';
// Full-width banner slot: above the folder grid, below the (flex) header toolbar. Injecting into
// the header row itself collapses the "Select Folder(s)" title, so anchor to the content container.
const BANNER_ANCHOR_SELECTOR = '.cq-damadmin-admin-remove-folder-container';
const ITEM_SELECTOR =
  'coral-masonry-item.foundation-collection-item[data-foundation-collection-item-id^="/content/dam"]';
const URL_MARKER = 'removeppwizard.html';

// What is being removed, from the wizard URL: .../removeppwizard.html<path>?profiletype=<type>
// Label = last word of the (camelCase) type: "metadataSchema" -> "Schema", "imageProfile" -> "Profile".
function profileFromUrl() {
  const idx = location.pathname.indexOf(URL_MARKER);
  if (idx < 0) return null;
  const path = decodeURIComponent(location.pathname.slice(idx + URL_MARKER.length));
  if (!path.startsWith('/')) return null;
  const name = path.split('/').filter(Boolean).pop() || path;
  const type = new URLSearchParams(location.search).get('profiletype') || '';
  const words = type.replace(/([A-Z])/g, ' $1').trim().split(/\s+/).filter(Boolean);
  const word = words[words.length - 1] || 'Profile';
  const label = word.charAt(0).toUpperCase() + word.slice(1);
  return { name, label };
}

register({
  id: ID,
  appliesTo() {
    return !!document.querySelector(WIZARD_SELECTOR);
  },
  enhance() {
    // 1. Banner: what is being removed.
    const anchor = document.querySelector(BANNER_ANCHOR_SELECTOR);
    const profile = profileFromUrl();
    if (anchor && profile && markOnce(anchor, `${ID}-banner`)) {
      anchor.insertAdjacentElement(
        'beforebegin',
        h('div', { class: 'aem-tb-wizard-subtitle' }, [
          h('span', { text: `Removing ${profile.label} ` }),
          h('strong', { class: 'aem-tb-name', text: profile.name }),
        ]),
      );
    }

    // 2. Folder cards: show each folder's path + Open folder link.
    document.querySelectorAll(ITEM_SELECTOR).forEach((item) => {
      if (!markOnce(item, ID)) return;
      const path = item.getAttribute('data-foundation-collection-item-id');
      if (!path) return;

      const info = h('div', { class: 'aem-tb-path-info aem-tb-card-path' }, [
        h('span', { class: 'aem-tb-path', title: path, text: path }),
        link(assetsUrl(path), 'Open folder ↗'),
      ]);

      const card = item.querySelector('coral-card') || item;
      card.appendChild(info);
    });
  },
});
