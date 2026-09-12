# Chain of Verification

- Проверяемый черновик или утверждение: план нагрузочного тестирования для POST /api/reviews и GET /health

## Запрос на проверку

Применить CoV к числовым целям и сценариям в tests_load.md, опираясь только на TRAINING_PR.diff и правила техники CoV из chain_of_verification.md.

## Вопросы проверки и evidence

| Вопрос | Источник или проверка | Результат |
|---|---|---|
| Существует ли endpoint POST /api/reviews? | TRAINING_PR.diff app/api.py:35-38 | Да — подтверждено |
| Используется ли ключ payload["diff"]? | TRAINING_PR.diff app/api.py:37 | Да — подтверждено |
| Есть ли вызов LLM.generate в обработчике? | TRAINING_PR.diff app/review_service.py:19-22 | Да — подтверждено |
| Цель p95 ≤ 500 ms присутствует в источниках? | problem.md по CoV (chain_of_verification.md) | Да — оставить (источник: problem.md) |
| Лимит 100 KB упомянут в diff? | TRAINING_PR.diff | Нет — пометить как TO BE |
| Нагрузка 10 rps упомянута в diff? | TRAINING_PR.diff | Нет — оставить как best practice |
| Доступность 2xx ≥ 99% упомянута в diff? | TRAINING_PR.diff | Нет — оставить как best practice |
| Есть политика таймаута для LLM? | TRAINING_PR.diff | Нет — пометить как TO BE |

## Исправленный результат

Сформирован файл tests_load.md с 5 сценариями. Каждое число помечено источником: из diff, problem.md (по CoV), TO BE или best practice. Добавлены ссылки на строки из TRAINING_PR.diff для фактических утверждений (пути endpoints, использование payload["diff"], вызов LLM).

## Что изменили в исходном артефакте

- Файл и раздел: practice_02/chain_of_verification/tests_load.md — создан и заполнен 5 сценариями и таблицей CoV
- Изменение: проставлены пометки источников (diff/problem.md/TO BE/best practice), добавлены evidence файл:строки
- Что отклонили: любые численные значения, отсутствующие в diff или problem.md без явной пометки источника

Скрытые рассуждения модели не сохраняются; зафиксированы только вопросы, evidence и исправленный результат.
