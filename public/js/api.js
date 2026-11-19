/* =====================================================
   GARIXOS — Cliente da API (api.js)
   Centraliza as chamadas ao back-end: usa a mesma origem
   do site e envia o token JWT da sessão automaticamente.
===================================================== */
(function () {
  const SESSION_KEY = 'garinxoCurrentUser';

  function getSessao() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch (e) {
      return null;
    }
  }

  function salvarSessao(usuario, token) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...usuario, token }));
  }

  function encerrarSessao() {
    localStorage.removeItem(SESSION_KEY);
  }

  // Aceita tanto '/api/...' quanto URLs antigas 'http://localhost:3000/api/...'
  function normalizarUrl(url) {
    return String(url).replace(/^https?:\/\/localhost:3000/, '');
  }

  async function apiFetch(url, options = {}) {
    const sessao = getSessao();
    const headers = new Headers(options.headers || {});

    if (sessao && sessao.token && !headers.has('Authorization')) {
      headers.set('Authorization', 'Bearer ' + sessao.token);
    }

    const resposta = await fetch(normalizarUrl(url), { ...options, headers });

    // Sessão inválida/expirada: volta para o login (exceto na própria tela de login)
    const naTelaDeLogin = /(^\/$|index\.html$|criarcadastro\.html$)/.test(window.location.pathname);
    if (resposta.status === 401 && !naTelaDeLogin) {
      encerrarSessao();
      window.location.href = 'index.html';
    }

    return resposta;
  }

  window.apiFetch = apiFetch;
  window.GarixosSessao = { get: getSessao, salvar: salvarSessao, encerrar: encerrarSessao };
})();
