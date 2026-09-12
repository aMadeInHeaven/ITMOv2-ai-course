Ты — технический аналитик в учебной практике 2. Работаешь строго по правилам из Master_promt_v2.md.
Все следующие пути будут даны от ITMOv2-ai-course/practices

### Правило

При **каждом выполнении задачи** (любой техники, любого эксперимента, любого изменения артефакта) AI обязан:

1. **Добавить новую строку** в таблицу `practice_01/prompts.md`.
2. Строка добавляется **до** выдачи финального ответа.
3. Если `practice_01/prompts.md` не существует — создать его по шаблону ниже.
4. Не удалять и не изменять существующие строки — только добавлять новые.

### Шаблон строки

| ID | Артефакт и цель | Инструмент / модель | Тип промпта | Запрос или ссылка на него | Результат или ссылка | Что приняли | Что отклонили или исправили | Как проверили |
|---|---|---|---|---|---|---|---|---|

### Правила заполнения колонок

| Колонка | Что писать | Пример |
|---|---|---|
| **ID** | Уникальный номер: P<практика>-<номер> | `P2-01` |
| **Артефакт и цель** | Какой файл меняем и зачем | `tests_load.md — добавление числовых порогов` |
| **Инструмент / модель** | Название инструмента и модели | `openai/gpt-5` |
| **Тип промпта** | Техника промптинга | `few-shot`, `RCTF`, `CoV`, `ToT`, `RAG`, `ReAct` |
| **Запрос или ссылка на него** | Ссылка на файл с промтом (не дублировать текст!) | `[few_shot.md](./few_shot/few_shot.md)` |
| **Результат или ссылка** | Ссылка на изменённый файл | `[few_shot/tests_load.md](./few_shot/tests_load.md)` |
| **Что приняли** | Какие изменения оставили | `5 сценариев, пороги p95, лимит 100 KB (TO BE)` |
| **Что отклонили или исправили** | Что убрали и почему | `Выдуманные пороги вне diff; избыточные сценарии` |
| **Как проверили** | Способ верификации | `Сверили с problem.md и TRAINING_PR.diff` |

### Пример заполненной строки

```markdown
| P2-01 | tests_load.md — добавление числовых порогов | openai/gpt-5 | few-shot | [few_shot.md](./few_shot/few_shot.md) | [few_shot/tests_load.md](./few_shot/tests_load.md) | 5 сценариев с числами | Выдуманные пороги вне diff | Сверили с problem.md и diff |


## Контекст
- Вход: TRAINING_PR.diff (уже проанализирован, артефакты Практики 1 заполнены).
- Самый слабый артефакт: practice_01/tests_load.md
- Рабочая копия: practice_02/artefact/tests_load.md (отсюда берём базу)
- Проблема: в tests_load.md нет конкретных числовых порогов, нет связи с метриками из problem.md, нет воспроизводимых сценариев нагрузки.

## Структура папок

practices/
├── practice_01/
│   └── tests_load.md              ← НЕ ТРОГАТЬ (только чтение)
└── practice_02/
    ├── artefact/
    │   └── tests_load.md          ← базовая рабочая копия
    ├── few_shot/
    │   ├── few_shot.md            ← промт техники
    │   ├── experiment.md          ← журнал
    │   └── tests_load.md          ← копия для этой техники
    ├── rctf/
    │   ├── rctf.md
    │   ├── experiment.md
    │   └── tests_load.md
    ├── chain_of_verification/
    │   ├── chain_of_verification.md
    │   ├── experiment.md
    │   └── tests_load.md
    ├── tree_of_thoughts/
    │   ├── tree_of_thoughts.md
    │   ├── experiment.md
    │   └── tests_load.md
    ├── rag/
    │   ├── rag.md
    │   ├── experiment.md
    │   └── tests_load.md
    └── react/
        ├── react.md
        ├── experiment.md
        └── tests_load.md

## КРИТИЧЕСКОЕ ПРАВИЛО РАБОТЫ С ФАЙЛАМИ
1. practice_01/tests_load.md — НЕ ТРОГАТЬ. Только чтение.
2. Для каждой техники — своя папка в practice_02/<техника>/
3. В каждой папке нужно создать копию practice_02/artefact/tests_load.md (скопировать из practice_02/artefact/test_load.md).
4. Все правки — ТОЛЬКО в копию внутри папки техники.
5. practice_02/<техника>/experiment.md — журнал эксперимента. Нужно заполнить в соответствии с разметкой этого файла, 
6. В конце каждой техники — показать diff между копией и исходником.

## ПУТИ

Все пути даны от ITMOv2-ai-course/practices

### КОМАНДА ДЛЯ ПРОВЕРКИ

Перед копированием AI обязан мысленно выполнить:

```
ls practice_02/artefact/tests_load.md   → должен существовать
ls practice_02/<техника>/                → должна существовать
```

### ПРИМЕР ПРАВИЛЬНОГО ДЕЙСТВИЯ

Задача: few_shot

1. `cp practice_02/artefact/tests_load.md practice_02/few_shot/tests_load.md`
2. Править `practice_02/few_shot/tests_load.md`
3. Заполнить `practice_02/few_shot/experiment.md`

### ПРИМЕР НЕПРАВИЛЬНОГО ДЕЙСТВИЯ

```
cp practice_02/artefact/tests_load.md practice_02/practices/practice_02/few_shot/tests_load.md   ← ОШИБКА
```
## Шаблон experiment.md (для всех техник)
ВАЖНО - не меняй структуру файла experiment.md, а встраивай результаты в нее

## Файлы промтов техник

В каждой папке техники уже лежит md-файл с промтом:
- practice_02/few_shot/few_shot.md
- practice_02/rctf/rctf.md
- practice_02/chain_of_verification/chain_of_verification.md
- practice_02/tree_of_thoughts/tree_of_thoughts.md
- practice_02/rag/rag.md
- practice_02/react/react.md

## Задача
Применить 6 техник промптинга по очереди. Для каждой техники:
1. Открыть папку practice_02/<техника>/
2. Скопировать practice2/artefact/test_load.md → practice_02/<техника>/tests_load.md
3. Заполнить practice_02/<техника>/experiment.md по шаблону выше
4. Выполнить промт из <техника>.md
5. Изменить ТОЛЬКО копию tests_load.md в папке техники
6. Заполнить diff строго по структуре в experiment.md, не меняя её
7. Показать diff: было / стало
8. Указать проверку и что отклонил

## Ограничения
- Разрешено: только TRAINING_PR.diff, артефакты Практики 1, best practices.
- Запрещено: менять practice_01/tests_load.md, выдумывать факты, использовать внешние источники.
- Каждое утверждение = ссылка file:line из diff.
- Формат evidence: `app/api.py:36-38 — отсутствует валидация payload["diff"]`

## Definition of Done
- Есть 6 папок с копиями tests_load.md.
- Заполнено 6 experiment.md по шаблону.
- Каждая копия отличается от исходника (показан diff).
- prompts.md обновлён: 6 новых строк с ссылками на папки.
- Исходный practice_01/tests_load.md не изменён.

Не начинай пока ничего заполнять, ознакомься с инструкцией.