const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido. Configure-o no arquivo .env (veja .env.example).');
}

const PERFIS_ADMIN = ['ADMIN_INTERNO', 'MASTER'];

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, perfil: usuario.perfil },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Exige um token JWT válido no header Authorization: Bearer <token>
function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ mensagem: 'Faça login para continuar.' });
  }

  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ mensagem: 'Sessão expirada. Faça login novamente.' });
  }
}

const ehAdmin = (usuario) => PERFIS_ADMIN.includes(usuario?.perfil);

// Restringe a rota a perfis administrativos
function apenasAdmin(req, res, next) {
  if (!ehAdmin(req.usuario)) {
    return res.status(403).json({ mensagem: 'Acesso restrito à administração.' });
  }
  return next();
}

// Permite acesso ao próprio recurso (:id) ou a administradores
function proprioOuAdmin(param = 'id') {
  return (req, res, next) => {
    if (ehAdmin(req.usuario) || Number(req.params[param]) === Number(req.usuario.id)) {
      return next();
    }
    return res.status(403).json({ mensagem: 'Você não tem permissão para acessar este recurso.' });
  };
}

module.exports = { gerarToken, autenticar, apenasAdmin, proprioOuAdmin, ehAdmin };
