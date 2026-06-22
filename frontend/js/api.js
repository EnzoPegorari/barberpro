const API_BASE = '/api';

function obterToken() {
  return localStorage.getItem('barberpro_token');
}

function salvarSessao({ token, usuario, tipo }) {
  localStorage.setItem('barberpro_token', token);
  localStorage.setItem('barberpro_usuario', JSON.stringify(usuario));
  localStorage.setItem('barberpro_tipo', tipo);
}

function obterSessao() {
  const token = obterToken();
  const usuarioRaw = localStorage.getItem('barberpro_usuario');
  const tipo = localStorage.getItem('barberpro_tipo');
  if (!token || !usuarioRaw || !tipo) return null;
  return { token, usuario: JSON.parse(usuarioRaw), tipo };
}

function limparSessao() {
  localStorage.removeItem('barberpro_token');
  localStorage.removeItem('barberpro_usuario');
  localStorage.removeItem('barberpro_tipo');
}

async function api(caminho, { metodo = 'GET', corpo = null, autenticado = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (autenticado) {
    const token = obterToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const resposta = await fetch(`${API_BASE}${caminho}`, {
    method: metodo,
    headers,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const erro = new Error(dados.erro || 'Erro inesperado na comunicação com o servidor.');
    erro.status = resposta.status;
    throw erro;
  }

  return dados;
}

const API = { api, salvarSessao, obterSessao, limparSessao, obterToken };
