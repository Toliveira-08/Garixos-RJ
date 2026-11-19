process.env.JWT_SECRET = 'segredo-de-teste';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { gerarToken, autenticar, apenasAdmin, proprioOuAdmin } = require('../middlewares/auth');

// Simula req/res do Express
function executar(middleware, req) {
  let status = 200;
  let chamouNext = false;
  const res = {
    status(code) { status = code; return this; },
    json() { return this; }
  };
  middleware(req, res, () => { chamouNext = true; });
  return { status, chamouNext };
}

const cliente = { id: 2, email: 'ana@x.com', perfil: 'CLIENTE' };
const admin = { id: 1, email: 'admin@garixos.com', perfil: 'MASTER' };

test('autenticar: bloqueia requisição sem token', () => {
  const r = executar(autenticar, { headers: {} });
  assert.equal(r.status, 401);
  assert.equal(r.chamouNext, false);
});

test('autenticar: bloqueia token inválido', () => {
  const r = executar(autenticar, { headers: { authorization: 'Bearer token-falso' } });
  assert.equal(r.status, 401);
});

test('autenticar: aceita token válido e preenche req.usuario', () => {
  const req = { headers: { authorization: `Bearer ${gerarToken(cliente)}` } };
  const r = executar(autenticar, req);
  assert.equal(r.chamouNext, true);
  assert.equal(req.usuario.id, 2);
  assert.equal(req.usuario.perfil, 'CLIENTE');
});

test('apenasAdmin: cliente recebe 403, admin passa', () => {
  assert.equal(executar(apenasAdmin, { usuario: cliente }).status, 403);
  assert.equal(executar(apenasAdmin, { usuario: admin }).chamouNext, true);
});

test('proprioOuAdmin: cliente só acessa o próprio id', () => {
  const mw = proprioOuAdmin();
  assert.equal(executar(mw, { usuario: cliente, params: { id: '2' } }).chamouNext, true);
  assert.equal(executar(mw, { usuario: cliente, params: { id: '1' } }).status, 403);
  assert.equal(executar(mw, { usuario: admin, params: { id: '2' } }).chamouNext, true);
});
