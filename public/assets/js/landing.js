document.addEventListener('DOMContentLoaded', () => {

    const track = document.getElementById('featured-products-carousel');
    const prevButton = document.getElementById('carousel-prev');
    const nextButton = document.getElementById('carousel-next');
    let slideIndex = 0;
    let slides = [];

    async function loadFeaturedProducts() {
        try {
            const response = await apiFetch('/api/productos', 'GET');
            track.innerHTML = '';
            
            if (!response.success || response.data.length === 0) {
                track.innerHTML = '<p>No hay productos destacados por el momento.</p>';
                prevButton.style.display = 'none';
                nextButton.style.display = 'none';
                return;
            }
            
            const featured = response.data
                .filter(p => p.es_temporada && p.activo)
                .slice(0, 4);
            
            if (featured.length === 0) {
                 track.innerHTML = '<p>Pronto tendremos nuevos productos de temporada.</p>';
                 prevButton.style.display = 'none';
                 nextButton.style.display = 'none';
                 return;
            }
            
            featured.forEach(product => {
                track.appendChild(createCarouselSlide(product));
            });
            
            slides = track.querySelectorAll('.carousel-slide');
            setupCarousel();
            
        } catch (error) {
            console.error('Error cargando productos destacados:', error);
            track.innerHTML = '<p>Error al cargar productos.</p>';
        }
    }

    function createCarouselSlide(product) {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';

        const price = parseFloat(product.precio).toFixed(2);
        const imageUrl = product.imagen_url || 'assets/images/placeholder.jpg';

        slide.innerHTML = `
            <div class="product-card">
                <div class="product-image-container">
                    <img src="${imageUrl}" alt="${product.nombre}" class="product-image" onerror="this.src='assets/images/placeholder.jpg'">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.nombre}</h3>
                    <p class="product-description">${product.descripcion || ''}</p>
                    <div class="product-footer">
                        <span class="product-price">$${price}</span>
                    </div>
                </div>
            </div>
        `;
        return slide;
    }

    function setupCarousel() {
        if (slides.length <= 1) {
            prevButton.style.display = 'none';
            nextButton.style.display = 'none';
        }

        const updateSlidePosition = () => {
            track.style.transform = `translateX(-${slideIndex * 100}%)`;
        };

        nextButton.addEventListener('click', () => {
            slideIndex++;
            if (slideIndex > slides.length - 1) {
                slideIndex = 0;
            }
            updateSlidePosition();
        });

        prevButton.addEventListener('click', () => {
            slideIndex--;
            if (slideIndex < 0) {
                slideIndex = slides.length - 1;
            }
            updateSlidePosition();
        });
    }

    loadFeaturedProducts();
});