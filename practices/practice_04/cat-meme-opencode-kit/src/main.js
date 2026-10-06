import { initialCards } from './cards.js';

/**
 * Create a card article element for a cat card.
 * Uses safe DOM APIs, no innerHTML for user text.
 */
function createCardEl(card) {
  const li = document.createElement('li');

  const article = document.createElement('article');
  article.className = 'card';
  article.setAttribute('data-id', card.id);

  const figure = document.createElement('figure');
  figure.className = 'card__media';

  const img = document.createElement('img');
  img.className = 'card__image';
  img.src = card.imageUrl;
  img.alt = card.altText; // alt comes from curated initial data

  // On error, replace the broken image with a placeholder element
  img.addEventListener('error', () => {
    // remove broken img to avoid broken icon
    figure.innerHTML = '';
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

function renderInitialCards() {
  const list = document.getElementById('card-list');
  if (!list) return;
  const frag = document.createDocumentFragment();
  initialCards.forEach((card) => {
    frag.appendChild(createCardEl(card));
  });
  list.appendChild(frag);
}

// Render on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderInitialCards, { once: true });
} else {
  renderInitialCards();
}
