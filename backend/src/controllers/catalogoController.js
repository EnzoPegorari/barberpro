const ServicoModel = require('../models/servicoModel');
const BarbeiroModel = require('../models/barbeiroModel');

function listarServicos(req, res) {
  return res.json({ servicos: ServicoModel.listarTodos() });
}

function listarBarbeiros(req, res) {
  return res.json({ barbeiros: BarbeiroModel.listarTodos() });
}

module.exports = { listarServicos, listarBarbeiros };
