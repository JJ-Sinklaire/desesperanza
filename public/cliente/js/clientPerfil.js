document.addEventListener('DOMContentLoaded', () => {

    const profileForm = document.getElementById('profile-form');
    const passwordForm = document.getElementById('password-form');
    
    const usuarioInput = document.getElementById('usuario');
    const emailInput = document.getElementById('email');
    const nombreInput = document.getElementById('nombre');
    const apellidoInput = document.getElementById('apellido');
    const telefonoInput = document.getElementById('telefono');
    const direccionInput = document.getElementById('direccion');
    
    const saveProfileButton = document.getElementById('save-profile-button');
    const savePasswordButton = document.getElementById('save-password-button');
    
    const profileMessage = document.getElementById('profile-message');
    const passwordMessage = document.getElementById('password-message');

    async function loadProfile() {
        try {
            const response = await apiFetch('/api/clientes/perfil', 'GET');
            if (response.success) {
                const user = response.data;
                usuarioInput.value = user.usuario;
                emailInput.value = user.email;
                nombreInput.value = user.nombre;
                apellidoInput.value = user.apellido;
                telefonoInput.value = user.telefono || '';
                direccionInput.value = user.direccion || '';
            }
        } catch (error) {
            console.error('Error cargando perfil:', error);
            if (error.status === 401) {
                window.location.href = '/cliente/';
            }
        }
    }

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveProfileButton.disabled = true;
        saveProfileButton.textContent = 'Guardando...';
        profileMessage.textContent = '';
        profileMessage.className = 'form-message';

        const data = {
            email: emailInput.value,
            nombre: nombreInput.value,
            apellido: apellidoInput.value,
            telefono: telefonoInput.value,
            direccion: direccionInput.value
        };

        try {
            const response = await apiFetch('/api/clientes/perfil', 'PUT', data);
            if (response.success) {
                profileMessage.textContent = '¡Perfil actualizado con éxito!';
                profileMessage.className = 'form-message success';
            }
        } catch (error) {
            profileMessage.textContent = error.message || 'Error al actualizar.';
            profileMessage.className = 'form-message error';
        } finally {
            saveProfileButton.disabled = false;
            saveProfileButton.textContent = 'Guardar Cambios';
        }
    });

    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        savePasswordButton.disabled = true;
        savePasswordButton.textContent = 'Actualizando...';
        passwordMessage.textContent = '';
        passwordMessage.className = 'form-message';

        const data = {
            oldPassword: document.getElementById('oldPassword').value,
            newPassword: document.getElementById('newPassword').value
        };

        try {
            const response = await apiFetch('/api/clientes/cambiar-password', 'POST', data);
            if (response.success) {
                passwordMessage.textContent = '¡Contraseña actualizada con éxito!';
                passwordMessage.className = 'form-message success';
                passwordForm.reset();
            }
        } catch (error) {
            passwordMessage.textContent = error.message || 'Error al cambiar la contraseña.';
            passwordMessage.className = 'form-message error';
        } finally {
            savePasswordButton.disabled = false;
            savePasswordButton.textContent = 'Actualizar Contraseña';
        }
    });

    loadProfile();
});