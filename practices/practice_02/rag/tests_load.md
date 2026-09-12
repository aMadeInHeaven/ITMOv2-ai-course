| Сценарий | Нагрузка | Предел | Что измеряем | Источник | Evidence |
|---|---|---|---|---|---|
| Базовая нагрузка на создание обзора | 10 rps, 5 мин | p95 < 500 ms (best practice) | p50/p95 | problem.md | app/api.py:35-38 |
| Устойчивость при всплеске | 50 rps, 1 мин, затем 10 rps, 4 мин | 2xx ≥ 99% (best practice) | 2xx rate | tests_e2e.md | app/api.py:35-38 |
| Корректность обработки больших диффов | тело diff ~100KB | p95 < 800 ms (best practice) | размер ответа/время | tests_integration.md | app/review_service.py:19-22 |
| Отказоустойчивость при ошибке LLM | 5 rps, 3 мин | 5xx ≤ 1% (best practice) | 5xx rate | tests_integration.md | app/review_service.py:19-22 |
| Длительная стабильность | 5 rps, 30 мин | p95 < 600 ms; 2xx ≥ 99% (both best practice) | p50/p95, 2xx | problem.md | app/api.py:35-38 |

Примечания:
- Числовые пределы взяты из problem.md или помечены как best practice, если явно не указано в problem.md.
- Каждый сценарий согласован с tests_e2e.md и рисками из tests_integration.md.
