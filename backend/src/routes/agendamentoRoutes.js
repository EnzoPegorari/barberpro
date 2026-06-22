const express = require('express');
const router = express.Router();
const agendamentoController = require('../controllers/agendamentoController');
const { autenticar, autorizar } = require('../middleware/auth');

// RF04: consulta pública de horários disponíveis (não exige login para visualizar)
router.get('/disponiveis', agendamentoController.horariosDisponiveis);

// RF03: criar agendamento — somente cliente autenticado
router.post('/', autenticar, autorizar('cliente'), agendamentoController.criarAgendamento);

// RF06: listar agendamentos do cliente autenticado
router.get('/meus', autenticar, autorizar('cliente'), agendamentoController.listarMeusAgendamentos);

// Agenda do barbeiro autenticado
router.get(
  '/agenda',
  autenticar,
  autorizar('barbeiro'),
  agendamentoController.listarAgendaBarbeiro
);

// Listagem geral (administrativo) — qualquer usuário autenticado pode listar todos
router.get(
  '/todos',
  autenticar,
  autorizar('barbeiro'),
  agendamentoController.listarTodosAgendamentos
);

// RF05: cancelar agendamento — somente o cliente dono do agendamento
router.delete('/:id', autenticar, autorizar('cliente'), agendamentoController.cancelarAgendamento);

module.exports = router;
