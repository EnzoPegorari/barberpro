const request = require('supertest');
const { construirAppDeTeste, limparBanco } = require('./setup');

let app;

beforeAll(() => {
  app = construirAppDeTeste();
});

beforeEach(() => {
  limparBanco();
});

function emailUnico(prefixo) {
  return `${prefixo}_${Date.now()}_${Math.random().toString(36).slice(2)}@teste.com`;
}

describe('RF01 - Cadastro de clientes', () => {
  test('cadastra um novo cliente com sucesso', async () => {
    const res = await request(app).post('/api/auth/registro/cliente').send({
      nome: 'Maria Souza',
      telefone: '16999998888',
      email: emailUnico('maria'),
      senha: 'senha123',
    });

    expect(res.status).toBe(201);
    expect(res.body.cliente).toHaveProperty('id');
    expect(res.body).toHaveProperty('token');
  });

  test('rejeita cadastro com e-mail duplicado', async () => {
    const email = emailUnico('dup');
    const payload = { nome: 'A', telefone: '16900000000', email, senha: 'senha123' };

    await request(app).post('/api/auth/registro/cliente').send(payload);
    const res = await request(app).post('/api/auth/registro/cliente').send(payload);

    expect(res.status).toBe(409);
  });

  test('rejeita cadastro com campos faltando', async () => {
    const res = await request(app)
      .post('/api/auth/registro/cliente')
      .send({ nome: 'Sem email' });

    expect(res.status).toBe(400);
  });
});

describe('RF02 - Login de usuários', () => {
  test('realiza login de cliente com credenciais corretas', async () => {
    const email = emailUnico('login');
    await request(app)
      .post('/api/auth/registro/cliente')
      .send({ nome: 'Login Teste', telefone: '16900000000', email, senha: 'minhasenha' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, senha: 'minhasenha', tipo: 'cliente' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('rejeita login com senha incorreta', async () => {
    const email = emailUnico('loginerro');
    await request(app)
      .post('/api/auth/registro/cliente')
      .send({ nome: 'Login Erro', telefone: '16900000000', email, senha: 'minhasenha' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, senha: 'errada', tipo: 'cliente' });

    expect(res.status).toBe(401);
  });
});

describe('Fluxo completo end-to-end: registro -> login -> agendar -> listar -> cancelar', () => {
  test('executa o fluxo principal do sistema com sucesso', async () => {
    // 1. Registrar barbeiro
    const emailBarbeiro = emailUnico('barbeiro');
    const resBarbeiro = await request(app).post('/api/auth/registro/barbeiro').send({
      nome: 'Carlos Barbeiro',
      telefone: '16911112222',
      especialidade: 'Corte e barba',
      email: emailBarbeiro,
      senha: 'senha123',
    });
    expect(resBarbeiro.status).toBe(201);
    const barbeiroId = resBarbeiro.body.barbeiro.id;

    // 2. Registrar cliente
    const emailCliente = emailUnico('cliente');
    const resCliente = await request(app).post('/api/auth/registro/cliente').send({
      nome: 'Ana Cliente',
      telefone: '16933334444',
      email: emailCliente,
      senha: 'senha123',
    });
    expect(resCliente.status).toBe(201);
    const tokenCliente = resCliente.body.token;

    // 3. Consultar serviços disponíveis (RF: catálogo)
    const resServicos = await request(app).get('/api/servicos');
    expect(resServicos.status).toBe(200);
    const servicoId = resServicos.body.servicos[0].id;

    // 4. Consultar horários disponíveis do barbeiro (RF04)
    const resDisponiveis = await request(app)
      .get('/api/agendamentos/disponiveis')
      .query({ barbeiro_id: barbeiroId, data: '2030-03-15' });
    expect(resDisponiveis.status).toBe(200);
    expect(resDisponiveis.body.horarios_disponiveis).toContain('14:00');

    // 5. Criar agendamento (RF03)
    const resAgendamento = await request(app)
      .post('/api/agendamentos')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ barbeiro_id: barbeiroId, servico_id: servicoId, data: '2030-03-15', horario: '14:00' });
    expect(resAgendamento.status).toBe(201);
    const agendamentoId = resAgendamento.body.agendamento.id;

    // 6. Tentar agendar o mesmo horário novamente -> deve falhar (RN01)
    const resConflito = await request(app)
      .post('/api/agendamentos')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ barbeiro_id: barbeiroId, servico_id: servicoId, data: '2030-03-15', horario: '14:00' });
    expect(resConflito.status).toBe(409);

    // 7. Listar meus agendamentos (RF06)
    const resListar = await request(app)
      .get('/api/agendamentos/meus')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(resListar.status).toBe(200);
    expect(resListar.body.agendamentos).toHaveLength(1);
    expect(resListar.body.agendamentos[0].status).toBe('confirmado');

    // 8. Cancelar o agendamento (RF05) — bem distante no futuro, dentro do prazo
    const resCancelar = await request(app)
      .delete(`/api/agendamentos/${agendamentoId}`)
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(resCancelar.status).toBe(200);
    expect(resCancelar.body.agendamento.status).toBe('cancelado');

    // 9. Confirmar que o horário foi liberado (RF04 novamente)
    const resDisponiveisDepois = await request(app)
      .get('/api/agendamentos/disponiveis')
      .query({ barbeiro_id: barbeiroId, data: '2030-03-15' });
    expect(resDisponiveisDepois.body.horarios_disponiveis).toContain('14:00');
  });
});

describe('Segurança e autorização', () => {
  test('rejeita criação de agendamento sem token', async () => {
    const res = await request(app)
      .post('/api/agendamentos')
      .send({ barbeiro_id: 1, servico_id: 1, data: '2030-01-01', horario: '10:00' });

    expect(res.status).toBe(401);
  });

  test('rejeita acesso de barbeiro a rota exclusiva de cliente', async () => {
    const emailBarbeiro = emailUnico('barbsec');
    const resBarbeiro = await request(app).post('/api/auth/registro/barbeiro').send({
      nome: 'Barbeiro Seguro',
      telefone: '16900001111',
      email: emailBarbeiro,
      senha: 'senha123',
    });
    const tokenBarbeiro = resBarbeiro.body.token;

    const res = await request(app)
      .post('/api/agendamentos')
      .set('Authorization', `Bearer ${tokenBarbeiro}`)
      .send({ barbeiro_id: 1, servico_id: 1, data: '2030-01-01', horario: '10:00' });

    expect(res.status).toBe(403);
  });
});

describe('Healthcheck', () => {
  test('retorna status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
