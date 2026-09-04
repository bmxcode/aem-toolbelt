// A single reusable hover popover (floating info box). One element, repositioned per trigger.
// Content can be produced lazily/async (e.g. after a fetch); a "Loading…" box shows meanwhile.

import { h } from './dom.js';

let popEl = null;
let hideTimer = null;
let currentTrigger = null;

function ensureEl() {
  if (popEl) return popEl;
  popEl = h('div', { class: 'aem-tb-popover', role: 'dialog' });
  popEl.style.display = 'none';
  popEl.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  popEl.addEventListener('mouseleave', scheduleHide);
  document.body.appendChild(popEl);
  return popEl;
}

function scheduleHide() {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(hide, 180);
}

function hide() {
  if (popEl) popEl.style.display = 'none';
  currentTrigger = null;
}

function position(el, trigger) {
  const r = trigger.getBoundingClientRect();
  el.style.position = 'fixed';
  el.style.display = 'block';
  const pr = el.getBoundingClientRect();
  let left = r.left;
  let top = r.bottom + 6;
  if (left + pr.width > window.innerWidth - 8) left = window.innerWidth - pr.width - 8;
  if (top + pr.height > window.innerHeight - 8 && r.top - pr.height - 6 > 8) top = r.top - pr.height - 6;
  el.style.left = `${Math.max(8, left)}px`;
  el.style.top = `${Math.max(8, top)}px`;
}

function show(trigger, contentNode) {
  const el = ensureEl();
  clearTimeout(hideTimer);
  el.textContent = '';
  el.appendChild(contentNode);
  position(el, trigger);
}

/**
 * Show the popover on hover of `trigger`. `contentFn()` returns a Node or a Promise of one; while
 * it resolves, a loading box is shown. Safe to call repeatedly on the same element (idempotent).
 */
export function attachHoverPopover(trigger, contentFn) {
  if (trigger.__tbPopover) return;
  trigger.__tbPopover = true;

  trigger.addEventListener('mouseenter', () => {
    currentTrigger = trigger;
    show(trigger, h('div', { class: 'aem-tb-pop-loading', text: 'Loading…' }));
    Promise.resolve()
      .then(contentFn)
      .then((node) => {
        if (currentTrigger === trigger) show(trigger, node);
      })
      .catch(() => {
        if (currentTrigger === trigger) show(trigger, h('div', { text: 'Failed to load details.' }));
      });
  });
  trigger.addEventListener('mouseleave', scheduleHide);
}
