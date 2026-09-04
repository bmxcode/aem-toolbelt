// The runner: decides when to (re)apply enhancers. AEM's Touch UI swaps page content in place
// (pjax-style) and opens wizards/dialogs without a full reload, firing `foundation-contentloaded`.
// We listen for that AND keep a debounced MutationObserver as a fallback, then dispatch to every
// applicable enhancer. All work is idempotent, so extra runs are harmless.

import { getApplicable } from './registry.js';
import { injectStyles, LINK_CLASS } from './dom.js';
import styles from '../styles.css';

const LOG = '[aem-toolbelt]';

// Our injected links usually sit inside selectable Coral collection items (cards, rows) whose
// select handlers run in the CAPTURE phase on an ancestor — so a listener on the link can't stop
// them. Intercept at the top of the capture phase instead: for events originating in one of our
// links, stop propagation so the item never selects. We don't preventDefault, so the link's own
// navigation (its href) still happens.
function guardLinkClicks() {
  const stopIfOurLink = (e) => {
    const t = e.target;
    if (t && t.closest && t.closest(`a.${LINK_CLASS}`)) e.stopPropagation();
  };
  for (const type of ['pointerdown', 'mousedown', 'mouseup', 'click']) {
    window.addEventListener(type, stopIfOurLink, true);
  }
}

/** Cheap guard so enhancers never run on non-AEM pages that happen to match a host. */
function looksLikeAem() {
  return !!(
    window.Granite ||
    document.querySelector('coral-shell, .foundation-content, .granite-collection, [class*="_coral-"]')
  );
}

function runOnce() {
  if (!looksLikeAem()) return;
  for (const enhancer of getApplicable()) {
    try {
      enhancer.enhance(document);
    } catch (err) {
      console.warn(LOG, 'enhance() threw for', enhancer.id, err);
    }
  }
}

let scheduled = false;
function scheduleRun() {
  if (scheduled) return;
  scheduled = true;
  const run = () => {
    scheduled = false;
    runOnce();
  };
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 400 });
  else setTimeout(run, 150);
}

export function start() {
  injectStyles(styles);
  guardLinkClicks();

  // AEM in-app navigation and dialog/wizard rendering.
  document.addEventListener('foundation-contentloaded', scheduleRun, true);

  // Fallback for content that appears without a foundation event (some Coral dialogs/masonry).
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length) {
        scheduleRun();
        return;
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  // First run.
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', scheduleRun);
  } else {
    scheduleRun();
  }

  console.info(LOG, 'started');
}
