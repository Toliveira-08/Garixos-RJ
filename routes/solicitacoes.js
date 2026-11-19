const { Router } = require('express');
const solicitacaoRepo = require('../repositories/solicitacaoRepository');
const enderecoRepo = require('../repositories/enderecoRepository');
const { autenticar, apenasAdmin, ehAdmin } = require('../middlewares/auth');

const router = Router();
router.use(autenticar);

const TIPOS_LIXO = ['ORGANICO', 'RECICLAVEL', 'ELETRONICO', 'PODA', 'ENTULHO'];

// GET /api/solicitacoes — admin vê todas; cidadão vê só as suas
router.get('/', async (req, res) => {
  const filtro = ehAdmin(req.usuario) ? {} : { usuario_id: req.usuario.id };
  res.status(200).json(await solicitacaoRepo.obterSolicitacoes(filtro));
});

// POST /api/solicitacoes — cidadão abre uma solicitação para um endereço seu
router.post('/', async (req, res) => {
  const { endereco_id, tipo_lixo } = req.body;
  const tipo = String(tipo_lixo || '').toUpperCase();

  if (!endereco_id || !TIPOS_LIXO.includes(tipo)) {
    return res.status(400).json({ mensagem: `Informe o endereço e um tipo de lixo válido (${TIPOS_LIXO.join(', ')}).` });
  }

  const endereco = await enderecoRepo.buscarEnderecoPorId(endereco_id);
  if (!endereco || endereco.usuario_id !== req.usuario.id) {
    return res.status(400).json({ mensagem: 'Endereço inválido para este usuário.' });
  }

  const nova = await solicitacaoRepo.salvarSolicitacao({
    usuario_id: req.usuario.id,
    endereco_id,
    tipo_lixo: tipo,
    status: 'PENDENTE'
  });
  res.status(201).json(nova);
});

// PUT /api/solicitacoes/:id — a empresa atualiza status / aloca veículo (administração)
router.put('/:id', apenasAdmin, async (req, res) => {
  const { status, veiculo_id, tipo_lixo, data_solicitacao } = req.body;
  const atualizada = await solicitacaoRepo.atualizarSolicitacao(req.params.id, {
    status, veiculo_id, tipo_lixo, data_solicitacao
  });

  if (!atualizada) return res.status(404).json({ mensagem: 'Solicitação não encontrada.' });
  res.status(200).json(atualizada);
});

// DELETE /api/solicitacoes/:id — o dono cancela a sua; admin pode remover qualquer uma
router.delete('/:id', async (req, res) => {
  const solicitacao = await solicitacaoRepo.buscarSolicitacaoPorId(req.params.id);
  if (!solicitacao || (!ehAdmin(req.usuario) && solicitacao.usuario_id !== req.usuario.id)) {
    return res.status(404).json({ mensagem: 'Solicitação não encontrada.' });
  }

  await solicitacaoRepo.excluirSolicitacao(req.params.id);
  res.status(200).json({ mensagem: 'Solicitação cancelada com sucesso!' });
});

module.exports = router;
