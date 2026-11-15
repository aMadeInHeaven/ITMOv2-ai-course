#!/usr/bin/env node
import { spawnSync } from 'child_process';
import fs from 'fs';

console.log('==> 1. Проверка файлов...');
const requiredFiles = [
  'index.html',
  'report.html',
  'src/app.js',
  'src/styles.css',
  'src/cat-app.js',
  'src/cat.css',
  'src/card-validation.mjs',
  'AGENTS.md',
  'reflection.md',
  '.opencode/skills/cat-card-tdd/SKILL.md',
  '.opencode/plugins/check-after-edit.js',
  'tools/cat-cards-mcp.mjs',
];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`FAIL: ${file} отсутствует`);
    process.exit(1);
  }
}

console.log('==> 2. Запуск юнит-тестов (Vitest)...');
const testRun = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run'], { stdio: 'inherit' });
if (testRun.status !== 0) process.exit(testRun.status || 1);

console.log('==> 3. Сборка (Vite build)...');
const buildRun = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], { stdio: 'inherit' });
if (buildRun.status !== 0) process.exit(buildRun.status || 1);

console.log('==> 4. Smoke-тест hook...');
const hookRun = spawnSync(process.execPath, ['scripts/test-hook.mjs'], { stdio: 'inherit' });
if (hookRun.status !== 0) process.exit(hookRun.status || 1);

console.log('==> 5. Тест MCP-сервера...');
const mcpRun = spawnSync(process.execPath, ['scripts/test-mcp.mjs'], { stdio: 'inherit' });
if (mcpRun.status !== 0) process.exit(mcpRun.status || 1);

console.log('\n==> [PASS] ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ УСПЕШНО!');
