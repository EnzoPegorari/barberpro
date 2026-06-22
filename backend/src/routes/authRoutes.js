const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/registro/cliente', authController.registrarCliente);
router.post('/registro/barbeiro', authController.registrarBarbeiro);
router.post('/login', authController.login);

module.exports = router;
