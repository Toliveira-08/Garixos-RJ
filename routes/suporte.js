const { Router } = require('express');
const suporteRepo = require('../repositories/suporteRepository');
const { autenticar, apenasAdmin, ehAdmin } = require('../middlewares/auth');

const router = Router();
router.use(autenticar);

// GET /api/suporte — admin vê todos os chamados; cidadão vê só os seus
router.get('/', async (req, res) => {
  const filtro = ehAdmin(req.usuario) ? {} : { usuario_id: req.usuario.id };
  res.status(200).json(await suporteRepo.listarSolicitacoes(filtro));
});

// POST /api/suporte — abre chamado / feedback / pedido de alteração de dados
router.post('/', async (req, res) => {
  const { tipo, email, assunto, mensagem, tipo_feedback } = req.body;

  if (!tipo || !email || !assunto || !mensagem) {
    return res.status(400).json({ mensagem: 'Tipo, email, assunto e mensagem são obrigatórios.' });
  }

  const novo = await suporteRepo.criarSolicitacao({
    tipo,
    email,
    assunto,
    mensagem,
    tipo_feedback: tipo_feedback || null,
    status: 'aberto',
    usuario_id: req.usuario.id
  });
  res.status(201).json(novo);
});

// PUT /api/suporte/:id — atualiza status (administração)
router.put('/:id', apenasAdmin, async (req, res) => {
  const atualizado = await suporteRepo.atualizarStatus(req.params.id, req.body.status || 'aberto');
  if (!atualizado) return res.status(404).json({ mensagem: 'Registro de suporte não encontrado.' });
  res.status(200).json(atualizado);
});

// DELETE /api/suporte/:id — administração
router.delete('/:id', apenasAdmin, async (req, res) => {
  const removido = await suporteRepo.excluirSolicitacao(req.params.id);
  if (!removido) return res.status(404).json({ mensagem: 'Registro de suporte não encontrado.' });
  res.status(200).json({ mensagem: 'Registro removido com sucesso.' });
});

module.exports = router;
