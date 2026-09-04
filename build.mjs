// Builds one shared core+enhancers bundle into two deliverables:
//   build/aem-toolbelt.user.js   — Tampermonkey userscript (metadata header + bundle)
//   build/extension/             — unpacked MV3 Chrome extension (manifest + popup + content.js)
// Run: `node build.mjs` (add --watch to rebuild on change).

import * as esbuild from 'esbuild';
import { readFile, writeFile, mkdir, copyFile, rm, watch } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const p = (...s) => join(root, ...s);

const pkg = JSON.parse(await readFile(p('package.json'), 'utf8'));
const VERSION = pkg.version;

async function bundle() {
  const result = await esbuild.build({
    entryPoints: [p('src/enhancers/index.js')],
    bundle: true,
    format: 'iife',
    target: ['chrome110'],
    platform: 'browser',
    loader: { '.css': 'text' },
    charset: 'utf8',
    write: false,
  });
  return result.outputFiles[0].text;
}

async function build() {
  const code = await bundle();

  await rm(p('build'), { recursive: true, force: true });
  await mkdir(p('build/extension'), { recursive: true });

  // Userscript = metadata header (with version) + bundle.
  const header = (await readFile(p('wrappers/userscript-header.txt'), 'utf8')).replaceAll('{{VERSION}}', VERSION);
  await writeFile(p('build/aem-toolbelt.user.js'), `${header}\n${code}`);

  // Extension = static wrapper files (version-stamped manifest) + generated content.js.
  const manifest = (await readFile(p('wrappers/extension/manifest.json'), 'utf8')).replaceAll('{{VERSION}}', VERSION);
  await writeFile(p('build/extension/manifest.json'), manifest);
  await copyFile(p('wrappers/extension/popup.html'), p('build/extension/popup.html'));
  await copyFile(p('wrappers/extension/popup.js'), p('build/extension/popup.js'));
  await writeFile(p('build/extension/content.js'), code);

  console.log(`✓ built v${VERSION}: build/aem-toolbelt.user.js + build/extension/`);
}

await build();

if (process.argv.includes('--watch')) {
  console.log('watching src/ and wrappers/ …');
  for (const dir of ['src', 'wrappers']) {
    (async () => {
      for await (const _ of watch(p(dir), { recursive: true })) {
        try {
          await build();
        } catch (err) {
          console.error('build failed:', err.message);
        }
      }
    })();
  }
}
