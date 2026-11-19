const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const usuarioRepo = require('../repositories/usuarioRepository');
const { gerarToken } = require('../middlewares/auth');

const router = Router();

// Limita tentativas de login para dificultar ataques de força bruta
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensagem: 'Muitas tentativas de login. Tente novamente em alguns minutos.' }
});

// POST /api/login
router.post('/login', limiteLogin, async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ mensagem: 'Email e senha são obrigatórios.' });
  }

  const usuario = await usuarioRepo.verificarCredenciais(email, senha);
  if (!usuario) {
    return res.status(401).json({ mensagem: 'Email ou senha inválidos' });
  }

  res.status(200).json({
    mensagem: 'Login bem-sucedido',
    token: gerarToken(usuario),
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil }
  });
});

module.exports = router;
