# 02. Общий контракт взаимодействия (UI <-> Logic)

## 1. Концепция
Модуль логики `src/favorites.mjs` отвечает исключительно за хранение и проверку ID избранных карточек.
Управление массивом всех карточек и фильтрация каталога остаются в `src/cat-app.js`.

## 2. Формат данных
- ID карточки: `string` (длина 1–64 символа, буквы/цифры/дефис/подчеркивание).
- Хранилище: `localStorage`, ключ `cat-meme-favorites:v1`.
- Структура в storage: JSON-массив строк `string[]`.

## 3. Публичный API модуля `favoritesStore`
Экспортируется синглтон `favoritesStore` (или фабрика):
- `isFavorite(id: string): boolean` — проверка наличия в избранном за O(1).
- `toggleFavorite(id: string): { ok: boolean, isFavorite: boolean, error?: string }` — переключение лайка.
- `getFavoriteIds(): string[]` — получение копии массива всех лайкнутых ID.
- `getFavoritesCount(): number` — количество лайкнутых карточек.

## 4. События и ошибки
- Изменение состава: `window.dispatchEvent(new CustomEvent('favorites:changed', { detail: { ids: string[] } }))`.
- Ошибки: при `QuotaExceededError` метод `toggleFavorite` возвращает `{ ok: false, isFavorite: false, error: 'storage_quota_exceeded' }` и эмитит `favorites:error`.
- UI слушает нативное событие `window.addEventListener('favorites:changed', ...)`.