import { describe, it, expect, beforeEach, vi } from 'vitest';
/* @vitest-environment jsdom */

// Simulate DOM environment by importing the app after setting up document
function setupDom(html) {
  document.body.innerHTML = html;
}

const baseHtml = `
  <section class="cat-section" id="catalog" aria-labelledby="catalog-title">
    <div class="cat-section-head"><div><p class="cat-kicker">Лента</p><h2 id="catalog-title">Коты в естественной среде</h2></div><span id="card-count">6 карточек</span></div>
    <div class="cat-grid" id="cat-grid" aria-live="polite"></div>
  </section>
  <section class="cat-section add-section" id="add" aria-labelledby="add-title">
    <form id="cat-form" novalidate>
      <label>Подпись мема<input name="title" /><small data-error="title"></small></label>
      <label>URL изображения<input name="imageUrl" /><small data-error="imageUrl"></small></label>
      <label>Описание изображения<textarea name="altText"></textarea><small data-error="altText"></small></label>
      <p class="cat-status" id="cat-status" role="status" aria-live="polite"></p>
    </form>
  </section>
`;

describe('sort-cards UI behavior', () => {
  beforeEach(() => {
    // jsdom lacks scrollIntoView; stub it to prevent errors on submit
    // eslint-disable-next-line no-undef
    if (!Element.prototype.scrollIntoView) {
      // eslint-disable-next-line no-undef
      Element.prototype.scrollIntoView = () => {};
    }
    vi.resetModules();
    localStorage.clear();
    setupDom(baseHtml);
    // Import after DOM is ready
    // eslint-disable-next-line import/no-unresolved
    return import('../src/cat-app.js');
  });

  it('renders default order and adds sorting controls', async () => {
    const grid = document.querySelector('#cat-grid');
    const controls = document.querySelector('.sort-controls');
    expect(controls).toBeTruthy();
    expect(grid.children.length).toBeGreaterThanOrEqual(6);
  });

  it('enables A–Я sort and resets back to default', async () => {
    const [sortBtn, resetBtn] = document.querySelectorAll('.sort-button');
    expect(sortBtn).toBeTruthy();
    expect(resetBtn).toBeTruthy();

    const titlesBefore = Array.from(document.querySelectorAll('.cat-card h3')).map(h => h.textContent);
    sortBtn.click();
    const titlesSorted = Array.from(document.querySelectorAll('.cat-card h3')).map(h => h.textContent);
    // Sorted should be different from before for typical starter set
    expect(titlesSorted.join('|')).not.toEqual(titlesBefore.join('|'));

    resetBtn.click();
    const titlesReset = Array.from(document.querySelectorAll('.cat-card h3')).map(h => h.textContent);
    expect(titlesReset.join('|')).toEqual(titlesBefore.join('|'));
  });

  it('stable ordering when titles are equal', async () => {
    // Add two user cards with the same title
    const form = document.querySelector('#cat-form');
    const title = 'Одинаковый заголовок';

    // First card
    form.querySelector('[name="title"]').value = title;
    form.querySelector('[name="imageUrl"]').value = 'https://example.com/a.jpg';
    form.querySelector('[name="altText"]').value = 'Описание 12345678';
    form.dispatchEvent(new Event('submit'));

    // Second card
    form.querySelector('[name="title"]').value = title;
    form.querySelector('[name="imageUrl"]').value = 'https://example.com/b.jpg';
    form.querySelector('[name="altText"]').value = 'Описание 87654321';
    form.dispatchEvent(new Event('submit'));

    const [sortBtn] = document.querySelectorAll('.sort-button');
    sortBtn.click();

    const headings = Array.from(document.querySelectorAll('.cat-card h3')).map(h => h.textContent);
    // The two equal-titled user cards should preserve their mutual order
    const equalTitlePositions = headings
      .map((t, i) => [t, i])
      .filter(([t]) => t === title)
      .map(([, i]) => i);
    expect(equalTitlePositions.length).toBeGreaterThanOrEqual(2);
    expect(equalTitlePositions[0]).toBeLessThan(equalTitlePositions[1]);
  });

  it('sort mode is not persisted across reload', async () => {
    const [sortBtn] = document.querySelectorAll('.sort-button');
    const titlesBefore = Array.from(document.querySelectorAll('.cat-card h3')).map(h => h.textContent);
    sortBtn.click();
    const titlesSorted = Array.from(document.querySelectorAll('.cat-card h3')).map(h => h.textContent);
    expect(titlesSorted.join('|')).not.toEqual(titlesBefore.join('|'));

    // Simulate reload: reset modules and re-import app with fresh DOM
    // Reset modules and re-init app
    vi.resetModules();
    setupDom(baseHtml);
    await import('../src/cat-app.js');

    const titlesReload = Array.from(document.querySelectorAll('.cat-card h3')).map(h => h.textContent);
    expect(titlesReload.join('|')).toEqual(titlesBefore.join('|'));
  });
});
