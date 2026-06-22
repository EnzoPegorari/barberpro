async function carregarAgendaBarbeiro() {
  const data = document.getElementById('agenda-data').value;
  const lista = document.getElementById('lista-agenda');
  lista.innerHTML = '<p class="lista-vazia">Carregando...</p>';

  try {
    const caminho = data ? `/agendamentos/agenda?data=${data}` : '/agendamentos/agenda';
    const resp = await API.api(caminho, { autenticado: true });

    if (resp.agendamentos.length === 0) {
      lista.innerHTML = '<p class="lista-vazia">Nenhum agendamento para esta data.</p>';
      return;
    }

    lista.innerHTML = resp.agendamentos
      .map(
        (a) => `
          <div class="agendamento-card">
            <div class="agendamento-info">
              <h3>${a.cliente_nome} — ${a.servico_nome}</h3>
              <p>${a.data} às ${a.horario}</p>
            </div>
            <span class="agendamento-status">Confirmado</span>
          </div>
        `
      )
      .join('');
  } catch (err) {
    lista.innerHTML = '<p class="lista-vazia">Erro ao carregar agenda.</p>';
    mostrarToast(err.message, 'erro');
  }
}

function inicializarAreaBarbeiro() {
  const inputData = document.getElementById('agenda-data');
  inputData.value = new Date().toISOString().split('T')[0];
  inputData.addEventListener('change', carregarAgendaBarbeiro);
  carregarAgendaBarbeiro();
}
