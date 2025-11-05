document.addEventListener('DOMContentLoaded', () => {

    apiFetch('/api/auth/verificar', 'GET').then(data => {
        if (data.success && data.autenticado && data.tipo === 'cliente') {
            window.location.href = '/cliente/dashboard/';
        }
    }).catch(() => {
    });

    const toggleToRegister = document.getElementById('toggle-to-register');
    const toggleToLogin = document.getElementById('toggle-to-login');
    const body = document.body;

    toggleToRegister.addEventListener('click', () => {
        body.classList.add('show-register');
    });

    toggleToLogin.addEventListener('click', () => {
        body.classList.remove('show-register');
    });

    const loginForm = document.getElementById('login-form');
    const loginButton = document.getElementById('login-button');
    const loginError = document.getElementById('login-error');
    const loginUsuarioInput = document.getElementById('login-usuario');
    const loginPasswordInput = document.getElementById('login-password');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const v1 = window.validateInput(loginUsuarioInput, window.validationRegex.alphanumeric, 'Usuario inválido.');
        const v2 = window.validateInput(loginPasswordInput, null, '');
        
        if (!v1 || !v2) return;

        loginButton.disabled = true;
        loginButton.textContent = 'Ingresando...';
        loginError.style.display = 'none';

        const data = {
            usuario: loginUsuarioInput.value,
            password: loginPasswordInput.value
        };

        try {
            const response = await apiFetch('/api/auth/login-cliente', 'POST', data);
            if (response.success) {
                window.location.href = '/tienda/';
            }
        } catch (error) {
            loginError.textContent = error.message;
            loginError.style.display = 'block';
            loginButton.disabled = false;
            loginButton.textContent = 'Ingresar';
        }
    });

    const registerForm = document.getElementById('register-form');
    const registerButton = document.getElementById('register-button');
    const registerError = document.getElementById('register-error');
    const registerSuccess = document.getElementById('register-success');
    
    const regUsuario = document.getElementById('register-usuario');
    const regEmail = document.getElementById('register-email');
    const regNombre = document.getElementById('register-nombre');
    const regApellido = document.getElementById('register-apellido');
    const regPassword = document.getElementById('register-password');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerError.style.display = 'none';
        registerSuccess.style.display = 'none';

        const v1 = window.validateInput(regUsuario, window.validationRegex.alphanumeric, 'Usuario inválido (solo letras, números, guión bajo).');
        const v2 = window.validateInput(regEmail, window.validationRegex.email, 'Email inválido.');
        const v3 = window.validateInput(regNombre, window.validationRegex.name, 'Nombre inválido.');
        const v4 = window.validateInput(regApellido, window.validationRegex.name, 'Apellido inválido.');
        const v5 = window.validateInput(regPassword, window.validationRegex.password, 'La contraseña debe tener mínimo 8 caracteres.');
        
        if (!v1 || !v2 || !v3 || !v4 || !v5) {
            registerError.textContent = 'Por favor corrige los errores en el formulario.';
            registerError.style.display = 'block';
            return;
        }

        registerButton.disabled = true;
        registerButton.textContent = 'Registrando...';

        const data = {
            usuario: regUsuario.value,
            email: regEmail.value,
            nombre: regNombre.value,
            apellido: regApellido.value,
            password: regPassword.value
        };

        try {
            const response = await apiFetch('/api/auth/register-cliente', 'POST', data);
            if (response.success) {
                registerSuccess.textContent = '¡Registro exitoso! Revisa tu email. Serás redirigido al login.';
                registerSuccess.style.display = 'block';
                registerForm.reset();
                setTimeout(() => {
                    body.classList.remove('show-register');
                    registerSuccess.style.display = 'none';
                }, 3000);
            }
        } catch (error) {
            registerError.textContent = error.message;
            registerError.style.display = 'block';
        } finally {
            registerButton.disabled = false;
            registerButton.textContent = 'Registrarse';
        }
    });
});