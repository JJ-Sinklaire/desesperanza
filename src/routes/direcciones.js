// routes/direcciones.js
const express = require('express');
const router = express.Router();
const { isAuthCliente } = require('../middlewares/auth');
const db = require('../services/db.service');

// ============================================
// GET /api/direcciones - LISTAR DIRECCIONES DEL USUARIO
// ============================================
router.get('/', isAuthCliente, async (req, res) => {
    try {
        // El id_cliente viene de req.session.cliente
        const idCliente = req.session.cliente.id_cliente;

        const [direcciones] = await db.query(
            'SELECT * FROM direcciones WHERE id_cliente = ? ORDER BY fecha_creacion DESC',
            [idCliente]
        );

        res.json({
            success: true,
            data: direcciones
        });
    } catch (error) {
        console.error('Error al obtener direcciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener direcciones'
        });
    }
});

// ============================================
// GET /api/direcciones/:id - OBTENER DIRECCIÓN POR ID
// ============================================
router.get('/:id', isAuthCliente, async (req, res) => {
    try {
        const { id } = req.params;
        const idCliente = req.session.cliente.id_cliente;

        const [direccion] = await db.query(
            'SELECT * FROM direcciones WHERE id_direccion = ? AND id_cliente = ?',
            [id, idCliente]
        );

        if (direccion.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Dirección no encontrada'
            });
        }

        res.json({
            success: true,
            data: direccion[0]
        });
    } catch (error) {
        console.error('Error al obtener dirección:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener dirección'
        });
    }
});

// ============================================
// POST /api/direcciones - CREAR NUEVA DIRECCIÓN
// ============================================
router.post('/', isAuthCliente, async (req, res) => {
    try {
        const idCliente = req.session.cliente.id_cliente;
        const {
            alias,
            calle,
            colonia,
            codigo_postal,
            ciudad,
            estado,
            referencias,
            latitud,
            longitud
        } = req.body;

        // Validaciones básicas
        if (!alias || !calle || !colonia || !codigo_postal || !ciudad || !estado) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos',
                errors: {
                    alias: !alias ? 'El alias es requerido' : null,
                    calle: !calle ? 'La calle es requerida' : null,
                    colonia: !colonia ? 'La colonia es requerida' : null,
                    codigo_postal: !codigo_postal ? 'El código postal es requerido' : null,
                    ciudad: !ciudad ? 'La ciudad es requerida' : null,
                    estado: !estado ? 'El estado es requerido' : null
                }
            });
        }

        if (!latitud || !longitud) {
            return res.status(400).json({
                success: false,
                message: 'Las coordenadas son requeridas. Por favor, selecciona una ubicación en el mapa.'
            });
        }

        // Validar coordenadas
        const lat = parseFloat(latitud);
        const lng = parseFloat(longitud);

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({
                success: false,
                message: 'Coordenadas inválidas'
            });
        }

        // Validar código postal (5 dígitos para México)
        if (!/^\d{5}$/.test(codigo_postal)) {
            return res.status(400).json({
                success: false,
                message: 'El código postal debe tener 5 dígitos'
            });
        }

        // Verificar límite de direcciones por usuario (opcional)
        const [countResult] = await db.query(
            'SELECT COUNT(*) as total FROM direcciones WHERE id_cliente = ?',
            [idCliente]
        );

        if (countResult[0].total >= 10) {
            return res.status(400).json({
                success: false,
                message: 'Has alcanzado el límite máximo de 10 direcciones guardadas'
            });
        }

        // Insertar dirección
        const [result] = await db.query(
            `INSERT INTO direcciones
             (id_cliente, alias, calle, colonia, codigo_postal, ciudad, estado, referencias, latitud, longitud)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [idCliente, alias, calle, colonia, codigo_postal, ciudad, estado, referencias || null, lat, lng]
        );

        // Obtener la dirección recién creada
        const [nuevaDireccion] = await db.query(
            'SELECT * FROM direcciones WHERE id_direccion = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Dirección creada correctamente',
            data: nuevaDireccion[0]
        });
    } catch (error) {
        console.error('Error al crear dirección:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear dirección'
        });
    }
});

// ============================================
// PUT /api/direcciones/:id - ACTUALIZAR DIRECCIÓN
// ============================================
router.put('/:id', isAuthCliente, async (req, res) => {
    try {
        const { id } = req.params;
        const idCliente = req.session.cliente.id_cliente;

        // Verificar que la dirección existe y pertenece al usuario
        const [direccion] = await db.query(
            'SELECT * FROM direcciones WHERE id_direccion = ? AND id_cliente = ?',
            [id, idCliente]
        );

        if (direccion.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Dirección no encontrada o no tienes permiso para modificarla'
            });
        }

        // Construir query dinámico solo con campos enviados
        const updates = [];
        const values = [];

        const camposPermitidos = [
            'alias', 'calle', 'colonia', 'codigo_postal',
            'ciudad', 'estado', 'referencias', 'latitud', 'longitud'
        ];

        camposPermitidos.forEach(field => {
            if (req.body[field] !== undefined) {
                // Validación especial para código postal
                if (field === 'codigo_postal' && !/^\d{5}$/.test(req.body[field])) {
                    return res.status(400).json({
                        success: false,
                        message: 'El código postal debe tener 5 dígitos'
                    });
                }

                // Validación especial para coordenadas
                if (field === 'latitud' || field === 'longitud') {
                    const coord = parseFloat(req.body[field]);
                    if (isNaN(coord)) {
                        return res.status(400).json({
                            success: false,
                            message: `${field} inválida`
                        });
                    }
                    if ((field === 'latitud' && (coord < -90 || coord > 90)) ||
                        (field === 'longitud' && (coord < -180 || coord > 180))) {
                        return res.status(400).json({
                            success: false,
                            message: `${field} fuera de rango`
                        });
                    }
                }

                updates.push(`${field} = ?`);
                values.push(req.body[field]);
            }
        });

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se enviaron campos para actualizar'
            });
        }

        // Agregar WHERE conditions
        values.push(id, idCliente);

        await db.query(
            `UPDATE direcciones SET ${updates.join(', ')} WHERE id_direccion = ? AND id_cliente = ?`,
            values
        );

        // Obtener dirección actualizada
        const [actualizada] = await db.query(
            'SELECT * FROM direcciones WHERE id_direccion = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Dirección actualizada correctamente',
            data: actualizada[0]
        });
    } catch (error) {
        console.error('Error al actualizar dirección:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar dirección'
        });
    }
});

// ============================================
// DELETE /api/direcciones/:id - ELIMINAR DIRECCIÓN
// ============================================
router.delete('/:id', isAuthCliente, async (req, res) => {
    try {
        const { id } = req.params;
        const idCliente = req.session.cliente.id_cliente;

        // Verificar si la dirección está asociada a pedidos pendientes (opcional)
        const [pedidos] = await db.query(
            `SELECT COUNT(*) as total FROM pedidos
             WHERE id_direccion = ? AND estado IN ('pendiente', 'enviado')`,
            [id]
        );

        if (pedidos[0].total > 0) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar la dirección porque tiene pedidos activos asociados'
            });
        }

        // Eliminar dirección
        const [result] = await db.query(
            'DELETE FROM direcciones WHERE id_direccion = ? AND id_cliente = ?',
            [id, idCliente]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Dirección no encontrada o no tienes permiso para eliminarla'
            });
        }

        res.json({
            success: true,
            message: 'Dirección eliminada correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar dirección:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar dirección'
        });
    }
});

module.exports = router;