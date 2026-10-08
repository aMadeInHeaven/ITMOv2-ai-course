export const STORAGE_KEY = 'cat-meme-cards:v1';

export function validateCard(input = {}) {
  const errors = {};
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const imageUrl = typeof input.imageUrl === 'string' ? input.imageUrl.trim() : '';
  const altText = typeof input.altText === 'string' ? input.altText.trim() : '';

  if (title.length < 3 || title.length > 80) {
    errors.title = 'Название должно содержать от 3 до 80 символов';
  }

  if (!imageUrl) {
    errors.imageUrl = 'Укажите URL изображения';
  } else {
    try {
      const parsedUrl = new URL(imageUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        errors.imageUrl = 'Разрешены только протоколы http: и https:';
      }
    } catch {
      errors.imageUrl = 'Введите корректный абсолютный URL';
    }
  }

  if (altText.length < 8 || altText.length > 140) {
    errors.altText = 'Описание должно содержать от 8 до 140 символов';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, card: { title, imageUrl, altText } };
}

export function restoreCards(serialized) {
  if (!serialized) return [];

  try {
    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) return [];

    return parsed.slice(0, 50).flatMap((candidate, index) => {
      const result = validateCard(candidate);
      if (!result.ok) return [];
      return [{
        id: typeof candidate.id === 'string' ? candidate.id : `restored-${index}`,
        ...result.card,
        isUserCard: true,
      }];
    });
  } catch {
    return [];
  }
}
