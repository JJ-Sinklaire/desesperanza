document.addEventListener('DOMContentLoaded', () => {

    const resetForm = document.getElementById('reset-form');
    const resetButton = document.getElementById('reset-button');
    const passwordInput = document.getElementById('new-password');
    const tokenInput = document.getElementById('token');
    const errorMsg = document.getElementById('reset-error');
    const successMsg = document.getElementById('reset-success');

    function getTokenFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('token');
    }

    const token = getTokenFromURL();
    if (token) {
        tokenInput.value = token;
    } else {
        errorMsg.textContent = 'Token no válido o faltante.';
        errorMsg.style.display = 'block';
        resetButton.disabled = true;
    }

    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!tokenInput.value) {
            errorMsg.textContent = 'Token no válido o faltante.';
            errorMsg.style.display = 'block';
            return;
        }

        resetButton.disabled = true;
        resetButton.textContent = 'Guardando...';
        errorMsg.style.display = 'none';
        successMsg.style.display = 'none';

        try {
            const response = await apiFetch('/api/auth/reset-password', 'POST', {
                token: tokenInput.value,
                newPassword: passwordInput.value
            });
            
            if (response.success) {
                successMsg.innerHTML = '¡Contraseña actualizada! Serás redirigido al login en 3 segundos...';
                successMsg.style.display = 'block';
                resetForm.reset();
                setTimeout(() => {
                    window.location.href = '/cliente/';
                }, 3000);
            }
        } catch (error) {
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
            resetButton.disabled = false;
            resetButton.textContent = 'Guardar Nueva Contraseña';
        }
    });
});