const { db } = require('../db/database');

const BarbeiroModel = {
  criar({ nome, telefone, especialidade, email, senha_hash }) {
    const stmt = db.prepare(
      'INSERT INTO barbeiros (nome, telefone, especialidade, email, senha_hash) VALUES (?, ?, ?, ?, ?)'
    );
    const info = stmt.run(nome, telefone, especialidade || null, email, senha_hash);
    return this.buscarPorId(info.lastInsertRowid);
  },

  buscarPorEmail(email) {
    return db.prepare('SELECT * FROM barbeiros WHERE email = ?').get(email);
  },

  buscarPorId(id) {
    return db
      .prepare(
        'SELECT id, nome, telefone, especialidade, email, criado_em FROM barbeiros WHERE id = ?'
      )
      .get(id);
  },

  listarTodos() {
    return db
      .prepare('SELECT id, nome, telefone, especialidade, email, criado_em FROM barbeiros')
      .all();
  },
};

module.exports = BarbeiroModel;
