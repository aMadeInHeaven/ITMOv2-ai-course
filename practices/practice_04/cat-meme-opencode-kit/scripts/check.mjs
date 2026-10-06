#!/usr/bin/env node
import { spawnSync } from 'child_process';
import fs from 'fs';

console.log('==> [1/3] Проверка файлов проекта...');
if (!fs.existsSync('index.html')) {
  console.error('FAIL: index.html не найден');
  process.exit(1);
}

console.log('==> [2/3] Запуск юнит-тестов...');
const testResult = spawnSync('npm', ['test', '--', '--run'], { stdio: 'inherit', shell: true });
if (testResult.status !== 0) {
  console.error('FAIL: Тесты не прошли');
  process.exit(testResult.status || 1);
}

console.log('==> [3/3] Сборка (Build check)...');
const buildResult = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
if (buildResult.status !== 0) {
  console.error('FAIL: Ошибка сборки');
  process.exit(buildResult.status || 1);
}

console.log('\n==> ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ (PASS)!');
