const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const { applyCors } = require('./src/middlewares/cors');
const { applySession } = require('./src/middlewares/session');

const { applySanitizer } = require('./src/middlewares/sanitizer');

const authRoutes = require('./src/routes/auth');
const productoRoutes = require('./src/routes/productos');
const categoriaRoutes = require('./src/routes/categorias');
const clienteRoutes = require('./src/routes/clientes');
const pedidoRoutes = require('./src/routes/pedidos');
const direccionesRoutes = require('./src/routes/direcciones');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

applyCors(app);
applySession(app);
app.use(express.static(path.join(__dirname, 'public')));


app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('api/direcciones', direccionesRoutes)

app.use((err, req, res, next) => {
    console.error(`Error: ${err.message}`);
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Error interno del servidor. Inténtelo más tarde.' : err.message;
    
    res.status(statusCode).json({
        success: false,
        message: message,
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Servidor online en http://localhost:${PORT}`);
    console.log(`Entorno: ${process.env.NODE_ENV}`);
});