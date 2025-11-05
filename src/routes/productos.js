const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const { isAuthAdmin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.get('/', productosController.getAllProductos);
router.get('/:id', productosController.getProductoById);

router.post('/', isAuthAdmin, upload, productosController.createProducto);
router.put('/:id', isAuthAdmin, upload, productosController.updateProducto);

router.delete('/:id', isAuthAdmin, productosController.deleteProducto);

module.exports = router;