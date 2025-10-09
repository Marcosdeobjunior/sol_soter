document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const fab = document.getElementById('fab-add-item');
    const addModal = document.getElementById('add-item-modal');
    const detailsModal = document.getElementById('details-modal');
    const closeBtn = addModal.querySelector('.close-button');
    const detailsCloseBtn = detailsModal.querySelector('.details-close');
    const modalForm = document.getElementById('modal-form');
    const itemTypeSelect = document.getElementById('item-type');
    const seriesAnimeFields = document.getElementById('series-anime-fields');
    const tabsContainer = document.getElementById('tabs-container');
    const searchBar = document.getElementById('search-bar');
    const genresContainer = document.getElementById('genres-summary-container');

    let currentFilter = 'movies';
    let currentGenreFilter = null;
    let editingItemId = null;

    // --- Lógica de Modais e Eventos ---

    function resetAddModal() {
        editingItemId = null;
        modalForm.reset();
        document.querySelector('#add-item-modal h2').textContent = 'Adicionar Novo Item';
        document.querySelector('#modal-form button[type="submit"]').textContent = 'Salvar Item';
        seriesAnimeFields.style.display = 'none';
    }

    fab.addEventListener('click', () => {
        resetAddModal();
        addModal.style.display = 'block';
    });

    const closeModal = () => {
        addModal.style.display = 'none';
        resetAddModal();
    };

    closeBtn.addEventListener('click', closeModal);
    detailsCloseBtn.addEventListener('click', () => detailsModal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === addModal) closeModal();
        if (event.target === detailsModal) detailsModal.style.display = 'none';
    });
    itemTypeSelect.addEventListener('change', () => {
        const selectedType = itemTypeSelect.value;
        seriesAnimeFields.style.display = (selectedType === 'series' || selectedType === 'animes') ? 'flex' : 'none';
    });
    modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (editingItemId) {
            updateItem();
        } else {
            addItem();
        }
        addModal.style.display = 'none';
    });
    tabsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-link')) {
            currentFilter = e.target.getAttribute('data-filter');

            if (currentGenreFilter) {
                currentGenreFilter = null;
                const activeGenreTag = document.querySelector('.genre-tag.active');
                if (activeGenreTag) activeGenreTag.classList.remove('active');
            }

            document.querySelector('.tab-link.active').classList.remove('active');
            e.target.classList.add('active');
            displayItems();
        }
    });

    genresContainer.addEventListener('click', (e) => {
        const targetTag = e.target.closest('.genre-tag');
        if (!targetTag) return;

        const genre = targetTag.dataset.genre;

        const activeTab = document.querySelector('.tab-link.active');
        if (activeTab) activeTab.classList.remove('active');

        document.querySelectorAll('.genre-tag.active').forEach(t => t.classList.remove('active'));

        if (currentGenreFilter === genre) {
            currentGenreFilter = null;
            document.querySelector('.tab-link[data-filter="movies"]').classList.add('active');
            currentFilter = 'movies';
        } else {
            currentGenreFilter = genre;
            targetTag.classList.add('active');
            currentFilter = 'all'; 
        }
        displayItems();
    });

    searchBar.addEventListener('input', displayItems);

    // --- Funções de CRUD ---
    function addItem() {
        const category = document.getElementById('item-type').value;
        const title = document.getElementById('item-title').value.trim();
        if (!category || !title) {
            alert("Por favor, selecione um tipo e preencha o título.");
            return;
        }
        const item = {
            id: Date.now(),
            category: category,
            title: title,
            author: document.getElementById('item-author').value.trim(),
            status: document.getElementById('item-status').value,
            genre: document.getElementById('item-genre').value.trim(),
            rating: document.getElementById('item-rating').value ? parseFloat(document.getElementById('item-rating').value).toFixed(1) : 'N/A',
            isFavorite: document.getElementById('item-favorite').checked,
            posterUrl: document.getElementById('item-poster').value.trim(),
            summary: document.getElementById('item-summary').value.trim(),
            actors: document.getElementById('item-actors').value.trim(),
            seasons: document.getElementById('item-seasons').value,
            episodes: document.getElementById('item-episodes').value,
            franchise: document.getElementById('item-franchise').value.trim(),
            startDate: document.getElementById('item-start-date').value,
            endDate: document.getElementById('item-end-date').value,
            review: document.getElementById('item-review').value.trim()
        };
        const items = getItemsFromStorage(category);
        items.push(item);
        saveItemsToStorage(category, items);
        displayItems();
    }

    function updateItem() {
        if (!editingItemId) return;
        const newCategory = document.getElementById('item-type').value;

        const updatedItem = {
            id: editingItemId,
            category: newCategory,
            title: document.getElementById('item-title').value.trim(),
            author: document.getElementById('item-author').value.trim(),
            status: document.getElementById('item-status').value,
            genre: document.getElementById('item-genre').value.trim(),
            rating: document.getElementById('item-rating').value ? parseFloat(document.getElementById('item-rating').value).toFixed(1) : 'N/A',
            isFavorite: document.getElementById('item-favorite').checked,
            posterUrl: document.getElementById('item-poster').value.trim(),
            summary: document.getElementById('item-summary').value.trim(),
            actors: document.getElementById('item-actors').value.trim(),
            seasons: document.getElementById('item-seasons').value,
            episodes: document.getElementById('item-episodes').value,
            franchise: document.getElementById('item-franchise').value.trim(),
            startDate: document.getElementById('item-start-date').value,
            endDate: document.getElementById('item-end-date').value,
            review: document.getElementById('item-review').value.trim()
        };

        let originalCategory = '';
        for (const cat of ['movies', 'series', 'animes']) {
            const items = getItemsFromStorage(cat);
            if (items.some(i => i.id === editingItemId)) {
                originalCategory = cat;
                break;
            }
        }

        if (originalCategory !== newCategory) {
            let oldItems = getItemsFromStorage(originalCategory);
            oldItems = oldItems.filter(i => i.id !== editingItemId);
            saveItemsToStorage(originalCategory, oldItems);

            let newItems = getItemsFromStorage(newCategory);
            newItems.push(updatedItem);
            saveItemsToStorage(newCategory, newItems);
        } else {
            let items = getItemsFromStorage(newCategory);
            const itemIndex = items.findIndex(i => i.id === editingItemId);
            items[itemIndex] = updatedItem;
            saveItemsToStorage(newCategory, items);
        }

        displayItems();
        resetAddModal();
    }

    window.deleteItem = function(category, id) {
        if (!confirm('Tem certeza que deseja excluir este item?')) return;
        let items = getItemsFromStorage(category);
        items = items.filter(item => item.id !== id);
        saveItemsToStorage(category, items);
        displayItems();
    }

    window.toggleFavorite = function(category, id) {
        let items = getItemsFromStorage(category);
        const itemIndex = items.findIndex(item => item.id === id);
        if (itemIndex > -1) {
            items[itemIndex].isFavorite = !items[itemIndex].isFavorite;
            saveItemsToStorage(category, items);
            displayItems();
        }
    }

    // --- Funções de Renderização ---
    function renderCard(item) {
        const container = document.getElementById('items-card-container');
        const card = document.createElement('div');
        card.classList.add('card');
        card.setAttribute('data-id', item.id);

        const statusClassMap = { 'Assistido': 'status-assistido', 'Assistindo': 'status-assistindo', 'Planejo Assistir': 'status-planejo-assistir' };
        const statusClass = statusClassMap[item.status] || '';
        const favoriteIconClass = item.isFavorite ? 'fas fa-star' : 'far fa-star';
        const favoriteBtnClass = item.isFavorite ? 'favorite' : '';

        const posterContent = item.posterUrl
            ? `<img src="${item.posterUrl}" alt="Pôster de ${item.title}" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'card-poster-placeholder\\'><span>${item.title}</span></div>';">`
            : `<div class="card-poster-placeholder"><span>${item.title}</span></div>`;

        card.innerHTML = `
            <div class="card-clickable-area" onclick="showDetails('${item.category}', ${item.id})">
                <div class="card-poster">
                    ${posterContent}
                </div>
                <div class="card-info">
                    <h3>${item.title}</h3>
                    <div class="card-footer">
                        <span class="status ${statusClass}">${item.status}</span>
                    </div>
                </div>
            </div>
            <div class="card-buttons">
                <button class="favorite-btn ${favoriteBtnClass}" onclick="event.stopPropagation(); toggleFavorite('${item.category}', ${item.id})">
                    <i class="${favoriteIconClass}"></i>
                </button>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteItem('${item.category}', ${item.id})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    }

    function openEditModal(category, id) {
        const items = getItemsFromStorage(category);
        const item = items.find(i => i.id === id);
        if (!item) return;

        editingItemId = id;

        document.querySelector('#add-item-modal h2').textContent = 'Editar Item';
        document.querySelector('#modal-form button[type="submit"]').textContent = 'Salvar Alterações';

        document.getElementById('item-type').value = item.category;
        document.getElementById('item-title').value = item.title;
        document.getElementById('item-author').value = item.author || '';
        document.getElementById('item-poster').value = item.posterUrl || '';
        document.getElementById('item-summary').value = item.summary || '';
        document.getElementById('item-status').value = item.status;
        document.getElementById('item-genre').value = item.genre || '';
        document.getElementById('item-actors').value = item.actors || '';
        document.getElementById('item-seasons').value = item.seasons || '';
        document.getElementById('item-episodes').value = item.episodes || '';
        document.getElementById('item-franchise').value = item.franchise || '';
        document.getElementById('item-start-date').value = item.startDate || '';
        document.getElementById('item-end-date').value = item.endDate || '';
        document.getElementById('item-rating').value = item.rating === 'N/A' ? '' : item.rating;
        document.getElementById('item-review').value = item.review || '';
        document.getElementById('item-favorite').checked = item.isFavorite;

        itemTypeSelect.dispatchEvent(new Event('change'));

        detailsModal.style.display = 'none';
        addModal.style.display = 'block';
    }

    window.showDetails = function(category, id) {
        const items = getItemsFromStorage(category);
        const item = items.find(i => i.id === id);
        if (!item) return;

        const displayInfo = (elementId, value, prefix = '', suffix = '') => {
            const element = document.getElementById(elementId);
            const parentSection = element.closest('.details-section');
            const valueExists = value && String(value).trim() !== '' && String(value).trim() !== 'N/A';

            if (valueExists) {
                element.textContent = `${prefix}${value}${suffix}`;
                element.classList.remove('placeholder-text');
                if (parentSection) parentSection.style.display = 'block';
            } else {
                element.textContent = 'Não informado';
                element.classList.add('placeholder-text');
                if (elementId === 'details-summary' || elementId === 'details-review') {
                    if (parentSection) parentSection.style.display = 'none';
                }
            }
        };

        document.getElementById('details-poster-img').src = item.posterUrl || 'img/placeholder.png';
        displayInfo('details-title', item.title);
        displayInfo('details-author', item.author, 'por ');

        const statusElement = document.getElementById('details-status');
        const statusClassMap = { 'Assistido': 'status-assistido', 'Assistindo': 'status-assistindo', 'Planejo Assistir': 'status-planejo-assistir' };
        statusElement.textContent = item.status;
        statusElement.className = `status ${statusClassMap[item.status] || ''}`;
        document.getElementById('details-rating').innerHTML = `<i class="fas fa-star"></i> ${item.rating || 'N/A'}`;

        displayInfo('details-summary', item.summary);
        displayInfo('details-review', item.review);
        displayInfo('details-genre', item.genre);
        displayInfo('details-actors', item.actors);
        displayInfo('details-franchise', item.franchise);

        let dateText = '';
        if (item.startDate) {
            try {
                const startDate = new Date(item.startDate + 'T00:00:00');
                dateText = `Iniciado em ${startDate.toLocaleDateString()}`;
                if (item.endDate) {
                    const endDate = new Date(item.endDate + 'T00:00:00');
                    dateText = `De ${startDate.toLocaleDateString()} a ${endDate.toLocaleDateString()}`;
                }
            } catch (e) { dateText = 'Data inválida'; }
        }
        displayInfo('details-dates', dateText);

        const seriesInfo = document.getElementById('details-series-info');
        if ((item.category === 'series' || item.category === 'animes') && (item.seasons || item.episodes)) {
            displayInfo('details-seasons', item.seasons || 'N/A');
            displayInfo('details-episodes', item.episodes || 'N/A');
            seriesInfo.style.display = 'block';
        } else {
            seriesInfo.style.display = 'none';
        }

        document.getElementById('edit-item-btn').onclick = () => openEditModal(category, id);
        detailsModal.style.display = 'block';
    }

    function displayItems() {
        const container = document.getElementById('items-card-container');
        container.innerHTML = '';
        const allItems = getAllItems();
        let filteredItems = [];

        if (currentGenreFilter) {
            filteredItems = allItems.filter(item =>
                item.genre && item.genre.toLowerCase().split(',').map(g => g.trim()).includes(currentGenreFilter.toLowerCase())
            );
        } else {
            switch(currentFilter) {
                case 'movies': case 'series': case 'animes':
                    filteredItems = allItems.filter(item => item.category === currentFilter);
                    break;
                case 'favorites':
                    filteredItems = allItems.filter(item => item.isFavorite);
                    break;
                case 'Assistido': case 'Assistindo': case 'Planejo Assistir':
                    filteredItems = allItems.filter(item => item.status === currentFilter);
                    break;
                default:
                    filteredItems = allItems;
            }
        }

        const searchTerm = searchBar.value.toLowerCase().trim();
        if (searchTerm) {
            filteredItems = filteredItems.filter(item => 
                item.title.toLowerCase().includes(searchTerm)
            );
        }

        if (filteredItems.length === 0) {
            container.innerHTML = '<p class="no-results-message">Nenhum item encontrado.</p>';
        } else {
            filteredItems.sort((a, b) => a.title.localeCompare(b.title)).forEach(item => renderCard(item));
        }
        renderGenresSummary();
        renderStatistics(); // ATUALIZA AS ESTATÍSTICAS
    }

    function renderGenresSummary() {
        genresContainer.innerHTML = '';
        const allItems = getAllItems();
        const GENRE_EMOJI_MAP = { 'ação': '💥', 'aventura': '🗺️', 'comédia': '😂', 'drama': '🎭', 'ficção científica': '🚀', 'sci-fi': '🚀', 'fantasia': '🧙', 'terror': '👻', 'suspense': '🔪', 'romance': '❤️', 'animação': '🎨', 'documentário': '📹', 'crime': '🕵️', 'mistério': '❓', 'musical': '🎶', 'guerra': '🎖️', 'história': '📜', 'família': '👨‍👩‍👧‍👦', 'esporte': '⚽', 'faroeste': '🤠', 'biografia': '👤' };
        const DEFAULT_EMOJI = '🎬';
        const genreCounts = {};
        allItems.forEach(item => {
            if (item.genre) {
                const genres = item.genre.split(',').map(g => g.trim());
                genres.forEach(genre => {
                    if (genre) genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                });
            }
        });
        Object.keys(genreCounts).sort().forEach(genre => {
            const emoji = GENRE_EMOJI_MAP[genre.toLowerCase()] || DEFAULT_EMOJI;
            const tag = document.createElement('div');
            tag.classList.add('genre-tag');
            tag.dataset.genre = genre;
            tag.innerHTML = `${emoji} ${genre} <span class="genre-count">(${genreCounts[genre]})</span>`;
            genresContainer.appendChild(tag);
        });
    }

    // --- NOVA FUNÇÃO DE ESTATÍSTICAS ---
    function renderStatistics() {
        const countersContainer = document.getElementById('stats-counters-container');
        const genresChartContainer = document.getElementById('genres-chart');
        if (!countersContainer || !genresChartContainer) return;

        const allItems = getAllItems();
        const watchedItems = allItems.filter(item => item.status === 'Assistido');

        // 1. Calcular Stats
        const moviesWatched = watchedItems.filter(item => item.category === 'movies').length;
        const seriesWatched = watchedItems.filter(item => item.category === 'series').length;
        const animesWatched = watchedItems.filter(item => item.category === 'animes').length;

        const ratedItems = watchedItems.filter(item => item.rating && item.rating !== 'N/A');
        const averageRating = ratedItems.length > 0
            ? (ratedItems.reduce((acc, item) => acc + parseFloat(item.rating), 0) / ratedItems.length).toFixed(1)
            : 'N/A';

        const genreCounts = {};
        watchedItems.forEach(item => {
            if (item.genre) {
                const genres = item.genre.toLowerCase().split(',').map(g => g.trim());
                genres.forEach(genre => {
                    // Capitaliza a primeira letra para agrupar (ex: "ação" e "Ação")
                    const capitalizedGenre = genre.charAt(0).toUpperCase() + genre.slice(1);
                    if (capitalizedGenre) genreCounts[capitalizedGenre] = (genreCounts[capitalizedGenre] || 0) + 1;
                });
            }
        });
        const sortedGenres = Object.entries(genreCounts).sort(([, a], [, b]) => b - a);
        const maxGenreCount = sortedGenres.length > 0 ? sortedGenres[0][1] : 0;

        // 2. Renderizar Contadores
        countersContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${moviesWatched}</div>
                <div class="stat-label">Filmes Assistidos</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${seriesWatched}</div>
                <div class="stat-label">Séries Concluídas</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${animesWatched}</div>
                <div class="stat-label">Animes Concluídos</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${averageRating}</div>
                <div class="stat-label">Nota Média</div>
            </div>
        `;

        // 3. Renderizar Gráfico de Gêneros
        if (sortedGenres.length > 0) {
            genresChartContainer.innerHTML = sortedGenres.map(([genre, count]) => {
                const barWidth = maxGenreCount > 0 ? (count / maxGenreCount) * 100 : 0;
                return `
                    <div class="chart-bar-row">
                        <div class="chart-label" title="${genre}">${genre}</div>
                        <div class="chart-bar-bg">
                            <div class="chart-bar" style="width: ${barWidth}%;">${count}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            genresChartContainer.innerHTML = '<p class="placeholder-text" style="text-align: center;">Nenhum item com status "Assistido" para exibir estatísticas.</p>';
        }
    }

    // --- Funções Auxiliares ---
    function getAllItems() {
        return [ ...getItemsFromStorage('movies'), ...getItemsFromStorage('series'), ...getItemsFromStorage('animes') ];
    }
    function getItemsFromStorage(category) { return JSON.parse(localStorage.getItem(`cinema_${category}`)) || []; }
    function saveItemsToStorage(category, items) { localStorage.setItem(`cinema_${category}`, JSON.stringify(items)); }

    // --- Inicialização ---
    displayItems();
});
