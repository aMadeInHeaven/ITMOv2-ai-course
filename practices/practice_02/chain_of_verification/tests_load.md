# Нагрузочное тестирование API

Объект тестирования: FastAPI-сервис с маршрутами:
- POST /api/reviews — создаёт ревью по переданному payload["diff"]. Evidence: TRAINING_PR.diff app/api.py:35-38
- GET /health — проверка здоровья сервиса. Evidence: TRAINING_PR.diff app/api.py:40-42

Связанные факты:
- Внутри ReviewService вызывается LLM.generate(prompt). Evidence: TRAINING_PR.diff app/review_service.py:19-22

Пометки источников:
- [diff] — подтверждено строками из TRAINING_PR.diff
- [problem.md] — указано как требование в problem.md (по CoV-промпту)
- [TO BE] — численное значение подлежит уточнению и согласованию
- [best practice] — индустриальная рекомендация, не факт из diff

## Цели качества (с источником)

- p95 времени ответа ≤ 500 ms [problem.md]
- Успешность 2xx ≥ 99% [best practice]
- Лимит размера входного diff ≈ 100 KB [TO BE]
- Таймаут на вызов LLM установлен и задокументирован [TO BE]
- Режим нагрузки 10 rps как базовый прогон [best practice]

## Сценарии (5 шт.)

1. Smoke — GET /health
   - Шаблон нагрузки: 5 rps, 1 минута [best practice]
   - Ожидания: 2xx ≥ 99% [best practice]; маршрут существует [diff app/api.py:40-42]
   - Метрики: p50/p95 латентность (без строгого порога; порог не задаём, так как нет источника) [n/a]

2. Базовая стабильная — POST /api/reviews @ 10 rps
   - Шаблон нагрузки: 10 rps, 5 минут [best practice]
   - Вход: payload с ключом diff (строковый текст) [diff app/api.py:37]
   - Ожидания: p95 ≤ 500 ms [problem.md]; 2xx ≥ 99% [best practice]
   - Evidence маршрута: [diff app/api.py:35-38]; вызов LLM внутри сервиса [diff app/review_service.py:19-22]

3. Пик/бурст — POST /api/reviews @ 20 rps
   - Шаблон нагрузки: резкий рост до 20 rps на 60 секунд [best practice]
   - Вход: корректный payload["diff"] [diff app/api.py:37]
   - Ожидания: p95 ≤ 500 ms [problem.md] (зафиксировать фактическое значение); 2xx ≥ 99% [best practice]
   - Наблюдения: деградация из-за внешнего LLM возможна; таймауты см. сценарий 5 [TO BE]

4. Размер входа — предел ~100 KB
   - Шаблон нагрузки: 5 rps, 3 минуты [best practice]
   - Вход: payload["diff"] ≈ 100 KB [TO BE]
   - Ожидания: запросы обрабатываются без 5xx, либо предсказуемая ошибка валидации (если лимит будет установлен) [TO BE]
   - Примечание: конкретный лимит размера не подтверждён diff; требуется решение и валидация [TO BE]

5. Таймаут LLM и устойчивость
   - Шаблон нагрузки: 5 rps, 2 минуты [best practice]
   - Условие: смоделированный таймаут/медленный ответ LLM.generate [TO BE]
   - Ожидания: документированное поведение при таймауте (код/ответ без необработанных 5xx) [TO BE]
   - Evidence вызова LLM: [diff app/review_service.py:19-22]

## Проверочные вопросы (CoV)

| Утверждение | Вопрос | Ответ | Исправление/пометка |
|---|---|---|---|
| POST /api/reviews существует | Есть в diff? | Да, app/api.py:35-38 | [diff] |
| GET /health существует | Есть в diff? | Да, app/api.py:40-42 | [diff] |
| Используется payload["diff"] | Подтверждено file:line? | Да, app/api.py:37 | [diff] |
| Внутри сервиса вызывается LLM.generate | Подтверждено file:line? | Да, app/review_service.py:19-22 | [diff] |
| p95 ≤ 500 ms | Есть в problem.md? | Да (по CoV) | [problem.md] |
| 2xx ≥ 99% | Есть в diff/problem.md? | Нет | [best practice] |
| 10 rps как базовая нагрузка | Есть в diff/problem.md? | Нет | [best practice] |
| Лимит ≈100 KB | Есть в diff/problem.md? | Нет | [TO BE] |
| Таймаут LLM | Есть в diff/problem.md? | Нет | [TO BE] |

## Методика измерений

- Инструменты: любой генератор нагрузки (k6/locust/jmeter) — выбор инструмента не влияет на CoV [best practice]
- Метрики снимать постфактум: p50/p95, rps, процент 2xx, ошибки 4xx/5xx, время обработки [best practice]
- Все численные цели, не подтверждённые diff/problem.md, помечены [TO BE] или [best practice]

## Definition of Done

- 5 сценариев описаны; все утверждения промаркированы источником
- Есть таблица проверочных вопросов CoV
- Evidence на маршруты и вызов LLM ссылается на TRAINING_PR.diff
