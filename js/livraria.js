document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM existentes
  const addBookModal = document.getElementById('add-book-modal');
  const confirmDeleteModal = document.getElementById('confirm-delete-modal');
  const bookDetailsModal = document.getElementById('book-details-modal');
  const addBookForm = document.getElementById('add-book-form');
  const openAddBookModalBtn = document.getElementById('open-add-book-modal-btn');
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

  let livros = JSON.parse(localStorage.getItem('livrosTracker')) || [];
  let livroIdParaExcluir = null;
  let activeTab = 'todos'; // Aba ativa padrão
  let activeGenreFilter = 'todos'; // Filtro de gênero ativo padrão

  // NOVO: Mapa de emojis para gêneros
  const genreEmojis = {
    'Fantasia': '🧙', 'Ficção Científica': '🚀', 'Romance': '💖',
    'Suspense': '🔪', 'Terror': '👻', 'Aventura': '🗺️',
    'Mistério': '🕵️', 'Histórico': '📜', 'Biografia': '👤',
    'Autoajuda': '💡', 'Técnico': '💻', 'Clássico': '🏛️',
    'default': '📚' // Emoji padrão
  };

  // NOVO: Função para atualizar o histórico de leitura
  const atualizarHistoricoDeLeitura = (livro, paginasLidasAntes) => {
    const paginasLidasAgora = livro.paginaAtual;
    const paginasNovas = paginasLidasAgora - paginasLidasAntes;

    if (paginasNovas <= 0) return; // Nenhuma página nova lida

    const hoje = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const historico = JSON.parse(localStorage.getItem('historicoProgresso') || '{}');

    if (!historico[hoje]) {
      historico[hoje] = { pagesRead: 0 };
    }

    historico[hoje].pagesRead += paginasNovas;
    localStorage.setItem('historicoProgresso', JSON.stringify(historico));
  };

  const salvarLivros = () => {
    localStorage.setItem('livrosTracker', JSON.stringify(livros));
    const livrosLidos = livros.filter(livro => livro.lido);
    localStorage.setItem('livrosLidos', JSON.stringify(livrosLidos));
    if (window.readingStats) {
      window.readingStats.refresh();
    }
    updateBookCounts();
    renderizarLivros();
    renderizarGenreStats(); // NOVO: Atualiza as estatísticas de gênero
  };

  const getRatingStars = (rating = 0) => {
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
          starsHtml += `<i class="${i <= rating ? 'fa-solid' : 'fa-regular'} fa-star"></i>`;
      }
      return starsHtml;
  };

  const updateBookCounts = () => {
    const lendo = livros.filter(livro => !livro.lido && livro.paginaAtual > 0).length;
    const lido = livros.filter(livro => livro.lido).length;
    const queroLer = livros.filter(livro => !livro.lido && livro.paginaAtual === 0).length;

    if (countALer) countALer.textContent = lendo;
    if (countLido) countLido.textContent = lido;
    if (countQueroLer) countQueroLer.textContent = queroLer;
  };

  const renderizarListaLivros = (listaElement, livrosParaRenderizar) => {
    listaElement.innerHTML = '';
    if (livrosParaRenderizar.length === 0) {
      listaElement.innerHTML = '<p class="no-books-message">Nenhum livro encontrado.</p>';
      return;
    }
    livrosParaRenderizar.sort((a, b) => b.id - a.id).forEach(livro => {
      const li = document.createElement('li');
      li.className = 'book-item';
      li.dataset.id = livro.id;
      const percentual = livro.totalPaginas > 0 ? ((livro.paginaAtual / livro.totalPaginas) * 100).toFixed(0) : 0;
      let generosArray = [];
      if (Array.isArray(livro.generos)) {
        generosArray = livro.generos;
      } else if (typeof livro.generos === 'string' && livro.generos) {
        generosArray = livro.generos.split(',').map(g => g.trim());
      }
      const generosHtml = generosArray.map(g => `<span class="genre-tag">${g}</span>`).join('');
      li.innerHTML = `<div class="book-item-cover" style="background-image: url('${livro.capaUrl || 'img/default_cover.png'}');">
          ${livro.isFavorite ? '<i class="fas fa-star favorite-icon"></i>' : ''}
          <div class="progress-bar-overlay"><div class="progress-overlay" style="width: ${percentual}%;">${percentual > 10 ? percentual + '%' : ''}</div></div>
        </div>
        <div class="book-item-info">
          <h4>${livro.titulo}</h4>
          <p class="autor">por ${livro.autor}</p>
          <div class="card-rating">${getRatingStars(livro.nota)}</div>
          <div class="genre-tags">${generosHtml}</div>
        </div>`;
      listaElement.appendChild(li);
    });
  };

  const renderizarLivros = () => {
    const listaTodos = document.getElementById('lista-livros-todos');
    const listaFavoritos = document.getElementById('lista-livros-favoritos');
    const listaALer = document.getElementById('lista-livros-a-ler');
    const listaQueroLer = document.getElementById('lista-livros-quero-ler');
    const listaLido = document.getElementById('lista-livros-lido');
    const listaGeneros = document.getElementById('lista-livros-generos');

    [listaTodos, listaFavoritos, listaALer, listaQueroLer, listaLido, listaGeneros].forEach(list => {
      if (list) list.innerHTML = '';
    });
    
    // NOVO: Aplica o filtro de pesquisa
    const searchTerm = searchInput.value.toLowerCase();
    const livrosBase = searchTerm
      ? livros.filter(livro => 
          livro.titulo.toLowerCase().includes(searchTerm) || 
          livro.autor.toLowerCase().includes(searchTerm)
        )
      : livros;


    let livrosFiltrados = [];

    switch (activeTab) {
      case 'todos':
        livrosFiltrados = livrosBase;
        break;
      case 'favoritos':
        livrosFiltrados = livrosBase.filter(livro => livro.isFavorite);
        break;
      case 'a-ler':
        livrosFiltrados = livrosBase.filter(livro => !livro.lido && livro.paginaAtual > 0);
        break;
      case 'quero-ler':
        livrosFiltrados = livrosBase.filter(livro => !livro.lido && livro.paginaAtual === 0);
        break;
      case 'lido':
        livrosFiltrados = livrosBase.filter(livro => livro.lido);
        break;
      case 'generos':
        if (activeGenreFilter === 'todos') {
          livrosFiltrados = livrosBase;
        } else {
          livrosFiltrados = livrosBase.filter(livro => 
            Array.isArray(livro.generos) && livro.generos.includes(activeGenreFilter)
          );
        }
        break;
      default:
        livrosFiltrados = livrosBase;
    }

    const currentListElement = document.getElementById(`lista-livros-${activeTab}`);
    if (currentListElement) {
      renderizarListaLivros(currentListElement, livrosFiltrados);
    }

    updateGenreFilters();
  };

  const switchTab = (tabId) => {
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));

    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
    activeTab = tabId;
    renderizarLivros();
  };

  const getAllUniqueGenres = () => {
    const uniqueGenres = new Set();
    livros.forEach(livro => {
      if (Array.isArray(livro.generos)) {
        livro.generos.forEach(genre => uniqueGenres.add(genre));
      }
    });
    return Array.from(uniqueGenres).sort();
  };

  // NOVO: Função para renderizar as estatísticas de gênero
  const renderizarGenreStats = () => {
    if (!genreStatsContainer) return;
    genreStatsContainer.innerHTML = '';
    const genreCounts = {};

    livros.forEach(livro => {
      if (Array.isArray(livro.generos)) {
        livro.generos.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });

    // Ordena os gêneros pela quantidade de livros (do maior para o menor)
    const sortedGenres = Object.entries(genreCounts).sort(([,a],[,b]) => b-a);
    
    if (sortedGenres.length === 0) {
      genreStatsContainer.innerHTML = '<p class="no-books-message">Adicione livros com gêneros para ver as estatísticas.</p>';
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
          <span class="genre-stat-count">${count} ${count > 1 ? 'livros' : 'livro'}</span>
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
      renderizarLivros();
    });
    generosFilterContainer.appendChild(allButton);

    allGenres.forEach(genre => {
      const genreButton = document.createElement('span');
      genreButton.className = `genre-tag ${activeGenreFilter === genre ? 'active' : ''}`;
      genreButton.textContent = genre;
      genreButton.addEventListener('click', () => {
        activeGenreFilter = genre;
        updateGenreFilters();
        renderizarLivros();
      });
      generosFilterContainer.appendChild(genreButton);
    });
  };

  const adicionarLivro = (e) => {
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
      const novoLivro = {
        id: Date.now(),
        titulo, autor, totalPaginas,
        paginaAtual: 0, lido: false, isFavorite: false, nota: 0,
        capaUrl: capaUrl || 'img/default_cover.png',
        generos: generosInput ? generosInput.split(',').map(g => g.trim()) : [],
        sumario, resenha, dataInicio, dataConclusao,
        saga: { nome: sagaNome, volume: sagaVolume },
      };
      livros.push(novoLivro);
      salvarLivros();
      addBookForm.reset();
      fecharTodosModais();
    } else {
      alert('Por favor, preencha pelo menos Título, Autor e Total de Páginas.');
    }
  };

  const excluirLivro = (id) => {
    livros = livros.filter(l => l.id !== id);
    salvarLivros();
  };

  const abrirModal = (modal) => modal.classList.add('show');
  const fecharTodosModais = () => document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));

  const abrirModalExclusao = (id) => {
    livroIdParaExcluir = id;
    fecharTodosModais();
    abrirModal(confirmDeleteModal);
  };

  const popularEAbrirModalDetalhes = (id) => {
    const livro = livros.find(l => l.id === id);
    if (!livro) return;
    bookDetailsModal.dataset.currentBookId = livro.id;
    document.getElementById('details-capa-img').src = livro.capaUrl || 'img/default_cover.png';
    document.getElementById('details-titulo').value = livro.titulo;
    document.getElementById('details-autor').value = livro.autor;
    document.getElementById('details-pagina-atual').value = livro.paginaAtual;
    document.getElementById('details-total-paginas').value = livro.totalPaginas;
    document.getElementById('details-sumario').value = livro.sumario || '';
    document.getElementById('details-resenha').value = livro.resenha || '';
    document.getElementById('details-data-inicio').value = livro.dataInicio || '';
    document.getElementById('details-data-conclusao').value = livro.dataConclusao || '';
    
    document.getElementById('details-saga-nome').value = livro.saga?.nome || '';
    document.getElementById('details-saga-volume').value = livro.saga?.volume || '';

    let generosString = Array.isArray(livro.generos) ? livro.generos.join(', ') : (typeof livro.generos === 'string' ? livro.generos : '');
    document.getElementById('details-generos').value = generosString;
    updateStarRating(livro.nota || 0);
    toggleFavoriteBtn.classList.toggle('active', livro.isFavorite);

    const outrosLivrosContainer = document.getElementById('other-books-by-author');
    const outrosLivros = livros.filter(l => l.autor === livro.autor && l.id !== livro.id);
    
    if (outrosLivros.length > 0) {
      outrosLivrosContainer.innerHTML = outrosLivros.map(l => `
        <div class="mini-book-card" data-book-id="${l.id}">
          <div class="mini-book-cover" style="background-image: url('${l.capaUrl || 'img/default_cover.png'}');"></div>
          <div class="mini-book-title">${l.titulo}</div>
          <div class="mini-book-author">por ${l.autor}</div>
        </div>
      `).join('');
    } else {
      outrosLivrosContainer.innerHTML = '<p style="color: rgba(255, 255, 255, 0.7); font-style: italic;">Nenhum outro livro deste autor cadastrado.</p>';
    }
        
    const sagaSectionContainer = document.getElementById('saga-section-container');
    const sagaContainer = document.getElementById('books-in-saga');
    if (livro.saga?.nome) {
      const outrosDaSaga = livros
        .filter(l => l.saga?.nome === livro.saga.nome && l.id !== livro.id)
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

    abrirModal(bookDetailsModal);
  };

  const updateStarRating = (rating) => {
    detailsNotaStars.dataset.rating = rating;
    detailsNotaStars.querySelectorAll('i').forEach(star => {
        star.classList.toggle('filled', parseInt(star.dataset.value) <= rating);
    });
  };

  // Event Listeners
  openAddBookModalBtn.addEventListener('click', () => abrirModal(addBookModal));
  addBookForm.addEventListener('submit', adicionarLivro);
  
  closeButtons.forEach(btn => btn.addEventListener('click', fecharTodosModais));
  
  window.addEventListener('click', (e) => { 
    if (e.target.classList.contains('modal')) fecharTodosModais(); 
  });
  
  cancelDeleteBtn.addEventListener('click', fecharTodosModais);
  
  confirmDeleteBtn.addEventListener('click', () => {
    if (livroIdParaExcluir) {
      excluirLivro(livroIdParaExcluir);
      livroIdParaExcluir = null;
      fecharTodosModais();
    }
  });

  saveChangesBtn.addEventListener('click', () => {
    const id = parseInt(bookDetailsModal.dataset.currentBookId);
    const livro = livros.find(l => l.id === id);
    if(livro) {
      const paginasAntesDeSalvar = livro.paginaAtual;

      livro.titulo = document.getElementById('details-titulo').value.trim();
      livro.autor = document.getElementById('details-autor').value.trim();
      livro.paginaAtual = parseInt(document.getElementById('details-pagina-atual').value) || 0;
      livro.totalPaginas = parseInt(document.getElementById('details-total-paginas').value) || 1;
      const generosInput = document.getElementById('details-generos').value.trim();
      livro.generos = generosInput ? generosInput.split(',').map(g => g.trim()) : [];
      livro.sumario = document.getElementById('details-sumario').value.trim();
      livro.resenha = document.getElementById('details-resenha').value.trim();
      livro.dataInicio = document.getElementById('details-data-inicio').value;
      livro.dataConclusao = document.getElementById('details-data-conclusao').value;
      livro.nota = parseInt(detailsNotaStars.dataset.rating) || 0;
      
      livro.saga = {
          nome: document.getElementById('details-saga-nome').value.trim(),
          volume: document.getElementById('details-saga-volume').value.trim()
      };

      livro.lido = livro.paginaAtual >= livro.totalPaginas;
      atualizarHistoricoDeLeitura(livro, paginasAntesDeSalvar);
      salvarLivros();
      fecharTodosModais();
    }
  });

  toggleFavoriteBtn.addEventListener('click', function() {
    const id = parseInt(bookDetailsModal.dataset.currentBookId);
    const livro = livros.find(l => l.id === id);
    if (livro) {
      livro.isFavorite = !livro.isFavorite;
      this.classList.toggle('active', livro.isFavorite);
      salvarLivros();
    }
  });

  deleteFromDetailsBtn.addEventListener('click', () => {
    const id = parseInt(bookDetailsModal.dataset.currentBookId);
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

  bookDetailsModal.addEventListener('click', (e) => {
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
    searchInput.addEventListener('input', renderizarLivros);
  }

  // Inicialização
  updateBookCounts();
  renderizarLivros();
  renderizarGenreStats(); // NOVO: Renderiza as estatísticas de gênero
  
  setTimeout(() => {
    if (window.readingStats) {
      window.readingStats.refresh();
    }
  }, 100);
});
