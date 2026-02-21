function readArray(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch (_) {
    return [];
  }
}

let favoritesIndex = 0;
let favoritesDragStartX = 0;
let favoritesDragging = false;
let favoritesCount = 0;

function readHistorySum(key, field) {
  try {
    const history = JSON.parse(localStorage.getItem(key) || "{}");
    if (!history || typeof history !== "object") return 0;
    return Object.values(history).reduce((sum, item) => {
      const value = Number(item && item[field]);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
  } catch (_) {
    return 0;
  }
}

function readHistoryObject(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "{}");
    return data && typeof data === "object" ? data : {};
  } catch (_) {
    return {};
  }
}

function getLatestDate(key) {
  try {
    const history = JSON.parse(localStorage.getItem(key) || "{}");
    const dates = Object.keys(history || {});
    if (!dates.length) return null;
    dates.sort();
    return dates[dates.length - 1];
  } catch (_) {
    return null;
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(text);
}

function setWidth(id, value) {
  const el = document.getElementById(id);
  if (el) el.style.width = `${Math.max(0, Math.min(100, value))}%`;
}

function buildSummary(items) {
  const total = items.length;
  const done = items.filter((item) => Boolean(item && item.lido)).length;
  const inProgress = items.filter((item) => item && !item.lido).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, inProgress, progress };
}

function formatDatePt(value) {
  if (!value) return "-";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR");
}

