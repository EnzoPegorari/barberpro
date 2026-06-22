const { db } = require('../db/database');

const ServicoModel = {
  listarTodos() {
    return db.prepare('SELECT * FROM servicos ORDER BY nome').all();
  },

  buscarPorId(id) {
    return db.prepare('SELECT * FROM servicos WHERE id = ?').get(id);
  },

  criar({ nome, preco, duracao_minutos }) {
    const stmt = db.prepare(
      'INSERT INTO servicos (nome, preco, duracao_minutos) VALUES (?, ?, ?)'
    );
    const info = stmt.run(nome, preco, duracao_minutos);
    return this.buscarPorId(info.lastInsertRowid);
  },
};

module.exports = ServicoModel;
