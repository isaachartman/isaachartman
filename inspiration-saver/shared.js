// Shared by popup and wall: folder handle persistence + read/write of the library.
const DB_NAME = 'inspiration-saver';
const STORE = 'kv';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export const getDir = () => idbGet('dir');
export const setDir = (handle) => idbSet('dir', handle);

// Returns true when readwrite access is granted. With ask=true this must run inside a user gesture.
export async function ensurePermission(handle, ask = false) {
  const opts = { mode: 'readwrite' };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  if (!ask) return false;
  return (await handle.requestPermission(opts)) === 'granted';
}

export async function readIndex(dir) {
  try {
    const fh = await dir.getFileHandle('references.json');
    const text = await (await fh.getFile()).text();
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    if (e.name === 'NotFoundError') return [];
    throw e;
  }
}

export async function writeIndex(dir, list) {
  const fh = await dir.getFileHandle('references.json', { create: true });
  const w = await fh.createWritable();
  await w.write(JSON.stringify(list, null, 2));
  await w.close();
}

// "moody serif hero #typography #Dark" -> { note: "moody serif hero", tags: ["typography","dark"] }
export function parseNote(raw) {
  const re = /#([\p{L}\p{N}_-]+)/gu;
  const tags = [...new Set([...raw.matchAll(re)].map((m) => m[1].toLowerCase()))];
  const note = raw.replace(re, '').replace(/\s+/g, ' ').trim();
  return { note, tags };
}

export async function saveReference(dir, { blob, url, title, raw, width, height }) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const imageName = `${id}.jpg`;
  const imagesDir = await dir.getDirectoryHandle('images', { create: true });
  const imgHandle = await imagesDir.getFileHandle(imageName, { create: true });
  const w = await imgHandle.createWritable();
  await w.write(blob);
  await w.close();

  const { note, tags } = parseNote(raw);
  const entry = {
    id,
    url,
    title,
    note,
    tags,
    image: `images/${imageName}`,
    width,
    height,
    savedAt: new Date().toISOString(),
  };
  const list = await readIndex(dir);
  list.unshift(entry);
  await writeIndex(dir, list);
  return entry;
}

export async function deleteReference(dir, id) {
  const list = await readIndex(dir);
  const entry = list.find((e) => e.id === id);
  await writeIndex(dir, list.filter((e) => e.id !== id));
  if (entry) {
    try {
      const imagesDir = await dir.getDirectoryHandle('images');
      await imagesDir.removeEntry(entry.image.split('/').pop());
    } catch (_) { /* image already gone */ }
  }
}

export async function loadImageUrl(dir, imagePath) {
  const imagesDir = await dir.getDirectoryHandle('images');
  const fh = await imagesDir.getFileHandle(imagePath.split('/').pop());
  return URL.createObjectURL(await fh.getFile());
}
