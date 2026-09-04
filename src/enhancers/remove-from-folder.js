// Enhancer #1 — "Remove from Folder(s)" wizard (`removeppwizard`).
//
// Three gaps, same wizard:
//  1. The header only says "Select Folder(s)" — never *what* you're removing. We add a banner
//     naming it, e.g. "Removing Schema test-b".
//  2. The folder cards show only a title + "FOLDER", never the path. We surface the path as text
//     on each card (read-only — the card itself is a selectable tile, so we don't put a link on it).
//  3. There's no way to jump to a folder. We add an "Open Folder" button next to Cancel in the
//     header. It is enabled only when exactly one folder tile is selected, and opens that folder
//     in Assets. (The tile is selectable, so a single selection is an unambiguous target.)
//
// This one enhancer covers every Assets Tool that reuses the wizard: Metadata Schemas, Folder
// Metadata Schemas, Metadata Profiles, Processing Profiles, Image Profiles, and Video Profiles.

import { register } from '../core/registry.js';
import { markOnce, assetsUrl, h } from '../core/dom.js';

const ID = 'remove-from-folder';
const WIZARD_SELECTOR = 'form.remove-folder-wizard';
const BANNER_ANCHOR_SELECTOR = '.cq-damadmin-admin-remove-folder-container';
const HEADER_SELECTOR = '.foundation-layout-wizard2-header';
const CANCEL_SELECTOR = '.foundation-layout-wizard2-header a.foundation-wizard-control';
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

function folderPaths({ selectedOnly } = {}) {
  const items = [...document.querySelectorAll(ITEM_SELECTOR)];
  const chosen = selectedOnly ? items.filter((i) => i.getAttribute('aria-selected') === 'true') : items;
  return chosen.map((i) => i.getAttribute('data-foundation-collection-item-id')).filter(Boolean);
}

function buildOpenButton() {
  const btn = h(
    'button',
    { type: 'button', class: '_coral-Button _coral-Button--secondary foundation-layout-inline2-item aem-tb-open-folder' },
    [h('coral-button-label', { class: '_coral-Button-label', text: 'Open Folder' })],
  );
  btn.disabled = true;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const paths = folderPaths({ selectedOnly: true });
    if (paths.length === 1) window.open(assetsUrl(paths[0]), '_blank', 'noopener');
  });
  return btn;
}

// Enable only when exactly one folder tile is selected.
function syncOpenButtonState(btn) {
  const enabled = folderPaths({ selectedOnly: true }).length === 1;
  btn.disabled = !enabled;
  btn.title = enabled ? '' : 'Select a single folder to open it';
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

    // 2. Header "Open Folder" button, next to Cancel (only when there are folders to open).
    const cancel = document.querySelector(CANCEL_SELECTOR);
    const header = document.querySelector(HEADER_SELECTOR);
    if (cancel && header && document.querySelector(ITEM_SELECTOR) && markOnce(header, `${ID}-openbtn`)) {
      const btn = buildOpenButton();
      cancel.insertAdjacentElement('beforebegin', btn);
      syncOpenButtonState(btn);
      // Keep the enabled state in sync with tile selection (mouse or keyboard).
      const collection = document.querySelector(BANNER_ANCHOR_SELECTOR) || header.closest('form') || document;
      new MutationObserver(() => syncOpenButtonState(btn)).observe(collection, {
        attributes: true,
        subtree: true,
        attributeFilter: ['aria-selected'],
      });
    }

    // 3. Folder cards: show each folder's path (read-only text; no link on the selectable tile).
    document.querySelectorAll(ITEM_SELECTOR).forEach((item) => {
      if (!markOnce(item, ID)) return;
      const path = item.getAttribute('data-foundation-collection-item-id');
      if (!path) return;
      const card = item.querySelector('coral-card') || item;
      card.appendChild(
        h('div', { class: 'aem-tb-path-info aem-tb-card-path' }, [
          h('span', { class: 'aem-tb-path', title: path, text: path }),
        ]),
      );
    });
  },
});
