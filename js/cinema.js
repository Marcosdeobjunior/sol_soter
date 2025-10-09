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
  const countALer = document.getElementById('count-para-assistir');
  const countAssistido = document.getElementById('count-assistido');
  const countQueroLer = document.getElementById('count-quero-assistir');
  const tabsNav = document.querySelector('.tabs-nav');
  const generosFilterContainer = document.getElementById('generos-filter-container');

  // NOVOS ELEMENTOS DO DOM
  const searchInput = document.getElementById('search-input');
  const genreStatsContainer = document.getElementById('genre-stats-container');
  
  // NOVOS ELEMENTOS PARA FILTROS DE ORGANIZAÇÃO
  const sortFiltersContainer = document.querySelector('.sort-filters-options');

  let filmes = JSON.parse(localStorage.getItem('filmesTracker')) || [];
  let filmeIdParaExcluir = null;
  let activeTab = 'todos'; // Aba ativa padrão
  let activeGenreFilter = 'todos'; // Filtro de gênero ativo padrão
  let activeSortFilter = 'default'; // Filtro de organização ativo padrão

  // NOVO: Variáveis para paginação
  const LIVROS_POR_PAGINA = 30; // 6 colunas x 5 linhas
  let currentPages = {
    'todos': 1,
    'favoritos': 1,
    'para-assistir': 1,
    'quero-assistir': 1,
    'assistido': 1,
    'generos': 1
  };

  // NOVO E MELHORADO: "Banco de Dados" de Emojis para Gêneros
  // Para adicionar um novo gênero, basta incluir uma nova linha no formato:
  // 'Nome do Gênero': '📧',
  const genreEmojis = {
    // Ficção
    'Fantasia': '🧙',
    'Ficção Cientifica': '🚀',
    'Ficção': '🌟',
    'Aventura': '🗺️',
    'Distopia': '🌆',
    'Mistério': '🕵️',
    'Policial': '🚓',
    'Crime': '⚖️',
    'Suspense': '🔪',
    'Terror': '👻',
    'Romance': '💖',
    'Comédia Romantica': '👩‍❤️‍💋‍👨',
    'Clássico': '🏛️',
    'Drama': '🎭',
    'Comédia': '😂',
    'Sátira': '😏',
    'Infantil': '🧸',
    'Juvenil': '🧑',
    'Ação': '💣',
    'Medieval': '⚔️',
    'Detetives': '🔍',
    'Thriller': '😱',
    'Viagem no Tempo': '⏳',
    
    
    // Não-Ficção
    'Histórico': '📜',
    'Biografia': '👤',
    'Autobiografia': '✍️',
    'Autoajuda': '💡',
    'Desenvolvimento Pessoal': '📈',
    'Técnico': '💻',
    'Ciência': '🔬',
    'Filosofia': '🤔',
    'Psicologia': '🧠',
    'Política': '🏛️',
    'Espiritualidade': '🙏',
    'Religião': '⛪',
    'Viagem': '✈️',
    'Literatura Antiga': '📜',
    'Economia Política': '📊',
    'Culinária': '🍳',

    // Outros
    'Poesia': '✒️',
    'Contos': '📖',
    'Crônicas': '📰',
    'Guerra': '⚔️',
    
    // Emoji padrão para qualquer gênero não listado acima
    'default': '📚' 
  };

  // NOVO: Função para calcular duração da sessão em dias
  const calcularDuracaoSessão = (filme) => {
    if (!filme.dataInicio) return 0;
    
    const dataInicio = new Date(filme.dataInicio);
    let dataFim;
    
    if (filme.assistido && filme.dataConclusao) {
      dataFim = new Date(filme.dataConclusao);
    } else {
      dataFim = new Date(); // Data atual se ainda está lendo
    }
    
    const diffTime = Math.abs(dataFim - dataInicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // NOVO: Função para ordenar filmes baseado no filtro ativo
  const ordenarFilmes = (filmesArray) => {
    const filmesCopia = [...filmesArray];
    
    switch (activeSortFilter) {
      case 'title-asc':
        return filmesCopia.sort((a, b) => a.titulo.localeCompare(b.titulo));
      
      case 'title-desc':
        return filmesCopia.sort((a, b) => b.titulo.localeCompare(a.titulo));
      
      case 'author-asc':
        return filmesCopia.sort((a, b) => a.diretor.localeCompare(b.diretor));
      
      case 'pages-asc':
        return filmesCopia.sort((a, b) => a.totalPaginas - b.totalPaginas);
      
      case 'pages-desc':
        return filmesCopia.sort((a, b) => b.totalPaginas - a.totalPaginas);
      
      case 'progress-desc':
        return filmesCopia.sort((a, b) => {
          const progressoA = a.totalPaginas > 0 ? (a.paginaAtual / a.totalPaginas) : 0;
          const progressoB = b.totalPaginas > 0 ? (b.paginaAtual / b.totalPaginas) : 0;
          return progressoB - progressoA;
        });
      
      case 'start-date-desc':
        return filmesCopia.sort((a, b) => {
          if (!a.dataInicio && !b.dataInicio) return 0;
          if (!a.dataInicio) return 1;
          if (!b.dataInicio) return -1;
          return new Date(b.dataInicio) - new Date(a.dataInicio);
        });
      
      case 'start-date-asc':
        return filmesCopia.sort((a, b) => {
          if (!a.dataInicio && !b.dataInicio) return 0;
          if (!a.dataInicio) return 1;
          if (!b.dataInicio) return -1;
          return new Date(a.dataInicio) - new Date(b.dataInicio);
        });
      
      case 'end-date-desc':
        return filmesCopia.sort((a, b) => {
          if (!a.dataConclusao && !b.dataConclusao) return 0;
          if (!a.dataConclusao) return 1;
          if (!b.dataConclusao) return -1;
          return new Date(b.dataConclusao) - new Date(a.dataConclusao);
        });
      
      case 'rating-desc':
        return filmesCopia.sort((a, b) => (b.nota || 0) - (a.nota || 0));
      
      case 'reading-time':
        return filmesCopia.sort((a, b) => {
          const duracaoA = calcularDuracaoSessão(a);
          const duracaoB = calcularDuracaoSessão(b);
          return duracaoB - duracaoA;
        });
      
      case 'default':
      default:
        return filmesCopia.sort((a, b) => b.id - a.id); // Mais recentes primeiro
    }
  };

  // NOVO: Função para paginar filmes
  const paginarFilmes = (filmesArray, pagina) => {
    const inicio = (pagina - 1) * LIVROS_POR_PAGINA;
    const fim = inicio + LIVROS_POR_PAGINA;
    return filmesArray.slice(inicio, fim);
  };

  // NOVO: Função para calcular total de minutos
  const calcularTotalPaginas = (totalFilmes) => {
    return Math.ceil(totalFilmes / LIVROS_POR_PAGINA);
  };

  // NOVO: Função para renderizar controles de paginação
  const renderizarPaginacao = (containerId, totalFilmes, paginaAtual) => {
    const container = document.getElementById(`pagination-${containerId}`);
    if (!container) return;

    const totalPaginas = calcularTotalPaginas(totalFilmes);
    
    if (totalPaginas <= 1) {
      container.innerHTML = '';
      return;
    }

    let paginationHtml = '';

    // Botão Anterior
    paginationHtml += `
      <button class="pagination-btn prev ${paginaAtual === 1 ? 'disabled' : ''}" 
              data-page="${paginaAtual - 1}" data-tab="${containerId}">
        <i class="fas fa-chevron-left"></i> Anterior
      </button>
    `;

    // Números das minutos
    paginationHtml += '<div class="pagination-numbers">';
    
    let startPage = Math.max(1, paginaAtual - 2);
    let endPage = Math.min(totalPaginas, paginaAtual + 2);

    // Ajustar para sempre mostrar 5 minutos quando possível
    if (endPage - startPage < 4) {
      if (startPage === 1) {
        endPage = Math.min(totalPaginas, startPage + 4);
      } else if (endPage === totalPaginas) {
        startPage = Math.max(1, endPage - 4);
      }
    }

    // Primeira página se não estiver no range
    if (startPage > 1) {
      paginationHtml += `
        <button class="pagination-btn" data-page="1" data-tab="${containerId}">1</button>
      `;
      if (startPage > 2) {
        paginationHtml += '<span class="pagination-ellipsis">...</span>';
      }
    }

    // Páginas no range
    for (let i = startPage; i <= endPage; i++) {
      paginationHtml += `
        <button class="pagination-btn ${i === paginaAtual ? 'active' : ''}" 
                data-page="${i}" data-tab="${containerId}">${i}</button>
      `;
    }

    // Última página se não estiver no range
    if (endPage < totalPaginas) {
      if (endPage < totalPaginas - 1) {
        paginationHtml += '<span class="pagination-ellipsis">...</span>';
      }
      paginationHtml += `
        <button class="pagination-btn" data-page="${totalPaginas}" data-tab="${containerId}">${totalPaginas}</button>
      `;
    }

    paginationHtml += '</div>';

    // Botão Próximo
    paginationHtml += `
      <button class="pagination-btn next ${paginaAtual === totalPaginas ? 'disabled' : ''}" 
              data-page="${paginaAtual + 1}" data-tab="${containerId}">
        Próximo <i class="fas fa-chevron-right"></i>
      </button>
    `;

    // Info da paginação
    const inicio = (paginaAtual - 1) * LIVROS_POR_PAGINA + 1;
    const fim = Math.min(paginaAtual * LIVROS_POR_PAGINA, totalFilmes);
    paginationHtml += `
      <div class="pagination-info">
        Mostrando ${inicio}-${fim} de ${totalFilmes} filmes
      </div>
    `;

    container.innerHTML = paginationHtml;
  };

  // NOVO: Função para atualizar o histórico de sessão
  const atualizarHistoricoDeSessão = (filme, minutosLidasAntes) => {
    const minutosLidasAgora = filme.paginaAtual;
    const minutosNovas = minutosLidasAgora - minutosLidasAntes;

    if (minutosNovas <= 0) return; // Nenhuma página nova lida

    const hoje = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const historico = JSON.parse(localStorage.getItem('historicoAssistidos') || '{}');

    if (!historico[hoje]) {
      historico[hoje] = { pagesRead: 0 };
    }

    historico[hoje].pagesRead += minutosNovas;
    localStorage.setItem('historicoAssistidos', JSON.stringify(historico));
  };

  const salvarFilmes = () => {
    localStorage.setItem('filmesTracker', JSON.stringify(filmes));
    const filmesAssistidos = filmes.filter(filme => filme.assistido);
    localStorage.setItem('filmesAssistidos', JSON.stringify(filmesAssistidos));
    if (window.readingStats) {
      window.readingStats.refresh();
    }
    updateBookCounts();
    renderizarFilmes();
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
    const lendo = filmes.filter(filme => !filme.assistido && filme.paginaAtual > 0).length;
    const assistido = filmes.filter(filme => filme.assistido).length;
    const queroLer = filmes.filter(filme => !filme.assistido && filme.paginaAtual === 0).length;

    if (countALer) countALer.textContent = lendo;
    if (countAssistido) countAssistido.textContent = assistido;
    if (countQueroLer) countQueroLer.textContent = queroLer;
  };

  const renderizarListaFilmes = (listaElement, filmesParaRenderizar, tabId) => {
    listaElement.innerHTML = '';
    
    if (filmesParaRenderizar.length === 0) {
      listaElement.innerHTML = '<p class="no-books-message">Nenhum filme encontrado.</p>';
      // Renderizar paginação vazia
      renderizarPaginacao(tabId, 0, 1);
      return;
    }
    
    // MODIFICADO: Aplicar ordenação antes de paginar
    const filmesOrdenados = ordenarFilmes(filmesParaRenderizar);
    
    // NOVO: Aplicar paginação
    const paginaAtual = currentPages[tabId] || 1;
    const filmesPaginados = paginarFilmes(filmesOrdenados, paginaAtual);
    
    filmesPaginados.forEach(filme => {
      const li = document.createElement('li');
      li.className = 'book-item';
      li.dataset.id = filme.id;
      const percentual = filme.totalPaginas > 0 ? ((filme.paginaAtual / filme.totalPaginas) * 100).toFixed(0) : 0;
      let generosArray = [];
      if (Array.isArray(filme.generos)) {
        generosArray = filme.generos;
      } else if (typeof filme.generos === 'string' && filme.generos) {
        generosArray = filme.generos.split(',').map(g => g.trim());
      }
      const generosHtml = generosArray.map(g => `<span class="genre-tag">${g}</span>`).join('');
      li.innerHTML = `<div class="book-item-cover" style="background-image: url('${filme.capaUrl || 'img/default_cover.png'}');">
          ${filme.isFavorite ? '<i class="fas fa-star favorite-icon"></i>' : ''}
          <div class="progress-bar-overlay"><div class="progress-overlay" style="width: ${percentual}%;">${percentual > 10 ? percentual + '%' : ''}</div></div>
        </div>
        <div class="book-item-info">
          <h4>${filme.titulo}</h4>
          <p class="diretor">por ${filme.diretor}</p>
          <div class="card-rating">${getRatingStars(filme.nota)}</div>
          <div class="genre-tags">${generosHtml}</div>
        </div>`;
      listaElement.appendChild(li);
    });

    // NOVO: Renderizar controles de paginação
    renderizarPaginacao(tabId, filmesOrdenados.length, paginaAtual);
  };

  const renderizarFilmes = () => {
    const listaTodos = document.getElementById('lista-filmes-todos');
    const listaFavoritos = document.getElementById('lista-filmes-favoritos');
    const listaALer = document.getElementById('lista-filmes-para-assistir');
    const listaQueroLer = document.getElementById('lista-filmes-quero-assistir');
    const listaAssistido = document.getElementById('lista-filmes-assistido');
    const listaGeneros = document.getElementById('lista-filmes-generos');

    [listaTodos, listaFavoritos, listaALer, listaQueroLer, listaAssistido, listaGeneros].forEach(list => {
      if (list) list.innerHTML = '';
    });
    
    // NOVO: Aplica o filtro de pesquisa
    const searchTerm = searchInput.value.toLowerCase();
    const filmesBase = searchTerm
      ? filmes.filter(filme => 
          filme.titulo.toLowerCase().includes(searchTerm) || 
          filme.diretor.toLowerCase().includes(searchTerm)
        )
      : filmes;

    let filmesFiltrados = [];

    switch (activeTab) {
      case 'todos':
        filmesFiltrados = filmesBase;
        break;
      case 'favoritos':
        filmesFiltrados = filmesBase.filter(filme => filme.isFavorite);
        break;
      case 'para-assistir':
        filmesFiltrados = filmesBase.filter(filme => !filme.assistido && filme.paginaAtual > 0);
        break;
      case 'quero-assistir':
        filmesFiltrados = filmesBase.filter(filme => !filme.assistido && filme.paginaAtual === 0);
        break;
      case 'assistido':
        filmesFiltrados = filmesBase.filter(filme => filme.assistido);
        break;
      case 'generos':
        if (activeGenreFilter === 'todos') {
          filmesFiltrados = filmesBase;
        } else {
          filmesFiltrados = filmesBase.filter(filme => 
            Array.isArray(filme.generos) && filme.generos.includes(activeGenreFilter)
          );
        }
        break;
      default:
        filmesFiltrados = filmesBase;
    }

    const currentListElement = document.getElementById(`lista-filmes-${activeTab}`);
    if (currentListElement) {
      renderizarListaFilmes(currentListElement, filmesFiltrados, activeTab);
    }

    updateGenreFilters();
  };

  const switchTab = (tabId) => {
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));

    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
    activeTab = tabId;
    renderizarFilmes();
  };

  // NOVO: Função para alternar filtro de organização
  const switchSortFilter = (sortId) => {
    document.querySelectorAll('.sort-filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.sort-filter-btn[data-sort="${sortId}"]`).classList.add('active');
    activeSortFilter = sortId;
    
    // Reset minutos quando mudar filtro
    Object.keys(currentPages).forEach(key => {
      currentPages[key] = 1;
    });
    
    renderizarFilmes();
  };

  // NOVO: Função para mudar página
  const mudarPagina = (tabId, novaPagina) => {
    currentPages[tabId] = novaPagina;
    renderizarFilmes();
  };

  const getAllUniqueGenres = () => {
    const uniqueGenres = new Set();
    filmes.forEach(filme => {
      if (Array.isArray(filme.generos)) {
        filme.generos.forEach(genre => uniqueGenres.add(genre));
      }
    });
    return Array.from(uniqueGenres).sort();
  };

  // NOVO: Função para renderizar as estatísticas de gênero
  const renderizarGenreStats = () => {
    if (!genreStatsContainer) return;
    genreStatsContainer.innerHTML = '';
    const genreCounts = {};

    filmes.forEach(filme => {
      if (Array.isArray(filme.generos)) {
        filme.generos.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });

    // Ordena os gêneros pela quantidade de filmes (do maior para o menor)
    const sortedGenres = Object.entries(genreCounts).sort(([,a],[,b]) => b-a);
    
    if (sortedGenres.length === 0) {
      genreStatsContainer.innerHTML = '<p class="no-books-message">Adicione filmes com gêneros para ver as estatísticas.</p>';
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
          <span class="genre-stat-count">${count} ${count > 1 ? 'filmes' : 'filme'}</span>
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
      currentPages['generos'] = 1; // Reset página
      updateGenreFilters();
      renderizarFilmes();
    });
    generosFilterContainer.appendChild(allButton);

    allGenres.forEach(genre => {
      const genreButton = document.createElement('span');
      genreButton.className = `genre-tag ${activeGenreFilter === genre ? 'active' : ''}`;
      genreButton.textContent = genre;
      genreButton.addEventListener('click', () => {
        activeGenreFilter = genre;
        currentPages['generos'] = 1; // Reset página
        updateGenreFilters();
        renderizarFilmes();
      });
      generosFilterContainer.appendChild(genreButton);
    });
  };

  const adicionarFilme = (e) => {
    e.preventDefault();
    const titulo = document.getElementById('titulo').value.trim();
    const diretor = document.getElementById('diretor').value.trim();
    const totalPaginas = parseInt(document.getElementById('total-minutos').value);
    const capaUrl = document.getElementById('capa-url').value.trim();
    const generosInput = document.getElementById('generos').value.trim();
    const sumario = document.getElementById('sumario').value.trim();
    const resenha = document.getElementById('resenha').value.trim();
    const dataInicio = document.getElementById('data-inicio').value;
    const dataConclusao = document.getElementById('data-conclusao').value;
    const sagaNome = document.getElementById('saga-nome').value.trim();
    const sagaVolume = document.getElementById('saga-volume').value.trim();

    if (titulo && diretor && totalPaginas > 0) {
      const novoFilme = {
        id: Date.now(),
        titulo, diretor, totalPaginas,
        paginaAtual: 0, assistido: false, isFavorite: false, nota: 0,
        capaUrl: capaUrl || 'img/default_cover.png',
        generos: generosInput ? generosInput.split(',').map(g => g.trim()) : [],
        sumario, resenha, dataInicio, dataConclusao,
        saga: { nome: sagaNome, volume: sagaVolume },
      };
      filmes.push(novoFilme);
      salvarFilmes();
      addBookForm.reset();
      fecharTodosModais();
    } else {
      alert('Por favor, preencha pelo menos Título, Diretor e Total de Páginas.');
    }
  };

  const excluirFilme = (id) => {
    filmes = filmes.filter(l => l.id !== id);
    salvarFilmes();
  };

  const abrirModal = (modal) => modal.classList.add('show');
  const fecharTodosModais = () => document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));

  const abrirModalExclusao = (id) => {
    filmeIdParaExcluir = id;
    fecharTodosModais();
    abrirModal(confirmDeleteModal);
  };

  const popularEAbrirModalDetalhes = (id) => {
    const filme = filmes.find(l => l.id === id);
    if (!filme) return;
    bookDetailsModal.dataset.currentBookId = filme.id;
    document.getElementById('details-capa-img').src = filme.capaUrl || 'img/default_cover.png';
    document.getElementById('details-titulo').value = filme.titulo;
    document.getElementById('details-diretor').value = filme.diretor;
    document.getElementById('details-pagina-atual').value = filme.paginaAtual;
    document.getElementById('details-total-minutos').value = filme.totalPaginas;
    document.getElementById('details-sumario').value = filme.sumario || '';
    document.getElementById('details-resenha').value = filme.resenha || '';
    document.getElementById('details-data-inicio').value = filme.dataInicio || '';
    document.getElementById('details-data-conclusao').value = filme.dataConclusao || '';
    
    document.getElementById('details-saga-nome').value = filme.saga?.nome || '';
    document.getElementById('details-saga-volume').value = filme.saga?.volume || '';

    let generosString = Array.isArray(filme.generos) ? filme.generos.join(', ') : (typeof filme.generos === 'string' ? filme.generos : '');
    document.getElementById('details-generos').value = generosString;
    updateStarRating(filme.nota || 0);
    toggleFavoriteBtn.classList.toggle('active', filme.isFavorite);

    const outrosFilmesContainer = document.getElementById('other-books-by-author');
    const outrosFilmes = filmes.filter(l => l.diretor === filme.diretor && l.id !== filme.id);
    
    if (outrosFilmes.length > 0) {
      outrosFilmesContainer.innerHTML = outrosFilmes.map(l => `
        <div class="mini-book-card" data-book-id="${l.id}">
          <div class="mini-book-cover" style="background-image: url('${l.capaUrl || 'img/default_cover.png'}');"></div>
          <div class="mini-book-title">${l.titulo}</div>
          <div class="mini-book-author">por ${l.diretor}</div>
        </div>
      `).join('');
    } else {
      outrosFilmesContainer.innerHTML = '<p style="color: rgba(255, 255, 255, 0.7); font-style: italic;">Nenhum outro filme deste diretor cadastrado.</p>';
    }
        
    const sagaSectionContainer = document.getElementById('saga-section-container');
    const sagaContainer = document.getElementById('books-in-saga');
    if (filme.saga?.nome) {
      const outrosDaSaga = filmes
        .filter(l => l.saga?.nome === filme.saga.nome && l.id !== filme.id)
        .sort((a, b) => parseFloat(a.saga.volume) - parseFloat(b.saga.volume));
      
      if (outrosDaSaga.length > 0) {
        sagaContainer.innerHTML = outrosDaSaga.map(l => `
          <div class="mini-book-card" data-book-id="${l.id}">
            <div class="mini-book-cover" style="background-image: url('${l.capaUrl || 'img/default_cover.png'}');"></div>
            <div class="mini-book-title">Vol. ${l.saga.volume}: ${l.titulo}</div>
            <div class="mini-book-author">por ${l.diretor}</div>
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
  addBookForm.addEventListener('submit', adicionarFilme);
  
  closeButtons.forEach(btn => btn.addEventListener('click', fecharTodosModais));
  
  window.addEventListener('click', (e) => { 
    if (e.target.classList.contains('modal')) fecharTodosModais(); 
  });
  
  cancelDeleteBtn.addEventListener('click', fecharTodosModais);
  
  confirmDeleteBtn.addEventListener('click', () => {
    if (filmeIdParaExcluir) {
      excluirFilme(filmeIdParaExcluir);
      filmeIdParaExcluir = null;
      fecharTodosModais();
    }
  });

  saveChangesBtn.addEventListener('click', () => {
    const id = parseInt(bookDetailsModal.dataset.currentBookId);
    const filme = filmes.find(l => l.id === id);
    if(filme) {
      const minutosAntesDeSalvar = filme.paginaAtual;

      filme.titulo = document.getElementById('details-titulo').value.trim();
      filme.diretor = document.getElementById('details-diretor').value.trim();
      filme.paginaAtual = parseInt(document.getElementById('details-pagina-atual').value) || 0;
      filme.totalPaginas = parseInt(document.getElementById('details-total-minutos').value) || 1;
      const generosInput = document.getElementById('details-generos').value.trim();
      filme.generos = generosInput ? generosInput.split(',').map(g => g.trim()) : [];
      filme.sumario = document.getElementById('details-sumario').value.trim();
      filme.resenha = document.getElementById('details-resenha').value.trim();
      filme.dataInicio = document.getElementById('details-data-inicio').value;
      filme.dataConclusao = document.getElementById('details-data-conclusao').value;
      filme.nota = parseInt(detailsNotaStars.dataset.rating) || 0;
      
      filme.saga = {
          nome: document.getElementById('details-saga-nome').value.trim(),
          volume: document.getElementById('details-saga-volume').value.trim()
      };

      filme.assistido = filme.paginaAtual >= filme.totalPaginas;
      atualizarHistoricoDeSessão(filme, minutosAntesDeSalvar);
      salvarFilmes();
      fecharTodosModais();
    }
  });

  toggleFavoriteBtn.addEventListener('click', function() {
    const id = parseInt(bookDetailsModal.dataset.currentBookId);
    const filme = filmes.find(l => l.id === id);
    if (filme) {
      filme.isFavorite = !filme.isFavorite;
      this.classList.toggle('active', filme.isFavorite);
      salvarFilmes();
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

    // NOVO: Event listener para botões de paginação
    const paginationBtn = e.target.closest('.pagination-btn');
    if (paginationBtn && !paginationBtn.classList.contains('disabled')) {
      const page = parseInt(paginationBtn.dataset.page);
      const tab = paginationBtn.dataset.tab;
      if (page && tab) {
        mudarPagina(tab, page);
      }
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
  
  // NOVO: Event listener para filtros de organização
  if (sortFiltersContainer) {
    sortFiltersContainer.addEventListener('click', (e) => {
      const button = e.target.closest('.sort-filter-btn');
      if (button) {
        switchSortFilter(button.dataset.sort);
      }
    });
  }
  
  // NOVO: Event listener para a barra de pesquisa
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      // Reset minutos quando pesquisar
      Object.keys(currentPages).forEach(key => {
        currentPages[key] = 1;
      });
      renderizarFilmes();
    });
  }

  // Inicialização
  updateBookCounts();
  renderizarFilmes();
  renderizarGenreStats(); // NOVO: Renderiza as estatísticas de gênero
  
  setTimeout(() => {
    if (window.readingStats) {
      window.readingStats.refresh();
    }
  }, 100);
});
