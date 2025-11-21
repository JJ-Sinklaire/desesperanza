// addressSelector.js - Address selector with Leaflet

document.addEventListener('DOMContentLoaded', () => {
    let map;
    let marker;
    let currentLocation = { lat: 19.4326, lng: -99.1332 }; // Ciudad de México por defecto
    let addresses = [];
    let editingAddressId = null;

    // Elementos del DOM
    const form = document.getElementById('address-form');
    const btnMyLocation = document.getElementById('btn-my-location');
    const btnSearch = document.getElementById('btn-search');
    const btnCancel = document.getElementById('btn-cancel');
    const addressesList = document.getElementById('addresses-list');

    // Inicializar
    initializeMap();
    loadSavedAddresses();

    // Inicializar mapa de Leaflet
    function initializeMap() {
        // Crear mapa centrado en CDMX
        map = L.map('map').setView([currentLocation.lat, currentLocation.lng], 13);

        // Agregar capa de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        // Agregar marcador draggable
        marker = L.marker([currentLocation.lat, currentLocation.lng], {
            draggable: true,
            icon: createCustomIcon()
        }).addTo(map);

        // Evento cuando se arrastra el marcador
        marker.on('dragend', function(e) {
            const position = marker.getLatLng();
            updateCoordinates(position.lat, position.lng);
            reverseGeocode(position.lat, position.lng);
        });

        // Evento click en el mapa
        map.on('click', function(e) {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            updateCoordinates(lat, lng);
            reverseGeocode(lat, lng);
        });

        // Agregar popup al marcador
        marker.bindPopup('<b>Tu ubicación</b><br>Arrastra el marcador o haz clic en el mapa').openPopup();
    }

    // Crear icono personalizado
    function createCustomIcon() {
        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                background: #5D4037;
                width: 30px;
                height: 30px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 3px solid #FFF;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            ">
                <div style="
                    width: 15px;
                    height: 15px;
                    background: #FFF;
                    border-radius: 50%;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                "></div>
            </div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });
    }

    // Actualizar coordenadas en el formulario
    function updateCoordinates(lat, lng) {
        currentLocation = { lat, lng };
        document.getElementById('latitud').value = lat.toFixed(6);
        document.getElementById('longitud').value = lng.toFixed(6);
        document.getElementById('display-lat').textContent = lat.toFixed(6);
        document.getElementById('display-lng').textContent = lng.toFixed(6);
    }

    // Geocodificación inversa (obtener dirección de coordenadas)
    async function reverseGeocode(lat, lng) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            const data = await response.json();

            if (data && data.address) {
                // Autocompletar campos del formulario
                const addr = data.address;

                if (addr.road) {
                    const numero = addr.house_number || '';
                    document.getElementById('calle').value = `${addr.road} ${numero}`.trim();
                }

                if (addr.suburb || addr.neighbourhood) {
                    document.getElementById('colonia').value = addr.suburb || addr.neighbourhood;
                }

                if (addr.postcode) {
                    document.getElementById('codigo_postal').value = addr.postcode;
                }

                if (addr.city || addr.town) {
                    document.getElementById('ciudad').value = addr.city || addr.town;
                }

                if (addr.state) {
                    document.getElementById('estado').value = addr.state;
                }
            }
        } catch (error) {
            console.error('Error en geocodificación inversa:', error);
        }
    }

    // Obtener ubicación actual del usuario
    btnMyLocation.addEventListener('click', () => {
        if ('geolocation' in navigator) {
            btnMyLocation.disabled = true;
            btnMyLocation.textContent = 'Obteniendo ubicación...';

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    map.setView([lat, lng], 16);
                    marker.setLatLng([lat, lng]);
                    updateCoordinates(lat, lng);
                    reverseGeocode(lat, lng);

                    btnMyLocation.disabled = false;
                    btnMyLocation.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        Usar mi ubicación
                    `;
                },
                (error) => {
                    alert('No se pudo obtener tu ubicación. Por favor, verifica los permisos.');
                    btnMyLocation.disabled = false;
                    btnMyLocation.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        Usar mi ubicación
                    `;
                }
            );
        } else {
            alert('Tu navegador no soporta geolocalización.');
        }
    });

    // Buscar lugar
    btnSearch.addEventListener('click', () => {
        const query = prompt('Ingresa un lugar (calle, colonia, código postal):');
        if (query) {
            searchLocation(query);
        }
    });

    // Buscar ubicación por texto
    async function searchLocation(query) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
            );
            const data = await response.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);

                map.setView([lat, lng], 16);
                marker.setLatLng([lat, lng]);
                updateCoordinates(lat, lng);
                reverseGeocode(lat, lng);
            } else {
                alert('No se encontró la ubicación. Intenta con otro nombre.');
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
            alert('Error al buscar la ubicación.');
        }
    }

    // Guardar dirección
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const addressData = {
            alias: document.getElementById('alias').value.trim(),
            calle: document.getElementById('calle').value.trim(),
            colonia: document.getElementById('colonia').value.trim(),
            codigo_postal: document.getElementById('codigo_postal').value.trim(),
            ciudad: document.getElementById('ciudad').value.trim(),
            estado: document.getElementById('estado').value.trim(),
            referencias: document.getElementById('referencias').value.trim(),
            latitud: parseFloat(document.getElementById('latitud').value),
            longitud: parseFloat(document.getElementById('longitud').value)
        };

        // Validar que se hayan seleccionado coordenadas
        if (!addressData.latitud || !addressData.longitud) {
            alert('Por favor, selecciona una ubicación en el mapa.');
            return;
        }

        try {
            const btnSave = document.getElementById('btn-save');
            btnSave.disabled = true;
            btnSave.textContent = 'Guardando...';

            let response;
            if (editingAddressId) {
                // Actualizar dirección existente
                response = await apiFetch(`/api/direcciones/${editingAddressId}`, 'PUT', addressData);
            } else {
                // Crear nueva dirección
                response = await apiFetch('/api/direcciones', 'POST', addressData);
            }

            if (response.success) {
                alert(editingAddressId ? 'Dirección actualizada correctamente' : 'Dirección guardada correctamente');
                resetForm();
                await loadSavedAddresses();
            }

            btnSave.disabled = false;
            btnSave.textContent = 'Guardar Dirección';
        } catch (error) {
            console.error('Error al guardar dirección:', error);
            alert(error.message || 'Error al guardar la dirección');
            document.getElementById('btn-save').disabled = false;
            document.getElementById('btn-save').textContent = 'Guardar Dirección';
        }
    });

    // Cancelar edición
    btnCancel.addEventListener('click', () => {
        resetForm();
    });

    // Reset form
    function resetForm() {
        form.reset();
        editingAddressId = null;
        document.getElementById('display-lat').textContent = '--';
        document.getElementById('display-lng').textContent = '--';
        document.getElementById('btn-save').textContent = 'Guardar Dirección';
    }

    // Cargar direcciones guardadas
    async function loadSavedAddresses() {
        try {
            const response = await apiFetch('/api/direcciones', 'GET');

            if (response.success && response.data) {
                addresses = response.data;
                renderAddresses();
            }
        } catch (error) {
            console.error('Error al cargar direcciones:', error);
        }
    }

    // Renderizar lista de direcciones
    function renderAddresses() {
        if (addresses.length === 0) {
            addressesList.innerHTML = `
                <div class="empty-addresses">
                    <p>No tienes direcciones guardadas aún.</p>
                    <p>Selecciona una ubicación en el mapa y completa el formulario.</p>
                </div>
            `;
            return;
        }

        addressesList.innerHTML = addresses.map(addr => `
            <div class="address-card" data-id="${addr.id_direccion}">
                <div class="address-card-header">
                    <span class="address-alias">📍 ${addr.alias}</span>
                    <div class="address-card-actions">
                        <button class="btn-address-action btn-select" onclick="selectAddress(${addr.id_direccion})">Usar</button>
                        <button class="btn-address-action btn-edit" onclick="editAddress(${addr.id_direccion})">Editar</button>
                        <button class="btn-address-action btn-delete" onclick="deleteAddress(${addr.id_direccion})">Eliminar</button>
                    </div>
                </div>
                <div class="address-details">
                    <p><strong>Dirección:</strong> ${addr.calle}</p>
                    <p><strong>Colonia:</strong> ${addr.colonia}, CP: ${addr.codigo_postal}</p>
                    <p><strong>Ciudad:</strong> ${addr.ciudad}, ${addr.estado}</p>
                    ${addr.referencias ? `<p><strong>Referencias:</strong> ${addr.referencias}</p>` : ''}
                </div>
            </div>
        `).join('');
    }

    // Funciones globales para los botones
    window.selectAddress = function(id) {
        const address = addresses.find(a => a.id_direccion === id);
        if (address) {
            // Guardar en localStorage o usar para el pedido
            localStorage.setItem('selectedAddress', JSON.stringify(address));
            alert(`Dirección "${address.alias}" seleccionada para tu próximo pedido.`);
            // Opcionalmente redirigir al carrito
            // window.location.href = '/cliente/carrito/';
        }
    };

    window.editAddress = function(id) {
        const address = addresses.find(a => a.id_direccion === id);
        if (address) {
            editingAddressId = id;

            // Llenar formulario
            document.getElementById('alias').value = address.alias;
            document.getElementById('calle').value = address.calle;
            document.getElementById('colonia').value = address.colonia;
            document.getElementById('codigo_postal').value = address.codigo_postal;
            document.getElementById('ciudad').value = address.ciudad;
            document.getElementById('estado').value = address.estado;
            document.getElementById('referencias').value = address.referencias || '';

            // Actualizar mapa
            const lat = parseFloat(address.latitud);
            const lng = parseFloat(address.longitud);
            map.setView([lat, lng], 16);
            marker.setLatLng([lat, lng]);
            updateCoordinates(lat, lng);

            // Cambiar texto del botón
            document.getElementById('btn-save').textContent = 'Actualizar Dirección';

            // Scroll al formulario
            form.scrollIntoView({ behavior: 'smooth' });
        }
    };

    window.deleteAddress = async function(id) {
        if (!confirm('¿Estás seguro de eliminar esta dirección?')) {
            return;
        }

        try {
            const response = await apiFetch(`/api/direcciones/${id}`, 'DELETE');

            if (response.success) {
                alert('Dirección eliminada correctamente');
                await loadSavedAddresses();
            }
        } catch (error) {
            console.error('Error al eliminar dirección:', error);
            alert(error.message || 'Error al eliminar la dirección');
        }
    };
});