const { db } = require('../db/database');

const ClienteModel = {
  criar({ nome, telefone, email, senha_hash }) {
    const stmt = db.prepare(
      'INSERT INTO clientes (nome, telefone, email, senha_hash) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(nome, telefone, email, senha_hash);
    return this.buscarPorId(info.lastInsertRowid);
  },

  buscarPorEmail(email) {
    return db.prepare('SELECT * FROM clientes WHERE email = ?').get(email);
  },

  buscarPorId(id) {
    return db
      .prepare('SELECT id, nome, telefone, email, criado_em FROM clientes WHERE id = ?')
      .get(id);
  },

  listarTodos() {
    return db.prepare('SELECT id, nome, telefone, email, criado_em FROM clientes').all();
  },
};

module.exports = ClienteModel;
