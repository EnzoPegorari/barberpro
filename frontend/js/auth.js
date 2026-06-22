function mostrarToast(mensagem, tipo = 'sucesso') {
  const toast = document.getElementById('toast');
  toast.textContent = mensagem;
  toast.className = `toast visivel ${tipo === 'erro' ? 'erro' : ''}`;
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.remove('visivel');
  }, 3200);
}

function configurarAbasAuth() {
  const abas = document.querySelectorAll('.auth-tab');
  abas.forEach((aba) => {
    aba.addEventListener('click', () => {
      abas.forEach((a) => a.classList.remove('ativo'));
      aba.classList.add('ativo');
      document.querySelectorAll('.auth-form').forEach((f) => f.classList.remove('ativo'));
      document.querySelector(`.auth-form[data-form="${aba.dataset.tab}"]`).classList.add('ativo');
    });
  });
}

function configurarCampoEspecialidade() {
  const tipoSelect = document.getElementById('cadastro-tipo');
  const campoEspecialidade = document.querySelector('.campo-especialidade');
  tipoSelect.addEventListener('change', () => {
    campoEspecialidade.classList.toggle('oculto', tipoSelect.value !== 'barbeiro');
  });
}

function configurarFormLogin() {
  const form = document.getElementById('form-login');
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const erroEl = document.getElementById('login-erro');
    erroEl.textContent = '';

    const tipo = document.getElementById('login-tipo').value;
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;

    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;

    try {
      const resp = await API.api('/auth/login', {
        metodo: 'POST',
        corpo: { email, senha, tipo },
      });
      API.salvarSessao({ token: resp.token, usuario: resp.usuario, tipo });
      mostrarToast(`Bem-vindo(a), ${resp.usuario.nome}!`);
      window.dispatchEvent(new CustomEvent('barberpro:login', { detail: { tipo } }));
    } catch (err) {
      erroEl.textContent = err.message;
    } finally {
      botao.disabled = false;
    }
  });
}

function configurarFormCadastro() {
  const form = document.getElementById('form-cadastro');
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const erroEl = document.getElementById('cadastro-erro');
    erroEl.textContent = '';

    const tipo = document.getElementById('cadastro-tipo').value;
    const nome = document.getElementById('cadastro-nome').value.trim();
    const telefone = document.getElementById('cadastro-telefone').value.trim();
    const especialidade = document.getElementById('cadastro-especialidade').value.trim();
    const email = document.getElementById('cadastro-email').value.trim();
    const senha = document.getElementById('cadastro-senha').value;

    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;

    try {
      const caminho = tipo === 'cliente' ? '/auth/registro/cliente' : '/auth/registro/barbeiro';
      const corpo =
        tipo === 'cliente'
          ? { nome, telefone, email, senha }
          : { nome, telefone, especialidade, email, senha };

      const resp = await API.api(caminho, { metodo: 'POST', corpo });
      const usuario = tipo === 'cliente' ? resp.cliente : resp.barbeiro;
      API.salvarSessao({ token: resp.token, usuario, tipo });
      mostrarToast('Conta criada com sucesso!');
      window.dispatchEvent(new CustomEvent('barberpro:login', { detail: { tipo } }));
    } catch (err) {
      erroEl.textContent = err.message;
    } finally {
      botao.disabled = false;
    }
  });
}

function configurarLogout() {
  ['btn-logout-cliente', 'btn-logout-barbeiro'].forEach((id) => {
    const botao = document.getElementById(id);
    botao.addEventListener('click', () => {
      API.limparSessao();
      window.dispatchEvent(new CustomEvent('barberpro:logout'));
    });
  });
}

function inicializarAuth() {
  configurarAbasAuth();
  configurarCampoEspecialidade();
  configurarFormLogin();
  configurarFormCadastro();
  configurarLogout();
}
