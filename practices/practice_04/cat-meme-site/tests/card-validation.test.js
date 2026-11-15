import { describe, expect, it } from 'vitest';
import { restoreCards, validateCard } from '../src/card-validation.mjs';

const validCard = {
  title: 'Кот и тесты',
  imageUrl: 'https://example.com/cat.jpg',
  altText: 'Серый кот сидит перед монитором',
};

describe('validateCard', () => {
  it('normalizes a valid card', () => {
    expect(validateCard({ ...validCard, title: '  Кот и тесты  ' })).toEqual({ ok: true, card: validCard });
  });

  it.each(['javascript:alert(1)', 'data:text/html,bad', '/relative/cat.jpg'])('rejects unsafe or non-absolute URL: %s', (imageUrl) => {
    const result = validateCard({ ...validCard, imageUrl });
    expect(result.ok).toBe(false);
    expect(result.errors.imageUrl).toBeTruthy();
  });

  it('returns field-level errors for empty input', () => {
    const result = validateCard({});
    expect(result.ok).toBe(false);
    expect(Object.keys(result.errors)).toEqual(['title', 'imageUrl', 'altText']);
  });
});

describe('restoreCards', () => {
  it('recovers valid persisted cards and ignores invalid entries', () => {
    const restored = restoreCards(JSON.stringify([
      { id: 'safe', ...validCard },
      { id: 'bad', ...validCard, imageUrl: 'javascript:alert(1)' },
    ]));
    expect(restored).toHaveLength(1);
    expect(restored[0]).toMatchObject({ id: 'safe', isUserCard: true, ...validCard });
  });

  it('does not crash on corrupted localStorage data', () => {
    expect(restoreCards('{broken-json')).toEqual([]);
  });
});
