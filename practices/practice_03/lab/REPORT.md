# REPORT

## Hardware & Versions

- Python: 3.14.4
- Ollama: 0.34.4
- Hardware: AMD Ryzen 5 7535HS (6 ядер/12 потоков); GPU: NVIDIA GeForce RTX 4060 Laptop; интегрированная графика: Radeon; ОЗУ, доступная в WSL2: ~7.4 ГиБ

## Model

- ID: qwen3.5:4b (local, via Ollama)
- Family: qwen35; Params: ~4.7B; Quantization: Q4_K_M
- Context length (model): 262144 (per /api/tags)
- Context used (evaluation): 8192 tokens; Output: 4096 tokens
- Rationale: 8k контекст как компромисс между стабильностью и ресурсами ноутбука.

## OpenCode Configuration

- Provider: Ollama (OpenAI-compatible), baseURL: http://localhost:11434/v1
- model/small_model: ollama/qwen3.5:4b
- Agent `local-guide`: read-only (разрешены read, glob, grep)

## Tests

- make -C practices/practice_03/lab test: PASSED (3 tests)

## Questions & Evaluation Plan

- Источник вопросов: lab/QUESTIONS.md (5 пунктов, включая ложную предпосылку и отсутствие сведений)
- План: задавать вопросы в отдельных сессиях через OpenCode, сравнивать с эталонами по demo/*.

## Gold Answers (Possible)

1. Как запустить тесты? Укажи файл-источник.
   - Ответ: `make test`.
   - Источники: demo/README.md:6 ("Проверка: make test."), demo/Makefile:3 ("python3 -m unittest -v").

2. Что будет при пустом имени подписчика? Подтверди кодом.
   - Ответ: поднимется исключение `ValueError("empty name")`.
   - Источники: demo/service.py:5–7 (проверка `name.strip()` и `raise ValueError("empty name")`), demo/test_service.py:14–15 (тест ожидает ValueError).

3. Где реализован unsubscribe? Проверь предпосылку вопроса.
   - Ответ: функция `unsubscribe` в demo отсутствует (ложная предпосылка).
   - Источники: поиск по demo не находит `unsubscribe` (0 совпадений).

4. Какая CI-система запускает тесты? Если сведений нет, скажи об этом.
   - Ответ: сведений нет.
   - Источники: в demo отсутствуют файлы конфигурации CI (например, `.github/workflows/*.yml`, `.gitlab-ci.yml`).

5. Сохраняются ли подписки после перезапуска процесса? Подтверди кодом.
   - Ответ: не сохраняются; данные в памяти процесса.
   - Источники: demo/README.md:2 (про память процесса), demo/service.py:1 (`subscribers = set()`).

## Model Answers

1. Вопрос: Как запустить тесты? Укажи файл-источник.

- Ответ модели: `make test`
- Основание: demo/README.md, строка 6 ("Проверка: make test.")

2. Вопрос: Что будет при пустом имени подписчика? Подтверди кодом.

- Ответ модели: Исключение ValueError("empty name").
- Основание: demo/service.py, строки 5–7; demo/test_service.py, строки 14–15.

3. Вопрос: Где реализован unsubscribe? Проверь предпосылку вопроса.

- Ответ модели: Функция `unsubscribe` в demo не реализована (ложная предпосылка).
- Основание: поиск по проекту demo не нашёл вхождений `unsubscribe` (grep 0 совпадений).

4. Вопрос: Какая CI-система запускает тесты? Если сведений нет, скажи об этом.

- Ответ модели: сведений о CI-системе нет.
- Основание: в demo отсутствуют конфиги CI (`.github/workflows/*.yml`, `.gitlab-ci.yml` и т.п.).

5. Вопрос: Сохраняются ли подписки после перезапуска процесса? Подтверди кодом.

- Ответ модели: Нет, не сохраняются (данные в памяти процесса).
- Основание: demo/README.md, строка 2 (подписчики в памяти процесса); demo/service.py, строка 1 (`subscribers = set()`).

## Comparison (Model vs Gold)

1. OK — модель указала `make test` и сослалась на README.md.
2. OK — модель указала `ValueError("empty name")` с кодом из service.py и подтверждением тестом.
3. OK — модель указала отсутствие `unsubscribe` (ложная предпосылка проверена).
4. OK — модель корректно сообщила об отсутствии сведений о CI.
5. OK — модель верно указала, что данные не сохраняются между перезапусками (in-memory).

## Observations

- Контекст 8k был достаточен для чтения всех файлов demo; ответы устойчиво соответствуют коду.
- Ограничения: отсутствие CI-конфигов — ожидаемо для учебного demo; ответы корректно отражают "нет сведений".
- Рекомендации: при расширении demo добавить тест на дублирующую подписку и описание поведения в README (уже покрыто тестом `test_duplicate`).
