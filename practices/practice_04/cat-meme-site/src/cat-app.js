import { STORAGE_KEY, restoreCards, validateCard } from './card-validation.mjs';

const starterCards = [
  ['Созвон мог быть письмом', 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=900&q=82', 'Серый кот внимательно смотрит прямо в камеру'],
  ['Тесты зелёные. Подозрительно.', 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=82', 'Полосатый кот лежит и настороженно смотрит вверх'],
  ['Пять минут до дедлайна', 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=900&q=82', 'Светлый кот сидит на полу с очень серьёзным видом'],
  ['Я только поправил отступ', 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=900&q=82', 'Кот в круглых очках смотрит как опытный разработчик'],
  ['Ревью в пятницу вечером', 'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?auto=format&fit=crop&w=900&q=82', 'Рыжий кот выглядывает из зелёной травы'],
  ['Fallback тоже проверен', 'https://example.invalid/missing-cat.jpg', 'Кот должен был появиться здесь, но изображение не загрузилось'],
].map(([title, imageUrl, altText], index) => ({ id: `starter-${index}`, title, imageUrl, altText }));

const grid = document.querySelector('#cat-grid');
const form = document.querySelector('#cat-form');
const count = document.querySelector('#card-count');
const status = document.querySelector('#cat-status');
let userCards = restoreCards(localStorage.getItem(STORAGE_KEY));

function fallback(altText) {
  const element = document.createElement('div');
  element.className = 'cat-fallback';
  element.setAttribute('role', 'img');
  element.setAttribute('aria-label', altText);
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '↯';
  const label = document.createElement('span');
  label.textContent = 'Кот временно недоступен';
  element.append(icon, label);
  return element;
}

function cardElement(card, index) {
  const article = document.createElement('article');
  article.className = 'cat-card';
  const media = document.createElement('div');
  media.className = 'cat-media';
  const image = document.createElement('img');
  image.src = card.imageUrl;
  image.alt = card.altText;
  image.loading = index > 2 ? 'lazy' : 'eager';
  image.addEventListener('error', () => media.replaceChildren(fallback(card.altText)), { once: true });
  const body = document.createElement('div');
  body.className = 'cat-card-body';
  const label = document.createElement('span');
  label.textContent = card.isUserCard ? 'Добавлено вами' : `Мем ${String(index + 1).padStart(2, '0')}`;
  const heading = document.createElement('h3');
  heading.textContent = card.title;
  media.append(image);
  body.append(label, heading);
  article.append(media, body);
  return article;
}

function render() {
  const cards = [...userCards, ...starterCards];
  grid.replaceChildren(...cards.map(cardElement));
  count.textContent = `${cards.length} карточек`;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const result = validateCard(Object.fromEntries(new FormData(form)));
  for (const name of ['title', 'imageUrl', 'altText']) {
    const field = form.elements.namedItem(name);
    const message = result.ok ? '' : result.errors[name] ?? '';
    field.setAttribute('aria-invalid', String(Boolean(message)));
    form.querySelector(`[data-error="${name}"]`).textContent = message;
  }
  if (!result.ok) {
    status.textContent = 'Проверьте отмеченные поля.';
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  const card = { id: crypto.randomUUID?.() ?? `cat-${Date.now()}`, ...result.card, isUserCard: true };
  userCards = [card, ...userCards].slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userCards));
  form.reset();
  status.textContent = `Карточка «${card.title}» добавлена.`;
  render();
  grid.querySelector('.cat-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

form.addEventListener('input', (event) => {
  if (!event.target.name) return;
  event.target.setAttribute('aria-invalid', 'false');
  form.querySelector(`[data-error="${event.target.name}"]`).textContent = '';
  status.textContent = '';
});

render();
