# Журнал запросов и проверок

Не сохраняйте скрытую Chain of Thought и полный чат. Нужны запрос, краткий результат, ссылка на изменённый артефакт и ваша проверка.

| ID | Артефакт и цель | Инструмент / модель | Тип промпта | Запрос или ссылка на него | Результат или ссылка | Что приняли | Что отклонили или исправили | Как проверили |
|---|---|---|---|---|---|---|---|---|
| P1-01 | Baseline-ревью `TRAINING_PR.diff` | openai/gpt-5 | zero-shot | Просмотри PR по пути practices/practice_01/TRAINING_PR.diff и найди проблемы | [P1-01.md](./P1-01.md) | Сбор начальных рисков | Всё без evidence | Сопоставили с diff вручную |
| P1-02 | Повторное ревью с master prompt | openai/gpt-5 | master prompt | [master_promt.md](./master_promt.md) | Обновлены context.md, problem.md; заполнены analysis.md, adr.md, product_management.md и тестовые файлы | Приняли выводы, привязанные к файлам/строкам diff | Отклонено всё, что выходило бы за пределы diff | Сверили каждое утверждение с TRAINING_PR.diff |
| P1-03 | Обновления по Master_promt_v2 | openai/gpt-5 | master prompt | [Master_promt_v2.md](./Master_promt_v2.md) | Обновлены tests_load.md (таймаут LLM), problem.md (метрика размера, TO BE); правки в рамках ограничений и evidence | Приняли: сценарий таймаута и уточнение метрики по правилам Master_promt_v2 | Отклонено: любые предположения вне diff | Сверили с TRAINING_PR.diff и Master_promt_v2: evidence и границы соблюдены |
| P2-01 | tests_load.md — добавление числовых порогов и сценариев | openai/gpt-5 | few-shot | [few_shot.md](../practice_02/few_shot/few_shot.md) | [few_shot/tests_load.md](../practice_02/few_shot/tests_load.md) | Добавлены 3 сценария, конкретизированы пороги p95≤500ms, 2xx≥99%, лимит 100KB (TO BE) | Отклонены предположения вне diff; без выдуманных лимитов таймаута | Сверили с problem.md и TRAINING_PR.diff (app/api.py:35-38; app/review_service.py:19-22) |
| P2-02 | tests_load.md — финальная верификация (CoV) | openai/gpt-5 | CoV | [chain_of_verification.md](../practice_02/chain_of_verification/chain_of_verification.md) | [tests_load.md](../practice_02/chain_of_verification/tests_load.md) | Приняли: p95≤500ms (из problem.md), 100KB (TO BE), 10 rps (best practice) | Отклонено: числа без источника/пометки | Сверили с TRAINING_PR.diff (app/api.py:35-38; app/api.py:40-42; app/review_service.py:19-22) и CoV-таблицей |
| P2-03 | tests_load.md — RAG с ограниченными источниками | openai/gpt-5 | RAG | [rag.md](../practice_02/rag/rag.md) | [tests_load.md](../practice_02/rag/tests_load.md) | Приняли: только 4 источника, evidence по diff | Числа без источника помечены как best practice | Сверили с TRAINING_PR.diff (app/api.py:35-38; app/review_service.py:19-22) |
| P2-04 | tests_load.md — сценарии по RCTF | openai/gpt-5 | RCTF | [rctf.md](../practice_02/rctf/rctf.md) | [tests_load.md](../practice_02/rctf/tests_load.md) | Приняли: 5+ сценариев с числами, пороги отказа, evidence файл:строки diff | Отклонено: гипотезы вне diff; числа без источника помечены как best practice | Сверили с TRAINING_PR.diff (app/api.py:35-38; review_service.py:19-22) |
| P2-05 | ReAct — tests_load.md и журнал шагов | openai/gpt-5 | ReAct | [react.md](../practice_02/react/react.md) | [tests_load.md](../practice_02/react/tests_load.md) | Приняли: 5 сценариев с метриками и evidence; журнал ReAct (6 шагов) | Отклонено: выход за источники | Сверили с TRAINING_PR.diff (app/api.py:35-38; app/api.py:40-42; app/review_service.py:19-22) |
| P2-06 | Tree of Thoughts — выбор подхода и план | openai/gpt-5 | ToT | [tree_of_thoughts.md](../practice_02/tree_of_thoughts/tree_of_thoughts.md) | [tests_load.md](../practice_02/tree_of_thoughts/tests_load.md) | Приняли: 3 альтернативы, критерии, выбор C; 5 сценариев | Отклонено: избыточная матрица B, минимализм A | Сверили с tree_of_thoughts.md и критериями |

## Master Prompt v1

Соберите здесь контракт второго запуска. Не копируйте все документы целиком — ставьте ссылки на файлы и переносите только необходимый для задачи контекст.

### 1. Цель и роль

- Цель: На основе TRAINING_PR.diff подготовить согласованный набор артефактов и связный master prompt.
- Роль AI: Генерировать черновики артефактов по заданной структуре, строго ссылаясь на строки diff.

### 2. Входы и источники

- Обязательный вход: practices/practice_01/TRAINING_PR.diff
- Разрешённые файлы и источники: только TRAINING_PR.diff и правила практики
- Context Pack — факты, правила, примеры и ограничения: см. context.md (факты), problem.md (риски и приоритезация)

### 3. Задача и артефакты

- Что сделать: Заполнить context, analysis, adr, product/project management и тестовые артефакты, опираясь на diff.
- Что вернуть: Строго структурированный Markdown с evidence в формате файл:строки diff.

### 4. Формат результата

- Структура ответа: По шаблонам каждого файла практики, не изменяя заголовки.
- Ограничения объёма: Без лишних разделов; evidence компактно.

### 5. Полномочия и запреты

- Разрешено: Анализировать diff, ссылаться на строки, предлагать best practices.
- Запрещено: Выходить за рамки diff, придумывать факты, менять код.

### 6. Рабочий процесс и остановка

- Шаги: Прочитать diff → вытащить факты → заполнить артефакты → связать evidence.
- Когда остановиться и запросить человека: Если требуется информация вне diff.

### 7. Проверки и evidence

- Как проверять утверждения: Каждое — со ссылкой файл:строки из diff.
- Какое evidence сохранить: Сводные примеры в problem.md и тестовых файлаx.

### 8. Definition of Done

- Задача закончена, когда: Все артефакты заполнены, связаны между собой, каждое утверждение подтверждено строкой diff, разделы «Как использовали AI» заполнены.

## Сравнение двух запусков

| Проверка | Zero-shot | С master prompt | Вывод команды |
|---|---|---|---|
| Есть ссылка на файл или строку | Да | Да | Ссылки вида файл + номера строк diff |
| Вывод подтверждён diff или правилом | Да | Да | Утверждения сопоставлены с TRAINING_PR.diff |
| Соблюдены границы AI | Да | Да | Использован только diff |
| Есть воспроизводимая проверка | Да | Да | Перепроверка против TRAINING_PR.diff |

## Peer review

| Где другой команде пришлось догадываться | Что исправили | Если не исправили — почему |
|---|---|---|
| 1 |  |  |
| 2 |  |  |
| 3 |  |  |
