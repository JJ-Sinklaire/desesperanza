document.addEventListener('DOMContentLoaded', () => {

    const grid = document.getElementById('product-grid-container');
    const loginLink = document.getElementById('login-link');
    const cartBadge = document.getElementById('cart-badge');
    
    let isUserLoggedIn = false;
    let userType = null;
    let currentCart = [];

    async function initializeShop() {
        await checkAuthStatus();
        await loadProducts();
        
        if (isUserLoggedIn && userType === 'cliente') {
            await loadCart();
        }
    }

    async function checkAuthStatus() {
        try {
            const data = await apiFetch('/api/auth/verificar', 'GET');
            if (data.success && data.autenticado) {
                isUserLoggedIn = true;
                userType = data.tipo;
                if (userType === 'cliente') {
                    loginLink.textContent = 'Mi Cuenta';
                    loginLink.href = '/cliente/dashboard/';
                } else if (userType === 'admin') {
                    loginLink.textContent = 'Admin Panel';
                    loginLink.href = '/admin/dashboard/';
                }
            }
        } catch (error) {
            console.log('Visitante no autenticado');
        }
    }

    async function loadCart() {
        try {
            const response = await apiFetch('/api/pedidos/carrito', 'GET');
            if (response.success) {
                currentCart = response.data;
                updateCartBadge();
            }
        } catch (error) {
            console.error('Error al cargar carrito:', error);
        }
    }

    function updateCartBadge() {
        const totalItems = currentCart.reduce((sum, item) => sum + item.cantidad, 0);
        if (totalItems > 0) {
            cartBadge.textContent = totalItems;
            cartBadge.classList.add('visible');
        } else {
            cartBadge.classList.remove('visible');
        }
    }

    async function loadProducts() {
        try {
            const response = await apiFetch('/api/productos', 'GET');
            grid.innerHTML = '';
            
            if (!response.success || response.data.length === 0) {
                grid.innerHTML = '<p>No hay productos disponibles por el momento.</p>';
                return;
            }
            
            response.data.forEach(product => {
                grid.appendChild(createProductCard(product));
            });
            
        } catch (error) {
            console.error('Error cargando productos:', error);
            grid.innerHTML = '<p>Error al cargar los productos. Intente de nuevo.</p>';
        }
    }

    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'tienda-product-card';

        const price = parseFloat(product.precio).toFixed(2);
        const imageUrl = product.imagen_url || '../assets/images/placeholder.jpg';

        card.innerHTML = `
            <div class="product-image-container">
                <img src="${imageUrl}" alt="${product.nombre}" class="tienda-product-image" onerror="this.src='../assets/images/placeholder.jpg'">
            </div>
            <div class="product-info">
                <h3 class="tienda-product-name">${product.nombre}</h3> 
                <p class="tienda-product-description">${product.descripcion || ''}</p>
                <div class="tienda-product-footer"> 
                    <span class="tienda-product-price">$${price}</span> 
                    <div class="quantity-selector">
                        <button class="quantity-btn" data-action="decrease">-</button>
                        <input class="quantity-input" type="number" value="1" min="1" max="99">
                        <button class="quantity-btn" data-action="increase">+</button>
                    </div>
                    <button class="tienda-add-to-cart" data-id="${product.id_producto}">Agregar al Carrito</button>
                </div>
            </div>
        `;

        const qtyInput = card.querySelector('.quantity-input');

        card.querySelector('.tienda-add-to-cart').addEventListener('click', (e) => handleAddToCart(e, qtyInput));
        
        card.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                let currentValue = parseInt(qtyInput.value, 10);
                if (action === 'increase') {
                    currentValue++;
                } else if (action === 'decrease' && currentValue > 1) {
                    currentValue--;
                }
                qtyInput.value = currentValue;
            });
        });

        return card;
    }

    async function handleAddToCart(event, quantityInput) {
        if (!isUserLoggedIn || userType !== 'cliente') {
            alert('Por favor, inicia sesión como cliente para añadir productos al carrito.');
            window.location.href = '/cliente/';
            return;
        }

        const button = event.target;
        const productId = button.getAttribute('data-id');
        const quantity = parseInt(quantityInput.value, 10);
        
        if (quantity <= 0) {
            alert('Seleccione una cantidad válida.');
            return;
        }

        button.disabled = true;
        button.textContent = 'Añadiendo...';

        try {
            const response = await apiFetch('/api/pedidos/carrito', 'POST', {
                id_producto: parseInt(productId, 10),
                cantidad: quantity
            });
            
            if (response.success) {
                currentCart = response.data;
                updateCartBadge();
                button.textContent = 'Añadido ✓';
                setTimeout(() => {
                    button.disabled = false;
                    button.textContent = 'Agregar al Carrito';
                }, 2000);
            }
        } catch (error) {
            console.error('Error al añadir al carrito:', error);
            alert(error.message || 'No se pudo añadir el producto.');
            button.disabled = false;
            button.textContent = 'Agregar al Carrito';
        }
    }

    initializeShop();
});