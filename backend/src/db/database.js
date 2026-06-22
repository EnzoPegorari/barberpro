const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'barberpro.db');

// Garante que o diretório de dados existe (não aplicável para ':memory:')
if (DB_PATH !== ':memory:') {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

function initSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
}

function seed() {
  const count = db.prepare('SELECT COUNT(*) AS total FROM servicos').get().total;
  if (count > 0) return; // já populado

  const insertServico = db.prepare(
    'INSERT INTO servicos (nome, preco, duracao_minutos) VALUES (?, ?, ?)'
  );
  insertServico.run('Corte de Cabelo', 40.0, 30);
  insertServico.run('Barba', 30.0, 20);
  insertServico.run('Corte + Barba', 65.0, 50);
  insertServico.run('Sobrancelha', 15.0, 10);
}

module.exports = { db, initSchema, seed };
