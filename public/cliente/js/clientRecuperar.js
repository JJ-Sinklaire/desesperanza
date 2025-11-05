document.addEventListener('DOMContentLoaded', () => {

    const recoverForm = document.getElementById('recover-form');
    const recoverButton = document.getElementById('recover-button');
    const emailInput = document.getElementById('recover-email');
    const errorMsg = document.getElementById('recover-error');
    const successMsg = document.getElementById('recover-success');

    recoverForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        recoverButton.disabled = true;
        recoverButton.textContent = 'Enviando...';
        errorMsg.style.display = 'none';
        successMsg.style.display = 'none';

        try {
            const response = await apiFetch('/api/auth/recuperar-password', 'POST', {
                email: emailInput.value
            });
            
            if (response.success) {
                successMsg.textContent = '¡Correo enviado! Revisa tu bandeja de entrada.';
                successMsg.style.display = 'block';
                emailInput.disabled = true;
            }
        } catch (error) {
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
            recoverButton.disabled = false;
            recoverButton.textContent = 'Enviar Enlace';
        }
    });
});