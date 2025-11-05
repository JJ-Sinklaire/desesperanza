const db = require('../services/db.service');
const fs = require('fs').promises; 
const path = require('path');

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           
        .replace(/[^\w\-]+/g, '')       
        .replace(/\-\-+/g, '-')         
        .replace(/^-+/, '')             
        .replace(/-+$/, '');            
}

const getAllProductos = async (req, res, next) => {
    try {
        const query = `
            SELECT p.*, c.nombre as nombre_categoria 
            FROM productos p
            JOIN categorias c ON p.id_categoria = c.id_categoria
            WHERE p.activo = TRUE
            ORDER BY p.nombre ASC
        `;
        const [rows] = await db.query(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};

const getProductoById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT p.*, c.nombre as nombre_categoria 
            FROM productos p
            JOIN categorias c ON p.id_categoria = c.id_categoria
            WHERE p.id_producto = ? AND p.activo = TRUE
        `;
        const [rows] = await db.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        next(error);
    }
};

const createProducto = async (req, res, next) => {
    const {
        nombre,
        descripcion,
        precio,
        id_categoria,
        cantidad_disponible,
        cantidad_minima,
        es_temporada,
        temporada
    } = req.body;
    
    const id_admin = req.session.admin.id_administrador;

    if (!nombre || !precio || !id_categoria) {
        return res.status(400).json({ success: false, message: 'Campos requeridos faltantes: nombre, precio, id_categoria.' });
    }
    
    let imagen_url = null;


    if (req.file) {
        try {
            const slug = slugify(nombre);
            const extension = path.extname(req.file.originalname);
            const filename = `${slug}-${Date.now()}${extension}`;
            const savePath = path.join(__dirname, '..', '..', 'public', 'assets', 'images', 'panes', filename);

            await fs.writeFile(savePath, req.file.buffer);
            
            imagen_url = `/assets/images/panes/${filename}`;

        } catch (uploadError) {
            return next(uploadError);
        }
    }


    try {
        const query = `
            INSERT INTO productos 
            (nombre, descripcion, precio, id_categoria, cantidad_disponible, cantidad_minima, es_temporada, temporada, imagen_url, creado_por) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [
            nombre,
            descripcion,
            precio,
            id_categoria,
            cantidad_disponible || 0,
            cantidad_minima || 5,
            es_temporada === 'true' || es_temporada === true, 
            temporada,
            imagen_url,
            id_admin
        ]);

        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente.',
            id_producto: result.insertId
        });
    } catch (error) {
        next(error);
    }
};

const updateProducto = async (req, res, next) => {
    const { id } = req.params;
    const {
        nombre,
        descripcion,
        precio,
        id_categoria,
        cantidad_disponible,
        cantidad_minima,
        es_temporada,
        temporada,
        activo,
        imagen_url_actual 
    } = req.body;

    let imagen_url = imagen_url_actual || null;

    if (req.file) {
        try {
            const slug = slugify(nombre);
            const extension = path.extname(req.file.originalname);
            const filename = `${slug}-${Date.now()}${extension}`;
            const savePath = path.join(__dirname, '..', '..', 'public', 'assets', 'images', 'panes', filename);
            
            await fs.writeFile(savePath, req.file.buffer);
            
            imagen_url = `/assets/images/panes/${filename}`;

            if (imagen_url_actual) {
                const oldPath = path.join(__dirname, '..', '..', 'public', imagen_url_actual);
                fs.unlink(oldPath).catch(err => console.error("Error borrando imagen antigua:", err.message));
            }

        } catch (uploadError) {
            return next(uploadError);
        }
    }

    try {
        const query = `
            UPDATE productos SET
            nombre = ?, descripcion = ?, precio = ?, id_categoria = ?, 
            cantidad_disponible = ?, cantidad_minima = ?, es_temporada = ?, 
            temporada = ?, imagen_url = ?, activo = ?
            WHERE id_producto = ?
        `;
        const [result] = await db.query(query, [
            nombre,
            descripcion,
            precio,
            id_categoria,
            cantidad_disponible,
            cantidad_minima,
            es_temporada === 'true' || es_temporada === true,
            temporada,
            imagen_url,
            activo === 'true' || activo === true,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }

        res.status(200).json({ success: true, message: 'Producto actualizado exitosamente.' });
    } catch (error) {
        next(error);
    }
};
const deleteProducto = async (req, res, next) => {
    const { id } = req.params;
    
    try {
        const [result] = await db.query('UPDATE productos SET activo = FALSE WHERE id_producto = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }

        res.status(200).json({ success: true, message: 'Producto desactivado (eliminado lógicamente) exitosamente.' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllProductos,
    getProductoById,
    createProducto,
    updateProducto,
    deleteProducto
};