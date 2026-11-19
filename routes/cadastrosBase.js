// Rotas de cadastros administrativos: empresas, zonas de coleta e veículos.
// Leitura liberada para usuários logados; escrita restrita à administração.
const { Router } = require('express');
const empresaRepo = require('../repositories/empresaRepository');
const zonaColetaRepo = require('../repositories/zonaColetaRepository');
const veiculoRepo = require('../repositories/veiculoRepository');
const { autenticar, apenasAdmin } = require('../middlewares/auth');

// Monta um CRUD padrão a partir das funções do repositório
function crud({ listar, criar, atualizar, excluir, campos, obrigatorios, nome }) {
  const router = Router();
  router.use(autenticar);

  const pegarCampos = (body) => Object.fromEntries(campos.map((c) => [c, body[c]]));

  router.get('/', async (req, res) => res.status(200).json(await listar()));

  router.post('/', apenasAdmin, async (req, res) => {
    const faltando = obrigatorios.filter((c) => !req.body[c]);
    if (faltando.length) {
      return res.status(400).json({ mensagem: `Campos obrigatórios: ${faltando.join(', ')}.` });
    }
    res.status(201).json(await criar(pegarCampos(req.body)));
  });

  router.put('/:id', apenasAdmin, async (req, res) => {
    const atualizado = await atualizar(req.params.id, pegarCampos(req.body));
    if (!atualizado) return res.status(404).json({ mensagem: `${nome} não encontrado(a).` });
    res.status(200).json(atualizado);
  });

  router.delete('/:id', apenasAdmin, async (req, res) => {
    const excluido = await excluir(req.params.id);
    if (!excluido) return res.status(404).json({ mensagem: `${nome} não encontrado(a).` });
    res.status(200).json({ mensagem: `${nome} excluído(a) com sucesso!` });
  });

  return router;
}

const empresas = crud({
  nome: 'Empresa',
  campos: ['nome', 'cnpj'],
  obrigatorios: ['nome', 'cnpj'],
  listar: empresaRepo.obterEmpresas,
  criar: ({ nome, cnpj }) => empresaRepo.salvarEmpresa(nome, cnpj),
  atualizar: empresaRepo.atualizarEmpresa,
  excluir: empresaRepo.excluirEmpresa
});

const zonas = crud({
  nome: 'Zona de coleta',
  campos: ['nome_zona', 'empresa_id'],
  obrigatorios: ['nome_zona', 'empresa_id'],
  listar: zonaColetaRepo.obterZonas,
  criar: zonaColetaRepo.salvarZona,
  atualizar: zonaColetaRepo.atualizarZona,
  excluir: zonaColetaRepo.excluirZona
});

const veiculos = crud({
  nome: 'Veículo',
  campos: ['placa', 'marca', 'modelo', 'ano', 'empresa_id'],
  obrigatorios: ['placa', 'modelo', 'empresa_id'],
  listar: veiculoRepo.obterVeiculos,
  criar: veiculoRepo.salvarVeiculo,
  atualizar: veiculoRepo.atualizarVeiculo,
  excluir: veiculoRepo.excluirVeiculo
});

module.exports = { empresas, zonas, veiculos };
