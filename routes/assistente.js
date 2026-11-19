const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { autenticar } = require('../middlewares/auth');
const assistente = require('../services/assistente');

const router = Router();

// Evita uso abusivo da chave do Gemini
const limiteChat = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  message: { mensagem: 'Muitas mensagens em pouco tempo. Aguarde um instante.' }
});

// POST /api/assistant/chat — body: { history: [{ role, parts: [{ text }] }] }
router.post('/chat', autenticar, limiteChat, async (req, res) => {
  const { reply } = await assistente.responder(req.body.history || []);
  res.status(200).json({ reply });
});

module.exports = router;
