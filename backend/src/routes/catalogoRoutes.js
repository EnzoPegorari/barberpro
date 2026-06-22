const express = require('express');
const router = express.Router();
const catalogoController = require('../controllers/catalogoController');

router.get('/servicos', catalogoController.listarServicos);
router.get('/barbeiros', catalogoController.listarBarbeiros);

module.exports = router;
