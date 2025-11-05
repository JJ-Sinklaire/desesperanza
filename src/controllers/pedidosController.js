const db = require('../services/db.service');

const getCarrito = (req, res) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    res.status(200).json({ success: true, data: req.session.cart });
};

const addAlCarrito = async (req, res, next) => {
    const { id_producto, cantidad } = req.body;
    const qty = parseInt(cantidad, 10);

    if (!id_producto || !qty || qty <= 0) {
        return res.status(400).json({ success: false, message: 'ID de producto y cantidad válida son requeridos.' });
    }

    try {
        const [rows] = await db.query('SELECT nombre, precio, cantidad_disponible FROM productos WHERE id_producto = ? AND activo = TRUE', [id_producto]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }

        const producto = rows[0];

        if (!req.session.cart) {
            req.session.cart = [];
        }

        const itemIndex = req.session.cart.findIndex(item => item.id_producto === id_producto);

        if (itemIndex > -1) {
            const newQty = req.session.cart[itemIndex].cantidad + qty;
            if (newQty > producto.cantidad_disponible) {
                 return res.status(400).json({ success: false, message: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.cantidad_disponible}` });
            }
            req.session.cart[itemIndex].cantidad = newQty;
        } else {
             if (qty > producto.cantidad_disponible) {
                 return res.status(400).json({ success: false, message: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.cantidad_disponible}` });
            }
            req.session.cart.push({
                id_producto: id_producto,
                cantidad: qty,
                nombre: producto.nombre,
                precio_unitario: producto.precio
            });
        }

        res.status(200).json({ success: true, message: 'Producto añadido al carrito.', data: req.session.cart });

    } catch (error) {
        next(error);
    }
};

const removeFromCarrito = (req, res) => {
    const { id } = req.params;
    const id_producto = parseInt(id, 10);

    if (!req.session.cart) {
        req.session.cart = [];
    }

    const itemIndex = req.session.cart.findIndex(item => item.id_producto === id_producto);

    if (itemIndex > -1) {
        req.session.cart.splice(itemIndex, 1);
        res.status(200).json({ success: true, message: 'Producto eliminado del carrito.', data: req.session.cart });
    } else {
        res.status(404).json({ success: false, message: 'Producto no encontrado en el carrito.' });
    }
};

