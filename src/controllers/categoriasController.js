const db = require('../services/db.service');

const getAllCategorias = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM categorias ORDER BY nombre ASC');
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};

const createCategoria = async (req, res, next) => {
    const { nombre, descripcion } = req.body;
    if (!nombre) {
        return res.status(400).json({ success: false, message: 'El nombre es requerido.' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)',
            [nombre, descripcion]
        );
        res.status(201).json({
            success: true,
            message: 'Categoría creada exitosamente.',
            id_categoria: result.insertId
        });
    } catch (error) {
        next(error);
    }
};

const updateCategoria = async (req, res, next) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    if (!nombre) {
        return res.status(400).json({ success: false, message: 'El nombre es requerido.' });
    }
    try {
        const [result] = await db.query(
            'UPDATE categorias SET nombre = ?, descripcion = ? WHERE id_categoria = ?',
            [nombre, descripcion, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Categoría no encontrada.' });
        }
        res.status(200).json({ success: true, message: 'Categoría actualizada exitosamente.' });
    } catch (error) {
        next(error);
    }
};

const deleteCategoria = async (req, res, next) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM categorias WHERE id_categoria = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Categoría no encontrada.' });
        }
        res.status(200).json({ success: true, message: 'Categoría eliminada exitosamente.' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ success: false, message: 'No se puede eliminar la categoría porque tiene productos asociados.' });
        }
        next(error);
    }
};

module.exports = {
    getAllCategorias,
    createCategoria,
    updateCategoria,
    deleteCategoria
};