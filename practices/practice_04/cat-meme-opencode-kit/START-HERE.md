# Комплект OpenCode для проекта «Котомемы»

Комплект следует маршруту презентации: правила проекта, skill, Playwright MCP, две небольшие фичи, style guide, hook, отдельная работа над B и собственный MCP.

## 1. Подготовка

Скопируйте содержимое этой папки в корень Git-проекта. Предполагается Node.js 18+ и OpenCode 2.0.20. Если проект ещё не создан, сначала создайте Vite-проект на vanilla JavaScript, затем верните эти файлы в его корень.

В PowerShell:

```powershell
node --version
opencode --version
npm install
Set-Location .opencode
npm install
Set-Location ..
node scripts/check.mjs
```

`npm install` в `.opencode` нужен локальному hook для импорта `@opencode-ai/plugin/v2`.

Убедитесь, что корневые scripts `lint`, `test` и `build` завершаются сами. Например, для Vitest используйте `"test": "vitest run"`, а не watch-режим.

## 2. Playwright MCP: настройка и первый вызов

Playwright уже добавлен в `opencode.json` как локальный MCP. OpenCode запускает `npx -y @playwright/mcp@latest --browser=chrome --isolated`. Изолированный профиль подходит для воспроизводимой проверки `localStorage`.

1. Перезапустите OpenCode или выполните `opencode reload`.
2. Проверьте подключение: `opencode mcp list`.
3. Запустите сайт, например `npm run dev -- --host 127.0.0.1`.
4. В чате попросите: «Открой через Playwright MCP адрес, который напечатал Vite. Проверь сценарий A1 и ошибки консоли. Ничего не меняй».

Если браузер не стартует, сначала убедитесь, что `npx` доступен в том же терминале. При необходимости один раз выполните `npx playwright install chrome`, затем перезапустите OpenCode. Для CI можно заменить `--browser=chrome` на `--headless --browser=chromium`, если установлен соответствующий браузер.

Playwright MCP здесь нужен не для написания кода, а для доказательства пользовательского сценария в реально работающем интерфейсе: открыть страницу, заполнить форму, перезагрузить её и проверить DOM/доступность.

## 3. Что делает hook

Файл `.opencode/plugins/check-after-edit.js` регистрирует `ctx.tool.hook("execute.after", ...)`. После успешного инструмента редактирования он запускает один доверенный runner — `node scripts/check.mjs`.

Runner читает корневой `package.json` и последовательно выполняет существующие scripts `lint`, `test`, `build`. Если проверка падает, hook возвращает ошибку агенту; если проходит — добавляет `PASS` к результату операции. Это быстрая обратная связь, а не замена финальной ручной проверке.

Проверка hook:

1. Сначала вручную добейтесь успешного `node scripts/check.mjs`.
2. Выполните `opencode reload`.
3. Временно сломайте тест через OpenCode и убедитесь, что hook вернул `FAIL`.
4. Исправьте тест и убедитесь, что повтор вернул `PASS`.

## 4. Готовые запросы для OpenCode

### Проверить окружение

```text
Прочитай AGENTS.md, docs/requirements.md и docs/style-guide.md. Загрузи skill cat-card-tdd и прочитай его reference acceptance-scenarios.md. Назови границы фич A и B, реальные команды проверки и файлы, которые нельзя менять без поручения. Пока ничего не редактируй.
```

### Реализовать фичу A

```text
Реализуй фичу A по AGENTS.md и docs/requirements.md. Используй skill cat-card-tdd. Сначала добавь минимальный тест сценария A1 и покажи ожидаемое падение, затем сделай реализацию. После этого запусти node scripts/check.mjs и git diff --check. Запусти сайт и через Playwright MCP проверь A1, A2 и ошибки консоли. Покажи diff и фактически выполненные команды. Не делай commit без моей приёмки.
```

### Проверить применение style guide

```text
Назови три правила из docs/style-guide.md и для каждого укажи конкретное место текущей реализации фичи A. Если правило нарушено, сначала опиши нарушение и предложи минимальную правку; ничего не меняй без моего подтверждения.
```

### Проверить hook

```text
Покажи, что check-after-edit hook работает: внеси заведомо безопасное временное изменение теста, которое вызывает FAIL, затем верни корректное ожидание и получи PASS. Не ослабляй runner и не оставляй временную поломку в diff.
```

### Подготовить отдельную ветку/worktree для B

После приёмки и commit фичи A выполните в исходном проекте:

```powershell
git worktree add -b practice-04-b ..\cat-memes-p4-b HEAD
Set-Location ..\cat-memes-p4-b
npm install
opencode
```

### Реализовать фичу B

```text
Реализуй фичу B в этом worktree. Прочитай AGENTS.md, docs/style-guide.md и skill cat-card-tdd. Сохрани все сценарии A. Сначала покажи падающие проверки B1 и B3, затем сделай минимальную реализацию. Вызови MCP tool cat-cards_prepare_cat_card с одним валидным и одним опасным URL. Запусти node scripts/check.mjs, git diff --check и Playwright-проверки B1–B4. Покажи diff и результаты. Не делай commit без моей приёмки.
```

### Отдельное review B

```text
Проверь diff фичи B по AGENTS.md и docs/requirements.md. Особое внимание: регрессии A, localStorage, защита от javascript: URL, innerHTML, доступность ошибок и дубликаты. Запусти доступные проверки. Назови только подтверждённые проблемы с доказательствами и непроверенные сценарии. Файлы не меняй.
```

### Объединение

После приёмки и commit B в исходном worktree:

```powershell
git merge --ff-only practice-04-b
node scripts/check.mjs
git diff --check
git status --short
```

Если `--ff-only` остановился, не форсируйте merge: сначала разберите расхождение.

## 5. Собственный MCP: cat-cards

`tools/cat-cards-mcp.mjs` — локальный stdio MCP-сервер без сторонних зависимостей. Его один tool `prepare_cat_card` проверяет контракт карточки, запрещает опасные протоколы и возвращает нормализованный объект. Сервер полезен перед реализацией/проверкой фичи B и демонстрирует как успешный, так и ошибочный результат.

Подключение уже есть в `opencode.json`. После `opencode reload` выполните `opencode mcp list`; сервер `cat-cards` должен быть connected.

Успешный запрос:

```text
Используй MCP cat-cards и вызови prepare_cat_card: title «Кот понял дедлайн», imageUrl «https://example.com/cat.jpg», altText «Удивлённый серый кот смотрит в экран ноутбука». Покажи структурированный результат.
```

Ошибочный запрос:

```text
Используй MCP cat-cards и вызови prepare_cat_card: title «К», imageUrl «javascript:alert(1)», altText «кот». Объясни ошибки, ничего не добавляй на страницу.
```

Важно: MCP помогает агенту проверить данные, но браузерная форма обязана выполнять ту же защиту сама. Клиентский код не должен зависеть от запущенного MCP.

## 6. Что приложить к сдаче

- файлы из этого комплекта;
- скрин/лог `opencode mcp list`;
- реальный вызов Playwright MCP;
- успешный и ошибочный вызовы `prepare_cat_card`;
- лог FAIL → PASS от hook;
- diff и результаты `node scripts/check.mjs` для A и B;
- короткий `reflection.md`: что помогло, что мешало, где потребовалось ваше решение.

## Источники конфигурации

- OpenCode V2 MCP: https://dev.opencode.ai/v2/docs/mcp-servers/
- OpenCode V2 plugins: https://dev.opencode.ai/v2/docs/build/plugins/
- Playwright MCP: https://github.com/microsoft/playwright-mcp
