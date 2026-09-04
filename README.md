# AEM Toolbelt 🧰

Client-side quality-of-life enhancements for the Adobe Experience Manager (AEM) Assets Touch UI
console. AEM often **already has useful information in the page DOM** but never renders it, forcing
admins and developers into browser DevTools to read an attribute by hand. AEM Toolbelt surfaces that
information as visible text and clickable links.

It ships two ways from **one shared codebase**:

- a **Tampermonkey userscript** — fastest to install and iterate, and
- an **MV3 Chrome extension** — cleaner for distributing to a team.

Everything is **DOM-only**: no server deploy, no page-context scripts, no network calls beyond
navigating you to existing AEM URLs. It runs as the already-logged-in user and works on any instance
your browser can reach. This keeps it clean under the strict AEM as a Cloud Service CSP.

## What it fixes today

| Console | Problem | Toolbelt adds |
| --- | --- | --- |
| **Remove from Folder(s)** wizard — used by Metadata Schemas, Folder Metadata Schemas, Metadata Profiles, Processing Profiles, Image Profiles, Video Profiles | Folder cards show only a title, no path | The folder path + an **Open folder** link |
| **Assets › Shared Links** | Every row just says "Link share" — no idea which asset | The shared asset filename + path (**Open in Assets**) and a **View share JSON** link to the share record |

Detection is by **DOM signature, not URL** — AEMaaCS console paths are non-obvious and change
between versions, so the enhancers simply look for their target elements and no-op otherwise.

## Install

**No build required:** grab the prebuilt files from the
[latest release](https://github.com/bmxcode/aem-toolbelt/releases/latest) —
`aem-toolbelt-<version>.user.js` (userscript) and `aem-toolbelt-extension-<version>.zip`
(unzip and Load unpacked). Otherwise build locally as below.

### Userscript (recommended to start)

1. Install [Tampermonkey](https://www.tampermonkey.net/) in Chrome.
2. `npm install && npm run build`
3. Open `build/aem-toolbelt.user.js` in Tampermonkey (drag it in, or create a new script and paste
   the contents), and save.
4. Reload your AEM author tab.

It auto-runs on `*.adobeaemcloud.com` and `localhost:4502`. For other hosts, add a `@match` line.

### Chrome extension

**From a release (no npm):**

1. Download **`aem-toolbelt-extension-<version>.zip`** from the
   [latest release](https://github.com/bmxcode/aem-toolbelt/releases/latest).
2. **Unzip it.** Chrome loads the *folder*, not the zip — keep the unzipped folder somewhere
   permanent (Chrome reads it from disk on every launch; moving or deleting it breaks the extension).
3. Open `chrome://extensions`.
4. Toggle on **Developer mode** (top-right).
5. Click **Load unpacked** and select the unzipped folder. "AEM Toolbelt" appears in the list.
6. Optional: click the toolbar puzzle-piece icon and **pin** AEM Toolbelt for one-click access to its popup.

**From a local build:** run `npm install && npm run build`, then Load unpacked on `build/extension/`
(steps 3–6 above).

It auto-runs on `*.adobeaemcloud.com` and `localhost:4502`. For AEM hosts outside those (e.g. AMS or
on-prem), click the AEM Toolbelt icon and **Enable on this site**, then reload the tab.

**Updating:** unpacked extensions don't auto-update. Download the new zip, unzip over the same
folder, then click the refresh icon on the extension's card in `chrome://extensions`.

## Develop

```bash
npm install
npm run build      # one-off build → build/
npm run watch      # rebuild on change
```

### Add a new fix

1. Create `src/enhancers/<name>.js` that calls `register({ id, appliesTo, enhance })`.
2. Import it in `src/enhancers/index.js`.

That's it — no wrapper or build changes. `appliesTo()` is a DOM-signature test; `enhance()` decorates
the DOM idempotently (guard with `markOnce` from `src/core/dom.js`). The runner re-applies enhancers
on AEM's in-app navigation (`foundation-contentloaded`) and on DOM mutations.

## Project layout

```
src/core/        runner (nav/mutation handling), registry, DOM helpers
src/enhancers/   one file per console fix + index.js
wrappers/        userscript header + MV3 extension (manifest, popup)
build.mjs        esbuild: core+enhancers → userscript AND extension
```

## License

MIT
