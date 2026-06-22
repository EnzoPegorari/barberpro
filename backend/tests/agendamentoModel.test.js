const { construirAppDeTeste, limparBanco, db } = require('./setup');
const {
  AgendamentoModel,
  ConflitoHorarioError,
  RegraDeNegocioError,
  NaoEncontradoError,
} = require('../src/models/agendamentoModel');
const ClienteModel = require('../src/models/clienteModel');
const BarbeiroModel = require('../src/models/barbeiroModel');
const ServicoModel = require('../src/models/servicoModel');

describe('AgendamentoModel (unitário)', () => {
  let cliente, barbeiro, servico;

  beforeAll(() => {
    construirAppDeTeste();
  });

  beforeEach(() => {
    limparBanco();
    cliente = ClienteModel.criar({
      nome: 'Cliente Teste',
      telefone: '16999999999',
      email: `cliente_${Date.now()}_${Math.random()}@teste.com`,
      senha_hash: 'hash',
    });
    barbeiro = BarbeiroModel.criar({
      nome: 'Barbeiro Teste',
      telefone: '16988888888',
      especialidade: 'Geral',
      email: `barbeiro_${Date.now()}_${Math.random()}@teste.com`,
      senha_hash: 'hash',
    });
    servico = ServicoModel.listarTodos()[0];
  });

  test('RF03: cria um agendamento válido com sucesso', () => {
    const agendamento = AgendamentoModel.criar({
      cliente_id: cliente.id,
      barbeiro_id: barbeiro.id,
      servico_id: servico.id,
      data: '2030-01-10',
      horario: '10:00',
    });

    expect(agendamento).toHaveProperty('id');
    expect(agendamento.status).toBe('confirmado');
    expect(agendamento.cliente_nome).toBe('Cliente Teste');
  });

  test('RN01: não permite criar agendamento em horário já ocupado pelo mesmo barbeiro', () => {
    AgendamentoModel.criar({
      cliente_id: cliente.id,
      barbeiro_id: barbeiro.id,
      servico_id: servico.id,
      data: '2030-01-10',
      horario: '10:00',
    });

    expect(() =>
      AgendamentoModel.criar({
        cliente_id: cliente.id,
        barbeiro_id: barbeiro.id,
        servico_id: servico.id,
        data: '2030-01-10',
        horario: '10:00',
      })
    ).toThrow(ConflitoHorarioError);
  });

  test('RN01: permite o mesmo horário em data diferente', () => {
    AgendamentoModel.criar({
      cliente_id: cliente.id,
      barbeiro_id: barbeiro.id,
      servico_id: servico.id,
      data: '2030-01-10',
      horario: '10:00',
    });

    expect(() =>
      AgendamentoModel.criar({
        cliente_id: cliente.id,
        barbeiro_id: barbeiro.id,
        servico_id: servico.id,
        data: '2030-01-11', // dia diferente
        horario: '10:00',
      })
    ).not.toThrow();
  });

  test('RN01: permite mesmo horário com barbeiros diferentes', () => {
    const outroBarbeiro = BarbeiroModel.criar({
      nome: 'Outro Barbeiro',
      telefone: '16977777777',
      especialidade: 'Barba',
      email: `outro_${Date.now()}@teste.com`,
      senha_hash: 'hash',
    });

    AgendamentoModel.criar({
      cliente_id: cliente.id,
      barbeiro_id: barbeiro.id,
      servico_id: servico.id,
      data: '2030-01-10',
      horario: '10:00',
    });

    expect(() =>
      AgendamentoModel.criar({
        cliente_id: cliente.id,
        barbeiro_id: outroBarbeiro.id,
        servico_id: servico.id,
        data: '2030-01-10',
        horario: '10:00',
      })
    ).not.toThrow();
  });

  test('RN02: cancela com sucesso quando há mais de 1h de antecedência', () => {
    const agora = new Date('2030-01-10T08:00:00');
    const agendamento = AgendamentoModel.criar({
      cliente_id: cliente.id,
      barbeiro_id: barbeiro.id,
      servico_id: servico.id,
      data: '2030-01-10',
      horario: '10:00', // 2h de diferença
    });

    const cancelado = AgendamentoModel.cancelar(agendamento.id, cliente.id, agora);
    expect(cancelado.status).toBe('cancelado');
  });

  test('RN02: rejeita cancelamento com menos de 1h de antecedência', () => {
    const agora = new Date('2030-01-10T09:30:00');
    const agendamento = AgendamentoModel.criar({
      cliente_id: cliente.id,
      barbeiro_id: barbeiro.id,
      servico_id: servico.id,
      data: '2030-01-10',
      horario: '10:00', // 30 min de diferença
    });

    expect(() => AgendamentoModel.cancelar(agendamento.id, cliente.id, agora)).toThrow(
      RegraDeNegocioError
    );
  });

  test('RN02: rejeita cancelamento de agendamento já cancelado', () => {
    const agora = new Date('2030-01-10T08:00:00');
    const agendamento = AgendamentoModel.criar({
      cliente_id: cliente.id,
      barbeiro_id: barbeiro.id,
      servico_id: servico.id,
      data: '2030-01-10',
      horario: '10:00',
    });

    AgendamentoModel.cancelar(agendamento.id, cliente.id, agora);

    expect(() => AgendamentoModel.cancelar(agendamento.id, cliente.id, agora)).toThrow(
      RegraDeNegocioError
    );
  });

  test('rejeita cancelamento de agendamento de outro cliente', () => {
    const outroCliente = ClienteModel.criar({
      nome: 'Outro Cliente',
      telefone: '16966666666',
      email: `outrocliente_${Date.now()}@teste.com`,
      senha_hash: 'hash',
    });

    const agendamento = AgendamentoModel.criar({
      cliente_id: cliente.id,
      barbeiro_id: barbeiro.id,
      servico_id: servico.id,
      data: '2030-01-10',
      horario: '10:00',
    });

    expect(() =>
      AgendamentoModel.cancelar(agendamento.id, outroCliente.id, new Date('2030-01-10T08:00:00'))
    ).toThrow(NaoEncontradoError);
  });

  test('horario liberado após cancelamento pode ser reagendado', () => {
    const agora = new Date('2030-01-10T08:00:00');
    const agendamento = AgendamentoModel.criar({
      cliente_id: cliente.id,
      barbeiro_id: barbeiro.id,
      servico_id: servico.id,
      data: '2030-01-10',
      horario: '10:00',
    });

    AgendamentoModel.cancelar(agendamento.id, cliente.id, agora);

    expect(() =>
      AgendamentoModel.criar({
        cliente_id: cliente.id,
        barbeiro_id: barbeiro.id,
        servico_id: servico.id,
        data: '2030-01-10',
        horario: '10:00',
      })
    ).not.toThrow();
  });
});
