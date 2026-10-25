// Favorites logic module per agreed spec
// Public API: isFavorite, toggleFavorite, getFavoriteIds, getFavoritesCount

const KEY = 'cat-meme-favorites:v1';
const MAX = 50;
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

let favoritesSet = new Set();

function validateId(id) {
  return typeof id === 'string' && ID_RE.test(id);
}

function emitChanged(ids) {
  try {
    const CE = typeof window !== 'undefined' && window.CustomEvent ? window.CustomEvent : CustomEvent;
    const ev = new CE('favorites:changed', { detail: { ids } });
    window.dispatchEvent(ev);
  } catch (_) {
    // In non-DOM environments, ignore dispatch errors
  }
}

function readFromStorage() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw == null) return null; // No value yet
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return 'corrupted';
    // Ensure all items are valid IDs and unique
    const unique = new Set();
    for (const v of parsed) {
      if (typeof v !== 'string' || !validateId(v)) return 'corrupted';
      if (unique.has(v)) return 'corrupted';
      unique.add(v);
      if (unique.size > MAX) {
        // Stored data exceeds limit — treat as corrupted to recover safely
        return 'corrupted';
      }
    }
    return Array.from(unique);
  } catch (_) {
    return 'corrupted';
  }
}

function writeToStorage(ids) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
    return { ok: true };
  } catch (e) {
    if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
      return { ok: false, error: 'storage_quota_exceeded' };
    }
    return { ok: false, error: 'storage_write_failed' };
  }
}

function init() {
  const state = readFromStorage();
  if (state === null) {
    favoritesSet = new Set();
    return;
  }
  if (state === 'corrupted') {
    favoritesSet = new Set();
    const write = writeToStorage([]);
    // Regardless of write outcome, emit change to allow UI to sync to empty
    emitChanged([]);
    return;
  }
  favoritesSet = new Set(state);
}

init();

// Cross-tab synchronization
try {
  window.addEventListener('storage', (ev) => {
    if (ev.key !== KEY) return;
    const state = readFromStorage();
    const next = state && state !== 'corrupted' ? state : [];
    favoritesSet = new Set(next);
    emitChanged(next);
  });
} catch (_) {
  // Non-browser environment; no-op
}

export function isFavorite(id) {
  if (!validateId(id)) return false;
  return favoritesSet.has(id);
}

export function toggleFavorite(id) {
  if (!validateId(id)) {
    return { ok: false, isFavorite: false, error: 'invalid_id' };
  }
  const current = favoritesSet.has(id);
  let nextIds;
  if (current) {
    nextIds = Array.from(favoritesSet).filter((x) => x !== id);
  } else {
    if (favoritesSet.size >= MAX) {
      return { ok: false, isFavorite: false, error: 'limit_exceeded' };
    }
    nextIds = [...favoritesSet, id];
  }

  const write = writeToStorage(nextIds);
  if (!write.ok) {
    if (write.error === 'storage_quota_exceeded') {
      return { ok: false, isFavorite: false, error: 'storage_quota_exceeded' };
    }
    return { ok: false, isFavorite: false, error: 'storage_write_failed' };
  }

  favoritesSet = new Set(nextIds);
  emitChanged(nextIds);
  return { ok: true, isFavorite: !current };
}

export function getFavoriteIds() {
  return Array.from(favoritesSet);
}

export function getFavoritesCount() {
  return favoritesSet.size;
}
