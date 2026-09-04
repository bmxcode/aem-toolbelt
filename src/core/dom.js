// Small DOM helpers shared by every enhancer. Pure DOM reads/writes only — no page-context
// scripts, no network — so the tool stays clean under the AEMaaCS Content-Security-Policy.

export const MARKER_ATTR = 'data-aem-toolbelt';

/**
 * Idempotency guard. Returns true the first time an enhancer touches a node, false thereafter,
 * so repeated runs (AEM re-renders content on in-app navigation) never duplicate injected UI.
 */
export function markOnce(node, id) {
  const existing = node.getAttribute(MARKER_ATTR);
  if (existing && existing.split(' ').includes(id)) return false;
  node.setAttribute(MARKER_ATTR, existing ? `${existing} ${id}` : id);
  return true;
}

/** Build the Assets-console URL for a repository path. */
export function assetsUrl(path) {
  return `/assets.html${path}`;
}

/** Build the infinity-JSON URL AEM admins use to inspect a node's properties. */
export function infinityJsonUrl(path) {
  return `${path}.-1.json`;
}

/** Split an attribute that may hold several comma-separated paths (e.g. multi-asset shares). */
export function splitMultiPath(value) {
  if (!value) return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

/** Tiny hyperscript helper. */
export function h(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else node.setAttribute(key, value);
  }
  const kids = Array.isArray(children) ? children : [children];
  for (const child of kids) {
    if (child == null) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

/** An external link that opens in a new tab, styled by the injected stylesheet. */
export function link(href, text, extraClass = '') {
  return h('a', {
    class: `aem-tb-link${extraClass ? ` ${extraClass}` : ''}`,
    href,
    target: '_blank',
    rel: 'noopener',
  }, text);
}

let stylesInjected = false;
/** Inject the toolbelt stylesheet once per page. */
export function injectStyles(css) {
  if (stylesInjected || document.querySelector('style[data-aem-toolbelt-styles]')) {
    stylesInjected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute('data-aem-toolbelt-styles', '');
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
  stylesInjected = true;
}
