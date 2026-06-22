function mostrarTela(idTela) {
  document.querySelectorAll('.tela').forEach((t) => t.classList.remove('ativo'));
  document.getElementById(idTela).classList.add('ativo');
}

function configurarNavegacaoInterna(containerSeletor) {
  const container = document.querySelector(containerSeletor);
  const itens = container.querySelectorAll('.nav-item');
  const secoes = container.parentElement.querySelectorAll('.secao');

  itens.forEach((item) => {
    item.addEventListener('click', () => {
      itens.forEach((i) => i.classList.remove('ativo'));
      item.classList.add('ativo');
      secoes.forEach((s) => s.classList.remove('ativo'));
      const secaoAlvo = Array.from(secoes).find((s) => s.dataset.secao === item.dataset.secao);
      if (secaoAlvo) secaoAlvo.classList.add('ativo');

      if (item.dataset.secao === 'meus-agendamentos') carregarMeusAgendamentos();
      if (item.dataset.secao === 'agendar') carregarHorariosDisponiveis();
    });
  });
}

async function entrarComoCliente(usuario) {
  document.getElementById('cliente-nome-exibicao').textContent = usuario.nome;
  mostrarTela('tela-cliente');
  await inicializarAreaCliente();
}

function entrarComoBarbeiro(usuario) {
  document.getElementById('barbeiro-nome-exibicao').textContent = usuario.nome;
  mostrarTela('tela-barbeiro');
  inicializarAreaBarbeiro();
}

function roteandoSessao() {
  const sessao = API.obterSessao();
  if (!sessao) {
    mostrarTela('tela-auth');
    return;
  }
  if (sessao.tipo === 'cliente') {
    entrarComoCliente(sessao.usuario);
  } else {
    entrarComoBarbeiro(sessao.usuario);
  }
}

window.addEventListener('barberpro:login', (ev) => {
  const sessao = API.obterSessao();
  if (ev.detail.tipo === 'cliente') {
    entrarComoCliente(sessao.usuario);
  } else {
    entrarComoBarbeiro(sessao.usuario);
  }
});

window.addEventListener('barberpro:logout', () => {
  mostrarTela('tela-auth');
});

document.addEventListener('DOMContentLoaded', () => {
  inicializarAuth();
  configurarNavegacaoInterna('#tela-cliente .nav-itens');
  configurarNavegacaoInterna('#tela-barbeiro .nav-itens');
  roteandoSessao();
});
