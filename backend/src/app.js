const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const agendamentoRoutes = require('./routes/agendamentoRoutes');
const catalogoRoutes = require('./routes/catalogoRoutes');

function criarApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Serve o frontend estático (HTML/CSS/JS puro)
  app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

  // Healthcheck (usado pelo Docker e pelo CI)
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', servico: 'BarberPro API', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/agendamentos', agendamentoRoutes);
  app.use('/api', catalogoRoutes);

  // 404 para rotas de API não encontradas
  app.use('/api', (req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada.' });
  });

  // Tratamento de erros não previstos
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  });

  return app;
}

module.exports = criarApp;
