document.addEventListener('DOMContentLoaded', () => {
    
    const tableBody = document.getElementById('orders-table-body');
    const modal = document.getElementById('status-modal');
    const modalCloseButton = document.getElementById('modal-close-button');
    const statusForm = document.getElementById('status-form');
    const orderIdInput = document.getElementById('order-id');
    const orderIdLabel = document.getElementById('modal-order-id-label');
    const statusSelect = document.getElementById('estado');
    const saveStatusButton = document.getElementById('save-status-button');
    const modalError = document.getElementById('modal-error-message');

    async function loadOrders() {
        try {
            const response = await apiFetch('/api/pedidos/admin/todos', 'GET');
            tableBody.innerHTML = ''; 
            
            if (response.success) {
                response.data.forEach(order => {
                    const row = document.createElement('tr');
                    const fecha = new Date(order.fecha_pedido).toLocaleString('es-MX');
                    const total = parseFloat(order.total).toFixed(2);
                    const statusClass = order.estado.toLowerCase().replace(' ', '-');
                    
                    row.innerHTML = `
                        <td>#${order.id_pedido}</td>
                        <td>${order.nombre} ${order.apellido} (${order.email})</td>
                        <td>${fecha}</td>
                        <td>$${total}</td>
                        <td><span class="status-badge status-${statusClass}">${order.estado}</span></td>
                        <td>
                            <button class="action-button btn-edit" 
                                    data-id="${order.id_pedido}" 
                                    data-estado="${order.estado}">
                                Actualizar Estado
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error cargando pedidos:', error);
            tableBody.innerHTML = '<tr><td colspan="6">Error al cargar pedidos.</td></tr>';
        }
    }

    function openModal(id, estadoActual) {
        modalError.style.display = 'none';
        orderIdInput.value = id;
        orderIdLabel.textContent = id;
        statusSelect.value = estadoActual; 
        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
        statusForm.reset();
    }

    async function handleStatusSubmit(e) {
        e.preventDefault();
        modalError.style.display = 'none';
        
        const v1 = window.validateInput(statusSelect, window.validationRegex.text, 'Debes seleccionar un estado.');
        if (!v1) return;
        
        saveStatusButton.disabled = true;
        saveStatusButton.textContent = 'Guardando...';

        const id = orderIdInput.value;
        const newStatus = statusSelect.value;

        try {
            const response = await apiFetch(`/api/pedidos/admin/${id}`, 'PUT', { estado: newStatus });
            if (response.success) {
                closeModal();
                loadOrders(); 
            }
        } catch (error) {
            modalError.textContent = error.message || 'Error al actualizar.';
            modalError.style.display = 'block';
        } finally {
            saveStatusButton.disabled = false;
            saveStatusButton.textContent = 'Guardar Estado';
        }
    }

    modalCloseButton.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    statusForm.addEventListener('submit', handleStatusSubmit);

    tableBody.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('btn-edit')) {
            const id = target.getAttribute('data-id');
            const estado = target.getAttribute('data-estado');
            openModal(id, estado);
        }
    });

    loadOrders();
});