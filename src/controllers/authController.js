const db = require('../services/db.service');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const BCRYPT_SALT_ROUNDS = 10;

const loginAdmin = async (req, res, next) => {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        return res.status(400).json({ success: false, message: 'Usuario y contraseña son requeridos.' });
    }

    try {
        const [rows] = await db.query('SELECT * FROM administradores WHERE usuario = ? AND activo = TRUE', [usuario]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        const admin = rows[0];
        const match = await bcrypt.compare(password, admin.password);

        if (!match) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        req.session.regenerate((err) => {
            if (err) return next(err);

            req.session.admin = {
                id_administrador: admin.id_administrador,
                usuario: admin.usuario,
                nombre_completo: admin.nombre_completo
            };

            res.status(200).json({
                success: true,
                message: 'Login de administrador exitoso.',
                admin: req.session.admin
            });
        });

    } catch (error) {
        next(error);
    }
};

const loginCliente = async (req, res, next) => {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        return res.status(400).json({ success: false, message: 'Usuario y contraseña son requeridos.' });
    }

    try {
        const [rows] = await db.query('SELECT * FROM clientes WHERE usuario = ? AND activo = TRUE', [usuario]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas o cuenta inactiva.' });
        }

        const cliente = rows[0];
        const match = await bcrypt.compare(password, cliente.password);

        if (!match) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas o cuenta inactiva.' });
        }

        req.session.regenerate((err) => {
            if (err) return next(err);

            req.session.cliente = {
                id_cliente: cliente.id_cliente,
                usuario: cliente.usuario,
                nombre: cliente.nombre,
                email: cliente.email
            };
    
            req.session.cart = [];
    
            res.status(200).json({
                success: true,
                message: 'Login de cliente exitoso.',
                cliente: req.session.cliente
            });
        });

    } catch (error) {
        next(error);
    }
};

const registerCliente = async (req, res, next) => {
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
            'INSERT INTO clientes (usuario, password, email, nombre, apellido, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [usuario, hashedPassword, email, nombre, apellido, telefono, direccion]
        );

        const newClientId = result.insertId;

        const emailHtml = `
            <p>¡Hola ${nombre}!</p>
            <p>Gracias por registrarte en nuestra panadería.</p>
            <p>Tu cuenta con el usuario <strong>${usuario}</strong> ha sido creada exitosamente.</p>
            <p>Ya puedes iniciar sesión y explorar nuestros productos.</p>
        `;

        res.status(201).json({
            success: true,
            message: 'Cliente registrado exitosamente. Se ha enviado un correo de bienvenida.',
            id_cliente: newClientId
        });

    } catch (error) {
        next(error);
    }
};

const logout = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            return next(err);
        }
        res.clearCookie(process.env.SESSION_NAME);
        res.status(200).json({ success: true, message: 'Sesión cerrada exitosamente.' });
    });
};

const verificarSesion = (req, res) => {
    if (req.session.admin) {
        return res.status(200).json({
            success: true,
            autenticado: true,
            tipo: 'admin',
            usuario: req.session.admin
        });
    }
    
    if (req.session.cliente) {
        return res.status(200).json({
            success: true,
            autenticado: true,
            tipo: 'cliente',
            usuario: req.session.cliente
        });
    }

    return res.status(200).json({ success: true, autenticado: false });
};

const solicitarRecuperacion = async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'El email es requerido.' });
    }

    try {
        const [rows] = await db.query('SELECT id_cliente, nombre FROM clientes WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No se encontró un cliente con ese email.' });
        }

        const cliente = rows[0];
        const token = crypto.randomBytes(32).toString('hex');
        const expiracion = new Date(Date.now() + 3600000);

        await db.query(
            'INSERT INTO recuperacion_password (id_cliente, token, fecha_expiracion) VALUES (?, ?, ?)',
            [cliente.id_cliente, token, expiracion]
        );

        const resetLink = `http://localhost:${process.env.PORT || 3000}/cliente/reset-password/index.html?token=${token}`;

        const emailHtml = `
            <p>Hola ${cliente.nombre},</p>
            <p>Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
            <a href="${resetLink}" target="_blank" style="background-color: #8B4513; color: #ffffff; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">Restablecer mi contraseña</a>
            <p>Si no solicitaste esto, por favor ignora este correo.</p>
            <p>Este enlace expirará en 1 hora.</p>
        `;


        res.status(200).json({ success: true, message: 'Correo de recuperación enviado.' });

    } catch (error) {
        next(error);
    }
};

const resetearPassword = async (req, res, next) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: 'El token y la nueva contraseña son requeridos.' });
    }

    try {
        const [rows] = await db.query(
            'SELECT * FROM recuperacion_password WHERE token = ? AND utilizado = FALSE AND fecha_expiracion > NOW()',
            [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Token inválido o expirado.' });
        }

        const solicitud = rows[0];
        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

        await db.query('UPDATE clientes SET password = ? WHERE id_cliente = ?', [hashedPassword, solicitud.id_cliente]);
        await db.query('UPDATE recuperacion_password SET utilizado = TRUE WHERE id_recuperacion = ?', [solicitud.id_recuperacion]);

        res.status(200).json({ success: true, message: 'Contraseña actualizada exitosamente.' });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    loginAdmin,
    loginCliente,
    registerCliente,
    logout,
    verificarSesion,
    solicitarRecuperacion,
    resetearPassword
};