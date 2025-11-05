const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categoriasController');
const { isAuthAdmin } = require('../middlewares/auth');

router.get('/', categoriasController.getAllCategorias);

router.post('/', isAuthAdmin, categoriasController.createCategoria);
router.put('/:id', isAuthAdmin, categoriasController.updateCategoria);
router.delete('/:id', isAuthAdmin, categoriasController.deleteCategoria);

module.exports = router;