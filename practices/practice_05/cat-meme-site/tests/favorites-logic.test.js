import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';

let isFavorite, toggleFavorite, getFavoriteIds, getFavoritesCount;

beforeAll(async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.localStorage = dom.window.localStorage;
  const api = await import('../src/favorites.mjs');
  isFavorite = api.isFavorite;
  toggleFavorite = api.toggleFavorite;
  getFavoriteIds = api.getFavoriteIds;
  getFavoritesCount = api.getFavoritesCount;
});

// Helper to stub storage quota error (always throw)
function causeQuotaErrorAlways() {
  const original = window.Storage.prototype.setItem;
  window.Storage.prototype.setItem = function(key, value) {
    const err = new Error('QuotaExceededError');
    err.name = 'QuotaExceededError';
    throw err;
  };
  return () => { window.Storage.prototype.setItem = original; };
}

describe('favorites logic', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // ensure module picks up fresh state via storage event
    const ev = new window.Event('storage');
    ev.key = 'cat-meme-favorites:v1';
    ev.newValue = null;
    window.dispatchEvent(ev);
  });

  it('initially has no favorites', () => {
    expect(getFavoriteIds()).toEqual([]);
    expect(getFavoritesCount()).toBe(0);
    expect(isFavorite('cat1')).toBe(false);
  });

  it('validates id format', () => {
    const res = toggleFavorite('invalid id!');
    expect(res).toEqual({ ok: false, isFavorite: false, error: 'invalid_id' });
  });

  it('toggles add/remove and persists', () => {
    let r = toggleFavorite('cat-1');
    expect(r).toEqual({ ok: true, isFavorite: true });
    expect(isFavorite('cat-1')).toBe(true);
    expect(getFavoritesCount()).toBe(1);
    expect(getFavoriteIds()).toEqual(['cat-1']);

    r = toggleFavorite('cat-1');
    expect(r).toEqual({ ok: true, isFavorite: false });
    expect(isFavorite('cat-1')).toBe(false);
    expect(getFavoritesCount()).toBe(0);
    expect(getFavoriteIds()).toEqual([]);
  });

  it('enforces limit of 50', () => {
    for (let i = 0; i < 50; i++) {
      const id = `c${i}`;
      const res = toggleFavorite(id);
      expect(res.ok).toBe(true);
    }
    const over = toggleFavorite('overflow');
    expect(over).toEqual({ ok: false, isFavorite: false, error: 'limit_exceeded' });
    expect(getFavoritesCount()).toBe(50);
  });

  it('handles QuotaExceededError with rollback', () => {
    const restore = causeQuotaErrorAlways();
    const res = toggleFavorite('cat-2');
    restore();
    expect(res).toEqual({ ok: false, isFavorite: false, error: 'storage_quota_exceeded' });
    expect(isFavorite('cat-2')).toBe(false);
    expect(getFavoriteIds()).toEqual([]);
  });

  it('emits favorites:changed event on successful toggle', async () => {
    const events = [];
    const handler = (ev) => events.push(ev.detail.ids);
    window.addEventListener('favorites:changed', handler);
    try {
      const r = toggleFavorite('ev-1');
      expect(r).toEqual({ ok: true, isFavorite: true });
      expect(events.at(-1)).toEqual(['ev-1']);
      const r2 = toggleFavorite('ev-1');
      expect(r2).toEqual({ ok: true, isFavorite: false });
      expect(events.at(-1)).toEqual([]);
    } finally {
      window.removeEventListener('favorites:changed', handler);
    }
  });

  it('recovers from corrupted storage and emits change', () => {
    window.localStorage.setItem('cat-meme-favorites:v1', '{broken');
    // importing module already ran init, but our test relies on storage event
    // Simulate a storage event
    const ev = new window.Event('storage');
    ev.key = 'cat-meme-favorites:v1';
    ev.newValue = '{broken';
    const events = [];
    const handler = (e) => events.push(e.detail.ids);
    window.addEventListener('favorites:changed', handler);
    try {
      window.dispatchEvent(ev);
      expect(getFavoriteIds()).toEqual([]);
      expect(events.at(-1)).toEqual([]);
    } finally {
      window.removeEventListener('favorites:changed', handler);
    }
  });
});
