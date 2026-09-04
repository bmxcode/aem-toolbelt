# AEM Console Enhancer — Plan

## Context

The AEM Assets Touch UI console hides information that admins/developers need. In several
places AEM **already has the data in the DOM** (as Granite/Coral attributes) but never renders it,
forcing users into browser DevTools > Inspect to read an attribute by hand. Two confirmed cases
(both verified live on the dev instance `author-p<program>-e<env>`):

1. **Assets Tools > "Remove from Folder(s)" wizard** — the folder cards show only the folder
   *title* + the word "FOLDER", no path. **Confirmed:** each card is a
   `coral-masonry-item.foundation-collection-item` whose `data-foundation-collection-item-id`
   (and identical `data-granite-collection-item-id`) **is the folder path**, e.g.
   `/content/dam/example/my-folder`.
   **Scope:** this same wizard (`removeppwizard`) is reused by *many* Assets Tools — **Metadata
   Schemas, Folder Metadata Schemas, Metadata Profiles, Processing Profiles, Image Profiles, and
   Video Profiles**. Because detection is by DOM signature (not URL or `profiletype`), a single
   enhancer fixes the path-less folder list across **all** of them at once.
2. **Assets > Shared Links** ("Shared Links" tile) — every row shows "Link share" with no path.
   **Confirmed:** each row is `tr.foundation-collection-item` carrying:
   - `data-shared-paths` = **the shared asset path**, e.g.
     `/content/dam/example/sample-asset.png` (plural — comma-separated for
     multi-asset shares).
   - `data-shared-assets-title` = the asset filename.
   - `data-path` / `data-foundation-collection-item-id` = the **share record** node
     `/var/dam/share/<id>` (this is what the manual `.-1.json` trick inspects).

More such gaps will surface over time; the user wants a **reusable, extensible** way to fix them
across **any** AEM instance without per-instance server deploy.

