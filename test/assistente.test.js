delete process.env.GEMINI_API_KEY;

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { responder } = require('../services/assistente');

const pergunta = (text) => [{ role: 'user', parts: [{ text }] }];

test('assistente responde sem chave do Gemini (modo local)', async () => {
  const { reply, fonte } = await responder(pergunta('Onde descarto ÓLEO de cozinha?'));
  assert.equal(fonte, 'local');
  assert.match(reply, /óleo/i);
});

test('assistente rejeita histórico vazio', async () => {
  await assert.rejects(() => responder([]), /vazia/);
});
