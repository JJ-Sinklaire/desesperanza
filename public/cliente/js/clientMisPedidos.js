document.addEventListener('DOMContentLoaded', () => {

    const ordersContainer = document.getElementById('orders-list-container');
    const noOrdersMessage = document.getElementById('no-orders-message');

    async function loadMisPedidos() {
        try {
            const response = await apiFetch('/api/pedidos/mis-pedidos', 'GET');
            
            if (response.success) {
                renderPedidos(response.data);
            }
        } catch (error) {
            console.error('Error cargando pedidos:', error);
            if (error.status === 401) {
                window.location.href = '/cliente/';
            }
        }
    }

    function renderPedidos(pedidos) {
        ordersContainer.innerHTML = '';
        
        if (pedidos.length === 0) {
            noOrdersMessage.style.display = 'block';
            return;
        }

        noOrdersMessage.style.display = 'none';

        pedidos.forEach(order => {
            const orderElement = document.createElement('div');
            orderElement.className = 'order-item';
            
            const fecha = new Date(order.fecha_pedido).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
            const total = parseFloat(order.total).toFixed(2);
            const statusClass = order.estado.toLowerCase().replace(' ', '-');

            orderElement.innerHTML = `
                <div class="order-header">
                    <h3>Pedido #${order.id_pedido}</h3>
                    <span class="status-badge status-${statusClass}">${order.estado}</span>
                </div>
                <div class="order-details">
                    <span><strong>Fecha:</strong> ${fecha}</span>
                    <span><strong>Total:</strong> $${total}</span>
                </div>
                <button class="order-details-toggle" data-id="${order.id_pedido}">Ver Detalles</button>
                <div class="order-details-content" id="details-${order.id_pedido}"></div>
            `;
            ordersContainer.appendChild(orderElement);
        });
    }

    async function handleShowDetails(event) {
        const button = event.target;
        if (!button.classList.contains('order-details-toggle')) {
            return;
        }

        const id = button.getAttribute('data-id');
        const detailsContainer = document.getElementById(`details-${id}`);

        if (detailsContainer.classList.contains('visible')) {
            detailsContainer.classList.remove('visible');
            detailsContainer.style.display = 'none';
            button.textContent = 'Ver Detalles';
            return;
        }

        button.textContent = 'Cargando...';
        button.disabled = true;

        try {
            const response = await apiFetch(`/api/pedidos/${id}`, 'GET');
            if (response.success) {
                let html = '<h4>Productos:</h4>';
                response.data.detalles.forEach(item => {
                    const sub = parseFloat(item.precio_unitario) * item.cantidad;
                    html += `
                        <p>
                            (${item.cantidad}x) <span>${item.nombre}</span> 
                            - $${sub.toFixed(2)}
                        </p>
                    `;
                });
                
                detailsContainer.innerHTML = html;
                detailsContainer.classList.add('visible');
                detailsContainer.style.display = 'block';
                button.textContent = 'Ocultar Detalles';
            }
        } catch (error) {
            console.error('Error cargando detalles:', error);
            detailsContainer.innerHTML = '<p>Error al cargar detalles.</p>';
        } finally {
            button.disabled = false;
        }
    }
    
    ordersContainer.addEventListener('click', handleShowDetails);

    loadMisPedidos();
});