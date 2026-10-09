import { getDir, setDir, ensurePermission, readIndex, deleteReference, loadImageUrl } from './shared.js';

const $ = (id) => document.getElementById(id);
const wallEl = $('wall');
const emptyEl = $('empty');

let dir = null;
let items = [];
let activeTags = new Set();
let query = '';
let current = null;

const imgObserver = new IntersectionObserver((entries) => {
  for (const en of entries) {
    if (!en.isIntersecting) continue;
    imgObserver.unobserve(en.target);
    const img = en.target;
    loadImageUrl(dir, img.dataset.path).then((u) => { img.src = u; }).catch(() => { img.alt = 'Image missing'; });
  }
}, { rootMargin: '600px' });

function host(url) { try { return new URL(url).host; } catch (_) { return url; } }

function matches(e) {
  if (activeTags.size && ![...activeTags].every((t) => e.tags.includes(t))) return false;
  if (!query) return true;
  const hay = `${e.title} ${e.note} ${e.url} ${e.tags.join(' ')}`.toLowerCase();
  return query.split(/\s+/).every((w) => hay.includes(w));
}

function renderTags() {
  const counts = new Map();
  for (const e of items) for (const t of e.tags) counts.set(t, (counts.get(t) || 0) + 1);
  const box = $('tags');
  box.replaceChildren();
  [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).forEach(([t, n]) => {
    const b = document.createElement('button');
    b.className = 'chip' + (activeTags.has(t) ? ' on' : '');
    b.type = 'button';
    b.setAttribute('aria-pressed', activeTags.has(t));
    b.textContent = `#${t}`;
    const s = document.createElement('small');
    s.textContent = n;
    b.append(s);
    b.addEventListener('click', () => {
      activeTags.has(t) ? activeTags.delete(t) : activeTags.add(t);
      renderTags();
      renderWall();
    });
    box.append(b);
  });
}

function renderWall() {
  imgObserver.disconnect();
  wallEl.replaceChildren();
  const shown = items.filter(matches);
  $('count').textContent = items.length ? `${shown.length} of ${items.length}` : '';
  emptyEl.hidden = shown.length > 0;
  if (!shown.length) emptyEl.textContent = items.length ? 'No matches.' : 'Nothing saved yet. Use the toolbar button on any page.';

  for (const e of shown) {
    const card = document.createElement('article');
    card.className = 'card';

    const btn = document.createElement('button');
    btn.className = 'img';
    btn.type = 'button';
    btn.setAttribute('aria-label', `View ${e.title}`);
    if (e.width && e.height) btn.style.aspectRatio = `${e.width} / ${e.height}`;
    const img = document.createElement('img');
    img.alt = e.title;
    img.dataset.path = e.image;
    btn.append(img);
    btn.addEventListener('click', () => openLightbox(e));

    const body = document.createElement('div');
    body.className = 'body';
    const a = document.createElement('a');
    a.className = 't';
    a.href = e.url; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = e.title;
    body.append(a);
    if (e.note) { const n = document.createElement('div'); n.className = 'n'; n.textContent = e.note; body.append(n); }
    const h = document.createElement('div'); h.className = 'h'; h.textContent = host(e.url); body.append(h);
    if (e.tags.length) {
      const tg = document.createElement('div'); tg.className = 'tg';
      e.tags.forEach((t) => { const s = document.createElement('span'); s.textContent = `#${t}`; tg.append(s); });
      body.append(tg);
    }
    card.append(btn, body);
    wallEl.append(card);
    imgObserver.observe(img);
  }
}

async function openLightbox(e) {
  current = e;
  $('lbImg').src = await loadImageUrl(dir, e.image);
  const t = $('lbTitle');
  t.textContent = e.title; t.href = e.url;
  $('lbNote').textContent = e.note;
  $('lbMeta').textContent = `${host(e.url)} · ${new Date(e.savedAt).toLocaleDateString()}${e.tags.length ? ' · ' + e.tags.map((x) => '#' + x).join(' ') : ''}`;
  $('lightbox').hidden = false;
}
function closeLightbox() { $('lightbox').hidden = true; current = null; }

$('lightbox').addEventListener('click', (ev) => { if (ev.target === $('lightbox')) closeLightbox(); });
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeLightbox(); });
$('lbDelete').addEventListener('click', async () => {
  if (!current || !confirm('Delete this reference and its image?')) return;
  await deleteReference(dir, current.id);
  closeLightbox();
  await load();
});

$('search').addEventListener('input', (ev) => { query = ev.target.value.trim().toLowerCase(); renderWall(); });

$('folderBtn').addEventListener('click', async () => {
  if (dir && $('folderBtn').textContent === 'Reconnect folder') {
    if (await ensurePermission(dir, true).catch(() => false)) return load();
  }
  try {
    const handle = await showDirectoryPicker({ id: 'inspiration', mode: 'readwrite' });
    await setDir(handle);
    dir = handle;
    await load();
  } catch (e) { /* picker cancelled */ }
});

const themes = ['', 'light', 'dark'];
$('themeBtn').addEventListener('click', () => {
  const cur = document.documentElement.dataset.theme || '';
  const next = themes[(themes.indexOf(cur) + 1) % themes.length];
  if (next) document.documentElement.dataset.theme = next; else delete document.documentElement.dataset.theme;
  try { next ? localStorage.setItem('theme', next) : localStorage.removeItem('theme'); } catch (_) {}
  $('themeBtn').title = `Theme: ${next || 'system'}`;
});

async function load() {
  if (!dir) {
    emptyEl.hidden = false;
    emptyEl.textContent = 'Choose the folder where your references are (or will be) stored.';
    $('folderBtn').textContent = 'Choose folder';
    return;
  }
  if (!(await ensurePermission(dir))) {
    emptyEl.hidden = false;
    emptyEl.textContent = 'Chrome needs you to re-allow access to your folder.';
    $('folderBtn').textContent = 'Reconnect folder';
    return;
  }
  $('folderBtn').textContent = 'Change folder';
  items = (await readIndex(dir)).map((e) => ({ ...e, tags: e.tags || [], note: e.note || '' }));
  activeTags = new Set([...activeTags].filter((t) => items.some((e) => e.tags.includes(t))));
  renderTags();
  renderWall();
}

(async () => {
  dir = await getDir();
  await load();
})();
