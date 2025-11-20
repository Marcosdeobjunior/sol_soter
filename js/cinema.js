// Lógica de Dropdown aprimorada para todos os menus
document.querySelectorAll('.dropdown').forEach(dropdownContainer => {
  // O gatilho pode ser o cabeçalho do dropdown ou o perfil
  const toggle = dropdownContainer.querySelector('.dropdown-header, .profile');

  if (toggle) {
    toggle.addEventListener('click', (event) => {
      // Impede que o clique no link dentro do dropdown feche o menu imediatamente
      if (event.target.tagName === 'A') return;

      // Fecha outros menus abertos
      document.querySelectorAll('.dropdown.active').forEach(activeDropdown => {
        if (activeDropdown !== dropdownContainer) {
          activeDropdown.classList.remove('active');
        }
      });

      // Abre/fecha o menu atual
      dropdownContainer.classList.toggle('active');
    });
  }
});

// Fecha todos os dropdowns ao clicar fora
document.addEventListener('click', e => {
  // Se o clique não foi dentro de um dropdown, fecha todos
  if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown.active').forEach(dropdown => {
      dropdown.classList.remove('active');
    });
  }
});


// --- NOVIDADE: ATUALIZA O SALDO QUANDO A PÁGINA CARREGA ---
document.addEventListener('DOMContentLoaded', () => {
    // Chama a função do script global para mostrar o saldo
    if (typeof atualizarSaldoGlobal === 'function') {
        atualizarSaldoGlobal();
    }
});

