document.addEventListener('DOMContentLoaded', async () => {
    
    const usernamePlaceholder = document.getElementById('admin-username-placeholder');
    const logoutButton = document.getElementById('admin-logout-button');

    try {
        const data = await apiFetch('/api/auth/verificar', 'GET');

        if (data.success && data.autenticado && data.tipo === 'admin') {
            usernamePlaceholder.textContent = data.usuario.nombre_completo;
        } else {
            window.location.href = '/admin/';
        }
    } catch (error) {
        console.error('Error de verificación:', error);
        window.location.href = '/admin/';
    }

    logoutButton.addEventListener('click', async () => {
        try {
            await apiFetch('/api/auth/logout', 'POST');
            window.location.href = '/admin/';
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            alert('No se pudo cerrar sesión. Intente de nuevo.');
        }
    });

});