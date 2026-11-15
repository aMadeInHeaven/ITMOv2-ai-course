import { STORAGE_KEY, restoreCards, validateCard } from './card-validation.mjs';
import { isFavorite, toggleFavorite, getFavoriteIds, getFavoritesCount } from './favorites.mjs';

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
const catalogHead = document.querySelector('#catalog .cat-section-head');
let sortMode = 'default'; // 'default' | 'alpha'
const collator = new Intl.Collator('ru', { sensitivity: 'base' });
let userCards = restoreCards(localStorage.getItem(STORAGE_KEY));
let favoritesFilterOn = false;
// References to filter toggle in catalog head
let favoritesToggle;
let favoritesToggleState;

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
  // Favorite (like) button
  const favBtn = document.createElement('button');
  favBtn.type = 'button';
  favBtn.className = 'favorite-button';
  favBtn.setAttribute('aria-pressed', String(isFavorite(card.id)));
  favBtn.dataset.cardId = card.id;
  // Heart symbol + accessible text
  const heart = document.createElement('span');
  heart.setAttribute('aria-hidden', 'true');
  heart.className = 'favorite-icon';
  heart.textContent = '❤';
  const text = document.createElement('span');
  text.className = 'visually-hidden';
  text.textContent = isFavorite(card.id) ? 'Убрать из избранных' : 'Добавить в избранные';
  favBtn.append(heart, text);
  const inlineAlert = document.createElement('div');
  inlineAlert.className = 'favorite-error';
  inlineAlert.setAttribute('role', 'alert');
  inlineAlert.textContent = '';
  favBtn.addEventListener('click', () => {
    const id = favBtn.dataset.cardId;
    const result = toggleFavorite(id);
    if (result.ok) {
      favBtn.setAttribute('aria-pressed', String(result.isFavorite));
      text.textContent = result.isFavorite ? 'Убрать из избранных' : 'Добавить в избранные';
      inlineAlert.textContent = '';
      // Rendering will be handled by favorites:changed event as well
    } else {
      // keep previous visual state, show error
      inlineAlert.textContent = 'Не удалось сохранить лайк. Попробуйте ещё раз.';
    }
  });
  const body = document.createElement('div');
  body.className = 'cat-card-body';
  const label = document.createElement('span');
  label.textContent = card.isUserCard ? 'Добавлено вами' : `Мем ${String(index + 1).padStart(2, '0')}`;
  const heading = document.createElement('h3');
  heading.textContent = card.title;
  media.append(image, favBtn);
  body.append(label, heading, inlineAlert);
  article.append(media, body);
  return article;
}

function emptyStateElement() {
  const region = document.createElement('div');
  region.className = 'empty-state';
  region.setAttribute('role', 'region');
  region.setAttribute('aria-labelledby', 'empty-state-title');
  const title = document.createElement('h3');
  title.id = 'empty-state-title';
  title.textContent = 'Ещё нет избранных котиков';
  const desc = document.createElement('p');
  desc.textContent = 'Поставьте сердечко на понравившейся карточке — и она появится здесь';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'empty-state-reset';
  btn.textContent = 'Снять фильтр';
  btn.addEventListener('click', () => {
    favoritesFilterOn = false;
    favoritesToggle?.setAttribute('aria-pressed', 'false');
    favoritesToggleState.textContent = 'Выключен';
    render();
  });
  region.append(title, desc, btn);
  return region;
}

function render() {
  // Build base view: user cards first (newest first), then starter cards
  const baseView = [...userCards, ...starterCards];
  let view = baseView;
  if (sortMode === 'alpha') {
    // Stable, locale-aware alpha sort by title (ru), case-insensitive.
    // Tie-breaker: original base order.
    const baseIndex = new Map(baseView.map((c, i) => [c.id, i]));
    view = [...baseView].sort((a, b) => {
      const byTitle = collator.compare(a.title, b.title);
      if (byTitle !== 0) return byTitle;
      return (baseIndex.get(a.id) ?? 0) - (baseIndex.get(b.id) ?? 0);
    });
  }
  if (favoritesFilterOn) {
    const favIds = new Set(getFavoriteIds());
    view = view.filter(c => favIds.has(c.id));
  }
  if (favoritesFilterOn && getFavoritesCount() === 0) {
    grid.replaceChildren(emptyStateElement());
    count.textContent = `0 карточек`;
  } else {
    grid.replaceChildren(...view.map(cardElement));
    count.textContent = `${view.length} карточек`;
  }
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

// Sorting controls: create via DOM API, no innerHTML
if (catalogHead) {
  const controls = document.createElement('div');
  controls.className = 'sort-controls';
  // Favorites filter toggle
  const favoritesToggle = document.createElement('button');
  favoritesToggle.type = 'button';
  favoritesToggle.className = 'favorites-toggle';
  favoritesToggle.setAttribute('aria-pressed', 'false');
  const favoritesToggleLabel = document.createElement('span');
  favoritesToggleLabel.textContent = 'Только избранные';
  const favoritesToggleState = document.createElement('span');
  favoritesToggleState.className = 'favorites-toggle-state';
  favoritesToggleState.textContent = 'Выключен';
  favoritesToggle.append(favoritesToggleLabel, favoritesToggleState);
  favoritesToggle.addEventListener('click', () => {
    const pressed = favoritesToggle.getAttribute('aria-pressed') === 'true';
    favoritesToggle.setAttribute('aria-pressed', String(!pressed));
    favoritesToggleState.textContent = !pressed ? 'Включён' : 'Выключен';
    favoritesFilterOn = !pressed;
    render();
  });
  const sortBtn = document.createElement('button');
  sortBtn.type = 'button';
  sortBtn.className = 'sort-button';
  sortBtn.textContent = 'По алфавиту (А–Я)';
  sortBtn.addEventListener('click', () => { sortMode = 'alpha'; render(); });
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'sort-button';
  resetBtn.textContent = 'Сбросить';
  resetBtn.addEventListener('click', () => { sortMode = 'default'; render(); });
  controls.append(favoritesToggle, sortBtn, resetBtn);
  catalogHead.append(controls);
}

// Subscribe to favorites changes
window.addEventListener('favorites:changed', () => {
  render();
});
