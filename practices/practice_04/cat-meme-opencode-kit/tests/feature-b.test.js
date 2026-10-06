import { describe, it, expect } from 'vitest';
import { validateCardInput } from '../src/main.js';

describe('Фича B: Добавление карточки', () => {
  it('B1: валидная карточка проходит валидацию', () => {
    const valid = {
      title: 'Кот и дедлайн',
      imageUrl: 'https://example.com/cat.jpg',
      altText: 'Удивленный кот смотрит в ноутбук'
    };
    const res = validateCardInput(valid);
    expect(res.ok).toBe(true);
    expect(res.data.title).toBe('Кот и дедлайн');
  });

  it('B3: пустые поля и javascript: URL отклоняются', () => {
    const invalid = {
      title: 'К',
      imageUrl: 'javascript:alert(1)',
      altText: 'кот'
    };
    const res = validateCardInput(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors.title).toBeDefined();
    expect(res.errors.imageUrl).toBeDefined();
    expect(res.errors.altText).toBeDefined();
  });
});
