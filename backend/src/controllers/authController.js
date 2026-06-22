const bcrypt = require('bcryptjs');
const ClienteModel = require('../models/clienteModel');
const BarbeiroModel = require('../models/barbeiroModel');
const { gerarToken } = require('../middleware/auth');

const SALT_ROUNDS = 10;

/** RF01: Cadastro de clientes */
function registrarCliente(req, res) {
  const { nome, telefone, email, senha } = req.body;

  if (!nome || !telefone || !email || !senha) {
    return res.status(400).json({ erro: 'Campos obrigatórios: nome, telefone, email, senha.' });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter ao menos 6 caracteres.' });
  }
  if (ClienteModel.buscarPorEmail(email)) {
    return res.status(409).json({ erro: 'Já existe um cliente cadastrado com este e-mail.' });
  }

  const senha_hash = bcrypt.hashSync(senha, SALT_ROUNDS);
  const cliente = ClienteModel.criar({ nome, telefone, email, senha_hash });
  const token = gerarToken({ id: cliente.id, tipo: 'cliente', email: cliente.email });

  return res.status(201).json({ cliente, token });
}

/** RF02: Login de usuários (cliente ou barbeiro) */
function login(req, res) {
  const { email, senha, tipo } = req.body;

  if (!email || !senha || !tipo) {
    return res.status(400).json({ erro: 'Campos obrigatórios: email, senha, tipo.' });
  }
  if (!['cliente', 'barbeiro'].includes(tipo)) {
    return res.status(400).json({ erro: "Tipo inválido. Use 'cliente' ou 'barbeiro'." });
  }

  const Model = tipo === 'cliente' ? ClienteModel : BarbeiroModel;
  const usuario = Model.buscarPorEmail(email);

  if (!usuario || !bcrypt.compareSync(senha, usuario.senha_hash)) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }

  const token = gerarToken({ id: usuario.id, tipo, email: usuario.email });
  delete usuario.senha_hash;

  return res.json({ usuario, token });
}

/** Cadastro de barbeiros (uso administrativo) */
function registrarBarbeiro(req, res) {
  const { nome, telefone, especialidade, email, senha } = req.body;

  if (!nome || !telefone || !email || !senha) {
    return res.status(400).json({ erro: 'Campos obrigatórios: nome, telefone, email, senha.' });
  }
  if (BarbeiroModel.buscarPorEmail(email)) {
    return res.status(409).json({ erro: 'Já existe um barbeiro cadastrado com este e-mail.' });
  }

  const senha_hash = bcrypt.hashSync(senha, SALT_ROUNDS);
  const barbeiro = BarbeiroModel.criar({ nome, telefone, especialidade, email, senha_hash });
  const token = gerarToken({ id: barbeiro.id, tipo: 'barbeiro', email: barbeiro.email });

  return res.status(201).json({ barbeiro, token });
}

module.exports = { registrarCliente, login, registrarBarbeiro };
