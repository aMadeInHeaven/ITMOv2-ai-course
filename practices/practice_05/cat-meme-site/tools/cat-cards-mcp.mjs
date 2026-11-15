#!/usr/bin/env node
import readline from 'node:readline';
import { pathToFileURL } from 'node:url';
import { validateCard } from '../src/card-validation.mjs';

const SERVER_INFO = { name: 'cat-cards', version: '2.0.0' };
const DEFAULT_PROTOCOL_VERSION = '2024-11-05';

const toolDefinition = {
  name: 'prepare_cat_card',
  description: 'Проверяет и нормализует данные карточки котомема перед добавлением в каталог',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 80, description: 'Короткая подпись мема' },
      imageUrl: { type: 'string', format: 'uri', description: 'Абсолютный HTTP(S)-адрес изображения' },
      altText: { type: 'string', minLength: 8, maxLength: 140, description: 'Доступное описание изображения' },
    },
    required: ['title', 'imageUrl', 'altText'],
  },
};

function success(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function failure(id, code, message, data) {
  const error = { code, message };
  if (data !== undefined) error.data = data;
  return { jsonrpc: '2.0', id, error };
}

export function handleRequest(request) {
  if (!request || request.jsonrpc !== '2.0' || typeof request.method !== 'string') {
    return failure(request?.id ?? null, -32600, 'Invalid Request');
  }

  const { id, method, params } = request;
  const isNotification = id === undefined;

  if (method === 'notifications/initialized' || method === 'notifications/cancelled') return null;
  if (isNotification) return null;

  switch (method) {
    case 'initialize':
      return success(id, {
        protocolVersion: params?.protocolVersion ?? DEFAULT_PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: 'Используйте prepare_cat_card перед сохранением новой карточки.',
      });
    case 'ping':
      return success(id, {});
    case 'tools/list':
      return success(id, { tools: [toolDefinition] });
    case 'tools/call': {
      if (params?.name !== toolDefinition.name) {
        return failure(id, -32601, `Tool not found: ${String(params?.name ?? '')}`);
      }

      const output = validateCard(params?.arguments);
      const text = output.ok
        ? `Карточка «${output.card.title}» готова к добавлению.`
        : `Карточка не прошла проверку: ${Object.values(output.errors).join('; ')}`;

      return success(id, {
        content: [{ type: 'text', text }],
        structuredContent: output,
        isError: !output.ok,
      });
    }
    default:
      return failure(id, -32601, `Method not found: ${method}`);
  }
}

function write(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

const entryPath = process.argv[1];
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: false });
  lines.on('line', (line) => {
    if (!line.trim()) return;
    try {
      const response = handleRequest(JSON.parse(line));
      if (response) write(response);
    } catch (error) {
      write(failure(null, -32700, 'Parse error', { message: error.message }));
    }
  });
}
