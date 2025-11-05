const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');
const { isAuthCliente, isAuthAdmin } = require('../middlewares/auth');

router.get('/perfil', isAuthCliente, clientesController.getMiPerfil);
router.put('/perfil', isAuthCliente, clientesController.updateMiPerfil);
router.post('/cambiar-password', isAuthCliente, clientesController.cambiarPassword);

router.get('/admin/todos', isAuthAdmin, clientesController.getAllClientes);
router.get('/admin/:id', isAuthAdmin, clientesController.getClienteById);
router.post('/admin/crear', isAuthAdmin, clientesController.createClienteByAdmin);
router.put('/admin/:id', isAuthAdmin, clientesController.updateClienteByAdmin);

module.exports = router;