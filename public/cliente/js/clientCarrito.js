document.addEventListener('DOMContentLoaded', () => {

    const itemsContainer = document.getElementById('cart-items-container');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTotal = document.getElementById('summary-total');
    const checkoutButton = document.getElementById('checkout-button');
    const emptyMessage = document.getElementById('cart-empty-message');
    const successMessage = document.getElementById('checkout-success-message');
    const cartGrid = document.getElementById('cart-grid');
    const checkoutError = document.getElementById('checkout-error');

    let currentCart = [];

    async function loadCart() {
        try {
            const response = await apiFetch('/api/pedidos/carrito', 'GET');
            if (response.success) {
                currentCart = response.data;
                renderCart();
            }
        } catch (error) {
            console.error('Error al cargar carrito:', error);
            if (error.status === 401) {
                window.location.href = '/cliente/';
            }
        }
    }

    function renderCart() {
        itemsContainer.innerHTML = '';
        
        if (currentCart.length === 0) {
            emptyMessage.style.display = 'block';
            checkoutButton.disabled = true;
        } else {
            emptyMessage.style.display = 'none';
            checkoutButton.disabled = false;
        }

        let subtotal = 0;

        currentCart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            
            const price = parseFloat(item.precio_unitario);
            const itemTotal = price * item.cantidad;
            subtotal += itemTotal;

            itemElement.innerHTML = `
                <div class="cart-item-details">
                    <h3>${item.nombre}</h3>
                    <p class="cart-item-price">$${price.toFixed(2)}</p>
                    <div class="cart-item-actions">
                        <span class="cart-item-quantity">Cantidad: ${item.cantidad}</span>
                        <button class="remove-item-btn" data-id="${item.id_producto}">Eliminar</button>
                    </div>
                </div>
            `;
            
            itemElement.querySelector('.remove-item-btn').addEventListener('click', handleRemoveItem);
            itemsContainer.appendChild(itemElement);
        });

        summarySubtotal.textContent = `$${subtotal.toFixed(2)}`;
        summaryTotal.textContent = `$${subtotal.toFixed(2)}`;
    }

    async function handleRemoveItem(event) {
        const button = event.target;
        const productId = button.getAttribute('data-id');
        
        button.disabled = true;
        
        try {
            const response = await apiFetch(`/api/pedidos/carrito/${productId}`, 'DELETE');
            if (response.success) {
                currentCart = response.data;
                renderCart();
                updateHeaderCartBadge(response.data);
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert(error.message || 'No se pudo eliminar el producto.');
            button.disabled = false;
        }
    }

    async function handleCheckout() {
        checkoutButton.disabled = true;
        checkoutButton.textContent = 'Procesando...';
        checkoutError.style.display = 'none';

        try {
            const response = await apiFetch('/api/pedidos/checkout', 'POST');
            if (response.success) {
                currentCart = [];
                cartGrid.style.display = 'none';
                successMessage.style.display = 'block';
                updateHeaderCartBadge([]);
            }
        } catch (error) {
            console.error('Error en checkout:', error);
            checkoutError.textContent = error.message || 'Error al procesar el pedido.';
            checkoutError.style.display = 'block';
            checkoutButton.disabled = false;
            checkoutButton.textContent = 'Finalizar Compra';
        }
    }

    function updateHeaderCartBadge(cart) {
        const cartBadge = document.getElementById('cart-badge');
        const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
        if (totalItems > 0) {
            cartBadge.textContent = totalItems;
            cartBadge.classList.add('visible');
        } else {
            cartBadge.textContent = '0';
            cartBadge.classList.remove('visible');
        }
    }

    checkoutButton.addEventListener('click', handleCheckout);

    loadCart();
});