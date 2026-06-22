-- Schema do banco de dados BarberPro
-- Baseado no Diagrama de Classes Conceitual (Trabalho 1, seção 4.3)

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS barbeiros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  especialidade TEXT,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS servicos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  preco REAL NOT NULL,
  duracao_minutos INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  barbeiro_id INTEGER NOT NULL,
  servico_id INTEGER NOT NULL,
  data TEXT NOT NULL,       -- formato YYYY-MM-DD
  horario TEXT NOT NULL,    -- formato HH:MM
  status TEXT NOT NULL DEFAULT 'confirmado', -- confirmado | cancelado
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (barbeiro_id) REFERENCES barbeiros(id),
  FOREIGN KEY (servico_id) REFERENCES servicos(id),
  -- RN01: Não permitir horários duplicados para o mesmo barbeiro
  UNIQUE (barbeiro_id, data, horario, status)
);

CREATE TABLE IF NOT EXISTS administradores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL
);
