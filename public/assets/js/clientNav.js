document.addEventListener('DOMContentLoaded', () => {
    
    const loginLink = document.getElementById('login-link');
    const cartBadge = document.getElementById('cart-badge');
    const logoutButton = document.getElementById('logout-button');

    let isUserLoggedIn = false;
    let userType = null;
    let currentCart = [];

    async function initializeHeader() {
        await checkAuthStatus();
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
                    if (loginLink) loginLink.textContent = 'Mi Cuenta';
                    if (loginLink) loginLink.href = '/cliente/dashboard/';
                } else if (userType === 'admin') {
                    if (loginLink) loginLink.textContent = 'Admin Panel';
                    if (loginLink) loginLink.href = '/admin/dashboard/';
                }
            } else {
                handleNotAuthenticated();
            }
        } catch (error) {
            console.log('Visitante no autenticado, redirigiendo.');
            handleNotAuthenticated();
        }
    }

    function handleNotAuthenticated() {
        const pathname = window.location.pathname;

        const isPublicClientPage = 
            pathname === '/cliente/' || 
            pathname === '/cliente/index.html' ||
            pathname.startsWith('/cliente/recuperar-password') ||
            pathname.startsWith('/cliente/reset-password');

        const isProtectedPage = pathname.startsWith('/cliente/') && !isPublicClientPage;

        if (isProtectedPage) {
            window.location.href = '/cliente/';
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
        }
    }

    function updateCartBadge() {
        const totalItems = currentCart.reduce((sum, item) => sum + item.cantidad, 0);
        if (cartBadge) {
            if (totalItems > 0) {
                cartBadge.textContent = totalItems;
                cartBadge.classList.add('visible');
            } else {
                cartBadge.classList.remove('visible');
            }
        }
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await apiFetch('/api/auth/logout', 'POST');
                window.location.href = '/cliente/';
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
            }
        });
    }

    initializeHeader();
});