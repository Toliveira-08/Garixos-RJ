require('dotenv').config({ quiet: true });

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(helmet({ contentSecurityPolicy: false })); // CSP desligada: o front usa CDNs (Leaflet, Font Awesome...)
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '100kb' }));

// Front-end estático (HTML, CSS, JS e imagens)
app.use(express.static(path.join(__dirname, 'public')));

// API
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', require('./routes/auth'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/enderecos', require('./routes/enderecos'));
app.use('/api/solicitacoes', require('./routes/solicitacoes'));
app.use('/api/suporte', require('./routes/suporte'));
app.use('/api/assistant', require('./routes/assistente'));

const { empresas, zonas, veiculos } = require('./routes/cadastrosBase');
app.use('/api/empresas', empresas);
app.use('/api/zonas', zonas);
app.use('/api/veiculos', veiculos);

app.use('/api', (req, res) => res.status(404).json({ mensagem: 'Rota não encontrada.' }));

// Tratamento central de erros (o Express 5 encaminha erros de rotas async para cá)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    mensagem: status >= 500 ? 'Erro interno no servidor.' : err.message
  });
});

module.exports = app;
