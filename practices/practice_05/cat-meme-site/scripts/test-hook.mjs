#!/usr/bin/env node
import assert from 'node:assert/strict';
import checkAfterEdit from '../.opencode/plugins/check-after-edit.js';

let callback;
let executions = 0;
const messages = [];

checkAfterEdit({
  tool: {
    hook(name, registeredCallback) {
      assert.equal(name, 'execute.after');
      callback = registeredCallback;
    },
  },
  async exec(command) {
    executions += 1;
    assert.equal(command, 'node scripts/check.mjs');
    return { stdout: 'runner completed' };
  },
  log(message) { messages.push(message); },
  warn(message) { throw new Error(message); },
});

assert.equal(typeof callback, 'function', 'Hook должен зарегистрировать execute.after');
await callback({ tool: 'read' });
assert.equal(executions, 0, 'Чтение не должно запускать runner');
await callback({ tool: 'edit' });
assert.equal(executions, 1, 'Редактирование должно запустить runner один раз');
assert.match(messages.at(-1), /CHECK PASS/);

console.log('==> [PASS] Hook: execute.after зарегистрирован и запускает runner только после редактирования');
