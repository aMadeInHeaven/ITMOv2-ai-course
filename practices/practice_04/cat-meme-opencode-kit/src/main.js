import { initialCards } from './cards.js';

export const STORAGE_KEY = 'cat-meme-cards:v1';

export function loadUserCards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUserCard(card) {
  try {
    const current = loadUserCards();
    // Защита от дубликатов
    if (current.some(c => c.imageUrl === card.imageUrl && c.title === card.title)) {
      return false;
    }
    current.unshift(card);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return true;
  } catch {
    return false;
  }
}

export function validateCardInput(data) {
  const errors = {};
  const title = (data.title || '').trim();
  const imageUrl = (data.imageUrl || '').trim();
  const altText = (data.altText || '').trim();

  if (title.length < 3 || title.length > 80) {
    errors.title = 'Название должно быть от 3 до 80 символов';
  }

  if (!imageUrl) {
    errors.imageUrl = 'Укажите URL изображения';
  } else {
    try {
      const parsed = new URL(imageUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        errors.imageUrl = 'Разрешены только протоколы http: и https:';
      }
    } catch {
      errors.imageUrl = 'Некорректный абсолютный URL';
    }
  }

  if (altText.length < 8 || altText.length > 140) {
    errors.altText = 'Описание (alt) должно быть от 8 до 140 символов';
  }

  return { ok: Object.keys(errors).length === 0, errors, data: { title, imageUrl, altText } };
}

export function createCardEl(card) {
  const li = document.createElement('li');
  const article = document.createElement('article');
  article.className = 'card';
  if (card.id) article.setAttribute('data-id', card.id);

  const figure = document.createElement('figure');
  figure.className = 'card__media';

  const img = document.createElement('img');
  img.className = 'card__image';
  img.src = card.imageUrl;
  img.alt = card.altText;

  img.addEventListener('error', () => {
    figure.textContent = '';
    const ph = document.createElement('div');
    ph.className = 'img-placeholder';
    ph.setAttribute('role', 'img');
    ph.setAttribute('aria-label', 'Изображение недоступно');
    const icon = document.createElement('div');
    icon.className = 'img-placeholder__icon';
    ph.appendChild(icon);
    figure.appendChild(ph);
  }, { once: true });

  figure.appendChild(img);

  const body = document.createElement('div');
  body.className = 'card__body';

  const title = document.createElement('h3');
  title.className = 'card__title';
  title.textContent = card.title;

  body.appendChild(title);
  article.append(figure, body);
  li.appendChild(article);
  return li;
}

export function renderCards() {
  const list = document.getElementById('card-list');
  if (!list) return;
  list.textContent = '';

  const userCards = loadUserCards();
  const allCards = [...userCards, ...initialCards];

  const frag = document.createDocumentFragment();
  allCards.forEach(card => frag.appendChild(createCardEl(card)));
  list.appendChild(frag);
}

export function setupAddCardFeature() {
  const form = document.getElementById('add-card-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Очищаем предыдущие ошибки
    document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');

    const formData = {
      title: form.querySelector('#card-title')?.value || '',
      imageUrl: form.querySelector('#card-url')?.value || '',
      altText: form.querySelector('#card-alt')?.value || ''
    };

    const validation = validateCardInput(formData);

    if (!validation.ok) {
      let firstErrorField = null;
      for (const [field, msg] of Object.entries(validation.errors)) {
        const errorEl = document.getElementById(`error-${field}`);
        if (errorEl) errorEl.textContent = msg;
        if (!firstErrorField) {
          firstErrorField = form.querySelector(`[name="${field}"]`);
        }
      }
      if (firstErrorField) firstErrorField.focus();
      return;
    }

    const newCard = {
      id: 'user-' + Date.now(),
      title: validation.data.title,
      imageUrl: validation.data.imageUrl,
      altText: validation.data.altText
    };

    saveUserCard(newCard);

    // Добавляем карточку первой в список без перезагрузки
    const list = document.getElementById('card-list');
    if (list) {
      list.insertBefore(createCardEl(newCard), list.firstChild);
    }

    form.reset();
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      renderCards();
      setupAddCardFeature();
    });
  } else {
    renderCards();
    setupAddCardFeature();
  }
}
