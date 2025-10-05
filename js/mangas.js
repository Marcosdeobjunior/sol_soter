document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM existentes
  const addMangaModal = document.getElementById('add-manga-modal');
  const confirmDeleteModal = document.getElementById('confirm-delete-modal');
  const mangaDetailsModal = document.getElementById('manga-details-modal');
  const addMangaForm = document.getElementById('add-manga-form');
  const openAddMangaModalBtn = document.getElementById('open-add-manga-modal-btn');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  const saveChangesBtn = document.getElementById('save-changes-btn');
  const toggleFavoriteBtn = document.getElementById('toggle-favorite-btn');
  const deleteFromDetailsBtn = document.getElementById('delete-from-details-btn');
  const closeButtons = document.querySelectorAll('.close-btn');
  const detailsNotaStars = document.getElementById('details-nota-stars');

  // Novos elementos do DOM para contadores e abas
  const countALer = document.getElementById('count-a-ler');
  const countLido = document.getElementById('count-lido');
  const countQueroLer = document.getElementById('count-quero-ler');
  const tabsNav = document.querySelector('.tabs-nav');
  const generosFilterContainer = document.getElementById('generos-filter-container');

  // NOVOS ELEMENTOS DO DOM
  const searchInput = document.getElementById('search-input');
  const genreStatsContainer = document.getElementById('genre-stats-container');

  let mangas = JSON.parse(localStorage.getItem('mangasTracker')) || [];
  let mangaIdParaExcluir = null;
  let activeTab = 'todos'; // Aba ativa padrão
  let activeGenreFilter = 'todos'; // Filtro de gênero ativo padrão

  // NOVO: Mapa de emojis para gêneros
  const genreEmojis = {
    'Shonen': '🔥', 'Shojo': '🌸', 'Seinen': '👨‍💼',
    'Josei': '👩‍💼', 'Kodomomuke': '👶', 'Aventura': '🗺️',
    'Fantasia': '🧙', 'Ficção Científica': '🚀', 'Romance': '💖',
    'Suspense': '🔪', 'Terror': '👻', 'Mistério': '🕵️', 
    'Histórico': '📜', 'Esportes': '⚽', 'Slice of Life': '🍰',
    'default': '📚' // Emoji padrão
  };

  // NOVO: Função para atualizar o histórico de leitura
  const atualizarHistoricoDeLeitura = (manga, paginasLidasAntes) => {
    const paginasLidasAgora = manga.paginaAtual;
    const paginasNovas = paginasLidasAgora - paginasLidasAntes;

    if (paginasNovas <= 0) return; // Nenhuma página nova lida

    const hoje = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const historico = JSON.parse(localStorage.getItem('historicoProgressoMangas') || '{}');

    if (!historico[hoje]) {
      historico[hoje] = { pagesRead: 0 };
    }

    historico[hoje].pagesRead += paginasNovas;
    localStorage.setItem('historicoProgressoMangas', JSON.stringify(historico));
  };

  const salvarMangas = () => {
    localStorage.setItem('mangasTracker', JSON.stringify(mangas));
    const mangasLidos = mangas.filter(manga => manga.lido);
    localStorage.setItem('mangasLidos', JSON.stringify(mangasLidos));
    if (window.mangaStats) {
      window.mangaStats.refresh();
    }
    updateMangaCounts();
    renderizarMangas();
    renderizarGenreStats(); // NOVO: Atualiza as estatísticas de gênero
  };

  const getRatingStars = (rating = 0) => {
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
          starsHtml += `<i class="${i <= rating ? 'fa-solid' : 'fa-regular'} fa-star"></i>`;
      }
      return starsHtml;
  };

  const updateMangaCounts = () => {
    const lendo = mangas.filter(manga => !manga.lido && manga.paginaAtual > 0).length;
    const lido = mangas.filter(manga => manga.lido).length;
    const queroLer = mangas.filter(manga => !manga.lido && manga.paginaAtual === 0).length;

    if (countALer) countALer.textContent = lendo;
    if (countLido) countLido.textContent = lido;
    if (countQueroLer) countQueroLer.textContent = queroLer;
  };

  const renderizarListaMangas = (listaElement, mangasParaRenderizar) => {
    listaElement.innerHTML = '';
    if (mangasParaRenderizar.length === 0) {
      listaElement.innerHTML = '<p class="no-books-message">Nenhum mangá encontrado.</p>';
      return;
    }
    mangasParaRenderizar.sort((a, b) => b.id - a.id).forEach(manga => {
      const li = document.createElement('li');
      li.className = 'book-item';
      li.dataset.id = manga.id;
      const percentual = manga.totalPaginas > 0 ? ((manga.paginaAtual / manga.totalPaginas) * 100).toFixed(0) : 0;
      
      let generosArray = [];
      if (Array.isArray(manga.generos)) {
        generosArray = manga.generos;
      } else if (typeof manga.generos === 'string' && manga.generos) {
        generosArray = manga.generos.split(',').map(g => g.trim()).filter(Boolean);
      }
      
      let generosHtml;
      if (generosArray.length > 2) {
        // Se houver mais de dois gêneros, exibe os dois primeiros e adiciona "..."
        generosHtml = generosArray.slice(0, 2).map(g => `<span class="genre-tag">${g}</span>`).join('') + '<span class="genre-tag">...</span>';
      } else {
        // Caso contrário, exibe todos os gêneros
        generosHtml = generosArray.map(g => `<span class="genre-tag">${g}</span>`).join('');
      }

      li.innerHTML = `<div class="book-item-cover" style="background-image: url('${manga.capaUrl || 'img/default_cover.png'}');">
          ${manga.isFavorite ? '<i class="fas fa-star favorite-icon"></i>' : ''}
          <div class="progress-bar-overlay"><div class="progress-overlay" style="width: ${percentual}%;">${percentual > 10 ? percentual + '%' : ''}</div></div>
        </div>
        <div class="book-item-info">
          <h4>${manga.titulo}</h4>
          <p class="autor">por ${manga.autor}</p>
          <div class="card-rating">${getRatingStars(manga.nota)}</div>
          <div class="genre-tags">${generosHtml}</div>
        </div>`;
      listaElement.appendChild(li);
    });
  };

  const renderizarMangas = () => {
    const listaTodos = document.getElementById('lista-mangas-todos');
    const listaFavoritos = document.getElementById('lista-mangas-favoritos');
    const listaALer = document.getElementById('lista-mangas-a-ler');
    const listaQueroLer = document.getElementById('lista-mangas-quero-ler');
    const listaLido = document.getElementById('lista-mangas-lido');
    const listaGeneros = document.getElementById('lista-mangas-generos');

    [listaTodos, listaFavoritos, listaALer, listaQueroLer, listaLido, listaGeneros].forEach(list => {
      if (list) list.innerHTML = '';
    });
    
    // NOVO: Aplica o filtro de pesquisa
    const searchTerm = searchInput.value.toLowerCase();
    const mangasBase = searchTerm
      ? mangas.filter(manga => 
          manga.titulo.toLowerCase().includes(searchTerm) || 
          manga.autor.toLowerCase().includes(searchTerm)
        )
      : mangas;


    let mangasFiltrados = [];

    switch (activeTab) {
      case 'todos':
        mangasFiltrados = mangasBase;
        break;
      case 'favoritos':
        mangasFiltrados = mangasBase.filter(manga => manga.isFavorite);
        break;
      case 'a-ler':
        mangasFiltrados = mangasBase.filter(manga => !manga.lido && manga.paginaAtual > 0);
        break;
      case 'quero-ler':
        mangasFiltrados = mangasBase.filter(manga => !manga.lido && manga.paginaAtual === 0);
        break;
      case 'lido':
        mangasFiltrados = mangasBase.filter(manga => manga.lido);
        break;
      case 'generos':
        if (activeGenreFilter === 'todos') {
          mangasFiltrados = mangasBase;
        } else {
          mangasFiltrados = mangasBase.filter(manga => 
            Array.isArray(manga.generos) && manga.generos.includes(activeGenreFilter)
          );
        }
        break;
      default:
        mangasFiltrados = mangasBase;
    }

    const currentListElement = document.getElementById(`lista-mangas-${activeTab}`);
    if (currentListElement) {
      renderizarListaMangas(currentListElement, mangasFiltrados);
    }

    updateGenreFilters();
  };

  const switchTab = (tabId) => {
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));

    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
    activeTab = tabId;
    renderizarMangas();
  };

  const getAllUniqueGenres = () => {
    const uniqueGenres = new Set();
    mangas.forEach(manga => {
      if (Array.isArray(manga.generos)) {
        manga.generos.forEach(genre => uniqueGenres.add(genre));
      }
    });
    return Array.from(uniqueGenres).sort();
  };

  // NOVO: Função para renderizar as estatísticas de gênero
  const renderizarGenreStats = () => {
    if (!genreStatsContainer) return;
    genreStatsContainer.innerHTML = '';
    const genreCounts = {};

    mangas.forEach(manga => {
      if (Array.isArray(manga.generos)) {
        manga.generos.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });

    // Ordena os gêneros pela quantidade de livros (do maior para o menor)
    const sortedGenres = Object.entries(genreCounts).sort(([,a],[,b]) => b-a);
    
    if (sortedGenres.length === 0) {
      genreStatsContainer.innerHTML = '<p class="no-books-message">Adicione mangás com gêneros para ver as estatísticas.</p>';
      return;
    }
    
    sortedGenres.forEach(([genre, count]) => {
      const emoji = genreEmojis[genre] || genreEmojis.default;
      const statItem = document.createElement('div');
      statItem.className = 'genre-stat-item';
      statItem.innerHTML = `
        <div class="genre-stat-emoji">${emoji}</div>
        <div class="genre-stat-info">
          <span class="genre-stat-name">${genre}</span>
          <span class="genre-stat-count">${count} ${count > 1 ? 'volumes' : 'volume'}</span>
        </div>
      `;
      genreStatsContainer.appendChild(statItem);
    });
  };

  const updateGenreFilters = () => {
    if (!generosFilterContainer) return;
    generosFilterContainer.innerHTML = '';
    const allGenres = getAllUniqueGenres();

    const allButton = document.createElement('span');
    allButton.className = `genre-tag ${activeGenreFilter === 'todos' ? 'active' : ''}`;
    allButton.textContent = 'Todos';
    allButton.addEventListener('click', () => {
      activeGenreFilter = 'todos';
      updateGenreFilters();
      renderizarMangas();
    });
    generosFilterContainer.appendChild(allButton);

    allGenres.forEach(genre => {
      const genreButton = document.createElement('span');
      genreButton.className = `genre-tag ${activeGenreFilter === genre ? 'active' : ''}`;
      genreButton.textContent = genre;
      genreButton.addEventListener('click', () => {
        activeGenreFilter = genre;
        updateGenreFilters();
        renderizarMangas();
      });
      generosFilterContainer.appendChild(genreButton);
    });
  };

  const adicionarManga = (e) => {
    e.preventDefault();
    const titulo = document.getElementById('titulo').value.trim();
    const autor = document.getElementById('autor').value.trim();
    const totalPaginas = parseInt(document.getElementById('total-paginas').value);
    const capaUrl = document.getElementById('capa-url').value.trim();
    const generosInput = document.getElementById('generos').value.trim();
    const sumario = document.getElementById('sumario').value.trim();
    const resenha = document.getElementById('resenha').value.trim();
    const dataInicio = document.getElementById('data-inicio').value;
    const dataConclusao = document.getElementById('data-conclusao').value;
    const sagaNome = document.getElementById('saga-nome').value.trim();
    const sagaVolume = document.getElementById('saga-volume').value.trim();

    if (titulo && autor && totalPaginas > 0) {
      const novoManga = {
        id: Date.now(),
        titulo, autor, totalPaginas,
        paginaAtual: 0, lido: false, isFavorite: false, nota: 0,
        capaUrl: capaUrl || 'img/default_cover.png',
        generos: generosInput ? generosInput.split(',').map(g => g.trim()) : [],
        sumario, resenha, dataInicio, dataConclusao,
        saga: { nome: sagaNome, volume: sagaVolume },
      };
      mangas.push(novoManga);
      salvarMangas();
      addMangaForm.reset();
      fecharTodosModais();
    } else {
      alert('Por favor, preencha pelo menos Título, Autor e Total de Páginas.');
    }
  };

  const excluirManga = (id) => {
    mangas = mangas.filter(l => l.id !== id);
    salvarMangas();
  };

  const abrirModal = (modal) => modal.classList.add('show');
  const fecharTodosModais = () => document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));

  const abrirModalExclusao = (id) => {
    mangaIdParaExcluir = id;
    fecharTodosModais();
    abrirModal(confirmDeleteModal);
  };

  const popularEAbrirModalDetalhes = (id) => {
    const manga = mangas.find(l => l.id === id);
    if (!manga) return;
    mangaDetailsModal.dataset.currentMangaId = manga.id;
    document.getElementById('details-capa-img').src = manga.capaUrl || 'img/default_cover.png';
    document.getElementById('details-titulo').value = manga.titulo;
    document.getElementById('details-autor').value = manga.autor;
    document.getElementById('details-pagina-atual').value = manga.paginaAtual;
    document.getElementById('details-total-paginas').value = manga.totalPaginas;
    document.getElementById('details-sumario').value = manga.sumario || '';
    document.getElementById('details-resenha').value = manga.resenha || '';
    document.getElementById('details-data-inicio').value = manga.dataInicio || '';
    document.getElementById('details-data-conclusao').value = manga.dataConclusao || '';
    
    document.getElementById('details-saga-nome').value = manga.saga?.nome || '';
    document.getElementById('details-saga-volume').value = manga.saga?.volume || '';

    let generosString = Array.isArray(manga.generos) ? manga.generos.join(', ') : (typeof manga.generos === 'string' ? manga.generos : '');
    document.getElementById('details-generos').value = generosString;
    updateStarRating(manga.nota || 0);
    toggleFavoriteBtn.classList.toggle('active', manga.isFavorite);

    const outrosMangasContainer = document.getElementById('other-books-by-author');
    const outrosMangas = mangas.filter(l => l.autor === manga.autor && l.id !== manga.id);
    
    if (outrosMangas.length > 0) {
      outrosMangasContainer.innerHTML = outrosMangas.map(l => `
        <div class="mini-book-card" data-book-id="${l.id}">
          <div class="mini-book-cover" style="background-image: url('${l.capaUrl || 'img/default_cover.png'}');"></div>
          <div class="mini-book-title">${l.titulo}</div>
          <div class="mini-book-author">por ${l.autor}</div>
        </div>
      `).join('');
    } else {
      outrosMangasContainer.innerHTML = '<p style="color: rgba(255, 255, 255, 0.7); font-style: italic;">Nenhum outro mangá deste autor cadastrado.</p>';
    }
        
    const sagaSectionContainer = document.getElementById('saga-section-container');
    const sagaContainer = document.getElementById('books-in-saga');
    if (manga.saga?.nome) {
      const outrosDaSaga = mangas
        .filter(l => l.saga?.nome === manga.saga.nome && l.id !== manga.id)
        .sort((a, b) => parseFloat(a.saga.volume) - parseFloat(b.saga.volume));
      
      if (outrosDaSaga.length > 0) {
        sagaContainer.innerHTML = outrosDaSaga.map(l => `
          <div class="mini-book-card" data-book-id="${l.id}">
            <div class="mini-book-cover" style="background-image: url('${l.capaUrl || 'img/default_cover.png'}');"></div>
            <div class="mini-book-title">Vol. ${l.saga.volume}: ${l.titulo}</div>
            <div class="mini-book-author">por ${l.autor}</div>
          </div>
        `).join('');
        sagaSectionContainer.style.display = 'block';
      } else {
        sagaSectionContainer.style.display = 'none';
      }
    } else {
      sagaSectionContainer.style.display = 'none';
    }

    abrirModal(mangaDetailsModal);
  };

  const updateStarRating = (rating) => {
    detailsNotaStars.dataset.rating = rating;
    detailsNotaStars.querySelectorAll('i').forEach(star => {
        star.classList.toggle('filled', parseInt(star.dataset.value) <= rating);
    });
  };

  // Event Listeners
  openAddMangaModalBtn.addEventListener('click', () => abrirModal(addMangaModal));
  addMangaForm.addEventListener('submit', adicionarManga);
  
  closeButtons.forEach(btn => btn.addEventListener('click', fecharTodosModais));
  
  window.addEventListener('click', (e) => { 
    if (e.target.classList.contains('modal')) fecharTodosModais(); 
  });
  
  cancelDeleteBtn.addEventListener('click', fecharTodosModais);
  
  confirmDeleteBtn.addEventListener('click', () => {
    if (mangaIdParaExcluir) {
      excluirManga(mangaIdParaExcluir);
      mangaIdParaExcluir = null;
      fecharTodosModais();
    }
  });

  saveChangesBtn.addEventListener('click', () => {
    const id = parseInt(mangaDetailsModal.dataset.currentMangaId);
    const manga = mangas.find(l => l.id === id);
    if(manga) {
      const paginasAntesDeSalvar = manga.paginaAtual;

      manga.titulo = document.getElementById('details-titulo').value.trim();
      manga.autor = document.getElementById('details-autor').value.trim();
      manga.paginaAtual = parseInt(document.getElementById('details-pagina-atual').value) || 0;
      manga.totalPaginas = parseInt(document.getElementById('details-total-paginas').value) || 1;
      const generosInput = document.getElementById('details-generos').value.trim();
      manga.generos = generosInput ? generosInput.split(',').map(g => g.trim()) : [];
      manga.sumario = document.getElementById('details-sumario').value.trim();
      manga.resenha = document.getElementById('details-resenha').value.trim();
      manga.dataInicio = document.getElementById('details-data-inicio').value;
      manga.dataConclusao = document.getElementById('details-data-conclusao').value;
      manga.nota = parseInt(detailsNotaStars.dataset.rating) || 0;
      
      manga.saga = {
          nome: document.getElementById('details-saga-nome').value.trim(),
          volume: document.getElementById('details-saga-volume').value.trim()
      };

      manga.lido = manga.paginaAtual >= manga.totalPaginas;
      atualizarHistoricoDeLeitura(manga, paginasAntesDeSalvar);
      salvarMangas();
      fecharTodosModais();
    }
  });

  toggleFavoriteBtn.addEventListener('click', function() {
    const id = parseInt(mangaDetailsModal.dataset.currentMangaId);
    const manga = mangas.find(l => l.id === id);
    if (manga) {
      manga.isFavorite = !manga.isFavorite;
      this.classList.toggle('active', manga.isFavorite);
      salvarMangas();
    }
  });

  deleteFromDetailsBtn.addEventListener('click', () => {
    const id = parseInt(mangaDetailsModal.dataset.currentMangaId);
    if(id) abrirModalExclusao(id);
  });

  document.querySelector('main').addEventListener('click', (e) => {
    const card = e.target.closest('.book-item');
    if (card?.dataset.id) {
      if (e.target.closest('button, input')) return;
      popularEAbrirModalDetalhes(parseInt(card.dataset.id));
    }
  });

  detailsNotaStars.addEventListener('click', (e) => {
    const star = e.target.closest('i[data-value]');
    if(star) updateStarRating(parseInt(star.dataset.value));
  });

  mangaDetailsModal.addEventListener('click', (e) => {
    const miniCard = e.target.closest('.mini-book-card');
    if (miniCard && miniCard.dataset.bookId) {
      const bookId = parseInt(miniCard.dataset.bookId);
      popularEAbrirModalDetalhes(bookId);
    }
  });

  if (tabsNav) {
    tabsNav.addEventListener('click', (e) => {
      const button = e.target.closest('.tab-button');
      if (button) {
        switchTab(button.dataset.tab);
      }
    });
  }
  
  // NOVO: Event listener para a barra de pesquisa
  if (searchInput) {
    searchInput.addEventListener('input', renderizarMangas);
  }

  // Inicialização
  updateMangaCounts();
  renderizarMangas();
  renderizarGenreStats(); // NOVO: Renderiza as estatísticas de gênero
  
  setTimeout(() => {
    if (window.mangaStats) {
      window.mangaStats.refresh();
    }
  }, 100);
});
