const {
  AgendamentoModel,
  ConflitoHorarioError,
  RegraDeNegocioError,
  NaoEncontradoError,
} = require('../models/agendamentoModel');
const BarbeiroModel = require('../models/barbeiroModel');
const ServicoModel = require('../models/servicoModel');

/** RF03 / RN01: Agendamento de horários */
function criarAgendamento(req, res) {
  const { barbeiro_id, servico_id, data, horario } = req.body;
  const cliente_id = req.usuario.id;

  if (!barbeiro_id || !servico_id || !data || !horario) {
    return res
      .status(400)
      .json({ erro: 'Campos obrigatórios: barbeiro_id, servico_id, data, horario.' });
  }

  if (!BarbeiroModel.buscarPorId(barbeiro_id)) {
    return res.status(404).json({ erro: 'Barbeiro não encontrado.' });
  }
  if (!ServicoModel.buscarPorId(servico_id)) {
    return res.status(404).json({ erro: 'Serviço não encontrado.' });
  }

  // Critério de aceitação RF03: não permite agendar no passado
  const dataHora = new Date(`${data}T${horario}:00`);
  if (isNaN(dataHora.getTime()) || dataHora.getTime() < Date.now()) {
    return res.status(400).json({ erro: 'Não é possível agendar em uma data/horário no passado.' });
  }

  try {
    const agendamento = AgendamentoModel.criar({
      cliente_id,
      barbeiro_id,
      servico_id,
      data,
      horario,
    });
    return res.status(201).json({ agendamento });
  } catch (err) {
    if (err instanceof ConflitoHorarioError) {
      return res.status(409).json({ erro: err.message });
    }
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno ao criar agendamento.' });
  }
}

/** RF04: Visualização de horários disponíveis de um barbeiro em uma data */
function horariosDisponiveis(req, res) {
  const { barbeiro_id, data } = req.query;

  if (!barbeiro_id || !data) {
    return res.status(400).json({ erro: 'Parâmetros obrigatórios: barbeiro_id, data.' });
  }
  if (!BarbeiroModel.buscarPorId(barbeiro_id)) {
    return res.status(404).json({ erro: 'Barbeiro não encontrado.' });
  }

  const ABERTURA = 9; // 09:00
  const FECHAMENTO = 19; // 19:00
  const todosHorarios = [];
  for (let h = ABERTURA; h < FECHAMENTO; h++) {
    todosHorarios.push(`${String(h).padStart(2, '0')}:00`);
    todosHorarios.push(`${String(h).padStart(2, '0')}:30`);
  }

  const ocupados = new Set(AgendamentoModel.horariosOcupados(barbeiro_id, data));
  const disponiveis = todosHorarios.filter((h) => !ocupados.has(h));

  return res.json({ data, barbeiro_id: Number(barbeiro_id), horarios_disponiveis: disponiveis });
}

/** RF06: Listagem de agendamentos do cliente autenticado */
function listarMeusAgendamentos(req, res) {
  const agendamentos = AgendamentoModel.listarPorCliente(req.usuario.id);
  return res.json({ agendamentos });
}

/** Listagem de agendamentos do barbeiro autenticado (agenda do barbeiro) */
function listarAgendaBarbeiro(req, res) {
  const { data } = req.query;
  const agendamentos = AgendamentoModel.listarPorBarbeiro(req.usuario.id, data);
  return res.json({ agendamentos });
}

/** Listagem geral (uso administrativo) */
function listarTodosAgendamentos(req, res) {
  const agendamentos = AgendamentoModel.listarTodos();
  return res.json({ agendamentos });
}

/** RF05 / RN02: Cancelamento de agendamentos */
function cancelarAgendamento(req, res) {
  const { id } = req.params;
  const cliente_id = req.usuario.id;

  try {
    const agendamento = AgendamentoModel.cancelar(id, cliente_id);
    return res.json({ mensagem: 'Agendamento cancelado com sucesso.', agendamento });
  } catch (err) {
    if (err instanceof NaoEncontradoError) {
      return res.status(404).json({ erro: err.message });
    }
    if (err instanceof RegraDeNegocioError) {
      return res.status(422).json({ erro: err.message });
    }
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno ao cancelar agendamento.' });
  }
}

module.exports = {
  criarAgendamento,
  horariosDisponiveis,
  listarMeusAgendamentos,
  listarAgendaBarbeiro,
  listarTodosAgendamentos,
  cancelarAgendamento,
};
