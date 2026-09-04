# Contributing — adding an enhancer

Every console fix in AEM Toolbelt is one small **enhancer**. Adding one is a self-contained change:
a new file in `src/enhancers/` plus one line in `src/enhancers/index.js`. No changes to the runner,
the build, or the userscript/extension wrappers.

Read [`docs/DESIGN.md`](docs/DESIGN.md) once for the why; this file is the how.

## The mental model

AEM usually **already has the useful value in the page DOM** (a `data-*` attribute, a collection
item id) but never renders it. An enhancer reads that value and renders it as visible text + a
clickable link. That's the whole job. Two rules make it robust:

- **Detect by DOM signature, not URL.** AEMaaCS console paths are non-obvious and move between
  versions (every hardcoded URL we tried 404'd). Match on the elements/attributes you need instead.
- **Be idempotent.** AEM re-renders content on in-app navigation and opens dialogs/wizards without a
  full reload. The runner re-applies enhancers on every such change, so `enhance()` must be safe to
  run repeatedly — guard with `markOnce`.

## Anatomy of an enhancer

```js
register({
  id: 'my-fix',                         // unique; also the idempotency marker
  appliesTo() {                         // cheap DOM-signature test — true only on the target page
    return !!document.querySelector('<selector for the elements you decorate>');
  },
  enhance() {                           // idempotent DOM decoration
    document.querySelectorAll('<selector>').forEach((el) => {
      if (!markOnce(el, 'my-fix')) return;   // skip already-decorated nodes
      // read a data-* attribute off `el`, build UI with the dom.js helpers, append it
    });
  },
});
```

## Steps

### 1. Find the hidden value (DevTools)

On a real AEM instance, open the console page, right-click the row/card → **Inspect**, and look at
the element and its ancestors for a `data-*` attribute or `data-foundation-collection-item-id`
holding the path/name you want. Note a **stable, specific** selector for `appliesTo` — specific
enough not to fire on other consoles that also use `tr.foundation-collection-item`. Watch for AEM
quirks: some attributes are double-encoded (e.g. `data-path="…B&amp;R"`), so prefer the clean
source (`data-granite-collection-item-id`) when there's a choice.

### 2. Create `src/enhancers/<name>.js`

Copy an existing one as a template — [`shared-links.js`](src/enhancers/shared-links.js) (table rows)
or [`remove-from-folder.js`](src/enhancers/remove-from-folder.js) (cards + a header banner). Import
only the helpers you need from `../core/dom.js` and `../core/registry.js`.

### 3. Register it

Add one import to [`src/enhancers/index.js`](src/enhancers/index.js):

```js
import './my-fix.js';
```

### 4. Build and test live

```bash
npm install && npm run build
```

Then either install `build/aem-toolbelt.user.js` in Tampermonkey and open the page, or paste the
contents of `build/extension/content.js` into the page's DevTools console for a quick check.

## Conventions (please follow)

- **DOM reads only.** No injecting `<script>` into the page, no page-context APIs, no network calls
  beyond linking the user to existing AEM URLs. This keeps the tool clean under the AEMaaCS CSP.
- **Links must use `link()`** from `dom.js`. It gives every link the `aem-tb-link` class, which the
  runner's capture-phase guard uses to stop the click from selecting the underlying Coral tile/row
  while still letting the link navigate. A hand-rolled `<a>` will select the tile instead.
- **Namespace CSS** with the `aem-tb-` prefix, and add styles to `src/styles.css`.
- **Keep `appliesTo` cheap and specific** — it runs on every content change. A single
  `document.querySelector` is ideal.
- **Don't hardcode console URLs.** If you truly need the URL (e.g. to parse an id out of it, as
  `remove-from-folder` does), read it inside `enhance()`; keep `appliesTo` DOM-based.

### `dom.js` helpers

| Helper | Use |
| --- | --- |
| `markOnce(node, id)` | Idempotency guard; returns `false` if already decorated |
| `h(tag, props, children)` | Tiny element builder (`class`, `text`, attrs, `on*` handlers) |
| `link(href, text)` | External link (new tab) that won't trigger tile selection |
| `assetsUrl(path)` | `/assets.html<path>` |
| `infinityJsonUrl(path)` | `<path>.-1.json` |
| `splitMultiPath(value)` | Split a comma-separated multi-path attribute |

## PR checklist

- [ ] One enhancer per console gap; registered in `index.js`.
- [ ] `appliesTo` is DOM-signature based and specific to the target page.
- [ ] `enhance()` is idempotent (`markOnce`) and re-run safe.
- [ ] Links use `link()`; injected classes are `aem-tb-`-prefixed.
- [ ] `npm run build` succeeds and you verified the result on a real AEM console.
- [ ] Commit message says which console + what value is surfaced.
