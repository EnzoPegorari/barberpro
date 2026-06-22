let horarioSelecionado = null;

function moverPonteiroRelogio(horario) {
  const ponteiro = document.getElementById('relogio-ponteiro');
  if (!horario) {
    ponteiro.setAttribute('transform', 'rotate(0)');
    return;
  }
  const [h, m] = horario.split(':').map(Number);
  const minutosTotais = (h % 12) * 60 + m;
  const graus = (minutosTotais / 720) * 360;
  ponteiro.setAttribute('transform', `rotate(${graus})`);
}

async function carregarBarbeirosEServicos() {
  const [resBarbeiros, resServicos] = await Promise.all([
    API.api('/barbeiros'),
    API.api('/servicos'),
  ]);

  const selectBarbeiro = document.getElementById('agendar-barbeiro');
  selectBarbeiro.innerHTML = resBarbeiros.barbeiros
    .map((b) => `<option value="${b.id}">${b.nome}${b.especialidade ? ' — ' + b.especialidade : ''}</option>`)
    .join('');

  const selectServico = document.getElementById('agendar-servico');
  selectServico.innerHTML = resServicos.servicos
    .map((s) => `<option value="${s.id}">${s.nome} (R$ ${s.preco.toFixed(2)})</option>`)
    .join('');
}

function dataMinimaHoje() {
  const hoje = new Date();
  return hoje.toISOString().split('T')[0];
}

async function carregarHorariosDisponiveis() {
  const barbeiroId = document.getElementById('agendar-barbeiro').value;
  const data = document.getElementById('agendar-data').value;
  const grade = document.getElementById('horarios-grade');
  const legenda = document.getElementById('relogio-legenda');

  horarioSelecionado = null;
  moverPonteiroRelogio(null);

  if (!barbeiroId || !data) {
    grade.innerHTML = '';
    legenda.textContent = 'Selecione barbeiro e data para ver horários';
    return;
  }

  legenda.textContent = 'Carregando horários...';

  try {
    const resp = await API.api(`/agendamentos/disponiveis?barbeiro_id=${barbeiroId}&data=${data}`);
    if (resp.horarios_disponiveis.length === 0) {
      grade.innerHTML = '<p class="lista-vazia">Nenhum horário disponível nesta data.</p>';
      legenda.textContent = 'Sem horários livres';
      return;
    }

    grade.innerHTML = resp.horarios_disponiveis
      .map((h) => `<button type="button" class="horario-slot" data-horario="${h}">${h}</button>`)
      .join('');

    legenda.textContent = `${resp.horarios_disponiveis.length} horário(s) disponível(is)`;

    grade.querySelectorAll('.horario-slot').forEach((slot) => {
      slot.addEventListener('click', () => {
        grade.querySelectorAll('.horario-slot').forEach((s) => s.classList.remove('selecionado'));
        slot.classList.add('selecionado');
        horarioSelecionado = slot.dataset.horario;
        moverPonteiroRelogio(horarioSelecionado);
        legenda.textContent = `Horário selecionado: ${horarioSelecionado}`;
        confirmarAgendamento();
      });
    });
  } catch (err) {
    legenda.textContent = 'Erro ao carregar horários';
    mostrarToast(err.message, 'erro');
  }
}

async function confirmarAgendamento() {
  const mensagemEl = document.getElementById('agendar-mensagem');
  mensagemEl.textContent = '';
  mensagemEl.className = 'mensagem';

  if (!horarioSelecionado) return;

  const barbeiro_id = Number(document.getElementById('agendar-barbeiro').value);
  const servico_id = Number(document.getElementById('agendar-servico').value);
  const data = document.getElementById('agendar-data').value;

  try {
    await API.api('/agendamentos', {
      metodo: 'POST',
      autenticado: true,
      corpo: { barbeiro_id, servico_id, data, horario: horarioSelecionado },
    });
    mensagemEl.textContent = `Agendamento confirmado para ${data} às ${horarioSelecionado}.`;
    mensagemEl.className = 'mensagem sucesso';
    mostrarToast('Agendamento criado com sucesso!');
    horarioSelecionado = null;
    await carregarHorariosDisponiveis();
  } catch (err) {
    mensagemEl.textContent = err.message;
    mensagemEl.className = 'mensagem erro';
    mostrarToast(err.message, 'erro');
    await carregarHorariosDisponiveis(); // recarrega para refletir possível conflito (RN01)
  }
}

function formatarStatus(status) {
  return status === 'cancelado' ? 'Cancelado' : 'Confirmado';
}

async function carregarMeusAgendamentos() {
  const lista = document.getElementById('lista-meus-agendamentos');
  lista.innerHTML = '<p class="lista-vazia">Carregando...</p>';

  try {
    const resp = await API.api('/agendamentos/meus', { autenticado: true });
    if (resp.agendamentos.length === 0) {
      lista.innerHTML = '<p class="lista-vazia">Você ainda não tem agendamentos.</p>';
      return;
    }

    lista.innerHTML = resp.agendamentos
      .map((a) => {
        const cancelado = a.status === 'cancelado';
        return `
          <div class="agendamento-card ${cancelado ? 'cancelado' : ''}">
            <div class="agendamento-info">
              <h3>${a.servico_nome} com ${a.barbeiro_nome}</h3>
              <p>${a.data} às ${a.horario} — R$ ${Number(a.servico_preco).toFixed(2)}</p>
            </div>
            <span class="agendamento-status ${cancelado ? 'cancelado' : ''}">${formatarStatus(a.status)}</span>
            ${!cancelado ? `<button class="botao botao-cancelar" data-id="${a.id}">Cancelar</button>` : ''}
          </div>
        `;
      })
      .join('');

    lista.querySelectorAll('.botao-cancelar').forEach((botao) => {
      botao.addEventListener('click', () => cancelarAgendamento(botao.dataset.id));
    });
  } catch (err) {
    lista.innerHTML = `<p class="lista-vazia">Erro ao carregar agendamentos.</p>`;
    mostrarToast(err.message, 'erro');
  }
}

async function cancelarAgendamento(id) {
  try {
    await API.api(`/agendamentos/${id}`, { metodo: 'DELETE', autenticado: true });
    mostrarToast('Agendamento cancelado.');
    await carregarMeusAgendamentos();
  } catch (err) {
    mostrarToast(err.message, 'erro'); // ex: RN02 — fora do prazo de 1h
  }
}

async function inicializarAreaCliente() {
  document.getElementById('agendar-data').min = dataMinimaHoje();

  await carregarBarbeirosEServicos();
  await carregarHorariosDisponiveis();

  document.getElementById('agendar-barbeiro').addEventListener('change', carregarHorariosDisponiveis);
  document.getElementById('agendar-servico').addEventListener('change', () => {
    if (horarioSelecionado) confirmarAgendamento();
  });
  document.getElementById('agendar-data').addEventListener('change', carregarHorariosDisponiveis);
}
