class MediaStats {
  constructor() {
    this.goalTarget = 50; // Meta anual padrão para mídias
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    const goalCard = document.getElementById("media-goal-card");
    if (goalCard) {
      goalCard.addEventListener("click", () => {
        const mediaWatched = this.getMediaWatchedCount();
        if (mediaWatched >= this.goalTarget) return;
        this.openStatsModal();
      });
    }

    const statsModal = document.getElementById("media-stats-modal");
    if (statsModal) {
      const closeBtn = statsModal.querySelector(".close-btn");
      if (closeBtn) closeBtn.addEventListener("click", () => this.closeStatsModal());
      statsModal.addEventListener("click", (e) => {
        if (e.target === statsModal) this.closeStatsModal();
      });
    }
  }

  getWatchingHistory() {
    return JSON.parse(localStorage.getItem("historicoProgressoMidia") || "{}");
  }

  getWatchingDays() {
    const history = this.getWatchingHistory();
    return Object.keys(history).length;
  }

  getTotalProgress() {
    const history = this.getWatchingHistory();
    return Object.values(history).reduce((total, dailyData) => total + dailyData.progress, 0);
  }

  getProgressByDate() {
    const history = this.getWatchingHistory();
    const progressPerDay = {};
    for (const date in history) {
      progressPerDay[date] = history[date].progress;
    }
    return progressPerDay;
  }

  updateGoalProgress() {
    const mediaWatched = this.getMediaWatchedCount();
    const percentage = Math.round((mediaWatched / this.goalTarget) * 100);

    const mediaWatchedElement = document.getElementById("media-watched-count");
    const goalTargetElement = document.getElementById("media-goal-target");
    const progressFill = document.getElementById("media-goal-progress-fill");
    const percentageText = document.getElementById("media-goal-percentage-text");
    const goalCard = document.getElementById("media-goal-card");

    if (mediaWatchedElement) mediaWatchedElement.textContent = mediaWatched;
    if (goalTargetElement) goalTargetElement.textContent = this.goalTarget;
    if (progressFill) progressFill.style.width = `${Math.min(percentage, 100)}%`;
    if (percentageText) percentageText.textContent = `${percentage}`;

    if (goalCard) {
      if (mediaWatched >= this.goalTarget) {
        goalCard.style.cursor = "default";
        goalCard.title = "Meta de mídias assistidas completada!";
      } else {
        goalCard.style.cursor = "pointer";
        goalCard.title = "Clique para ver estatísticas detalhadas";
      }
    }
  }

  getMediaWatchedCount() {
    const midiasAssistidas = (JSON.parse(localStorage.getItem("midiasTracker")||"[]")).filter(m=>m.lido);
    return midiasAssistidas.length;
  }

  getMonthlyAverage() {
    const mediaWatched = this.getMediaWatchedCount();
    const currentMonth = new Date().getMonth() + 1;
    return mediaWatched > 0 ? (mediaWatched / currentMonth).toFixed(1) : 0;
  }

  getGenreStats() {
    const midiasAssistidas = (JSON.parse(localStorage.getItem("midiasTracker")||"[]")).filter(m=>m.lido);
    const genreCount = {};
    midiasAssistidas.forEach(midia => {
      if (midia.generos) {
        const genres = Array.isArray(midia.generos) ? midia.generos : midia.generos.split(",").map(g => g.trim());
        genres.forEach(genre => {
          if (genre) genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      }
    });
    return Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }

  getAuthorStats() {
    const midiasAssistidas = (JSON.parse(localStorage.getItem("midiasTracker")||"[]")).filter(m=>m.lido);
    const authorCount = {};
    midiasAssistidas.forEach(midia => {
      if (midia.autor) authorCount[midia.autor] = (authorCount[midia.autor] || 0) + 1;
    });
    return Object.entries(authorCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }

  generateGitHubChart() {
    const chartContainer = document.getElementById("github-chart");
    if (!chartContainer) return;
    chartContainer.innerHTML = "";
    
    const progressPerDay = this.getProgressByDate();
    const maxProgress = Math.max(...Object.values(progressPerDay), 1);
    const today = new Date();
    const startDate = new Date(today.getFullYear(), 0, 1);

    for (let i = 0; i < 365; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = currentDate.toISOString().split("T")[0];
      const progressOnDate = progressPerDay[dateString] || 0;
      
      const dayElement = document.createElement("div");
      dayElement.className = "github-day";
      
      if (progressOnDate > 0) {
        const intensity = Math.ceil((progressOnDate / maxProgress) * 4);
        dayElement.classList.add(`level-${Math.min(intensity, 4)}`);
      }
      
      const dateFormatted = currentDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
      dayElement.title = `${dateFormatted}: ${progressOnDate} de progresso`;
      
      chartContainer.appendChild(dayElement);
    }
  }

  renderGenresChart() {
    const chartContainer = document.getElementById("genres-chart");
    if (!chartContainer) return;

    const genreStats = this.getGenreStats();
    const maxCount = genreStats.length > 0 ? genreStats[0][1] : 1;

    chartContainer.innerHTML = "";

    genreStats.forEach(([genre, count]) => {
      const percentage = (count / maxCount) * 100;
      
      const itemElement = document.createElement("div");
      itemElement.className = "chart-item";
      
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
    const chartContainer = document.getElementById("authors-chart");
    if (!chartContainer) return;

    const authorStats = this.getAuthorStats();
    const maxCount = authorStats.length > 0 ? authorStats[0][1] : 1;

    chartContainer.innerHTML = "";

    authorStats.forEach(([author, count]) => {
      const percentage = (count / maxCount) * 100;
      
      const itemElement = document.createElement("div");
      itemElement.className = "chart-item";
      
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
      chartContainer.innerHTML = '<p style="color: rgba(255,255,255,0.7); text-align: center;">Nenhum diretor/criador registrado ainda</p>';
    }
  }

  openStatsModal() {
    const modal = document.getElementById("media-stats-modal");
    if (!modal) return;

    this.updateModalStats();
    
    this.generateGitHubChart();
    this.renderGenresChart();
    this.renderAuthorsChart();

    modal.classList.add("show");
    modal.style.display = "flex";
  }

  closeStatsModal() {
    const modal = document.getElementById("media-stats-modal");
    if (modal) {
      modal.classList.remove("show");
      modal.style.display = "none";
    }
  }

  updateModalStats() {
    const mediaWatched = this.getMediaWatchedCount();
    const totalProgress = this.getTotalProgress();
    const watchingDays = this.getWatchingDays();
    const monthlyAverage = this.getMonthlyAverage();
    const percentage = Math.round((mediaWatched / this.goalTarget) * 100);

    const elements = {
      "stats-media-watched-count": mediaWatched,
      "stats-media-goal": this.goalTarget,
      "stats-total-progress": totalProgress.toLocaleString(),
      "stats-reading-days": watchingDays,
      "stats-monthly-average": monthlyAverage
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });

    const progressFill = document.getElementById("stats-progress-fill");
    if (progressFill) {
      progressFill.style.width = `${Math.min(percentage, 100)}%`;
    }
  }

  refresh() {
    this.updateGoalProgress();
    const statsModal = document.getElementById("media-stats-modal");
    if (statsModal && statsModal.classList.contains("show")) {
      this.updateModalStats();
      this.generateGitHubChart();
      this.renderGenresChart();
      this.renderAuthorsChart();
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.mediaStats = new MediaStats();
  window.mediaStats.refresh();
});

