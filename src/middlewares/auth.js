const isAuthAdmin = (req, res, next) => {
    if (req.session && req.session.admin) {
        return next();
    } else {
        return res.status(401).json({
            success: false,
            message: 'Acceso no autorizado. Se requiere autenticación de administrador.'
        });
    }
};

const isAuthCliente = (req, res, next) => {
    if (req.session && req.session.cliente) {
        return next();
    } else {
        return res.status(401).json({
            success: false,
            message: 'Acceso no autorizado. Se requiere autenticación de cliente.'
        });
    }
};

module.exports = {
    isAuthAdmin,
    isAuthCliente
};