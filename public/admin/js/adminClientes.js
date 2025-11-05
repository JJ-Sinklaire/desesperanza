document.addEventListener('DOMContentLoaded', () => {
    
    const tableBody = document.getElementById('clients-table-body');
    const modal = document.getElementById('client-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalCloseButton = document.getElementById('modal-close-button');
    const addClientButton = document.getElementById('add-client-button');
    const saveClientButton = document.getElementById('save-client-button');
    const clientForm = document.getElementById('client-form');
    const modalError = document.getElementById('modal-error-message');
    
    const clientId = document.getElementById('client-id');
    const usuarioInput = document.getElementById('usuario');
    const passwordInput = document.getElementById('password');
    const passwordGroup = document.getElementById('password-group');
    const nombreInput = document.getElementById('nombre');
    const apellidoInput = document.getElementById('apellido');
    const emailInput = document.getElementById('email');
    const telefonoInput = document.getElementById('telefono');
    const direccionInput = document.getElementById('direccion');
    const activoCheckbox = document.getElementById('activo');

    async function loadClients() {
        try {
            const response = await apiFetch('/api/clientes/admin/todos', 'GET');
            tableBody.innerHTML = '';
            if (response.success) {
                response.data.forEach(client => {
                    const row = document.createElement('tr');
                    const statusClass = client.activo ? 'status-activo' : 'status-inactivo';
                    const statusText = client.activo ? 'Activo' : 'Inactivo';
                    
                    row.innerHTML = `
                        <td>${client.usuario}</td>
                        <td>${client.nombre} ${client.apellido}</td>
                        <td>${client.email}</td>
                        <td>${client.telefono || 'N/A'}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>
                            <button class="action-button btn-edit" data-id="${client.id_cliente}">Editar</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error cargando clientes:', error);
            tableBody.innerHTML = '<tr><td colspan="6">Error al cargar clientes.</td></tr>';
        }
    }

    function openModal() {
        modal.style.display = 'block';
        modalError.style.display = 'none';
    }

    function closeModal() {
        modal.style.display = 'none';
        clientForm.reset();
        clientId.value = '';
    }

    function openCreateModal() {
        modalTitle.textContent = 'Añadir Nuevo Cliente';
        clientForm.reset();
        clientId.value = '';
        activoCheckbox.checked = true;
        
        passwordGroup.style.display = 'block';
        passwordInput.required = true;
        usuarioInput.disabled = false;
        
        openModal();
    }

    async function openEditModal(id) {
        try {
            const response = await apiFetch(`/api/clientes/admin/${id}`, 'GET');
            if (response.success) {
                const client = response.data;
                modalTitle.textContent = 'Editar Cliente';
                
                clientId.value = client.id_cliente;
                usuarioInput.value = client.usuario;
                nombreInput.value = client.nombre;
                apellidoInput.value = client.apellido;
                emailInput.value = client.email;
                telefonoInput.value = client.telefono;
                direccionInput.value = client.direccion;
                activoCheckbox.checked = client.activo;
                
                passwordGroup.style.display = 'none';
                passwordInput.required = false;
                usuarioInput.disabled = true;
                
                openModal();
            }
        } catch (error) {
            console.error('Error obteniendo cliente:', error);
            alert('No se pudo cargar la información del cliente.');
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        modalError.style.display = 'none';
        const isEdit = clientId.value;

        const v1 = window.validateInput(usuarioInput, window.validationRegex.alphanumeric, 'Usuario inválido.');
        const v2 = window.validateInput(passwordInput, window.validationRegex.password, 'Mínimo 8 caracteres.', isEdit);
        const v3 = window.validateInput(nombreInput, window.validationRegex.name, 'Nombre inválido.');
        const v4 = window.validateInput(apellidoInput, window.validationRegex.name, 'Apellido inválido.');
        const v5 = window.validateInput(emailInput, window.validationRegex.email, 'Email inválido.');
        const v6 = window.validateInput(telefonoInput, window.validationRegex.phone, 'Deben ser 10 dígitos.', true);
        const v7 = window.validateInput(direccionInput, null, '', true);

        if (!v1 || !v2 || !v3 || !v4 || !v5 || !v6 || !v7) {
            modalError.textContent = 'Por favor corrige los errores del formulario.';
            modalError.style.display = 'block';
            return;
        }

        saveClientButton.disabled = true;
        saveClientButton.textContent = 'Guardando...';
        
        const data = {
            usuario: usuarioInput.value,
            nombre: nombreInput.value,
            apellido: apellidoInput.value,
            email: emailInput.value,
            telefono: telefonoInput.value,
            direccion: direccionInput.value,
            activo: activoCheckbox.checked
        };

        let method, endpoint;

        if (isEdit) {
            method = 'PUT';
            endpoint = `/api/clientes/admin/${clientId.value}`;
        } else {
            method = 'POST';
            endpoint = '/api/clientes/admin/crear';
            data.password = passwordInput.value;
        }

        try {
            const response = await apiFetch(endpoint, method, data);
            if (response.success) {
                closeModal();
                loadClients();
            }
        } catch (error) {
            modalError.textContent = error.message || 'Error al guardar.';
            modalError.style.display = 'block';
        } finally {
            saveClientButton.disabled = false;
            saveClientButton.textContent = 'Guardar Cliente';
        }
    }

    addClientButton.addEventListener('click', openCreateModal);
    modalCloseButton.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    clientForm.addEventListener('submit', handleFormSubmit);

    tableBody.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('btn-edit')) {
            const id = target.getAttribute('data-id');
            openEditModal(id);
        }
    });

    loadClients();
});