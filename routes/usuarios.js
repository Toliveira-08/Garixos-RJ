const { Router } = require('express');
const usuarioRepo = require('../repositories/usuarioRepository');
const { autenticar, apenasAdmin, proprioOuAdmin, ehAdmin, gerarToken } = require('../middlewares/auth');

const router = Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/usuarios — lista todos (somente administração)
router.get('/', autenticar, apenasAdmin, async (req, res) => {
  res.status(200).json(await usuarioRepo.obterUsuarios());
});

// GET /api/usuarios/:id — o próprio usuário ou administração
router.get('/:id', autenticar, proprioOuAdmin(), async (req, res) => {
  const usuario = await usuarioRepo.buscarPorId(req.params.id);
  if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
  res.status(200).json(usuario);
});

// POST /api/usuarios — cadastro público de cidadão
router.post('/', async (req, res) => {
  const { nome, email, senha, data_nascimento } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ mensagem: 'Nome, email e senha são obrigatórios!' });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ mensagem: 'Email inválido.' });
  }
  if (String(senha).length < 8) {
    return res.status(400).json({ mensagem: 'A senha precisa ter pelo menos 8 caracteres.' });
  }
  if (await usuarioRepo.buscarPorEmail(String(email).trim().toLowerCase())) {
    return res.status(409).json({ mensagem: 'Já existe uma conta com este email.' });
  }

  // O cadastro público sempre cria um CLIENTE: perfis administrativos só via painel/seed
  const novoUsuario = await usuarioRepo.salvarUsuario({
    nome, email, senha, data_nascimento, perfil: 'CLIENTE', empresa_id: null
  });

  res.status(201).json({ ...novoUsuario, token: gerarToken(novoUsuario) });
});

// PUT /api/usuarios/:id — o próprio usuário edita seus dados; só admin muda perfil/empresa
router.put('/:id', autenticar, proprioOuAdmin(), async (req, res) => {
  const { nome, email, senha, data_nascimento, perfil, empresa_id } = req.body;
  const dados = { nome, email, senha, data_nascimento };

  if (ehAdmin(req.usuario)) {
    Object.assign(dados, { perfil, empresa_id });
  }

  const atualizado = await usuarioRepo.atualizarUsuario(req.params.id, dados);
  if (!atualizado) return res.status(404).json({ mensagem: 'Usuário não encontrado para atualização.' });
  res.status(200).json(atualizado);
});

// DELETE /api/usuarios/:id — somente administração
router.delete('/:id', autenticar, apenasAdmin, async (req, res) => {
  const excluido = await usuarioRepo.excluirUsuario(req.params.id);
  if (!excluido) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
  res.status(200).json({ mensagem: 'Usuário excluído com sucesso!' });
});

module.exports = router;
