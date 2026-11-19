const { Router } = require('express');
const enderecoRepo = require('../repositories/enderecoRepository');
const { autenticar, ehAdmin, proprioOuAdmin } = require('../middlewares/auth');

const router = Router();
router.use(autenticar);

// GET /api/enderecos — admin vê todos; cidadão vê só os seus
router.get('/', async (req, res) => {
  const filtro = ehAdmin(req.usuario) ? {} : { usuario_id: req.usuario.id };
  res.status(200).json(await enderecoRepo.obterTodosEnderecos(filtro));
});

// GET /api/enderecos/usuario/:usuario_id
router.get('/usuario/:usuario_id', proprioOuAdmin('usuario_id'), async (req, res) => {
  res.status(200).json(await enderecoRepo.obterEnderecosPorUsuario(req.params.usuario_id));
});

// POST /api/enderecos — o endereço é sempre do usuário logado (admin pode informar outro)
router.post('/', async (req, res) => {
  const { cep, logradouro, bairro, numero, zona_id } = req.body;
  const usuario_id = ehAdmin(req.usuario) && req.body.usuario_id ? req.body.usuario_id : req.usuario.id;

  if (!cep || !logradouro || !bairro || !numero) {
    return res.status(400).json({ mensagem: 'Faltam dados obrigatórios para registrar o endereço!' });
  }

  const novo = await enderecoRepo.salvarEndereco({ usuario_id, cep, logradouro, bairro, numero, zona_id });
  res.status(201).json(novo);
});

// PUT /api/enderecos/:id
router.put('/:id', async (req, res) => {
  const endereco = await enderecoRepo.buscarEnderecoPorId(req.params.id);
  if (!endereco || (!ehAdmin(req.usuario) && endereco.usuario_id !== req.usuario.id)) {
    return res.status(404).json({ mensagem: 'Endereço não encontrado para atualização.' });
  }

  const { cep, logradouro, bairro, numero, zona_id } = req.body;
  const atualizado = await enderecoRepo.atualizarEndereco(req.params.id, { cep, logradouro, bairro, numero, zona_id });
  res.status(200).json(atualizado);
});

// DELETE /api/enderecos/:id/:usuario_id (mantido por compatibilidade com o front-end)
router.delete('/:id/:usuario_id', async (req, res) => {
  const dono = ehAdmin(req.usuario) ? req.params.usuario_id : req.usuario.id;
  const excluido = await enderecoRepo.excluirEndereco(req.params.id, dono);

  if (!excluido) {
    return res.status(404).json({ mensagem: 'Endereço não encontrado ou não pertence a este usuário.' });
  }
  res.status(200).json({ mensagem: 'Endereço excluído com sucesso!' });
});

module.exports = router;
