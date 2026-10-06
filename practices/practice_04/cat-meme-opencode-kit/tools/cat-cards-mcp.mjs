#!/usr/bin/env node
import readline from 'readline';

function validateAndPrepareCard(input = {}) {
  const errors = {};
  const rawTitle = typeof input.title === 'string' ? input.title.trim() : '';
  const rawUrl = typeof input.imageUrl === 'string' ? input.imageUrl.trim() : '';
  const rawAlt = typeof input.altText === 'string' ? input.altText.trim() : '';

  // Валидация URL
  if (!rawUrl) {
    errors.imageUrl = 'Укажите URL изображения';
  } else {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        errors.imageUrl = 'Разрешены только протоколы http: и https:';
      }
    } catch {
      errors.imageUrl = 'Некорректный абсолютный URL';
    }
  }

  // Валидация Title (3 - 80 символов)
  if (rawTitle.length < 3 || rawTitle.length > 80) {
    errors.title = 'Название должно быть от 3 до 80 символов';
  }

  // Валидация Alt Text (8 - 140 символов)
  if (rawAlt.length < 8 || rawAlt.length > 140) {
    errors.altText = 'Описание (alt) должно быть от 8 до 140 символов';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    card: {
      title: rawTitle,
      imageUrl: rawUrl,
      altText: rawAlt
    }
  };
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
function send(res) { process.stdout.write(JSON.stringify(res) + '\n'); }

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const req = JSON.parse(trimmed);
    const { id, method, params } = req;

    if (method === 'initialize') {
      send({
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: { name: 'cat-cards', version: '1.0.0' },
          capabilities: { tools: {} }
        }
      });
    } else if (method === 'tools/list') {
      send({
        jsonrpc: '2.0', id,
        result: {
          tools: [{
            name: 'prepare_cat_card',
            description: 'Валидирует и нормализует карточку кота',
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                imageUrl: { type: 'string' },
                altText: { type: 'string' }
              },
              required: ['title', 'imageUrl', 'altText']
            }
          }]
        }
      });
    } else if (method === 'tools/call') {
      if (params?.name === 'prepare_cat_card') {
        const out = validateAndPrepareCard(params?.arguments || {});
        send({
          jsonrpc: '2.0', id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(out, null, 2) }],
            isError: !out.ok
          }
        });
      } else {
        send({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Tool not found' } });
      }
    } else if (method === 'ping') {
      send({ jsonrpc: '2.0', id, result: {} });
    }
  } catch (err) {
    send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: err.message } });
  }
});
