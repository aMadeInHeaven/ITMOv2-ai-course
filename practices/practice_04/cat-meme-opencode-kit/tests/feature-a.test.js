import { describe, it, expect } from 'vitest';

describe('Фича A: Каталог карточек', () => {
  it('A1: должен экспортировать минимум 6 стартовых карточек', async () => {
    // Импортируем модуль карточек (он пока не написан, тест упадет)
    const { initialCards } = await import('../src/cards.js');
    
    expect(initialCards).toBeDefined();
    expect(Array.isArray(initialCards)).toBe(true);
    expect(initialCards.length).toBeGreaterThanOrEqual(6);

    // Проверяем структуру каждой карточки
    initialCards.forEach(card => {
      expect(card.id).toBeDefined();
      expect(typeof card.title).toBe('string');
      expect(card.title.length).toBeGreaterThanOrEqual(3);
      expect(typeof card.imageUrl).toBe('string');
      expect(card.imageUrl).toMatch(/^https?:\/\//);
      expect(typeof card.altText).toBe('string');
      expect(card.altText.length).toBeGreaterThanOrEqual(8);
    });
  });
});
