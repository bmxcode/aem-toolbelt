// Lets the user enable the toolbelt on an AEM host that isn't covered by the static content-script
// matches (e.g. an AMS or on-prem author with a custom hostname). Requests the optional host
// permission for the active site, injects the content script now, and registers it for future loads.

const hostEl = document.getElementById('host');
const btn = document.getElementById('enable');
const statusEl = document.getElementById('status');

let activeTab;
let origin;

async function init() {
  [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab || !/^https?:/.test(activeTab.url || '')) {
    hostEl.textContent = 'n/a';
    statusEl.textContent = 'Open an AEM tab to enable it here.';
    return;
  }
  const url = new URL(activeTab.url);
  origin = `${url.protocol}//${url.hostname}/*`;
  hostEl.textContent = url.hostname;

  const already = await chrome.permissions.contains({ origins: [origin] });
  if (already) {
    btn.textContent = 'Enabled ✓';
    statusEl.textContent = 'Reload the tab if you don’t see it yet.';
  } else {
    btn.disabled = false;
  }
}

btn.addEventListener('click', async () => {
  const granted = await chrome.permissions.request({ origins: [origin] });
  if (!granted) {
    statusEl.textContent = 'Permission declined.';
    return;
  }
  try {
    await chrome.scripting.registerContentScripts([
      {
        id: `aem-toolbelt-${new URL(activeTab.url).hostname}`,
        matches: [origin],
        js: ['content.js'],
        runAt: 'document_idle',
      },
    ]);
  } catch (err) {
    // Ignore "already registered" so re-enabling is harmless.
    console.debug('registerContentScripts:', err);
  }
  await chrome.scripting.executeScript({ target: { tabId: activeTab.id }, files: ['content.js'] });
  btn.disabled = true;
  btn.textContent = 'Enabled ✓';
  statusEl.textContent = 'Active on this site.';
});

init();