### Decision inputs (confirmed with user)
- Audience: **me now, team later** → prototype fast, package cleanly later.
- Target: **AEM as a Cloud Service now**; AMS/6.5 possibly later.
- Deploy access: **not always** → must be client-side.
- Browser: **Chrome** (AEM's supported author browser).

### Key finding from live inspection
Every console URL guessed from memory 404'd — AEMaaCS uses non-obvious, movable paths
(`mylinkshares.html`, `removeppwizard.html`, etc.). But in **both** cases the targets are standard
`.foundation-collection-item` elements carrying a path-bearing data attribute. **Therefore the tool
must detect targets by DOM signature, not by hardcoded URLs** — this is more robust across AEM
versions and instances and is the core design principle below.

## Approach

**Client-side DOM enhancer, shipped as a hybrid: a Tampermonkey userscript (now) and an MV3
Chrome extension (later), built from one shared "enhancer core."**

Every fix is the same shape — *read an attribute AEM already put in the DOM, render it as visible
text plus a clickable link/button.* This needs **only DOM reads**, never the page's JS context or
server calls, which sidesteps AEMaaCS's strict CSP and runs as the already-logged-in user with no
extra AEM permissions.

### Approaches considered (and why not)
- **Server-side AEM UI overlay / clientlib (rejected):** native but must be deployed to *every*
  instance and redone per AEM version — impossible without deploy access, breaking the "any
  instance" requirement. Ruled out by the "not always" deploy answer.
- **Pure userscript OR pure extension (folded into the hybrid):** userscript = instant iteration
  but needs Tampermonkey; extension = clean team distribution but slower to iterate. The hybrid
  keeps one logic core and two thin wrappers, so we get both without a rewrite.

## Architecture

A framework-agnostic **enhancer registry**. Each console gap = one small `Enhancer`:

```
Enhancer = {
  id: string,
  appliesTo(root): boolean,   // DOM-signature test (NOT a URL match) — e.g. presence of the
                              // specific collection items + attributes this enhancer needs
  enhance(root): void,        // idempotent DOM decoration; safe to re-run
}
```

A single **runner** drives them:
- On load AND on AEM's in-app navigation, run every enhancer whose `appliesTo` is true.
- **Critical AEM behavior (confirmed):** the author UI does pjax-style navigation and opens
  wizards/dialogs without a full reload (Coral/Granite `foundation-contentloaded` events). The
  runner must listen for `foundation-contentloaded` on `document` **and** keep a debounced
  `MutationObserver` on the content area (the Remove-from-Folder wizard and Shared Links list both
  render this way).
- `enhance()` must be **idempotent** — guard with a marker attribute (e.g. `data-ace-enhanced`)
  so re-runs don't duplicate injected UI.
- Detection is by DOM signature, so no console-URL list to maintain; enhancers simply no-op when
  their target elements aren't present.

### Repo layout
```
aem-toolbelt/
  src/
    core/
      runner.js         # foundation-contentloaded + MutationObserver + registry dispatch
      registry.js       # register()/getApplicable()
      dom.js            # helpers: marker guard, path->/assets.html link, path->.-1.json link,
                        #          splitMultiPath (comma-separated), inject styles, badge builder
    enhancers/
      shared-links.js
      remove-from-folder.js
      index.js          # imports each enhancer and registers it
    styles.css
  build/                # generated
  wrappers/
    userscript-header.txt
    extension/
      manifest.json     # MV3
      content.js        # thin: import bundled core+enhancers, start runner
      popup.html/js     # "enable on this domain" (optional host permissions)
  build.mjs             # esbuild: core+enhancers -> userscript AND extension content.js
  README.md
```

### Build (one core → two wrappers)
esbuild in `build.mjs`:
- Bundle `src/enhancers/index.js` (pulls in the core) into one IIFE.
- **Userscript:** prepend `wrappers/userscript-header.txt` → `build/aem-console-enhancer.user.js`.
- **Extension:** emit the same bundle as `wrappers/extension/content.js`; CSS injected
  programmatically from `styles.css` (keeps parity with the userscript, avoids
  `web_accessible_resources`).

## The two enhancers (initial scope)

### Enhancer #1 — Remove from Folder(s)
- **appliesTo:** page contains `coral-masonry-item.foundation-collection-item[data-foundation-collection-item-id^="/content/dam"]`.
  This one signature covers the shared `removeppwizard` used by **Metadata Schemas, Folder Metadata
  Schemas, Metadata Profiles, Processing Profiles, Image Profiles, and Video Profiles** — all fixed
  by this single enhancer.
- **Read:** `data-foundation-collection-item-id` = folder path.
- **Render (per card):** append the path as muted secondary text under the title + an **"Open
  folder"** link → `/assets.html<path>`.

### Enhancer #2 — Shared Links
- **appliesTo:** page contains `tr.foundation-collection-item[data-shared-paths]`.
- **Read:** `data-shared-paths` (split on comma for multi-asset), `data-shared-assets-title`,
  and `data-path` (share record).
- **Render (per row):** show the asset path(s) with, for each, **Open in Assets** →
  `/assets.html<assetPath>`; plus **View share JSON** → `/var/dam/share/<id>.-1.json` (from
  `data-path`). Prefer adding a cell/column; fall back to an inline badge in an existing cell if
  injecting a header column is fragile.

### Cross-instance concerns (baked in)
- **No hardcoded console URLs** — detection is by DOM signature (see finding above).
- **Hostname permissions:** default-enable on `*.adobeaemcloud.com` and `localhost:4502`. For MV3,
  use **optional host permissions** + a popup "Enable on this domain" so arbitrary AMS/6.5 hosts
  can be added later without a `<all_urls>` grant. The userscript uses `@match` (user-editable).
- **AEM detection:** enhancers key off Granite/Coral markers, so they no-op on non-AEM pages.
- **Version drift (6.5 later):** if attribute names differ, add fallbacks inside the two
  `appliesTo`/`enhance` functions — no rearchitecture.

## Extensibility (the real point)
Each future console gap = **one new file in `src/enhancers/` + one line in `index.js`**. No wrapper
changes. Directly serves "there are other lacking features… I'd like to also fix these."

## Verification
1. **Build:** `node build.mjs` produces the userscript and the packaged extension; no bundle errors.
2. **Userscript (primary):** install `build/aem-console-enhancer.user.js` in Tampermonkey on Chrome,
   on the dev instance `author-p<program>-e<env>.adobeaemcloud.com`:
   - Shared Links (`.../assets/mylinkshares.html`) → each row shows the asset filename + path with
     working **Open in Assets** and **View share JSON** links (share record resolves at
     `/var/dam/share/<id>.-1.json`).
   - Metadata Schemas → Remove from Folder (`removeppwizard`) → each folder card shows its
     `/content/dam/...` path + a working **Open folder** link.
   - Navigate between consoles and open the wizard **without reloading**; confirm enhancements
     re-apply (validates `foundation-contentloaded`/MutationObserver) and don't duplicate
     (idempotency marker).
3. **Extension:** load `wrappers/extension/` unpacked in Chrome, grant the domain via the popup,
   confirm identical behavior.

## Notes
- Both target attributes are **confirmed live** — no remaining unknowns for the initial two fixes.
- Keep all injected UI DOM-only (no inline `<script>` into the page) to stay clean under AEMaaCS CSP.
- No credentials, no network calls beyond navigating the user to existing AEM URLs.
