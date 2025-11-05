document.addEventListener('DOMContentLoaded', () => {

    const totalIngresosEl = document.getElementById('total-ingresos-stat');
    const totalPendientesEl = document.getElementById('total-pendientes-stat');
    const totalPedidosEl = document.getElementById('total-pedidos-stat');
    const totalClientesEl = document.getElementById('total-clientes-stat');
    const totalProductosEl = document.getElementById('total-productos-stat');
    const recentOrdersList = document.getElementById('recent-orders-list');
    const lowStockList = document.getElementById('low-stock-list');
    const recentClientsList = document.getElementById('recent-clients-list');

    async function loadDashboardData() {
        try {
            const [pedidosData, clientesData, productosData] = await Promise.all([
                apiFetch('/api/pedidos/admin/todos', 'GET'),
                apiFetch('/api/clientes/admin/todos', 'GET'),
                apiFetch('/api/productos', 'GET')
            ]);

            renderSummaryCards(pedidosData.data, clientesData.data, productosData.data);
            renderRecentOrders(pedidosData.data);
            renderLowStock(productosData.data);
            renderRecentClients(clientesData.data);

        } catch (error) {
            console.error("Error al cargar datos del dashboard:", error);
            recentOrdersList.innerHTML = '<tr><td colspan="4">Error al cargar datos.</td></tr>';
            lowStockList.innerHTML = '<li>Error al cargar datos.</li>';
        }
    }

    function renderSummaryCards(pedidos, clientes, productos) {
        
        const ingresos = pedidos
            .filter(p => p.estado === 'Completado')
            .reduce((sum, p) => sum + parseFloat(p.total), 0);
            
        const pendientes = pedidos.filter(p => p.estado === 'Pendiente').length;

        totalIngresosEl.textContent = `$${ingresos.toFixed(2)}`;
        totalPendientesEl.textContent = pendientes;
        totalPedidosEl.textContent = pedidos.length;
        totalClientesEl.textContent = clientes.length;
        totalProductosEl.textContent = productos.filter(p => p.activo).length;
    }

    function renderRecentOrders(pedidos) {
        recentOrdersList.innerHTML = '';
        if (pedidos.length === 0) {
            recentOrdersList.innerHTML = '<tr><td colspan="4">No hay pedidos recientes.</td></tr>';
            return;
        }

        const recent = pedidos.slice(0, 5);

        recent.forEach(order => {
            const row = document.createElement('tr');
            const total = parseFloat(order.total).toFixed(2);
            const statusClass = order.estado.toLowerCase().replace(' ', '-');
            
            row.innerHTML = `
                <td>#${order.id_pedido}</td>
                <td>${order.nombre} ${order.apellido}</td>
                <td>$${total}</td>
                <td><span class="status-badge status-${statusClass}">${order.estado}</span></td>
            `;
            recentOrdersList.appendChild(row);
        });
    }

    function renderLowStock(productos) {
        lowStockList.innerHTML = '';
        const lowStockItems = productos.filter(p => p.activo && p.cantidad_disponible <= p.cantidad_minima);

        if (lowStockItems.length === 0) {
            lowStockList.innerHTML = '<li>No hay productos con stock bajo.</li>';
            return;
        }

        lowStockItems.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.nombre}</span>
                <span class="stock-low">Quedan: ${item.cantidad_disponible}</span>
            `;
            lowStockList.appendChild(li);
        });
    }

    function renderRecentClients(clientes) {
        recentClientsList.innerHTML = '';
        if (clientes.length === 0) {
            recentClientsList.innerHTML = '<li>No hay clientes registrados.</li>';
            return;
        }

        const recent = clientes.slice(-5).reverse();

        recent.forEach(client => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${client.nombre} ${client.apellido}</span>
                <span class="stock-ok">${client.email}</span>
            `;
            recentClientsList.appendChild(li);
        });
    }

    loadDashboardData();
});