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

  // NOVOS CAMPOS: tipo e status para mangá
  const tipoSelect = document.getElementById('tipo');
  const statusMangaContainer = document.getElementById('status-manga-container');
  const statusMangaSelect = document.getElementById('status-manga');


  // Novos elementos do DOM para contadores e abas
  const countALer = document.getElementById('count-a-ler');
  const countLido = document.getElementById('count-lido');
  const countQueroLer = document.getElementById('count-quero-ler');
  const tabsNav = document.querySelector('.tabs-nav');
  const generosFilterContainer = document.getElementById('generos-filter-container');

  // NOVOS ELEMENTOS DO DOM
  const searchInput = document.getElementById('search-input');
  const genreStatsContainer = document.getElementById('genre-stats-container');
  
  // NOVOS ELEMENTOS PARA FILTROS DE ORGANIZAÇÃO
  const sortFiltersContainer = document.querySelector('.sort-filters-options');

  let livros = JSON.parse(localStorage.getItem('livrosTracker')) || [];

  // MIGRAÇÃO AUTOMÁTICA: garantir que entradas antigas tenham 'tipo' (default 'livro')
  try {
    let __changedTipo = false;
    livros = (livros || []).map(l => {
      if (!Object.prototype.hasOwnProperty.call(l, 'tipo') || !l.tipo) { l.tipo = 'livro'; __changedTipo = true; }
      return l;
    });
    if (__changedTipo) localStorage.setItem('livrosTracker', JSON.stringify(livros));
  } catch (err) {
    console.warn('Erro durante migração de tipo:', err);
  }


  // Mostrar/ocultar campo status do mangá quando tipo mudar
  if (tipoSelect) {
    tipoSelect.addEventListener('change', () => {
      if (tipoSelect.value === 'manga') {
        statusMangaContainer.style.display = 'block';
      } else {
        statusMangaContainer.style.display = 'none';
      }
    });
    // Inicializar visibilidade
    if (tipoSelect.value === 'manga') statusMangaContainer.style.display = 'block';
  }

  let livroIdParaExcluir = null;
  let activeTab = 'todos'; // Aba ativa padrão
  let activeGenreFilter = 'todos'; // Filtro de gênero ativo padrão
      let activeSortFilter = 'title-asc'; // Filtro de organização ativo padrão

  // NOVO: Variáveis para paginação
  const LIVROS_POR_PAGINA = 30; // 6 colunas x 5 linhas
  let currentPages = {
    'todos': 1,
    'favoritos': 1,
    'a-ler': 1,
    'quero-ler': 1,
    'lido': 1,
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

  // NOVO: Função para calcular duração da leitura em dias
  const calcularDuracaoLeitura = (livro) => {
    if (!livro.dataInicio) return 0;
    
    const dataInicio = new Date(livro.dataInicio);
    let dataFim;
    
    if (livro.lido && livro.dataConclusao) {
      dataFim = new Date(livro.dataConclusao);
    } else {
      dataFim = new Date(); // Data atual se ainda está lendo
    }
    
    const diffTime = Math.abs(dataFim - dataInicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // NOVO: Função para filtrar livros por tipo (manga, livro)
  const filtrarPorTipo = (livrosArray) => {
    if (activeSortFilter === 'mangas') {
      return livrosArray.filter(livro => livro.tipo === 'manga');
    }
    return livrosArray;
  };

  // NOVO: Função para ordenar livros baseado no filtro ativo
  const ordenarLivros = (livrosArray) => {
    const livrosCopia = [...livrosArray];
    
    switch (activeSortFilter) {
      case 'title-asc':
        return livrosCopia.sort((a, b) => a.titulo.localeCompare(b.titulo));
      
      case 'title-desc':
        return livrosCopia.sort((a, b) => b.titulo.localeCompare(a.titulo));
      
      case 'author-asc':
        return livrosCopia.sort((a, b) => a.autor.localeCompare(b.autor));
      
      case 'pages-asc':
        return livrosCopia.sort((a, b) => a.totalPaginas - b.totalPaginas);
      
      case 'pages-desc':
        return livrosCopia.sort((a, b) => b.totalPaginas - a.totalPaginas);
      
      case 'progress-desc':
        return livrosCopia.sort((a, b) => {
          const progressoA = a.totalPaginas > 0 ? (a.paginaAtual / a.totalPaginas) : 0;
          const progressoB = b.totalPaginas > 0 ? (b.paginaAtual / b.totalPaginas) : 0;
          return progressoB - progressoA;
        });
      
      case 'start-date-desc':
        return livrosCopia.sort((a, b) => {
          if (!a.dataInicio && !b.dataInicio) return 0;
          if (!a.dataInicio) return 1;
          if (!b.dataInicio) return -1;
          return new Date(b.dataInicio) - new Date(a.dataInicio);
        });
      
      case 'start-date-asc':
        return livrosCopia.sort((a, b) => {
          if (!a.dataInicio && !b.dataInicio) return 0;
          if (!a.dataInicio) return 1;
          if (!b.dataInicio) return -1;
          return new Date(a.dataInicio) - new Date(b.dataInicio);
        });
      
      case 'end-date-desc':
        return livrosCopia.sort((a, b) => {
          if (!a.dataConclusao && !b.dataConclusao) return 0;
          if (!a.dataConclusao) return 1;
          if (!b.dataConclusao) return -1;
          return new Date(b.dataConclusao) - new Date(a.dataConclusao);
        });
      
      case 'rating-desc':
        return livrosCopia.sort((a, b) => (b.nota || 0) - (a.nota || 0));
      
      case 'reading-time':
        return livrosCopia.sort((a, b) => {
          const duracaoA = calcularDuracaoLeitura(a);
          const duracaoB = calcularDuracaoLeitura(b);
          return duracaoB - duracaoA;
        });
      


      case 'mangas':
        return livrosCopia.sort((a, b) => a.titulo.localeCompare(b.titulo));
      case 'default':
        return livrosCopia.sort((a, b) => b.id - a.id); // Mais recentes primeiro
      case 'title-asc':
        return livrosCopia.sort((a, b) => a.titulo.localeCompare(b.titulo));



    }
  };

  // NOVO: Função para paginar livros
  const paginarLivros = (livrosArray, pagina) => {
    const inicio = (pagina - 1) * LIVROS_POR_PAGINA;
    const fim = inicio + LIVROS_POR_PAGINA;
    return livrosArray.slice(inicio, fim);
  };

  // NOVO: Função para calcular total de páginas
  const calcularTotalPaginas = (totalLivros) => {
    return Math.ceil(totalLivros / LIVROS_POR_PAGINA);
  };

  // NOVO: Função para renderizar controles de paginação
  const renderizarPaginacao = (containerId, totalLivros, paginaAtual) => {
    const container = document.getElementById(`pagination-${containerId}`);
    if (!container) return;

    const totalPaginas = calcularTotalPaginas(totalLivros);
    
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

    // Números das páginas
    paginationHtml += '<div class="pagination-numbers">';
    
    let startPage = Math.max(1, paginaAtual - 2);
    let endPage = Math.min(totalPaginas, paginaAtual + 2);

    // Ajustar para sempre mostrar 5 páginas quando possível
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
    const fim = Math.min(paginaAtual * LIVROS_POR_PAGINA, totalLivros);
    paginationHtml += `
      <div class="pagination-info">
        Mostrando ${inicio}-${fim} de ${totalLivros} livros
      </div>
    `;

    container.innerHTML = paginationHtml;
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

  

  // Função para criar objeto livro a partir do formulário (inclui tipo e statusManga)
  const criarLivroDoFormulario = () => {
    const titulo = document.getElementById('titulo') ? document.getElementById('titulo').value.trim() : '' ;
    const autor = document.getElementById('autor') ? document.getElementById('autor').value.trim() : '';
    const totalPaginas = parseInt(document.getElementById('total-paginas') ? document.getElementById('total-paginas').value : 0) || 0;
    const capaUrl = document.getElementById('capa-url') ? document.getElementById('capa-url').value.trim() : '';
    const sagaNome = document.getElementById('saga-nome') ? document.getElementById('saga-nome').value.trim() : '';
    const sagaVolume = document.getElementById('saga-volume') ? document.getElementById('saga-volume').value.trim() : '';
    const dataInicio = document.getElementById('data-inicio') ? document.getElementById('data-inicio').value : '';
    const dataConclusao = document.getElementById('data-conclusao') ? document.getElementById('data-conclusao').value : '';
    const generoInput = document.getElementById('genero-input') ? document.getElementById('genero-input').value.trim() : '';
    const generos = generoInput ? generoInput.split(',').map(g => g.trim()) : [];
    // Tipo e status do mangá (novos)
    const tipo = document.getElementById('tipo') ? document.getElementById('tipo').value : 'livro';
    const statusManga = (tipo === 'manga' && document.getElementById('status-manga')) ? document.getElementById('status-manga').value : '';

    const novoLivro = {
      id: Date.now(),
      titulo,
      autor,
      totalPaginas,
      paginaAtual: 0,
      capaUrl,
      saga: sagaNome || '',
      volume: sagaVolume || '',
      dataInicio: dataInicio || '',
      dataConclusao: dataConclusao || '',
      generos,
      isFavorite: false,
      nota: 0,
      lido: false,
      tipo,
      statusManga
    };
    return novoLivro;
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

  const renderizarListaLivros = (listaElement, livrosParaRenderizar, tabId) => {
    listaElement.innerHTML = '';
    
    if (livrosParaRenderizar.length === 0) {
      listaElement.innerHTML = '<p class="no-books-message">Nenhum livro encontrado.</p>';
      // Renderizar paginação vazia
      renderizarPaginacao(tabId, 0, 1);
      return;
    }
    
    // NOVO: Aplicar filtragem por tipo antes da ordenação
    const livrosFiltradosPorTipo = filtrarPorTipo(livrosParaRenderizar);

    // MODIFICADO: Aplicar ordenação antes de paginar
    const livrosOrdenados = ordenarLivros(livrosFiltradosPorTipo);
    
    // NOVO: Aplicar paginação
    const paginaAtual = currentPages[tabId] || 1;
    const livrosPaginados = paginarLivros(livrosOrdenados, paginaAtual);
    
    livrosPaginados.forEach(livro => {
      const li = document.createElement('li');
      li.className = 'book-item' + (livro.tipo === 'manga' ? ' manga' : '');
      li.dataset.id = livro.id;
      const percentual = livro.totalPaginas > 0 ? ((livro.paginaAtual / livro.totalPaginas) * 100).toFixed(0) : 0;
      let generosArray = [];
      if (Array.isArray(livro.generos)) {
        generosArray = livro.generos;
      } else if (typeof livro.generos === 'string' && livro.generos) {
        generosArray = livro.generos.split(',').map(g => g.trim());
      }
      
      // *** INÍCIO DA MODIFICAÇÃO: Lógica para exibir gêneros ***
      const generosParaMostrar = generosArray.slice(0, 2);
      let generosHtml = generosParaMostrar.map(g => `<span class="genre-tag">${g}</span>`).join('');
      if (generosArray.length > 2) {
        generosHtml += `<span class="genre-tag-ellipsis">...</span>`;
      }
      // *** FIM DA MODIFICAÇÃO ***

      const statusBadge = (livro.tipo === 'manga' && livro.statusManga) ? `<div class="manga-status">${livro.statusManga === 'concluido' ? 'Concluído' : 'Em andamento'}</div>` : '';
      
      li.innerHTML = `<div class="book-item-cover" style="background-image: url('${livro.capaUrl || 'img/default_cover.png'}');">
          ${livro.isFavorite ? '<i class="fas fa-star favorite-icon"></i>' : ''}
          <div class="progress-bar-overlay"><div class="progress-overlay" style="width: ${percentual}%;">${percentual > 10 ? percentual + '%' : ''}</div></div>
          ${statusBadge}
        </div>
        <div class="book-item-info">
          <h4>${livro.titulo}</h4>
          <p class="autor">por ${livro.autor}</p>
          <div class="card-rating">${getRatingStars(livro.nota)}</div>
          <div class="genre-tags">${generosHtml}</div>
        </div>`;
      listaElement.appendChild(li);
    });

    // NOVO: Renderizar controles de paginação
    renderizarPaginacao(tabId, livrosOrdenados.length, paginaAtual);
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

    const livrosBaseFiltradoPorTipo = filtrarPorTipo(livrosBase);


    let livrosFiltrados = [];
    switch (activeTab) {
      case 'todos':
        livrosFiltrados = livrosBaseFiltradoPorTipo;
        break;
      case 'favoritos':
        livrosFiltrados = livrosBaseFiltradoPorTipo.filter(livro => livro.isFavorite);
        break;
      case 'a-ler':
        livrosFiltrados = livrosBaseFiltradoPorTipo.filter(livro => !livro.lido && livro.paginaAtual > 0);
        break;
      case 'quero-ler':
        livrosFiltrados = livrosBaseFiltradoPorTipo.filter(livro => !livro.lido && livro.paginaAtual === 0);
        break;
      case 'lido':
        livrosFiltrados = livrosBaseFiltradoPorTipo.filter(livro => livro.lido);
        break;
      case 'generos':
        if (activeGenreFilter === 'todos') {
          livrosFiltrados = livrosBaseFiltradoPorTipo;
        } else {
          livrosFiltrados = livrosBaseFiltradoPorTipo.filter(livro => 
            Array.isArray(livro.generos) && livro.generos.includes(activeGenreFilter)
          );
        }
        break;
      default:
        livrosFiltrados = livrosBaseFiltradoPorTipo;
    }

    const currentListElement = document.getElementById(`lista-livros-${activeTab}`);
    if (currentListElement) {
      renderizarListaLivros(currentListElement, livrosFiltrados, activeTab);
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

  // NOVO: Função para alternar filtro de organização
  const switchSortFilter = (sortId) => {
    document.querySelectorAll('.sort-filter-btn').forEach(btn => btn.classList.remove('active'));
    const __sortBtn = document.querySelector(`.sort-filter-btn[data-sort="${sortId}"]`);
    if (__sortBtn) __sortBtn.classList.add('active');
    activeSortFilter = sortId;
    
    // Reset páginas quando mudar filtro
    Object.keys(currentPages).forEach(key => {
      currentPages[key] = 1;
    });
    
    renderizarLivros();
  };

  // NOVO: Função para mudar página
  const mudarPagina = (tabId, novaPagina) => {
    currentPages[tabId] = novaPagina;
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
      currentPages['generos'] = 1; // Reset página
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
        currentPages['generos'] = 1; // Reset página
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
      // Reset páginas quando pesquisar
      Object.keys(currentPages).forEach(key => {
        currentPages[key] = 1;
      });
      renderizarLivros();
    });
  }

  // Inicialização
  updateBookCounts();
  renderizarLivros();
  renderizarGenreStats(); // NOVO: Renderiza as estatísticas de gênero

  // Garantir que o botão de organização atual apareça ativo na UI (se existir)
  try {
    const __initialSortBtn = document.querySelector(`.sort-filter-btn[data-sort="${activeSortFilter}"]`);
    if (__initialSortBtn) __initialSortBtn.classList.add('active');
  } catch (e) { console.warn('erro ao setar botão inicial ativo', e); }

  
  setTimeout(() => {
    if (window.readingStats) {
      window.readingStats.refresh();
    }
  }, 100);
});
if (addBookForm) {
  addBookForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const novoLivro = criarLivroDoFormulario();
    livros.unshift(novoLivro);
    salvarLivros();
    addBookForm.reset();
    if (addBookModal) addBookModal.classList.remove('show');
    if (statusMangaContainer) statusMangaContainer.style.display = 'none';
  });
}