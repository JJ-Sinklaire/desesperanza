document.addEventListener('DOMContentLoaded', () => {
    
    apiFetch('/api/auth/verificar', 'GET').then(data => {
        if (data.success && data.autenticado && data.tipo === 'admin') {
            window.location.href = '/admin/dashboard/';
        }
    }).catch(() => {
    });

    const loginForm = document.getElementById('login-admin-form');
    const loginButton = document.getElementById('login-button');
    const errorMessage = document.getElementById('error-message');
    const usuarioInput = document.getElementById('usuario');
    const passwordInput = document.getElementById('password');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';

        const v1 = window.validateInput(usuarioInput, window.validationRegex.alphanumeric, 'Usuario inválido.');
        const v2 = window.validateInput(passwordInput, null, '');
        
        if (!v1 || !v2) return;

        loginButton.disabled = true;
        loginButton.textContent = 'Ingresando...';

        const data = {
            usuario: usuarioInput.value,
            password: passwordInput.value
        };

        try {
            const response = await apiFetch('/api/auth/login-admin', 'POST', data);

            if (response.success) {
                window.location.href = '/admin/dashboard/';
            } 
        } catch (error) {
            errorMessage.textContent = error.message || 'Error de conexión. Intente de nuevo.';
            errorMessage.style.display = 'block';
            loginButton.disabled = false;
            loginButton.textContent = 'Ingresar';
        }
    });
});