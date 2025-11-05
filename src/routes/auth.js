const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login-admin', authController.loginAdmin);
router.post('/login-cliente', authController.loginCliente);
router.post('/register-cliente', authController.registerCliente);
router.post('/logout', authController.logout);
router.get('/verificar', authController.verificarSesion);

router.post('/recuperar-password', authController.solicitarRecuperacion);
router.post('/reset-password', authController.resetearPassword);

module.exports = router;