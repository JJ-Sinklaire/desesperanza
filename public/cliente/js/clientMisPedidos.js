document.addEventListener('DOMContentLoaded', () => {

    const ordersContainer = document.getElementById('orders-list-container');
    const noOrdersMessage = document.getElementById('no-orders-message');
    const ticketModal = document.getElementById('ticket-modal');
    const ticketClose = document.querySelector('.close-ticket');

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
                <div style="margin-top: 10px;">
                    <button class="order-details-toggle" data-id="${order.id_pedido}">Ver Detalles</button>
                    <button class="btn-ticket" data-id="${order.id_pedido}" style="background-color: #27ae60; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 500; margin-left: 10px;">Ver Ticket</button>
                </div>
                <div class="order-details-content" id="details-${order.id_pedido}"></div>
            `;
            ordersContainer.appendChild(orderElement);
        });
    }

    async function handleShowDetails(event) {
        const button = event.target;
        
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

    async function loadTicketData(id) {
        try {
            const response = await apiFetch(`/api/pedidos/${id}`, 'GET');
            
            if (response.success) {
                const p = response.data.pedido;
                const d = response.data.detalles;

                document.getElementById('ticket-id').textContent = `Ticket #${p.id_pedido}`;
                document.getElementById('ticket-fecha').textContent = `Fecha: ${new Date(p.fecha_pedido).toLocaleDateString()}`;

                const list = document.getElementById('ticket-items-list');
                list.innerHTML = '';
                
                d.forEach(item => {
                    const totalItem = (item.precio_unitario * item.cantidad).toFixed(2);
                    list.innerHTML += `
                        <div class="ticket-item-row">
                            <span>${item.cantidad} x ${item.nombre}</span>
                            <span>$${totalItem}</span>
                        </div>
                    `;
                });

                const total = parseFloat(p.total);
                const subtotal = total / 1.16;
                const iva = total - subtotal;

                document.getElementById('ticket-sub').textContent = `$${subtotal.toFixed(2)}`;
                document.getElementById('ticket-tax').textContent = `$${iva.toFixed(2)}`;
                document.getElementById('ticket-total').textContent = `$${total.toFixed(2)}`;

                ticketModal.style.display = 'flex';
            }
        } catch (error) {
            console.error('Error ticket:', error);
            alert('No se pudo cargar el ticket.');
        }
    }
    
    ordersContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('order-details-toggle')) {
            handleShowDetails(e);
        } else if (e.target.classList.contains('btn-ticket')) {
            const id = e.target.getAttribute('data-id');
            loadTicketData(id);
        }
    });

    if (ticketClose) {
        ticketClose.addEventListener('click', () => {
            ticketModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === ticketModal) {
            ticketModal.style.display = 'none';
        }
    });

    loadMisPedidos();
});