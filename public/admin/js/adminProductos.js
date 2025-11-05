document.addEventListener('DOMContentLoaded', () => {
    
    const tableBody = document.getElementById('products-table-body');
    const modal = document.getElementById('product-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalCloseButton = document.getElementById('modal-close-button');
    const addProductButton = document.getElementById('add-product-button');
    const saveProductButton = document.getElementById('save-product-button');
    const productForm = document.getElementById('product-form');
    const modalError = document.getElementById('modal-error-message');

    const productId = document.getElementById('product-id');
    const nombreInput = document.getElementById('nombre');
    const descripcionInput = document.getElementById('descripcion');
    const precioInput = document.getElementById('precio');
    const categoriaSelect = document.getElementById('id_categoria');
    const stockInput = document.getElementById('cantidad_disponible');
    const stockMinInput = document.getElementById('cantidad_minima');
    const temporadaCheckbox = document.getElementById('es_temporada');
    const temporadaInput = document.getElementById('temporada');
    const activoCheckbox = document.getElementById('activo');
    const imagenInput = document.getElementById('imagen_producto');
    const imagenUrlActual = document.getElementById('imagen_url_actual');

    let categoriesCache = []; 

    async function loadCategories() {
        try {
            const response = await apiFetch('/api/categorias', 'GET');
            if (response.success) {
                categoriesCache = response.data; 
                categoriaSelect.innerHTML = '<option value="">Seleccione una categoría</option>';
                response.data.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id_categoria;
                    option.textContent = cat.nombre;
                    categoriaSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
            categoriaSelect.innerHTML = '<option value="">Error al cargar</option>';
        }
    }

    async function loadProducts() {
        try {
            const response = await apiFetch('/api/productos', 'GET');
            tableBody.innerHTML = ''; 
            if (response.success) {
                response.data.forEach(product => {
                    const category = categoriesCache.find(c => c.id_categoria === product.id_categoria);
                    const categoryName = category ? category.nombre : 'N/A';
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${product.nombre}</td>
                        <td>${categoryName}</td>
                        <td>$${parseFloat(product.precio).toFixed(2)}</td>
                        <td>${product.cantidad_disponible}</td>
                        <td>${product.es_temporada ? (product.temporada || 'Sí') : 'No'}</td>
                        <td>${product.activo ? 'Sí' : 'No'}</td>
                        <td>
                            <button class="action-button btn-edit" data-id="${product.id_producto}">Editar</button>
                            <button class="action-button btn-delete" data-id="${product.id_producto}">Desactivar</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
            tableBody.innerHTML = '<tr><td colspan="7">Error al cargar productos.</td></tr>';
        }
    }

    function openModal() {
        modal.style.display = 'block';
        modalError.style.display = 'none';
    }

    function closeModal() {
        modal.style.display = 'none';
        productForm.reset();
        productId.value = ''; 
    }

    function openCreateModal() {
        modalTitle.textContent = 'Añadir Nuevo Producto';
        productForm.reset();
        productId.value = '';
        activoCheckbox.checked = true; 
        openModal();
    }

    async function openEditModal(id) {
        try {
            const response = await apiFetch(`/api/productos/${id}`, 'GET');
            if (response.success) {
                const product = response.data;
                modalTitle.textContent = 'Editar Producto';
                
                productId.value = product.id_producto;
                nombreInput.value = product.nombre;
                descripcionInput.value = product.descripcion;
                precioInput.value = product.precio;
                categoriaSelect.value = product.id_categoria;
                stockInput.value = product.cantidad_disponible;
                stockMinInput.value = product.cantidad_minima;
                temporadaCheckbox.checked = product.es_temporada;
                temporadaInput.value = product.temporada;
                activoCheckbox.checked = product.activo;
                imagenUrlActual.value = product.imagen_url || '';
                imagenInput.value = null;
                
                openModal();
            }
        } catch (error) {
            console.error('Error obteniendo producto:', error);
            alert('No se pudo cargar la información del producto.');
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        modalError.style.display = 'none';

        const v1 = window.validateInput(nombreInput, window.validationRegex.name, 'Nombre inválido.');
        const v2 = window.validateInput(precioInput, window.validationRegex.price, 'Precio inválido (ej. 25.50).');
        const v3 = window.validateInput(categoriaSelect, window.validationRegex.number, 'Selecciona una categoría.');
        const v4 = window.validateInput(stockInput, window.validationRegex.number, 'Inválido.');
        const v5 = window.validateInput(stockMinInput, window.validationRegex.number, 'Inválido.');
        const v6 = window.validateInput(descripcionInput, null, '', true);
        const v7 = window.validateInput(temporadaInput, null, '', true);

        if (!v1 || !v2 || !v3 || !v4 || !v5 || !v6 || !v7) {
            modalError.textContent = 'Por favor corrige los errores del formulario.';
            modalError.style.display = 'block';
            return;
        }
        
        saveProductButton.disabled = true;
        saveProductButton.textContent = 'Guardando...';

        const isEdit = productId.value;
        const method = isEdit ? 'PUT' : 'POST';
        const endpoint = isEdit ? `/api/productos/${productId.value}` : '/api/productos';

        const formData = new FormData();
        formData.append('nombre', nombreInput.value);
        formData.append('descripcion', descripcionInput.value);
        formData.append('precio', parseFloat(precioInput.value));
        formData.append('id_categoria', parseInt(categoriaSelect.value, 10));
        formData.append('cantidad_disponible', parseInt(stockInput.value, 10));
        formData.append('cantidad_minima', parseInt(stockMinInput.value, 10));
        formData.append('es_temporada', temporadaCheckbox.checked);
        formData.append('temporada', temporadaInput.value);
        formData.append('activo', activoCheckbox.checked);
        
        if (isEdit) {
            formData.append('imagen_url_actual', imagenUrlActual.value);
        }
        if (imagenInput.files[0]) {
            formData.append('imagen_producto', imagenInput.files[0]);
        }

        try {
            const response = await fetch(endpoint, {
                method: method,
                body: formData, 
                credentials: 'include' 
            });

            const data = await response.json();
            if (!response.ok) throw data;

            if (data.success) {
                closeModal();
                loadProducts(); 
            }
        } catch (error) {
            modalError.textContent = error.message || 'Error al guardar.';
            modalError.style.display = 'block';
        } finally {
            saveProductButton.disabled = false;
            saveProductButton.textContent = 'Guardar Producto';
        }
    }

    async function handleDelete(id) {
        if (!confirm('¿Está seguro de que desea desactivar este producto? (Borrado lógico)')) {
            return;
        }
        try {
            const response = await apiFetch(`/api/productos/${id}`, 'DELETE');
            if (response.success) {
                loadProducts(); 
            }
        } catch (error) {
            alert(error.message || 'Error al desactivar el producto.');
        }
    }

    addProductButton.addEventListener('click', openCreateModal);
    modalCloseButton.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    productForm.addEventListener('submit', handleFormSubmit);

    tableBody.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.getAttribute('data-id');
        if (target.classList.contains('btn-edit')) {
            openEditModal(id);
        } else if (target.classList.contains('btn-delete')) {
            handleDelete(id);
        }
    });

    async function init() {
        await loadCategories(); 
        await loadProducts();   
    }
    init();
});