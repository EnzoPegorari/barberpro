const { db } = require('../db/database');

const AgendamentoModel = {
  /**
   * RF03 / RN01: cria um agendamento somente se o horário do barbeiro
   * estiver livre naquela data/hora (não permite horários duplicados).
   */
  criar({ cliente_id, barbeiro_id, servico_id, data, horario }) {
    const conflito = this.existeConflito({ barbeiro_id, data, horario });
    if (conflito) {
      throw new ConflitoHorarioError(
        'Horário indisponível: já existe um agendamento confirmado para este barbeiro nesta data e horário.'
      );
    }

    const stmt = db.prepare(`
      INSERT INTO agendamentos (cliente_id, barbeiro_id, servico_id, data, horario, status)
      VALUES (?, ?, ?, ?, ?, 'confirmado')
    `);
    const info = stmt.run(cliente_id, barbeiro_id, servico_id, data, horario);
    return this.buscarPorId(info.lastInsertRowid);
  },

  existeConflito({ barbeiro_id, data, horario }) {
    const row = db
      .prepare(
        `SELECT id FROM agendamentos
         WHERE barbeiro_id = ? AND data = ? AND horario = ? AND status = 'confirmado'`
      )
      .get(barbeiro_id, data, horario);
    return !!row;
  },

  buscarPorId(id) {
    return db
      .prepare(
        `SELECT a.*, c.nome AS cliente_nome, b.nome AS barbeiro_nome, s.nome AS servico_nome, s.preco AS servico_preco
         FROM agendamentos a
         JOIN clientes c ON c.id = a.cliente_id
         JOIN barbeiros b ON b.id = a.barbeiro_id
         JOIN servicos s ON s.id = a.servico_id
         WHERE a.id = ?`
      )
      .get(id);
  },

  listarPorCliente(cliente_id) {
    return db
      .prepare(
        `SELECT a.*, b.nome AS barbeiro_nome, s.nome AS servico_nome, s.preco AS servico_preco
         FROM agendamentos a
         JOIN barbeiros b ON b.id = a.barbeiro_id
         JOIN servicos s ON s.id = a.servico_id
         WHERE a.cliente_id = ?
         ORDER BY a.data, a.horario`
      )
      .all(cliente_id);
  },

  listarPorBarbeiro(barbeiro_id, data) {
    if (data) {
      return db
        .prepare(
          `SELECT a.*, c.nome AS cliente_nome, s.nome AS servico_nome
           FROM agendamentos a
           JOIN clientes c ON c.id = a.cliente_id
           JOIN servicos s ON s.id = a.servico_id
           WHERE a.barbeiro_id = ? AND a.data = ? AND a.status = 'confirmado'
           ORDER BY a.horario`
        )
        .all(barbeiro_id, data);
    }
    return db
      .prepare(
        `SELECT a.*, c.nome AS cliente_nome, s.nome AS servico_nome
         FROM agendamentos a
         JOIN clientes c ON c.id = a.cliente_id
         JOIN servicos s ON s.id = a.servico_id
         WHERE a.barbeiro_id = ? AND a.status = 'confirmado'
         ORDER BY a.data, a.horario`
      )
      .all(barbeiro_id);
  },

  listarTodos() {
    return db
      .prepare(
        `SELECT a.*, c.nome AS cliente_nome, b.nome AS barbeiro_nome, s.nome AS servico_nome
         FROM agendamentos a
         JOIN clientes c ON c.id = a.cliente_id
         JOIN barbeiros b ON b.id = a.barbeiro_id
         JOIN servicos s ON s.id = a.servico_id
         ORDER BY a.data, a.horario`
      )
      .all();
  },

  /**
   * RF05 / RN02: cancela um agendamento somente se faltarem mais de
   * 1 hora para o horário marcado (cancelamento até 1h antes).
   * `agora` é injetável para permitir testes determinísticos.
   */
  cancelar(id, cliente_id, agora = new Date()) {
    const agendamento = db
      .prepare('SELECT * FROM agendamentos WHERE id = ? AND cliente_id = ?')
      .get(id, cliente_id);

    if (!agendamento) {
      throw new NaoEncontradoError('Agendamento não encontrado para este cliente.');
    }

    if (agendamento.status === 'cancelado') {
      throw new RegraDeNegocioError('Este agendamento já está cancelado.');
    }

    const dataHoraAgendamento = new Date(`${agendamento.data}T${agendamento.horario}:00`);
    const diferencaMs = dataHoraAgendamento.getTime() - agora.getTime();
    const umaHoraMs = 60 * 60 * 1000;

    if (diferencaMs < umaHoraMs) {
      throw new RegraDeNegocioError(
        'Cancelamento não permitido: o prazo mínimo de 1 hora de antecedência não foi respeitado.'
      );
    }

    db.prepare("UPDATE agendamentos SET status = 'cancelado' WHERE id = ?").run(id);
    return this.buscarPorId(id);
  },

  /** Horários ocupados (confirmados) de um barbeiro em uma data — usado em RF04. */
  horariosOcupados(barbeiro_id, data) {
    return db
      .prepare(
        `SELECT horario FROM agendamentos WHERE barbeiro_id = ? AND data = ? AND status = 'confirmado'`
      )
      .all(barbeiro_id, data)
      .map((r) => r.horario);
  },
};

class ConflitoHorarioError extends Error {}
class RegraDeNegocioError extends Error {}
class NaoEncontradoError extends Error {}

module.exports = {
  AgendamentoModel,
  ConflitoHorarioError,
  RegraDeNegocioError,
  NaoEncontradoError,
};