// Opcional: Atualiza o saldo na index.html se outra aba alterar os dados
window.addEventListener('storage', (event) => {
    if (event.key === 'financeiro-widget') {
        if (typeof atualizarSaldoGlobal === 'function') {
            atualizarSaldoGlobal();
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
  // Elementos do DOM existentes
  const addBookModal = document.getElementById("add-book-modal");
  const confirmDeleteModal = document.getElementById("confirm-delete-modal");
  const bookDetailsModal = document.getElementById("book-details-modal");
  const addBookForm = document.getElementById("add-book-form");
  const openAddBookModalBtn = document.getElementById("open-add-book-modal-btn");
  const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
  const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
  const saveChangesBtn = document.getElementById("save-changes-btn");
  const toggleFavoriteBtn = document.getElementById("toggle-favorite-btn");
  const deleteFromDetailsBtn = document.getElementById("delete-from-details-btn");
  const closeButtons = document.querySelectorAll(".close-btn");
  const detailsNotaStars = document.getElementById("details-nota-stars");

  // Novos elementos do DOM para contadores e abas
  const countALer = document.getElementById("count-a-ler");
  const countLido = document.getElementById("count-lido");
  const countQueroLer = document.getElementById("count-quero-ler");
  const tabsNav = document.querySelector(".tabs-nav");
  const generosFilterContainer = document.getElementById("generos-filter-container");

  // NOVOS ELEMENTOS DO DOM
  const searchInput = document.getElementById("search-input");
  const genreStatsContainer = document.getElementById("genre-stats-container");
  
  // NOVOS ELEMENTOS PARA FILTROS DE ORGANIZAÇÃO
  const sortFiltersContainer = document.querySelector(".sort-filters-options");

  let midias = JSON.parse(localStorage.getItem("midiasTracker")) || [];
  let midiaIdParaExcluir = null;
  let activeTab = "todos"; // Aba ativa padrão
  let activeGenreFilter = "todos"; // Filtro de gênero ativo padrão
  let activeSortFilter = "default"; // Filtro de organização ativo padrão

  // NOVO: Variáveis para paginação
  const MIDIAS_POR_PAGINA = 30; // 6 colunas x 5 linhas
  let currentPages = {
    "todos": 1,
    "favoritos": 1,
    "a-ler": 1,
    "quero-ler": 1,
    "lido": 1,
    "generos": 1
  };

  // NOVO E MELHORADO: "Banco de Dados" de Emojis para Gêneros
  // Para adicionar um novo gênero, basta incluir uma nova linha no formato:
  // 'Nome do Gênero': '📧',
  const genreEmojis = {
    // Filmes/Séries/Animes
    'Ação': '💥',
    'Aventura': '🗺️',
    'Comédia': '😂',
    'Drama': '🎭',
    'Ficção Científica': '🚀',
    'Fantasia': '🧙',
    'Terror': '👻',
    'Suspense': '🔪',
    'Mistério': '🕵️',
    'Romance': '💖',
    'Documentário': '🎥',
    'Animação': '🎬',
    'Musical': '🎶',
    'Guerra': '⚔️',
    'Histórico': '📜',
    'Crime': '🚨',
    'Faroeste': '🤠',
    'Esporte': '🏅',
    'Biografia': '👤',
    'Infantil': '🧸',
    'Família': '👨‍👩‍👧‍👦',
    'Super-herói': '🦸',
    'Anime': '🎌',
    'K-Drama': '🇰🇷',
    'Sci-Fi': '🌌',
    'Thriller': '😱',
    'Cyberpunk': '🌃',
    'Steampunk': '⚙️',
    'Pós-apocalíptico': ' wasteland',
    'Zumbi': '🧟',
    'Vampiro': '🧛',
    'Lobisomem': '🐺',
    'Magia': '✨',
    'Viagem no Tempo': '⏳',
    'Espacial': '🪐',
    'Mecha': '🤖',
    'Slice of Life': '☕',
    'Shonen': '👊',
    'Shojo': '🌸',
    'Seinen': '💼',
    'Josei': '🥂',
    'Isekai': ' portal',
    'Fantasia Urbana': '🏙️',
    'Sobrenatural': '🔮',
    'Artes Marciais': '🥋',
    'Policial': '🚓',
    'Espionagem': '🕵️‍♀️',
    'Catástrofe': '🌪️',
    'Desastre': '🌊',
    'Cult': '🌟',
    'Independente': '🎬',
    'Curta-metragem': '🎞️',
    'Longa-metragem': '📽️',
    'Série de TV': '📺',
    'Minissérie': '📜',
    'Websérie': '💻',
    'Reality Show': '📺',
    'Talk Show': '🗣️',
    'Game Show': '🎲',
    'Notícias': '📰',
    'Entrevista': '🎤',
    'Show': '🎤',
    'Stand-up': '🎤',
    'Comédia Romântica': '👩‍❤️‍💋‍👨',
    'Ação e Aventura': '💥🗺️',
    'Ficção Científica e Fantasia': '🚀🧙',
    'Terror e Suspense': '👻🔪',
    'Drama e Romance': '🎭💖',
    
    // Emoji padrão para qualquer gênero não listado acima
    'default': '🎬' 
  };

  // NOVO: Função para calcular duração da mídia em dias
  const calcularDuracaoMidia = (midia) => {
    if (!midia.dataInicio) return 0;
    
    const dataInicio = new Date(midia.dataInicio);
    let dataFim;
    
    if (midia.lido && midia.dataConclusao) {
      dataFim = new Date(midia.dataConclusao);
    } else {
      dataFim = new Date(); // Data atual se ainda está assistindo
    }
    
    const diffTime = Math.abs(dataFim - dataInicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // NOVO: Função para ordenar mídias baseado no filtro ativo
  const ordenarMidias = (midiasArray) => {
    const midiasCopia = [...midiasArray];
    
    switch (activeSortFilter) {
      case 'title-asc':
        return midiasCopia.sort((a, b) => a.titulo.localeCompare(b.titulo));
      
      case 'title-desc':
        return midiasCopia.sort((a, b) => b.titulo.localeCompare(a.titulo));
      
      case 'author-asc':
        return midiasCopia.sort((a, b) => a.autor.localeCompare(b.autor));
      
      case 'pages-asc': // Adaptado para duração/episódios
        return midiasCopia.sort((a, b) => a.totalPaginas - b.totalPaginas);
      
      case 'pages-desc': // Adaptado para duração/episódios
        return midiasCopia.sort((a, b) => b.totalPaginas - a.totalPaginas);
      
      case 'progress-desc':
        return midiasCopia.sort((a, b) => {
          const progressoA = a.totalPaginas > 0 ? (a.paginaAtual / a.totalPaginas) : 0;
          const progressoB = b.totalPaginas > 0 ? (b.paginaAtual / b.totalPaginas) : 0;
          return progressoB - progressoA;
        });
      
      case 'start-date-desc':
        return midiasCopia.sort((a, b) => {
          if (!a.dataInicio && !b.dataInicio) return 0;
          if (!a.dataInicio) return 1;
          if (!b.dataInicio) return -1;
          return new Date(b.dataInicio) - new Date(a.dataInicio);
        });
      
      case 'start-date-asc':
        return midiasCopia.sort((a, b) => {
          if (!a.dataInicio && !b.dataInicio) return 0;
          if (!a.dataInicio) return 1;
          if (!b.dataInicio) return -1;
          return new Date(a.dataInicio) - new Date(b.dataInicio);
        });
      
      case 'end-date-desc':
        return midiasCopia.sort((a, b) => {
          if (!a.dataConclusao && !b.dataConclusao) return 0;
          if (!a.dataConclusao) return 1;
          if (!b.dataConclusao) return -1;
          return new Date(b.dataConclusao) - new Date(a.dataConclusao);
        });
      
      case 'rating-desc':
        return midiasCopia.sort((a, b) => (b.nota || 0) - (a.nota || 0));
      
      case 'reading-time': // Adaptado para tempo assistido
        return midiasCopia.sort((a, b) => {
          const duracaoA = calcularDuracaoMidia(a);
          const duracaoB = calcularDuracaoMidia(b);
          return duracaoB - duracaoA;
        });
      
      case 'default':
      default:
        return midiasCopia.sort((a, b) => b.id - a.id); // Mais recentes primeiro
    }
  };

  // NOVO: Função para paginar mídias
  const paginarMidias = (midiasArray, pagina) => {
    const inicio = (pagina - 1) * MIDIAS_POR_PAGINA;
    const fim = inicio + MIDIAS_POR_PAGINA;
    return midiasArray.slice(inicio, fim);
  };

  // NOVO: Função para calcular total de páginas
  const calcularTotalPaginas = (totalMidias) => {
    return Math.ceil(totalMidias / MIDIAS_POR_PAGINA);
  };

  // NOVO: Função para renderizar controles de paginação
  const renderizarPaginacao = (containerId, totalMidias, paginaAtual) => {
    const container = document.getElementById(`pagination-${containerId}`);
    if (!container) return;

    const totalPaginas = calcularTotalPaginas(totalMidias);
    
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
    const inicio = (paginaAtual - 1) * MIDIAS_POR_PAGINA + 1;
    const fim = Math.min(paginaAtual * MIDIAS_POR_PAGINA, totalMidias);
    paginationHtml += `
      <div class="pagination-info">
        Mostrando ${inicio}-${fim} de ${totalMidias} mídias
      </div>
    `;

    container.innerHTML = paginationHtml;
  };

  // NOVO: Função para atualizar o histórico de progresso
  const atualizarHistoricoDeProgresso = (midia, progressoAntes) => {
    const progressoAgora = midia.paginaAtual; // Usando paginaAtual para representar progresso em mídias
    const progressoNovo = progressoAgora - progressoAntes;

    if (progressoNovo <= 0) return; // Nenhum progresso novo

    const hoje = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const historico = JSON.parse(localStorage.getItem('historicoProgressoMidia') || '{}');

    if (!historico[hoje]) {
      historico[hoje] = { progress: 0 };
    }

    historico[hoje].progress += progressoNovo;
    localStorage.setItem('historicoProgressoMidia', JSON.stringify(historico));
  };

  const salvarMidias = () => {
    localStorage.setItem('midiasTracker', JSON.stringify(midias));
    // Keep midiasAssistidas derived for backward compatibility
    const midiasAssistidas = midias.filter(m => m.lido);
    localStorage.setItem('midiasAssistidas', JSON.stringify(midiasAssistidas));
    if (window.mediaStats) { window.mediaStats.refresh && window.mediaStats.refresh(); }
    updateMidiaCounts();
    renderizarMidias();
    renderizarGenreStats && renderizarGenreStats();
  };

  const getRatingStars = (rating = 0) => {
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
          starsHtml += `<i class="${i <= rating ? 'fa-solid' : 'fa-regular'} fa-star"></i>`;
      }
      return starsHtml;
  };

  const updateMidiaCounts = () => {
    const assistindo = midias.filter(midia => !midia.lido && midia.paginaAtual > 0).length;
    const assistido = midias.filter(midia => midia.lido).length;
    const queroAssistir = midias.filter(midia => !midia.lido && midia.paginaAtual === 0).length;

    if (countALer) countALer.textContent = assistindo;
    if (countLido) countLido.textContent = assistido;
    if (countQueroLer) countQueroLer.textContent = queroAssistir;
  };

  const renderizarListaMidias = (listaElement, midiasParaRenderizar, tabId) => {
    listaElement.innerHTML = '';
    
    if (midiasParaRenderizar.length === 0) {
      listaElement.innerHTML = '<p class="no-books-message">Nenhuma mídia encontrada.</p>';
      // Renderizar paginação vazia
      renderizarPaginacao(tabId, 0, 1);
      return;
    }
    
    // MODIFICADO: Aplicar ordenação antes de paginar
    const midiasOrdenadas = ordenarMidias(midiasParaRenderizar);
    
    // NOVO: Aplicar paginação
    const paginaAtual = currentPages[tabId] || 1;
    const midiasPaginadas = paginarMidias(midiasOrdenadas, paginaAtual);
    
    midiasPaginadas.forEach(midia => {
      const li = document.createElement('li');
      li.className = 'book-item'; // Mantendo a classe para não alterar o CSS
      li.dataset.id = midia.id;
      const percentual = midia.totalPaginas > 0 ? ((midia.paginaAtual / midia.totalPaginas) * 100).toFixed(0) : 0;
      let generosArray = [];
      if (Array.isArray(midia.generos)) {
        generosArray = midia.generos;
      } else if (typeof midia.generos === 'string' && midia.generos) {
        generosArray = midia.generos.split(',').map(g => g.trim());
      }
      
      // *** INÍCIO DA MODIFICAÇÃO PARA GÊNEROS ***
      let generosHtml = '';
      if (generosArray.length > 0) {
        const generosParaMostrar = generosArray.slice(0, 2);
        generosHtml = generosParaMostrar.map(g => `<span class="genre-tag">${g}</span>`).join('');
        if (generosArray.length > 2) {
          generosHtml += `<span class="genre-tag-more">...</span>`;
        }
      }
      // *** FIM DA MODIFICAÇÃO PARA GÊNEROS ***
      
      // Determinar emoji e informações específicas do tipo de mídia
      let tipoEmoji = '🎬';
      
      if (midia.tipoMidia === 'filme') {
        tipoEmoji = '🎬';
      } else if (midia.tipoMidia === 'serie') {
        tipoEmoji = '📺';
      } else if (midia.tipoMidia === 'anime') {
        tipoEmoji = '🎌';
      }
      
      li.innerHTML = `<div class="book-item-cover" style="background-image: url('${midia.capaUrl || 'img/default_cover.png'}');">
          ${midia.isFavorite ? '<i class="fas fa-star favorite-icon"></i>' : ''}
          <div class="media-type-badge">${tipoEmoji}</div>
          <div class="progress-bar-overlay"><div class="progress-overlay" style="width: ${percentual}%;">${percentual > 10 ? percentual + '%' : ''}</div></div>
        </div>
        <div class="book-item-info">
          <h4>${midia.titulo}</h4>
          <p class="autor">por ${midia.autor}</p>
          <div class="card-rating">${getRatingStars(midia.nota)}</div>
          <div class="genre-tags">${generosHtml}</div>
        </div>`;
      listaElement.appendChild(li);
    });

    // NOVO: Renderizar controles de paginação
    renderizarPaginacao(tabId, midiasOrdenadas.length, paginaAtual);
  };

  const renderizarMidias = () => {
    const listaTodos = document.querySelector('#tab-todos .book-list');
    const listaFavoritos = document.querySelector('#tab-favoritos .book-list');
    const listaALer = document.querySelector('#tab-a-ler .book-list');
    const listaQueroLer = document.querySelector('#tab-quero-ler .book-list');
    const listaLido = document.querySelector('#tab-lido .book-list');
    const listaGeneros = document.querySelector('#tab-generos .book-list');

    [listaTodos, listaFavoritos, listaALer, listaQueroLer, listaLido, listaGeneros].forEach(list => {
      if (list) list.innerHTML = '';
    });
    
    // NOVO: Aplica o filtro de pesquisa
    const searchTerm = searchInput.value.toLowerCase();
    const midiasBase = searchTerm
      ? midias.filter(midia => 
          midia.titulo.toLowerCase().includes(searchTerm) || 
          midia.autor.toLowerCase().includes(searchTerm)
        )
      : midias;

    let midiasFiltradas = [];

    switch (activeTab) {
      case 'todos':
        midiasFiltradas = midiasBase;
        break;
      case 'favoritos':
        midiasFiltradas = midiasBase.filter(midia => midia.isFavorite);
        break;
      case 'a-ler': // Adaptado para 'A assistir'
        midiasFiltradas = midiasBase.filter(midia => !midia.lido && midia.paginaAtual > 0);
        break;
      case 'quero-ler': // Adaptado para 'Quero assistir'
        midiasFiltradas = midiasBase.filter(midia => !midia.lido && midia.paginaAtual === 0);
        break;
      case 'lido': // Adaptado para 'Assistido'
        midiasFiltradas = midiasBase.filter(midia => midia.lido);
        break;
      case 'generos':
        if (activeGenreFilter === 'todos') {
          midiasFiltradas = midiasBase;
        } else {
          midiasFiltradas = midiasBase.filter(midia => 
            Array.isArray(midia.generos) && midia.generos.includes(activeGenreFilter)
          );
        }
        break;
      default:
        midiasFiltradas = midiasBase;
    }

    const currentListElement = document.querySelector(`#tab-${activeTab} .book-list`);
    if (currentListElement) {
      renderizarListaMidias(currentListElement, midiasFiltradas, activeTab);
    }

    updateGenreFilters();
  };

  const switchTab = (tabId) => {
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));

    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
    activeTab = tabId;
    renderizarMidias();
  };

  // NOVO: Função para alternar filtro de organização
  const switchSortFilter = (sortId) => {
    document.querySelectorAll('.sort-filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.sort-filter-btn[data-sort="${sortId}"]`).classList.add('active');
    activeSortFilter = sortId;
    
    // Reset páginas quando mudar
    Object.keys(currentPages).forEach(key => {
      currentPages[key] = 1;
    });
    renderizarMidias();
  };

  // NOVO: Função para mudar de página
  const mudarPagina = (tabId, page) => {
    currentPages[tabId] = page;
    renderizarMidias();
  };

  const getAllUniqueGenres = () => {
    const allGenres = new Set();
    midias.forEach(midia => {
      if (Array.isArray(midia.generos)) {
        midia.generos.forEach(genre => allGenres.add(genre));
      } else if (typeof midia.generos === 'string' && midia.generos) {
        midia.generos.split(',').map(g => g.trim()).forEach(genre => allGenres.add(genre));
      }
    });
    return Array.from(allGenres).sort();
  };

  const renderizarGenreStats = () => {
    if (!genreStatsContainer) return;
    genreStatsContainer.innerHTML = '';
    const genreCounts = {};
    midias.forEach(midia => {
      if (Array.isArray(midia.generos)) {
        midia.generos.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      } else if (typeof midia.generos === 'string' && midia.generos) {
        midia.generos.split(',').map(g => g.trim()).forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });

    const sortedGenres = Object.entries(genreCounts).sort(([, countA], [, countB]) => countB - countA);

    if (sortedGenres.length === 0) {
      genreStatsContainer.innerHTML = '<p class="no-stats-message">Nenhuma estatística de gênero disponível.</p>';
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
          <span class="genre-stat-count">${count} ${count > 1 ? 'mídias' : 'mídia'}</span>
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
      renderizarMidias();
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
        renderizarMidias();
      });
      generosFilterContainer.appendChild(genreButton);
    });
  };

  const adicionarMidia = (e) => {
    e.preventDefault();
    const titulo = document.getElementById('titulo').value.trim();
    const autor = document.getElementById('autor').value.trim();
    const tipoMidia = document.getElementById('tipo-midia').value;
    const capaUrl = document.getElementById('capa-url').value.trim();
    const generosInput = document.getElementById('generos').value.trim();
    const sumario = document.getElementById('sumario').value.trim();
    const resenha = document.getElementById('resenha').value.trim();
    const dataInicio = document.getElementById('data-inicio').value;
    const dataConclusao = document.getElementById('data-conclusao').value;
    const sagaNome = document.getElementById('saga-nome').value.trim();
    const sagaVolume = document.getElementById('saga-volume').value.trim();

    // Validação básica
    if (!titulo || !autor || !tipoMidia) {
      alert('Por favor, preencha pelo menos Título, Diretor/Criador e Tipo de Mídia.');
      return;
    }

    let novaMidia = {
      id: Date.now(),
      titulo, 
      autor, 
      tipoMidia,
      paginaAtual: 0, 
      lido: false, 
      isFavorite: false, 
      nota: 0,
      capaUrl: capaUrl || 'img/default_cover.png',
      generos: generosInput ? generosInput.split(',').map(g => g.trim()) : [],
      sumario, 
      resenha, 
      dataInicio, 
      dataConclusao,
      saga: { nome: sagaNome, volume: sagaVolume },
    };

    // Campos específicos por tipo de mídia
    if (tipoMidia === 'filme') {
      const duracaoMinutos = parseInt(document.getElementById('duracao-minutos').value);
      const minutosAssistidos = parseInt(document.getElementById('minutos-assistidos').value) || 0;
      
      if (!duracaoMinutos || duracaoMinutos <= 0) {
        alert('Por favor, preencha a duração do filme em minutos.');
        return;
      }

      novaMidia.duracaoMinutos = duracaoMinutos;
      novaMidia.minutosAssistidos = minutosAssistidos;
      novaMidia.totalPaginas = duracaoMinutos; // Para compatibilidade com sistema existente
      novaMidia.paginaAtual = minutosAssistidos;
      novaMidia.lido = minutosAssistidos >= duracaoMinutos;
      
    } else if (tipoMidia === 'serie' || tipoMidia === 'anime') {
      const totalTemporadas = parseInt(document.getElementById('total-temporadas').value);
      const totalEpisodios = parseInt(document.getElementById('total-episodios').value);
      const duracaoEpisodio = parseInt(document.getElementById('duracao-episodio').value);
      const temporadaAtual = parseInt(document.getElementById('temporada-atual').value) || 0;
      const episodioAtual = parseInt(document.getElementById('episodio-atual').value) || 0;

      if (!totalTemporadas || !totalEpisodios || !duracaoEpisodio) {
        alert('Por favor, preencha o número de temporadas, episódios e duração média por episódio.');
        return;
      }

      novaMidia.totalTemporadas = totalTemporadas;
      novaMidia.totalEpisodios = totalEpisodios;
      novaMidia.duracaoEpisodio = duracaoEpisodio;
      novaMidia.temporadaAtual = temporadaAtual;
      novaMidia.episodioAtual = episodioAtual;
      
      // Para compatibilidade com sistema existente
      novaMidia.totalPaginas = totalEpisodios;
      novaMidia.paginaAtual = episodioAtual;
      novaMidia.lido = episodioAtual >= totalEpisodios;
    }

    midias.push(novaMidia);
    salvarMidias();
    addBookForm.reset();
    resetarCamposCondicionais();
    fecharTodosModais();
  };

  // Função para resetar campos condicionais
  const resetarCamposCondicionais = () => {
    document.querySelectorAll('.conditional-field').forEach(field => {
      field.style.display = 'none';
    });
    document.getElementById('tipo-midia').value = '';
  };

  // Função para mostrar/ocultar campos baseado no tipo de mídia
  const gerenciarCamposCondicionais = (tipoMidia) => {
    // Ocultar todos os campos condicionais primeiro
    document.querySelectorAll('.conditional-field').forEach(field => {
      field.style.display = 'none';
    });

    // Mostrar campos específicos baseado no tipo
    if (tipoMidia === 'filme') {
      document.getElementById('duracao-filme').style.display = 'block';
      document.getElementById('progresso-filme').style.display = 'block';
      
      // Atualizar display de total de minutos quando duração mudar
      const duracaoInput = document.getElementById('duracao-minutos');
      const totalDisplay = document.getElementById('total-minutos-display');
      
      const atualizarTotal = () => {
        totalDisplay.textContent = duracaoInput.value || '0';
      };
      
      duracaoInput.addEventListener('input', atualizarTotal);
      atualizarTotal();
      
    } else if (tipoMidia === 'serie' || tipoMidia === 'anime') {
      document.getElementById('duracao-serie').style.display = 'block';
      document.getElementById('progresso-serie').style.display = 'block';
    }
  };

  // Função para gerenciar campos condicionais no modal de detalhes
  const gerenciarCamposCondicionaisDetalhes = (tipoMidia) => {
    // Ocultar todos os campos condicionais primeiro
    document.querySelectorAll('#book-details-modal .conditional-field').forEach(field => {
      field.style.display = 'none';
    });

    // Mostrar campos específicos baseado no tipo
    if (tipoMidia === 'filme') {
      document.getElementById('details-progresso-filme').style.display = 'block';
    } else if (tipoMidia === 'serie' || tipoMidia === 'anime') {
      document.getElementById('details-progresso-serie').style.display = 'block';
    }
  };

  const excluirMidia = (id) => {
    midias = midias.filter(l => l.id !== id);
    salvarMidias();
  };

  const abrirModal = (modal) => modal.classList.add('show');
  const fecharTodosModais = () => document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));

  const abrirModalExclusao = (id) => {
    midiaIdParaExcluir = id;
    fecharTodosModais();
    abrirModal(confirmDeleteModal);
  };

  const popularEAbrirModalDetalhes = (id) => {
    const midia = midias.find(l => l.id === id);
    if (!midia) return;
    bookDetailsModal.dataset.currentBookId = midia.id; // Mantendo ID para não alterar o HTML
    document.getElementById('details-capa-img').src = midia.capaUrl || 'img/default_cover.png';
    document.getElementById('details-titulo').value = midia.titulo;
    document.getElementById('details-autor').value = midia.autor;
    document.getElementById('details-sumario').value = midia.sumario || '';
    document.getElementById('details-resenha').value = midia.resenha || '';
    document.getElementById('details-data-inicio').value = midia.dataInicio || '';
    document.getElementById('details-data-conclusao').value = midia.dataConclusao || '';
    
    document.getElementById('details-saga-nome').value = midia.saga?.nome || '';
    document.getElementById('details-saga-volume').value = midia.saga?.volume || '';

    // Gerenciar campos condicionais baseados no tipo de mídia
    const tipoMidia = midia.tipoMidia || 'filme'; // Default para filme se não especificado
    document.getElementById('details-tipo-midia').value = tipoMidia;
    gerenciarCamposCondicionaisDetalhes(tipoMidia);

    // Preencher campos específicos por tipo
    if (tipoMidia === 'filme') {
      document.getElementById('details-duracao-minutos').value = midia.duracaoMinutos || midia.totalPaginas || 0;
      document.getElementById('details-minutos-assistidos').value = midia.minutosAssistidos || midia.paginaAtual || 0;
    } else if (tipoMidia === 'serie' || tipoMidia === 'anime') {
      document.getElementById('details-total-temporadas').value = midia.totalTemporadas || 1;
      document.getElementById('details-total-episodios').value = midia.totalEpisodios || midia.totalPaginas || 0;
      document.getElementById('details-temporada-atual').value = midia.temporadaAtual || 1;
      document.getElementById('details-episodio-atual').value = midia.episodioAtual || midia.paginaAtual || 0;
    }

    let generosString = Array.isArray(midia.generos) ? midia.generos.join(', ') : (typeof midia.generos === 'string' ? midia.generos : '');
    document.getElementById('details-generos').value = generosString;
    updateStarRating(midia.nota || 0);
    toggleFavoriteBtn.classList.toggle('active', midia.isFavorite);

    const outrasMidiasContainer = document.getElementById('other-books-by-author'); // Mantendo ID
    const outrasMidias = midias.filter(l => l.autor === midia.autor && l.id !== midia.id);
    
    if (outrasMidias.length > 0) {
      outrasMidiasContainer.innerHTML = outrasMidias.map(l => `
        <div class="mini-book-card" data-book-id="${l.id}">
          <div class="mini-book-cover" style="background-image: url('${l.capaUrl || 'img/default_cover.png'}');"></div>
          <div class="mini-book-title">${l.titulo}</div>
          <div class="mini-book-author">por ${l.autor}</div>
        </div>
      `).join('');
    } else {
      outrasMidiasContainer.innerHTML = '<p style="color: rgba(255, 255, 255, 0.7); font-style: italic;">Nenhuma outra mídia deste diretor/criador cadastrada.</p>';
    }
        
    const sagaSectionContainer = document.getElementById('saga-section-container');
    const sagaContainer = document.getElementById('books-in-saga'); // Mantendo ID
    if (midia.saga?.nome) {
      const outrasDaSaga = midias
        .filter(l => l.saga?.nome === midia.saga.nome && l.id !== midia.id)
        .sort((a, b) => parseFloat(a.saga.volume) - parseFloat(b.saga.volume));
      
      if (outrasDaSaga.length > 0) {
        sagaContainer.innerHTML = outrasDaSaga.map(l => `
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
  addBookForm.addEventListener('submit', adicionarMidia);
  
  closeButtons.forEach(btn => btn.addEventListener('click', fecharTodosModais));
  
  window.addEventListener('click', (e) => { 
    if (e.target.classList.contains('modal')) fecharTodosModais(); 
  });
  
  cancelDeleteBtn.addEventListener('click', fecharTodosModais);
  
  confirmDeleteBtn.addEventListener('click', () => {
    if (midiaIdParaExcluir) {
      excluirMidia(midiaIdParaExcluir);
      midiaIdParaExcluir = null;
      fecharTodosModais();
    }
  });

  saveChangesBtn.addEventListener('click', () => {
    const id = parseInt(bookDetailsModal.dataset.currentBookId);
    const midia = midias.find(l => l.id === id);
    if(midia) {
      const progressoAntesDeSalvar = midia.paginaAtual;

      midia.titulo = document.getElementById('details-titulo').value.trim();
      midia.autor = document.getElementById('details-autor').value.trim();
      const tipoMidia = document.getElementById('details-tipo-midia').value;
      midia.tipoMidia = tipoMidia;

      // Salvar dados específicos por tipo de mídia
      if (tipoMidia === 'filme') {
        const duracaoMinutos = parseInt(document.getElementById('details-duracao-minutos').value) || 0;
        const minutosAssistidos = parseInt(document.getElementById('details-minutos-assistidos').value) || 0;
        
        if (minutosAssistidos > duracaoMinutos) {
          alert('Minutos assistidos não pode ser maior que a duração total.');
          return;
        }

        midia.duracaoMinutos = duracaoMinutos;
        midia.minutosAssistidos = minutosAssistidos;
        // Manter compatibilidade com sistema existente
        midia.totalPaginas = duracaoMinutos;
        midia.paginaAtual = minutosAssistidos;
        midia.lido = minutosAssistidos >= duracaoMinutos;
        
      } else if (tipoMidia === 'serie' || tipoMidia === 'anime') {
        const totalTemporadas = parseInt(document.getElementById('details-total-temporadas').value) || 1;
        const totalEpisodios = parseInt(document.getElementById('details-total-episodios').value) || 1;
        const temporadaAtual = parseInt(document.getElementById('details-temporada-atual').value) || 1;
        const episodioAtual = parseInt(document.getElementById('details-episodio-atual').value) || 0;

        if (episodioAtual > totalEpisodios) {
          alert('Episódio atual não pode ser maior que o total de episódios.');
          return;
        }

        midia.totalTemporadas = totalTemporadas;
        midia.totalEpisodios = totalEpisodios;
        midia.temporadaAtual = temporadaAtual;
        midia.episodioAtual = episodioAtual;
        // Manter compatibilidade com sistema existente
        midia.totalPaginas = totalEpisodios;
        midia.paginaAtual = episodioAtual;
        midia.lido = episodioAtual >= totalEpisodios;
      }

      const generosInput = document.getElementById('details-generos').value.trim();
      midia.generos = generosInput ? generosInput.split(',').map(g => g.trim()) : [];
      midia.sumario = document.getElementById('details-sumario').value.trim();
      midia.resenha = document.getElementById('details-resenha').value.trim();
      midia.dataInicio = document.getElementById('details-data-inicio').value;
      midia.dataConclusao = document.getElementById('details-data-conclusao').value;
      midia.nota = parseInt(detailsNotaStars.dataset.rating) || 0;
      
      midia.saga = {
          nome: document.getElementById('details-saga-nome').value.trim(),
          volume: document.getElementById('details-saga-volume').value.trim()
      };

      atualizarHistoricoDeProgresso(midia, progressoAntesDeSalvar);
      salvarMidias();
      fecharTodosModais();
    }
  });

  toggleFavoriteBtn.addEventListener('click', function() {
    const id = parseInt(bookDetailsModal.dataset.currentBookId);
    const midia = midias.find(l => l.id === id);
    if (midia) {
      midia.isFavorite = !midia.isFavorite;
      this.classList.toggle('active', midia.isFavorite);
      salvarMidias();
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

  // Event listener para mudança de tipo de mídia no modal de detalhes
  document.getElementById('details-tipo-midia').addEventListener('change', (e) => {
    gerenciarCamposCondicionaisDetalhes(e.target.value);
  });
  
  // NOVO: Event listener para a barra de pesquisa
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      // Reset páginas quando pesquisar
      Object.keys(currentPages).forEach(key => {
        currentPages[key] = 1;
      });
      renderizarMidias();
    });
  }

  // Event listener para o seletor de tipo de mídia
  const tipoMidiaSelect = document.getElementById('tipo-midia');
  if (tipoMidiaSelect) {
    tipoMidiaSelect.addEventListener('change', (e) => {
      gerenciarCamposCondicionais(e.target.value);
    });
  }

  // Inicialização
  updateMidiaCounts();
  renderizarMidias();
  renderizarGenreStats(); // NOVO: Renderiza as estatísticas de gênero
  resetarCamposCondicionais(); // Inicializar campos condicionais ocultos
  
  setTimeout(() => {
    if (window.mediaStats) {
      window.mediaStats.refresh();
    }
  }, 100);
});



// Abre modal de detalhes e popula campos condicionais
function openBookDetails(id) {
  const midia = midias.find(m => m.id == id);
  if (!midia) return;
  const modal = document.getElementById('book-details-modal');
  modal.classList.add('show');
  document.getElementById('details-capa').src = midia.capaUrl || 'img/default_cover.png';
  document.getElementById('details-titulo').value = midia.titulo || '';
  document.getElementById('details-autor').value = midia.autor || '';
  const tipoSelect = document.getElementById('details-tipo-midia');
  if (tipoSelect) tipoSelect.value = midia.tipoMidia || '';
  renderDetailsProgressFields(midia);
  // attach current editing id
  modal.dataset.editingId = id;
}

// Render campos condicionais no modal de detalhes
function renderDetailsProgressFields(midia) {
  const container = document.getElementById('details-progress-container');
  if (!container) return;
  container.innerHTML = '';
  const tipo = midia.tipoMidia || 'filme';
  if (tipo === 'filme') {
    container.innerHTML = `
      <div class="details-field"><label>Duração (min)</label><input id="details-duracao-minutos" type="number" value="${midia.duracaoMinutos || midia.totalPaginas || 0}" min="1"/></div>
      <div class="details-field"><label>Minutos assistidos</label><input id="details-minutos-assistidos" type="number" value="${midia.minutosAssistidos || midia.paginaAtual || 0}" min="0"/></div>
    `;
  } else if (tipo === 'serie' || tipo === 'anime') {
    container.innerHTML = `
      <div class="details-field"><label>Temporada atual</label><input id="details-temporada-atual" type="number" value="${midia.temporadaAtual || 1}" min="1"/></div>
      <div class="details-field"><label>Total de temporadas</label><input id="details-total-temporadas" type="number" value="${midia.totalTemporadas || 1}" min="1"/></div>
      <div class="details-field"><label>Episódio atual</label><input id="details-episodio-atual" type="number" value="${midia.episodioAtual || 0}" min="0"/></div>
      <div class="details-field"><label>Total de episódios</label><input id="details-total-episodios" type="number" value="${midia.totalEpisodios || 0}" min="1"/></div>
      <div class="details-field"><label>Duração por episódio (min)</label><input id="details-duracao-episodio" type="number" value="${midia.duracaoEpisodio || 0}" min="1"/></div>
    `;
  } else { // Default case
    container.innerHTML = `
      <div class="details-field"><label>Temporada atual</label><input id="details-temporada-atual" type="number" value="${midia.temporadaAtual || 1}" min="1"/></div>
      <div class="details-field"><label>Episódio atual</label><input id="details-episodio-atual" type="number" value="${midia.episodioAtual || 0}" min="0"/></div>
      <div class="details-field"><label>Total de episódios</label><input id="details-total-episodios" type="number" value="${midia.totalEpisodios || midia.totalPaginas || 1}" min="1"/></div>
      <div class="details-field"><label>Total de temporadas</label><input id="details-total-temporadas" type="number" value="${midia.totalTemporadas || 1}" min="1"/></div>
    `;
  }
}

// Save changes from details modal with validation
document.addEventListener('click', function(e){
  if (e.target && e.target.id === 'save-changes-btn') {
    const modal = document.getElementById('book-details-modal');
    const id = modal && modal.dataset.editingId;
    if (!id) return;
    const midia = midias.find(m => m.id == id);
    if (!midia) return;
    // basic fields
    midia.titulo = document.getElementById('details-titulo').value.trim();
    midia.autor = document.getElementById('details-autor').value.trim();
    const tipo = document.getElementById('details-tipo-midia').value;
    midia.tipoMidia = tipo;
    // type-specific fields with validation
    if (tipo === 'filme') {
      const dur = parseInt(document.getElementById('details-duracao-minutos').value) || 0;
      const assist = parseInt(document.getElementById('details-minutos-assistidos').value) || 0;
      if (assist > dur) { alert('Minutos assistidos não pode ser maior que duração total.'); return; }
      midia.duracaoMinutos = dur;
      midia.minutosAssistidos = assist;
      // keep backward-compatible fields
      midia.totalPaginas = dur;
      midia.paginaAtual = assist;
    } else {
      const tempAtual = parseInt(document.getElementById('details-temporada-atual').value) || 1;
      const epiAtual = parseInt(document.getElementById('details-episodio-atual').value) || 0;
      const totalEpis = parseInt(document.getElementById('details-total-episodios').value) || 1;
      const totalTemps = parseInt(document.getElementById('details-total-temporadas').value) || 1;
      if (epiAtual > totalEpis) { alert('Episódio atual não pode ser maior que total de episódios.'); return; }
      midia.temporadaAtual = tempAtual;
      midia.episodioAtual = epiAtual;
      midia.totalEpisodios = totalEpis;
      midia.totalTemporadas = totalTemps;
      // compatibility mapping
      midia.totalPaginas = totalEpis;
      midia.paginaAtual = epiAtual;
    }
    salvarMidias();
    alert('Alterações salvas com sucesso.');
    modal.classList.remove('show');
  }
});