class MangaStats {
  constructor() {
    this.goalTarget = 24; // Meta anual padrão
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    const goalCard = document.getElementById('reading-goal-card');
    if (goalCard) {
      goalCard.addEventListener('click', () => {
        const booksRead = this.getBooksReadCount();
        if (booksRead >= this.goalTarget) return;
        this.openStatsModal();
      });
    }

    const statsModal = document.getElementById('reading-stats-modal');
    if (statsModal) {
      const closeBtn = statsModal.querySelector('.close-btn');
      if (closeBtn) closeBtn.addEventListener('click', () => this.closeStatsModal());
      statsModal.addEventListener('click', (e) => {
        if (e.target === statsModal) this.closeStatsModal();
      });
    }
  }

  // NOVO: Obtém o histórico de progresso do localStorage
  getReadingHistory() {
    return JSON.parse(localStorage.getItem('historicoProgressoMangas') || '{}');
  }

  // CORRIGIDO: Calcula os dias de leitura com base no histórico real
  getReadingDays() {
    const history = this.getReadingHistory();
    // Conta o número de dias únicos que têm registro de leitura
    return Object.keys(history).length;
  }

  // CORRIGIDO: Calcula o total de páginas lidas com base no histórico
  getTotalPagesRead() {
    const history = this.getReadingHistory();
    return Object.values(history).reduce((total, dailyData) => total + dailyData.pagesRead, 0);
  }

  // CORRIGIDO: Usa o histórico diretamente para o gráfico GitHub
  getPagesReadByDate() {
    const history = this.getReadingHistory();
    const pagesPerDay = {};
    for (const date in history) {
      pagesPerDay[date] = history[date].pagesRead;
    }
    return pagesPerDay;
  }

  // As funções abaixo permanecem, mas agora usam dados mais precisos
  updateGoalProgress() {
    const booksRead = this.getBooksReadCount();
    const percentage = Math.round((booksRead / this.goalTarget) * 100);

    const booksReadElement = document.getElementById('books-read-count');
    const goalTargetElement = document.getElementById('books-goal-target');
    const progressFill = document.getElementById('goal-progress-fill');
    const percentageText = document.getElementById('goal-percentage-text');
    const goalCard = document.getElementById('reading-goal-card');

    if (booksReadElement) booksReadElement.textContent = booksRead;
    if (goalTargetElement) goalTargetElement.textContent = this.goalTarget;
    if (progressFill) progressFill.style.width = `${Math.min(percentage, 100)}%`;
    if (percentageText) percentageText.textContent = `${percentage}`;

    if (goalCard) {
      if (booksRead >= this.goalTarget) {
        goalCard.style.cursor = 'default';
        goalCard.title = 'Meta de leitura completada!';
      } else {
        goalCard.style.cursor = 'pointer';
        goalCard.title = 'Clique para ver estatísticas detalhadas';
      }
    }
  }

  getBooksReadCount() {
    const mangasLidos = JSON.parse(localStorage.getItem('mangasLidos') || '[]');
    return mangasLidos.length;
  }

  getMonthlyAverage() {
    const booksRead = this.getBooksReadCount();
    const currentMonth = new Date().getMonth() + 1;
    return booksRead > 0 ? (booksRead / currentMonth).toFixed(1) : 0;
  }

