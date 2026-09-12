# Журнал экспериментов Практики 2

- Выбранный слабый артефакт Практики 1: tests_load.md
- Что в нём нужно улучшить: добавить числовые пороги, воспроизводимые сценарии и evidence; согласовать с problem.md и TRAINING_PR.diff; пометить источники (diff/problem.md/TO BE/best practice).
- Как поймём, что изменение полезно: 5 сценариев с метриками и критериями; у каждого сценария есть источники и evidence file:line; проверка ссылок проходит.

| Техника | Файл эксперимента | Изменённый файл Практики 1 | Конкретное изменение | Проверка | Что отклонили |
|---|---|---|---|---|---|
| Few-shot | [`few_shot/experiment.md`](few_shot/experiment.md) | `practice_02/few_shot/tests_load.md` | Добавлены 3 сценария; конкретизированы пороги (p95 ≤ 500 ms, 2xx ≥ 99%, лимит 100 KB — TO BE); добавлены evidence file:line | Сверка с problem.md и TRAINING_PR.diff (app/api.py:35-38; app/review_service.py:19-22) | Предположения вне diff; произвольные лимиты таймаута |
| R.C.T.F. | [`rctf/experiment.md`](rctf/experiment.md) | `practice_02/rctf/tests_load.md` | Создан файл с 5+ сценариями, числовыми порогами и разделом «Пороги отказа», с evidence | Сопоставлены пункты с TRAINING_PR.diff (app/api.py:35-38; app/api.py:40-42; app/review_service.py:19-22); числа без источника — best practice | Любые гипотезы вне diff |
| Chain of Verification | [`chain_of_verification/experiment.md`](chain_of_verification/experiment.md) | `practice_02/chain_of_verification/tests_load.md` | Исправлены источники чисел, добавлены пометки (diff/problem.md/TO BE/best practice), проверены evidence | Вопросы CoV и ответы со ссылками; финальный файл с 5 сценариями | Числа без источника и пометки |
| Tree of Thoughts | [`tree_of_thoughts/experiment.md`](tree_of_thoughts/experiment.md) | `practice_02/tree_of_thoughts/tests_load.md` | Добавлены цели, метрики, 5 сбалансированных сценариев (baseline, всплеск, таймауты, payload, параллельность) | Сверка с tree_of_thoughts.md; проверка наличия 5 сценариев и критериев | Избыточная матрица B, минимализм A |
| RAG | [`rag/experiment.md`](rag/experiment.md) | `practice_02/rag/tests_load.md` | Создан файл с 5 сценариями при ограничении источников (4 файла), с evidence | Проверка ограничений источников и evidence на TRAINING_PR.diff | Внешние данные вне 4 источников |
| ReAct | [`react/experiment.md`](react/experiment.md) | `practice_02/react/tests_load.md` | 5 сценариев с метриками и evidence; добавлен журнал ReAct (6 шагов) | Проверены ссылки на react.md и TRAINING_PR.diff; наличие журнала | Лишние сценарии сверх 5; чтение неперечисленных файлов |

## Независимое ревью

| Замечание другой команды | Где исправили | Evidence |
|---|---|---|
| Двусмысленность |  |  |
| Непроверяемое требование |  |  |
| Пропущенный риск или источник |  |  |
