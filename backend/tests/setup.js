// Garante banco em memória ANTES de qualquer require do app/db
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test_secret';

const criarApp = require('../src/app');
const { initSchema, seed, db } = require('../src/db/database');

function construirAppDeTeste() {
  initSchema();
  seed();
  return criarApp();
}

function limparBanco() {
  db.exec('DELETE FROM agendamentos');
  db.exec('DELETE FROM clientes');
  db.exec('DELETE FROM barbeiros');
  db.exec('DELETE FROM administradores');
}

module.exports = { construirAppDeTeste, limparBanco, db };
