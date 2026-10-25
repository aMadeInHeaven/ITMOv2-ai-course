# Tasks

## 1. UI Controls

- [x] 1.1 Add two buttons to the catalog header: "По алфавиту (А–Я)" and "Сбросить" using DOM API (no innerHTML). Verify buttons appear under "Коты в естественной среде" and are keyboard-focusable with visible outline.
- [x] 1.2 Style buttons minimally per existing design system (cat.css), maintaining contrast and focus states. Verify visual alignment does not break mobile layouts.

## 2. Sort Mode Logic

- [x] 2.1 Introduce an in-memory `sortMode` state (`default` | `alpha`) without persisting. Verify initial render is default order after reload.
- [x] 2.2 Wire button handlers: set `sortMode` to `alpha` on "А–Я" and to `default` on "Сбросить". Verify clicking each updates the view.
- [x] 2.3 Implement comparator using `Intl.Collator('ru', { sensitivity: 'base' })` with stable tie-break on base index. Verify titles with same text preserve base order.

## 3. Render Behavior

- [x] 3.1 In `render()`, build `view = [...userCards, ...starterCards]` and sort only when `sortMode === 'alpha'`. Do not mutate source arrays. Verify reset restores base order.
- [x] 3.2 Ensure numbering "Мем NN" and `img.loading` eager for first three follow current displayed order. Verify after sort and after reset.

## 4. Tests

- [x] 4.1 Add jsdom tests covering: default order, enabling А–Я sort, stable ordering on equal titles, and reset behavior. Verify `npm test` passes.
- [x] 4.2 Add a test ensuring sort mode is not persisted (reload → default). Verify by simulating a fresh app instance.
- [x] 4.3 Run `npm run check` to confirm unit tests, build, hook smoke, and MCP still pass.

## Workflow follow-up

- Archive the change after review if all checks pass.
