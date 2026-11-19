const bcrypt = require('bcryptjs');
const { Usuario, Endereco } = require('../models');

const SALT_ROUNDS = 10;

// Remove campos undefined para não sobrescrever dados existentes com null
const semIndefinidos = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

const removerSenha = (usuario) => {
  const { senha, ...resto } = usuario.toJSON();
  return resto;
};

const normalizarPerfil = (perfil) => {
  const valor = String(perfil || '').trim().toUpperCase();

  if (['CLIENTE', 'CIDADAO', 'CIDADÃO', 'CITADÃO', 'USER', 'CLIENT'].includes(valor)) {
    return 'CLIENTE';
  }

  if (['ADMIN', 'ADMIN_INTERNO', 'ADMINISTRADOR', 'INTERNAL_ADMIN'].includes(valor)) {
    return 'ADMIN_INTERNO';
  }

  if (['MASTER', 'MESTRE', 'SUPERUSER', 'ROOT'].includes(valor)) {
    return 'MASTER';
  }

  return 'CLIENTE';
};

const obterUsuarios = async () => {
  try {
    return await Usuario.findAll({
      // Exclui a senha do retorno para não vazar dados na API
      attributes: { exclude: ['senha'] },
      include: [
        {
          model: Endereco,
          attributes: ['logradouro', 'bairro', 'cep']
        }
      ]
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    throw new Error('Não foi possível listar os usuários.');
  }
};

const buscarPorEmail = async (email) => {
  try {
    // Essa função é essencial para a tela de Login do Front-end
    return await Usuario.findOne({ 
      where: { email } 
    });
  } catch (error) {
    console.error('Erro ao buscar usuário por email:', error);
    throw new Error('Não foi possível consultar o email.');
  }
};

const buscarPorId = async (id) => {
  try {
    return await Usuario.findByPk(id, {
      attributes: { exclude: ['senha'] },
      include: [
        {
          model: Endereco,
          attributes: ['logradouro', 'bairro', 'cep']
        }
      ]
    });
  } catch (error) {
    console.error('Erro ao buscar usuário por id:', error);
    throw new Error('Não foi possível consultar o usuário.');
  }
};

const salvarUsuario = async (dadosUsuario) => {
  try {
    const dadosNormalizados = {
      ...dadosUsuario,
      email: String(dadosUsuario.email).trim().toLowerCase(),
      senha: await bcrypt.hash(dadosUsuario.senha, SALT_ROUNDS),
      perfil: normalizarPerfil(dadosUsuario.perfil)
    };

    const usuario = await Usuario.create(dadosNormalizados);
    return removerSenha(usuario);
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    throw new Error('Não foi possível cadastrar o usuário.');
  }
};

const atualizarUsuario = async (id, dadosAtualizados) => {
  try {
    const usuario = await Usuario.findByPk(id);
    
    if (usuario) {
      const dadosNormalizados = semIndefinidos({
        ...dadosAtualizados,
        email: dadosAtualizados.email ? String(dadosAtualizados.email).trim().toLowerCase() : undefined,
        senha: dadosAtualizados.senha ? await bcrypt.hash(dadosAtualizados.senha, SALT_ROUNDS) : undefined,
        perfil: dadosAtualizados.perfil ? normalizarPerfil(dadosAtualizados.perfil) : undefined
      });

      await usuario.update(dadosNormalizados);
      return removerSenha(usuario);
    }
    return null; // Retorna nulo se o ID não existir
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw new Error('Não foi possível atualizar o usuário.');
  }
};

const excluirUsuario = async (id) => {
  try {
    const usuario = await Usuario.findByPk(id);
    if (usuario) {
      await usuario.destroy();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    throw new Error('Não foi possível remover o usuário.');
  }
};

// Confere email + senha. Retorna o usuário (sem senha) ou null.
const verificarCredenciais = async (email, senha) => {
  const usuario = await Usuario.findOne({ where: { email: String(email).trim().toLowerCase() } });
  if (!usuario || !usuario.senha) return null;

  const senhaConfere = await bcrypt.compare(String(senha), usuario.senha);
  return senhaConfere ? removerSenha(usuario) : null;
};

module.exports = {
  verificarCredenciais,
  obterUsuarios, 
  buscarPorId,
  buscarPorEmail, 
  salvarUsuario,
  atualizarUsuario,
  excluirUsuario
};
