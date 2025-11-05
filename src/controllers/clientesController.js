const db = require('../services/db.service');
const bcrypt = require('bcrypt');

const BCRYPT_SALT_ROUNDS = 10;

const getMiPerfil = async (req, res, next) => {
    const id_cliente = req.session.cliente.id_cliente;
    try {
        const [rows] = await db.query('SELECT id_cliente, usuario, nombre, apellido, email, telefono, direccion FROM clientes WHERE id_cliente = ?', [id_cliente]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Perfil no encontrado.' });
        }
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        next(error);
    }
};

const updateMiPerfil = async (req, res, next) => {
    const id_cliente = req.session.cliente.id_cliente;
    const { nombre, apellido, email, telefono, direccion } = req.body;

    if (!nombre || !apellido || !email) {
        return res.status(400).json({ success: false, message: 'Campos requeridos faltantes: nombre, apellido, email.' });
    }

    try {
        const [emailExists] = await db.query('SELECT 1 FROM clientes WHERE email = ? AND id_cliente != ?', [email, id_cliente]);
        if (emailExists.length > 0) {
            return res.status(409).json({ success: false, message: 'El email ya está en uso por otra cuenta.' });
        }

        const [result] = await db.query(
            'UPDATE clientes SET nombre = ?, apellido = ?, email = ?, telefono = ?, direccion = ? WHERE id_cliente = ?',
            [nombre, apellido, email, telefono, direccion, id_cliente]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Perfil no encontrado.' });
        }
        
        req.session.cliente.nombre = nombre;
        req.session.cliente.email = email;

        res.status(200).json({ success: true, message: 'Perfil actualizado exitosamente.' });
    } catch (error) {
        next(error);
    }
};

const cambiarPassword = async (req, res, next) => {
    const id_cliente = req.session.cliente.id_cliente;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Contraseña actual y nueva son requeridas.' });
    }

    try {
        const [rows] = await db.query('SELECT password FROM clientes WHERE id_cliente = ?', [id_cliente]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
        }

        const cliente = rows[0];
        const match = await bcrypt.compare(oldPassword, cliente.password);

        if (!match) {
            return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
        await db.query('UPDATE clientes SET password = ? WHERE id_cliente = ?', [hashedPassword, id_cliente]);

        res.status(200).json({ success: true, message: 'Contraseña actualizada exitosamente.' });

    } catch (error) {
        next(error);
    }
};
const getAllClientes = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT id_cliente, usuario, nombre, apellido, email, telefono, activo FROM clientes ORDER BY apellido, nombre');
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};

const getClienteById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT id_cliente, usuario, nombre, apellido, email, telefono, direccion, activo FROM clientes WHERE id_cliente = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
        }
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        next(error);
    }
};

const createClienteByAdmin = async (req, res, next) => {
    const { usuario, password, email, nombre, apellido, telefono, direccion } = req.body;

    if (!usuario || !password || !email || !nombre || !apellido) {
        return res.status(400).json({ success: false, message: 'Campos requeridos faltantes: usuario, password, email, nombre, apellido.' });
    }
    
    try {
        const [userExists] = await db.query('SELECT 1 FROM clientes WHERE usuario = ? OR email = ?', [usuario, email]);
        if (userExists.length > 0) {
            return res.status(409).json({ success: false, message: 'El usuario o email ya están registrados.' });
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

        const [result] = await db.query(
            'INSERT INTO clientes (usuario, password, email, nombre, apellido, telefono, direccion, activo) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)',
            [usuario, hashedPassword, email, nombre, apellido, telefono, direccion]
        );

        res.status(201).json({
            success: true,
            message: 'Cliente creado exitosamente por el administrador.',
            id_cliente: result.insertId
        });
    } catch (error) {
        next(error);
    }
};

const updateClienteByAdmin = async (req, res, next) => {
    const { id } = req.params;
    const { nombre, apellido, email, telefono, direccion, activo } = req.body;

    if (!nombre || !apellido || !email || (activo === undefined)) {
        return res.status(400).json({ success: false, message: 'Campos requeridos faltantes: nombre, apellido, email, activo.' });
    }

    try {
        const [emailExists] = await db.query('SELECT 1 FROM clientes WHERE email = ? AND id_cliente != ?', [email, id]);
        if (emailExists.length > 0) {
            return res.status(409).json({ success: false, message: 'El email ya está en uso por otra cuenta.' });
        }

        const [result] = await db.query(
            'UPDATE clientes SET nombre = ?, apellido = ?, email = ?, telefono = ?, direccion = ?, activo = ? WHERE id_cliente = ?',
            [nombre, apellido, email, telefono, direccion, activo, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
        }

        res.status(200).json({ success: true, message: 'Cliente actualizado exitosamente.' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMiPerfil,
    updateMiPerfil,
    cambiarPassword,
    getAllClientes,
    getClienteById,
    createClienteByAdmin,
    updateClienteByAdmin
};