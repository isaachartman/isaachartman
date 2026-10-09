import { getDir, ensurePermission, saveReference } from './shared.js';

const $ = (id) => document.getElementById(id);
const noteEl = $('note');
const saveBtn = $('save');
const statusEl = $('status');

let dir = null;
let tab = null;
let blob = null;
let dims = { width: 0, height: 0 };

function setStatus(msg, isErr = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle('err', isErr);
}

function ready() {
  const ok = !!(blob && dir);
  noteEl.disabled = !ok;
  saveBtn.disabled = !ok;
  if (ok) noteEl.focus();
}

$('openWall').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL('wall.html') });
  window.close();
});

$('grant').addEventListener('click', async () => {
  try {
    if (await ensurePermission(dir, true)) {
      $('setup').hidden = true;
      setStatus('');
      ready();
    } else {
      setStatus('Access denied.', true);
    }
  } catch (e) {
    setStatus('Open the wall to reconnect the folder.', true);
  }
});

async function capture() {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 92 });
  blob = await (await fetch(dataUrl)).blob();
  const bmp = await createImageBitmap(blob);
  dims = { width: bmp.width, height: bmp.height };
  bmp.close();
  const img = $('preview');
  img.src = dataUrl;
  img.style.display = 'block';
  $('shotPlaceholder').style.display = 'none';
}

async function init() {
  $('pageTitle').textContent = '';
  try {
    await capture();
    $('pageTitle').textContent = tab.title || tab.url;
    try { $('pageHost').textContent = new URL(tab.url).host; } catch (_) {}
  } catch (e) {
    $('shotPlaceholder').textContent = 'Can’t capture this page';
    setStatus('Chrome blocks screenshots on this kind of page.', true);
    return;
  }

  dir = await getDir();
  if (!dir) {
    setStatus('No folder yet. Open the wall to choose one.', true);
    return;
  }
  if (!(await ensurePermission(dir))) {
    $('setup').hidden = false;
    setStatus('Folder access needs to be re-allowed.');
    return;
  }
  ready();
}

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  saveBtn.disabled = true;
  noteEl.disabled = true;
  setStatus('Saving…');
  try {
    await saveReference(dir, {
      blob,
      url: tab.url,
      title: tab.title || tab.url,
      raw: noteEl.value,
      ...dims,
    });
    setStatus('Saved ✓');
    setTimeout(() => window.close(), 500);
  } catch (err) {
    setStatus(`Save failed: ${err.message}`, true);
    ready();
  }
});

init();
