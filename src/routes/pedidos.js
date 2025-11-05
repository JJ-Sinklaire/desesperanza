const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { isAuthAdmin, isAuthCliente } = require('../middlewares/auth');

router.get('/carrito', isAuthCliente, pedidosController.getCarrito);
router.post('/carrito', isAuthCliente, pedidosController.addAlCarrito);
router.delete('/carrito/:id', isAuthCliente, pedidosController.removeFromCarrito);
router.post('/checkout', isAuthCliente, pedidosController.crearPedido);

router.get('/mis-pedidos', isAuthCliente, pedidosController.getMisPedidos);
router.get('/:id', isAuthCliente, pedidosController.getPedidoDetalle);

router.get('/admin/todos', isAuthAdmin, pedidosController.getAllPedidos);
router.put('/admin/:id', isAuthAdmin, pedidosController.updateEstadoPedido);

module.exports = router;