# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] — 2026-09-04

### Added
- **Shared Links:** long shares now show the first two filenames inline + "… N more"; the full
  item list lives in the info box (handles the 18–20-asset shares seen in production).
- **Shared Links:** a dedicated emails popup on the USERS icon (only when the count is > 0),
  separate from the info box.
- **Shared Links:** rows with an empty `data-shared-paths` (folder shares and some single assets)
  now render their filename by sourcing the path from the share JSON.

### Changed
- **Shared Links:** the info box now lists every shared item and the share details; emails moved
  out to their own popup.
- Docs: README/DESIGN scrubbed of internal instance identifiers; added an unofficial/trademark
  disclaimer.

## [0.3.0] — 2026-09-04

### Added
- **Shared Links** redesign: the shared asset filename(s) render as links (`Share Link: name ↗`),
  with a hover **info box** (created-by, created/expiry dates, download/rendition permissions,
  message, shared-with emails) fetched lazily from the share JSON.

### Changed
- **Remove from Folder(s):** the "Open Folder" action moved from a per-tile link to a header button
  next to Cancel, enabled only when a single folder tile is selected.

## [0.2.0] — 2026-09-04

### Added
- **Remove from Folder(s):** a "Removing _&lt;type&gt; &lt;name&gt;_" banner naming the schema/profile
  being removed, and an **Open Folder** button.

### Fixed
- Injected links no longer select the underlying Coral tile/row (capture-phase guard); they navigate
  as intended.

### Security
- Bumped `esbuild` to ^0.25 to clear the dev-server advisory (GHSA-67mh-4wv8-2f99); the dev server
  is never used.

## [0.1.0] — 2026-09-04

### Added
- Initial release: a DOM-only enhancer framework shipped as a Tampermonkey userscript and an MV3
  Chrome extension from one shared core.
- **Remove from Folder(s)** wizard: folder path + Open folder link on each card, across all Assets
  Tools that reuse the wizard.
- **Shared Links:** shared asset filename + path, and a link to the share record.

[Unreleased]: https://github.com/bmxcode/aem-toolbelt/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/bmxcode/aem-toolbelt/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/bmxcode/aem-toolbelt/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/bmxcode/aem-toolbelt/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/bmxcode/aem-toolbelt/releases/tag/v0.1.0
