#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(scriptDirectory, '../tools/cat-cards-mcp.mjs');
const server = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });
const pending = new Map();
const stderr = [];

server.stderr.on('data', (chunk) => stderr.push(chunk.toString()));

readline.createInterface({ input: server.stdout, crlfDelay: Infinity }).on('line', (line) => {
  if (!line.trim()) return;
  const message = JSON.parse(line);
  const waiter = pending.get(message.id);
  if (waiter) {
    pending.delete(message.id);
    waiter.resolve(message);
  }
});

let nextId = 1;

function request(method, params = {}) {
  const id = nextId++;
  server.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`MCP timeout for ${method}. stderr: ${stderr.join('')}`));
    }, 2000);
    pending.set(id, {
      resolve: (message) => {
        clearTimeout(timer);
        resolve(message);
      },
    });
  });
}

try {
  const initialized = await request('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'integration-test', version: '1.0.0' } });
  assert.equal(initialized.result.serverInfo.name, 'cat-cards');
  server.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`);

  const ping = await request('ping');
  assert.deepEqual(ping.result, {});

  const listed = await request('tools/list');
  assert.equal(listed.result.tools.length, 1);
  assert.equal(listed.result.tools[0].name, 'prepare_cat_card');
  assert.deepEqual(listed.result.tools[0].inputSchema.required, ['title', 'imageUrl', 'altText']);

  const valid = await request('tools/call', {
    name: 'prepare_cat_card',
    arguments: { title: '  Кот и дедлайн  ', imageUrl: 'https://example.com/cat.jpg', altText: 'Кот внимательно смотрит в экран' },
  });
  assert.equal(valid.result.isError, false);
  assert.equal(valid.result.structuredContent.ok, true);
  assert.equal(valid.result.structuredContent.card.title, 'Кот и дедлайн');

  const unsafe = await request('tools/call', {
    name: 'prepare_cat_card',
    arguments: { title: 'Опасный кот', imageUrl: 'javascript:alert(1)', altText: 'Кот проверяет защиту от XSS' },
  });
  assert.equal(unsafe.result.isError, true);
  assert.equal(unsafe.result.structuredContent.ok, false);
  assert.match(unsafe.result.structuredContent.errors.imageUrl, /http/);

  const unknown = await request('tools/call', { name: 'missing_tool', arguments: {} });
  assert.equal(unknown.error.code, -32601);

  console.log('==> [PASS] MCP: handshake, ping, discovery, valid/unsafe calls and unknown tool (6 checks)');
} finally {
  server.stdin.end();
  server.kill();
}