function getRecentHistoryEntries(key, field, sourceLabel) {
  const history = readHistoryObject(key);
  return Object.entries(history)
    .map(([date, payload]) => ({
      date,
      source: sourceLabel,
      value: Number(payload && payload[field]) || 0,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function getFavoriteItems() {
  const livros = readArray("livrosTracker")
    .filter((item) => item && item.isFavorite)
    .map((item) => ({
      source: "Livraria",
      title: item.titulo || "Livro sem titulo",
      subtitle: item.autor || "Autor nao informado",
      image: item.capaUrl || "img/default_cover.png",
    }));

  const cinema = readArray("midiasTracker")
    .filter((item) => item && item.isFavorite)
    .map((item) => ({
      source: item.tipoMidia ? `Cinema - ${String(item.tipoMidia).toUpperCase()}` : "Cinema",
      title: item.titulo || "Midia sem titulo",
      subtitle: item.autor || "Criador nao informado",
      image: item.capaUrl || "img/default_cover.png",
    }));

  const mangas = readArray("mangasTracker")
    .filter((item) => item && item.isFavorite)
    .map((item) => ({
      source: "Mangas",
      title: item.titulo || "Manga sem titulo",
      subtitle: item.autor || "Autor nao informado",
      image: item.capaUrl || "img/default_cover.png",
    }));

  return [...livros, ...cinema, ...mangas];
}

function renderFavoriteSlide(index) {
  const slides = Array.from(document.querySelectorAll(".fav-slide"));
  if (!slides.length) return;
  const total = slides.length;

  const getOffset = (i) => {
    let delta = i - index;
    if (delta > total / 2) delta -= total;
    if (delta < -total / 2) delta += total;
    return delta;
  };

  slides.forEach((slide, i) => {
    const offset = getOffset(i);
    const abs = Math.abs(offset);
    const visible = abs <= 3;
    const x = offset * 180;
    const scale = Math.max(0.64, 1 - abs * 0.12);
    const rotate = offset * -8;
    const opacity = visible ? Math.max(0.18, 1 - abs * 0.28) : 0;

    slide.classList.toggle("active", i === index);
    slide.style.zIndex = String(100 - abs);
    slide.style.opacity = String(opacity);
    slide.style.pointerEvents = visible ? "auto" : "none";
    slide.style.transform = `translateX(calc(-50% + ${x}px)) scale(${scale}) rotateY(${rotate}deg)`;
  });
}

function mountFavoritesCarousel(items) {
  const track = document.getElementById("fav-carousel-track");
  if (!track) return;

  if (!items.length) {
    favoritesCount = 0;
    track.innerHTML = '<article class="fav-slide empty active"><p>Nenhum favorito encontrado.</p></article>';
    return;
  }

  favoritesCount = items.length;
  favoritesIndex = Math.max(0, Math.min(favoritesIndex, items.length - 1));
  track.innerHTML = items
    .map(
      (item) => `
        <article class="fav-slide" style="background-image:url('${item.image}')">
          <div class="fav-slide-info">
            <span class="fav-slide-kicker">${item.source}</span>
            <h3 class="fav-slide-title">${item.title}</h3>
            <p class="fav-slide-sub">${item.subtitle}</p>
          </div>
        </article>
      `
    )
    .join("");

  renderFavoriteSlide(favoritesIndex);

  if (track.dataset.dragBound !== "1") {
    track.dataset.dragBound = "1";

    track.addEventListener("mousedown", (event) => {
      favoritesDragging = true;
      favoritesDragStartX = event.clientX;
      track.classList.add("dragging");
    });

    window.addEventListener("mouseup", (event) => {
      if (!favoritesDragging) return;
      const delta = event.clientX - favoritesDragStartX;
      favoritesDragging = false;
      track.classList.remove("dragging");

      if (Math.abs(delta) < 40) return;
      if (favoritesCount <= 0) return;
      if (delta < 0) {
        favoritesIndex = (favoritesIndex + 1) % favoritesCount;
      } else {
        favoritesIndex = (favoritesIndex - 1 + favoritesCount) % favoritesCount;
      }
      renderFavoriteSlide(favoritesIndex);
    });
  }
}

function renderLivraria() {
  const items = readArray("livrosTracker");
  const summary = buildSummary(items);
  const pages = readHistorySum("historicoProgresso", "pagesRead");
  const lastDate = getLatestDate("historicoProgresso");

  setText("livraria-total", summary.total);
  setText("livraria-lidos", summary.done);
  setText("livraria-andamento", summary.inProgress);
  setText("livraria-progress-label", `${summary.progress}%`);
  setWidth("livraria-progress-fill", summary.progress);
  setText(
    "livraria-extra",
    summary.total
      ? `Paginas lidas: ${pages.toLocaleString("pt-BR")} | Ultimo registro: ${formatDatePt(lastDate)}`
      : "Sem dados ainda."
  );
  return summary;
}

function renderCinema() {
  const items = readArray("midiasTracker");
  const summary = buildSummary(items);
  const progress = readHistorySum("historicoProgressoMidia", "progress");
  const lastDate = getLatestDate("historicoProgressoMidia");

  setText("cinema-total", summary.total);
  setText("cinema-lidos", summary.done);
  setText("cinema-andamento", summary.inProgress);
  setText("cinema-progress-label", `${summary.progress}%`);
  setWidth("cinema-progress-fill", summary.progress);
  setText(
    "cinema-extra",
    summary.total
      ? `Progresso acumulado: ${progress.toLocaleString("pt-BR")} | Ultimo registro: ${formatDatePt(lastDate)}`
      : "Sem dados ainda."
  );
  return summary;
}

function renderMangas() {
  const items = readArray("mangasTracker");
  const summary = buildSummary(items);
  const pages = readHistorySum("historicoProgressoMangas", "pagesRead");
  const lastDate = getLatestDate("historicoProgressoMangas");

  setText("mangas-total", summary.total);
  setText("mangas-lidos", summary.done);
  setText("mangas-andamento", summary.inProgress);
  setText("mangas-progress-label", `${summary.progress}%`);
  setWidth("mangas-progress-fill", summary.progress);
  setText(
    "mangas-extra",
    summary.total
      ? `Paginas lidas: ${pages.toLocaleString("pt-BR")} | Ultimo registro: ${formatDatePt(lastDate)}`
      : "Sem dados ainda."
  );
  return summary;
}

function renderDashboardOverview(livraria, cinema, mangas) {
  const totalItems = livraria.total + cinema.total + mangas.total;
  const totalDone = livraria.done + cinema.done + mangas.done;
  const totalOpen = livraria.inProgress + cinema.inProgress + mangas.inProgress;
  const totalRate = totalItems ? Math.round((totalDone / totalItems) * 100) : 0;

  setText("db-total-items", totalItems);
  setText("db-total-done", totalDone);
  setText("db-total-open", totalOpen);
  setText("db-total-rate", `${totalRate}%`);

  setText("db-rate-livraria", `${livraria.progress}%`);
  setText("db-rate-cinema", `${cinema.progress}%`);
  setText("db-rate-mangas", `${mangas.progress}%`);
  setWidth("db-bar-livraria", livraria.progress);
  setWidth("db-bar-cinema", cinema.progress);
  setWidth("db-bar-mangas", mangas.progress);
}

function renderRecentActivity() {
  const list = document.getElementById("db-activity-list");
  if (!list) return;

  const entries = [
    ...getRecentHistoryEntries("historicoProgresso", "pagesRead", "Livraria"),
    ...getRecentHistoryEntries("historicoProgressoMidia", "progress", "Cinema"),
    ...getRecentHistoryEntries("historicoProgressoMangas", "pagesRead", "Mangas"),
  ]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 8);

  if (!entries.length) {
    list.innerHTML = "<li>Nenhum registro recente.</li>";
    return;
  }

  list.innerHTML = entries
    .map(
      (entry) =>
        `<li><strong>${entry.source}</strong> - ${entry.value.toLocaleString("pt-BR")} em ${formatDatePt(entry.date)}</li>`
    )
    .join("");
}

function renderBibliotecaResumo() {
  mountFavoritesCarousel(getFavoriteItems());
  const livraria = renderLivraria();
  const cinema = renderCinema();
  const mangas = renderMangas();
  renderDashboardOverview(livraria, cinema, mangas);
  renderRecentActivity();
}

document.addEventListener("DOMContentLoaded", renderBibliotecaResumo);
window.addEventListener("storage", renderBibliotecaResumo);