const crearPedido = async (req, res, next) => {
    const id_cliente = req.session.cliente.id_cliente;
    const email_cliente = req.session.cliente.email;
    const nombre_cliente = req.session.cliente.nombre;
    const carrito = req.session.cart;

    if (!carrito || carrito.length === 0) {
        return res.status(400).json({ success: false, message: 'El carrito está vacío.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        let totalPedido = 0;
        const idsProductos = carrito.map(item => item.id_producto);

        const [productosDB] = await connection.query(
            `SELECT id_producto, precio, cantidad_disponible, nombre FROM productos WHERE id_producto IN (?) FOR UPDATE`,
            [idsProductos]
        );

        const productosMap = new Map(productosDB.map(p => [p.id_producto, p]));

        for (const item of carrito) {
            const producto = productosMap.get(item.id_producto);
            if (!producto) {
                const error = new Error(`Producto con ID ${item.id_producto} no encontrado.`);
                error.statusCode = 404;
                throw error;
            }
            if (item.cantidad > producto.cantidad_disponible) {
                const error = new Error(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.cantidad_disponible}`);
                error.statusCode = 400;
                throw error;
            }
            totalPedido += item.cantidad * producto.precio;
        }

        const [resultPedido] = await connection.query(
            'INSERT INTO pedidos (id_cliente, total, estado) VALUES (?, ?, ?)',
            [id_cliente, totalPedido, 'Pendiente']
        );
        const id_pedido = resultPedido.insertId;

        const detalleQueries = [];
        const stockQueries = [];
        
        let emailHtmlDetalle = '';

        for (const item of carrito) {
            const producto = productosMap.get(item.id_producto);
            const subtotal = item.cantidad * producto.precio;
            
            detalleQueries.push(connection.query(
                'INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
                [id_pedido, item.id_producto, item.cantidad, producto.precio, subtotal]
            ));
            
            stockQueries.push(connection.query(
                'UPDATE productos SET cantidad_disponible = cantidad_disponible - ? WHERE id_producto = ?',
                [item.cantidad, item.id_producto]
            ));
            
            emailHtmlDetalle += `<tr style="border-bottom: 1px solid #f0ebe5;"><td style="padding: 10px;">${producto.nombre}</td><td style="padding: 10px;">${item.cantidad}</td><td style="padding: 10px;">$${parseFloat(producto.precio).toFixed(2)}</td><td style="padding: 10px;">$${subtotal.toFixed(2)}</td></tr>`;
        }

        await Promise.all(detalleQueries);
        await Promise.all(stockQueries);

        await connection.commit();
        
        req.session.cart = [];

        const emailHtml = `
            <p>¡Gracias por tu pedido, ${nombre_cliente}!</p>
            <p>Hemos recibido tu pedido #${id_pedido} y lo estamos procesando.</p>
            <h3>Resumen del Pedido</h3>
            <table style="width:100%; border-collapse: collapse; text-align: left;">
                <thead style="background-color: #f0ebe5;">
                    <tr>
                        <th style="padding: 10px;">Producto</th>
                        <th style="padding: 10px;">Cantidad</th>
                        <th style="padding: 10px;">Precio Unit.</th>
                        <th style="padding: 10px;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${emailHtmlDetalle}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="padding: 10px; text-align:right; font-weight: bold;">Total:</td>
                        <td style="padding: 10px; font-weight: bold; font-size: 1.1em;">$${totalPedido.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
            <p>Recibirás una notificación cuando tu pedido sea enviado.</p>
        `;


        res.status(201).json({ 
            success: true, 
            message: 'Pedido creado exitosamente.',
            id_pedido: id_pedido 
        });

    } catch (error) {
        if (connection) await connection.rollback();
        next(error);
    } finally {
        if (connection) connection.release();
    }
};

const getMisPedidos = async (req, res, next) => {
    const id_cliente = req.session.cliente.id_cliente;
    try {
        const [pedidos] = await db.query(
            'SELECT * FROM pedidos WHERE id_cliente = ? ORDER BY fecha_pedido DESC',
            [id_cliente]
        );
        res.status(200).json({ success: true, data: pedidos });
    } catch (error) {
        next(error);
    }
};

const getAllPedidos = async (req, res, next) => {
    try {
        const query = `
            SELECT p.*, c.nombre, c.apellido, c.email 
            FROM pedidos p
            JOIN clientes c ON p.id_cliente = c.id_cliente
            ORDER BY p.fecha_pedido DESC
        `;
        const [pedidos] = await db.query(query);
        res.status(200).json({ success: true, data: pedidos });
    } catch (error) {
        next(error);
    }
};

const updateEstadoPedido = async (req, res, next) => {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['Pendiente', 'Enviado', 'Completado', 'Cancelado'];
    if (!estado || !estadosValidos.includes(estado)) {
        return res.status(400).json({ success: false, message: 'Estado no válido.' });
    }

    try {
        const [result] = await db.query(
            'UPDATE pedidos SET estado = ? WHERE id_pedido = ?',
            [estado, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Pedido no encontrado.' });
        }
        
        if (estado === 'Enviado' || estado === 'Completado' || estado === 'Cancelado') {
            const [pedidoInfo] = await db.query(
                'SELECT c.email, c.nombre FROM pedidos p JOIN clientes c ON p.id_cliente = c.id_cliente WHERE p.id_pedido = ?',
                [id]
            );
            
            if(pedidoInfo.length > 0) {
                const { email, nombre } = pedidoInfo[0];
                const subject = `Actualización de tu Pedido #${id}`;
                const html = `<p>Hola ${nombre},</p><p>El estado de tu pedido #${id} ha sido actualizado a: <strong>${estado}</strong>.</p>`;
            }
        }

        res.status(200).json({ success: true, message: 'Estado del pedido actualizado.' });
    } catch (error) {
        next(error);
    }
};

const getPedidoDetalle = async (req, res, next) => {
    const { id } = req.params;
    const id_cliente = req.session.cliente.id_cliente;

    try {
        const [pedidos] = await db.query(
            'SELECT * FROM pedidos WHERE id_pedido = ? AND id_cliente = ?',
            [id, id_cliente]
        );

        if (pedidos.length === 0) {
            return res.status(404).json({ success: false, message: 'Pedido no encontrado.' });
        }

        const [detalles] = await db.query(
            'SELECT dp.*, p.nombre FROM detalle_pedidos dp JOIN productos p ON dp.id_producto = p.id_producto WHERE dp.id_pedido = ?',
            [id]
        );

        res.status(200).json({
            success: true,
            data: {
                pedido: pedidos[0],
                detalles: detalles
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCarrito,
    addAlCarrito,
    removeFromCarrito,
    crearPedido,
    getMisPedidos,
    getAllPedidos,
    updateEstadoPedido,
    getPedidoDetalle
};