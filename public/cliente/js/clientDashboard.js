document.addEventListener('DOMContentLoaded', () => {

    const welcomeName = document.getElementById('welcome-name');
    const profileUsuario = document.getElementById('profile-usuario');
    const profileEmail = document.getElementById('profile-email');

    async function loadDashboard() {
        try {
            const data = await apiFetch('/api/clientes/perfil', 'GET');
            
            if (data.success) {
                const user = data.data;
                if(welcomeName) welcomeName.textContent = `Bienvenido, ${user.nombre}`;
                if(profileUsuario) profileUsuario.textContent = user.usuario;
                if(profileEmail) profileEmail.textContent = user.email;
            }
        } catch (error) {
            console.error('Error cargando perfil:', error);
        }
    }

    loadDashboard();
});