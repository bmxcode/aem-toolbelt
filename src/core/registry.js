// The enhancer registry. Every console fix registers one small enhancer here; the runner asks the
// registry which ones apply to the current page. Adding a new fix = one new enhancer file + one
// import in enhancers/index.js — no changes to the runner or the wrappers.

/**
 * @typedef {Object} Enhancer
 * @property {string} id                       Stable, unique id (also used as the idempotency marker).
 * @property {() => boolean} appliesTo         DOM-signature test — true when this page has the target
 *                                             elements. Detection is by DOM, never by hardcoded URL,
 *                                             because AEMaaCS console paths are non-obvious and move.
 * @property {(root: ParentNode) => void} enhance  Idempotent DOM decoration.
 */

/** @type {Enhancer[]} */
const enhancers = [];

/** @param {Enhancer} enhancer */
export function register(enhancer) {
  if (!enhancer || !enhancer.id) throw new Error('[aem-toolbelt] enhancer needs an id');
  enhancers.push(enhancer);
}

/** Enhancers whose `appliesTo` currently returns true. Failures are isolated, never fatal. */
export function getApplicable() {
  return enhancers.filter((e) => {
    try {
      return e.appliesTo();
    } catch (err) {
      console.warn('[aem-toolbelt] appliesTo() threw for', e.id, err);
      return false;
    }
  });
}