  getGenreStats() {
    const mangasLidos = JSON.parse(localStorage.getItem('mangasLidos') || '[]');
    const genreCount = {};
    mangasLidos.forEach(manga => {
      if (manga.generos) {
        const genres = Array.isArray(manga.generos) ? manga.generos : manga.generos.split(',').map(g => g.trim());
        genres.forEach(genre => {
          if (genre) genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      }
    });
    return Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }

  getAuthorStats() {
    const mangasLidos = JSON.parse(localStorage.getItem('mangasLidos') || '[]');
    const authorCount = {};
    mangasLidos.forEach(manga => {
      if (manga.autor) authorCount[manga.autor] = (authorCount[manga.autor] || 0) + 1;
    });
    return Object.entries(authorCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }

  generateGitHubChart() {
    const chartContainer = document.getElementById('github-chart');
    if (!chartContainer) return;
    chartContainer.innerHTML = '';
    
    const pagesPerDay = this.getPagesReadByDate();
    const maxPages = Math.max(...Object.values(pagesPerDay), 1);
    const today = new Date();
    const startDate = new Date(today.getFullYear(), 0, 1);

    for (let i = 0; i < 365; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      const pagesOnDate = pagesPerDay[dateString] || 0;
      
      const dayElement = document.createElement('div');
      dayElement.className = 'github-day';
      
      if (pagesOnDate > 0) {
        const intensity = Math.ceil((pagesOnDate / maxPages) * 4);
        dayElement.classList.add(`level-${Math.min(intensity, 4)}`);
      }
      
      const dateFormatted = currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
      dayElement.title = `${dateFormatted}: ${pagesOnDate} páginas lidas`;
      
      chartContainer.appendChild(dayElement);
    }
  }

  showTooltip(event, date, pages) {
    // Remover tooltip existente
    this.hideTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'github-tooltip';
    tooltip.innerHTML = `
      <strong>${date}</strong><br>
      ${pages} páginas lidas
    `;
    
    document.body.appendChild(tooltip);
    
    // Posicionar tooltip
    const rect = event.target.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
  }

  hideTooltip() {
    const existingTooltip = document.querySelector('.github-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
  }

  renderGenresChart() {
    const chartContainer = document.getElementById('genres-chart');
    if (!chartContainer) return;

    const genreStats = this.getGenreStats();
    const maxCount = genreStats.length > 0 ? genreStats[0][1] : 1;

    chartContainer.innerHTML = '';

    genreStats.forEach(([genre, count]) => {
      const percentage = (count / maxCount) * 100;
      
      const itemElement = document.createElement('div');
      itemElement.className = 'chart-item';
      
      itemElement.innerHTML = `
        <div class="chart-label">${genre}</div>
        <div class="chart-bar">
          <div class="chart-bar-fill" style="width: ${percentage}%"></div>
        </div>
        <div class="chart-value">${count}</div>
      `;
      
      chartContainer.appendChild(itemElement);
    });

    if (genreStats.length === 0) {
      chartContainer.innerHTML = '<p style="color: rgba(255,255,255,0.7); text-align: center;">Nenhum gênero registrado ainda</p>';
    }
  }

  renderAuthorsChart() {
    const chartContainer = document.getElementById('authors-chart');
    if (!chartContainer) return;

    const authorStats = this.getAuthorStats();
    const maxCount = authorStats.length > 0 ? authorStats[0][1] : 1;

    chartContainer.innerHTML = '';

    authorStats.forEach(([author, count]) => {
      const percentage = (count / maxCount) * 100;
      
      const itemElement = document.createElement('div');
      itemElement.className = 'chart-item';
      
      itemElement.innerHTML = `
        <div class="chart-label">${author}</div>
        <div class="chart-bar">
          <div class="chart-bar-fill" style="width: ${percentage}%"></div>
        </div>
        <div class="chart-value">${count}</div>
      `;
      
      chartContainer.appendChild(itemElement);
    });

    if (authorStats.length === 0) {
      chartContainer.innerHTML = '<p style="color: rgba(255,255,255,0.7); text-align: center;">Nenhum autor registrado ainda</p>';
    }
  }

  openStatsModal() {
    const modal = document.getElementById('reading-stats-modal');
    if (!modal) return;

    // Atualizar estatísticas no modal
    this.updateModalStats();
    
    // Gerar gráficos
    this.generateGitHubChart();
    this.renderGenresChart();
    this.renderAuthorsChart();

    modal.classList.add('show');
    modal.style.display = 'flex';
  }

  closeStatsModal() {
    const modal = document.getElementById('reading-stats-modal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
    // Limpar tooltips
    this.hideTooltip();
  }

  updateModalStats() {
    const booksRead = this.getBooksReadCount();
    const totalPages = this.getTotalPagesRead();
    const readingDays = this.getReadingDays();
    const monthlyAverage = this.getMonthlyAverage();
    const percentage = Math.round((booksRead / this.goalTarget) * 100);

    // Atualizar elementos do modal
    const elements = {
      'stats-books-read': booksRead,
      'stats-books-goal': this.goalTarget,
      'stats-pages-read': totalPages.toLocaleString(),
      'stats-reading-days': readingDays,
      'stats-monthly-average': monthlyAverage
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });

    // Atualizar barra de progresso do modal
    const progressFill = document.getElementById('stats-progress-fill');
    if (progressFill) {
      progressFill.style.width = `${Math.min(percentage, 100)}%`;
    }
  }

  // Método para ser chamado quando um livro é adicionado/removido
  refresh() {
    this.updateGoalProgress();
    // Também atualizar o modal se estiver aberto
    const statsModal = document.getElementById('reading-stats-modal');
    if (statsModal && statsModal.classList.contains('show')) {
      this.updateModalStats();
      this.generateGitHubChart();
      this.renderGenresChart();
      this.renderAuthorsChart();
    }
  }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  window.mangaStats = new MangaStats();
  window.mangaStats.refresh(); // Chamar refresh para garantir que tudo seja atualizado na carga inicial
});
