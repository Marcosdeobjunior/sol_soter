document.addEventListener('DOMContentLoaded', () => {
  const navItems = Array.from(document.querySelectorAll('.ent-nav-item'));
  const mediaEl = document.getElementById('ent-stage-media');
  const pillEl = document.getElementById('ent-stage-pill');
  const titleEl = document.getElementById('ent-stage-title');
  const ratingEl = document.getElementById('ent-stage-rating');
  const favoriteEl = document.getElementById('ent-stage-favorite');
  const metaEl = document.getElementById('ent-stage-meta');
  const progressEl = document.getElementById('ent-stage-progress');
  const footEl = document.getElementById('ent-stage-foot');
  const detailsEl = document.getElementById('ent-stage-details');

  if (!navItems.length || !mediaEl || !pillEl || !titleEl || !ratingEl || !favoriteEl || !metaEl || !progressEl || !footEl || !detailsEl) return;

  const ls = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  };
  const pct = (a, b) => {
    const x = Number(a) || 0;
    const y = Number(b) || 0;
    if (!y) return 0;
    return Math.max(0, Math.min(100, Math.round((x / y) * 100)));
  };
  const esc = (v) => String(v || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const starsHtml = (value, cls) => {
    const n = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
    return Array.from({ length: 5 }, (_, i) => `<i class="fas fa-star ${cls}"></i>`).map((s, i) =>
      i < n ? s : `<i class="far fa-star ${cls}"></i>`
    ).join('');
  };
  const favoriteStar = (isFav) => `<i class="fas fa-star ${isFav ? 'ent-star-purple' : 'ent-star-black'}"></i>`;
  const ACTIVITY_THRESHOLD = 30;

  const books = Array.isArray(ls('livrosTracker', [])) ? ls('livrosTracker', []) : [];
  const mangas = Array.isArray(ls('mangasTracker', [])) ? ls('mangasTracker', []) : [];
  const media = Array.isArray(ls('midiasTracker', [])) ? ls('midiasTracker', []) : [];

  const dataset = {
    books: (() => {
      const current = books.filter((i) => !i.lido).sort((a, b) => (Number(b.paginaAtual) || 0) - (Number(a.paginaAtual) || 0))[0];
      const item = current || books[0] || null;
      if (!item) return null;
      return {
        label: 'Livros',
        title: item.titulo || 'Sem titulo',
        meta: item.autor || 'Autor nao informado',
        progress: pct(item.paginaAtual || 0, item.totalPaginas || 0),
        foot: '',
        image: item.capaUrl || item.image || 'img/default_cover.png',
        raw: item,
        itemId: item.id,
        historyStorageKey: 'historicoProgressoLivros',
        historyBucketKey: 'books',
        activityTitle: 'Atividade deste livro',
        activityUnit: 'paginas',
        favorite: Boolean(item.isFavorite),
        rating: Number(item.nota || item.rating || 0),
        details: () => {
          const total = Number(item.totalPaginas || 0);
          const current = Number(item.paginaAtual || 0);
          const faltam = Math.max(0, total - current);
          return {
            kpis: [
              { label: 'Paginas lidas', value: String(current) },
              { label: 'Paginas faltantes', value: String(faltam) },
            ],
            rows: [
              `Autor: ${item.autor || 'Nao informado'}`,
              `Genero: ${item.genero || (Array.isArray(item.generos) ? item.generos.join(', ') : 'Nao informado')}`,
            ],
          };
        },
      };
    })(),
    mangas: (() => {
      const current = mangas.filter((i) => !i.lido).sort((a, b) => {
        const ap = Number(a.capituloAtual || a.paginaAtual || 0);
        const bp = Number(b.capituloAtual || b.paginaAtual || 0);
        return bp - ap;
      })[0];
      const item = current || mangas[0] || null;
      if (!item) return null;
      const atual = Number(item.capituloAtual || item.paginaAtual || 0);
      const total = Number(item.totalCapitulos || item.totalPaginas || 0);
      return {
        label: 'Mangas',
        title: item.titulo || 'Sem titulo',
        meta: 'Leitura atual',
        progress: pct(atual, total),
        foot: '',
        image: item.capaUrl || item.image || 'img/default_cover.png',
        raw: item,
        itemId: item.id,
        historyStorageKey: 'historicoProgressoMangasItens',
        historyBucketKey: 'items',
        activityTitle: 'Atividade deste manga',
        activityUnit: 'paginas',
        favorite: Boolean(item.isFavorite),
        rating: Number(item.nota || item.rating || 0),
        details: () => ({
          kpis: [
            { label: 'Atual', value: String(atual) },
            { label: 'Faltam', value: String(Math.max(0, total - atual)) },
          ],
          rows: [
            `Autor: ${item.autor || 'Nao informado'}`,
            `Genero: ${item.genero || (Array.isArray(item.generos) ? item.generos.join(', ') : 'Nao informado')}`,
          ],
        }),
      };
    })(),
    movies: (() => {
      const arr = media.filter((i) => String(i.tipoMidia || '').toLowerCase() === 'filme');
      const pending = arr.find((i) => !i.lido);
      const item = pending || arr[0] || null;
      if (!item) return null;
      return {
        label: 'Filmes',
        title: item.titulo || 'Sem titulo',
        meta: item.lido ? 'Filme concluido' : 'Filme pendente',
        progress: item.lido ? 100 : 0,
        foot: '',
        image: item.capaUrl || item.image || 'img/default_cover.png',
        raw: item,
        itemId: item.id,
        historyStorageKey: 'historicoProgressoMidiaItens',
        historyBucketKey: 'items',
        activityTitle: 'Atividade deste filme',
        activityUnit: 'progresso',
        favorite: Boolean(item.isFavorite),
        rating: Number(item.nota || item.rating || 0),
        details: () => ({
          kpis: [
            { label: 'Status', value: item.lido ? 'Concluido' : 'Pendente' },
            { label: 'Ano', value: String(item.ano || '-') },
          ],
          rows: [
            `Diretor: ${item.diretor || 'Nao informado'}`,
            `Genero: ${item.genero || 'Nao informado'}`,
          ],
        }),
      };
    })(),
    series: (() => {
      const arr = media.filter((i) => ['serie', 'anime'].includes(String(i.tipoMidia || '').toLowerCase()));
      const current = arr.filter((i) => !i.lido)
        .sort((a, b) => pct(b.episodioAtual || 0, b.totalEpisodios || 0) - pct(a.episodioAtual || 0, a.totalEpisodios || 0))[0];
      const item = current || arr[0] || null;
      if (!item) return null;
      return {
        label: 'Series',
        title: item.titulo || 'Sem titulo',
        meta: `Temporada ${Number(item.temporadaAtual || 1)}`,
        progress: pct(item.episodioAtual || 0, item.totalEpisodios || 0),
        foot: '',
        image: item.capaUrl || item.image || 'img/default_cover.png',
        raw: item,
        itemId: item.id,
        historyStorageKey: 'historicoProgressoMidiaItens',
        historyBucketKey: 'items',
        activityTitle: 'Atividade desta serie',
        activityUnit: 'episodios',
        favorite: Boolean(item.isFavorite),
        rating: Number(item.nota || item.rating || 0),
        details: () => {
          const ep = Number(item.episodioAtual || 0);
          const totalEp = Number(item.totalEpisodios || 0);
          return {
            kpis: [
              { label: 'Episodios vistos', value: String(ep) },
              { label: 'Episodios faltantes', value: String(Math.max(0, totalEp - ep)) },
            ],
            rows: [
              `Genero: ${item.genero || 'Nao informado'}`,
              `Temporada atual: ${Number(item.temporadaAtual || 1)}`,
            ],
          };
        },
      };
    })(),
  };

  const formatKey = (k) => {
    const map = {
      titulo: 'Titulo',
      autor: 'Autor',
      genero: 'Genero',
      tipoMidia: 'Tipo',
      nota: 'Nota',
      paginaAtual: 'Pagina atual',
      totalPaginas: 'Total de paginas',
      capituloAtual: 'Capitulo atual',
      totalCapitulos: 'Total de capitulos',
      episodioAtual: 'Episodio atual',
      totalEpisodios: 'Total de episodios',
      temporadaAtual: 'Temporada atual',
      lido: 'Concluido',
      sinopse: 'Sinopse',
      descricao: 'Descricao',
      dataConclusao: 'Data de conclusao',
      dataInicio: 'Data de inicio',
      createdAt: 'Criado em',
      updatedAt: 'Atualizado em',
    };
    return map[k] || k;
  };

  const collectDetails = (raw) => {
    if (!raw || typeof raw !== 'object') return [];
    const ignored = new Set(['capaUrl', 'image', 'imagem']);
    return Object.entries(raw)
      .filter(([k, v]) => !ignored.has(k) && v !== null && v !== undefined && v !== '')
      .map(([k, v]) => {
        let value = v;
        if (Array.isArray(v)) value = v.join(', ');
        if (typeof v === 'object') value = JSON.stringify(v);
        if (typeof v === 'boolean') value = v ? 'Sim' : 'Nao';
        return `${formatKey(k)}: ${String(value)}`;
      });
  };

  const getItemHistoryByDate = (storageKey, bucketKey, itemId) => {
    const history = ls(storageKey, {});
    if (!history || typeof history !== 'object' || itemId === undefined || itemId === null) return {};
    const key = String(itemId);
    const byDate = {};

    Object.entries(history).forEach(([date, dayData]) => {
      if (!dayData || typeof dayData !== 'object') return;
      const bucket = dayData[bucketKey];
      if (!bucket || typeof bucket !== 'object') return;
      const value = Number(bucket[key]) || 0;
      if (value > 0) byDate[date] = value;
    });

    return byDate;
  };

  const renderActivityChart = (data) => {
    const container = detailsEl.querySelector('.ent-activity-wrap');
    if (!container) return;

    const titleNode = container.querySelector('.ent-activity-title');
    const chartNode = container.querySelector('.ent-activity-chart');
    const emptyNode = container.querySelector('.ent-activity-empty');
    if (!titleNode || !chartNode || !emptyNode) return;

    titleNode.textContent = data.activityTitle || 'Atividade do item';
    chartNode.innerHTML = '';
    emptyNode.textContent = '';

    const byDate = getItemHistoryByDate(data.historyStorageKey, data.historyBucketKey, data.itemId);
    const today = new Date();
    const startDate = new Date(today.getFullYear(), 0, 1);
    let hasActivity = false;

    for (let i = 0; i < 365; i += 1) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      const value = Number(byDate[dateString]) || 0;

      const day = document.createElement('div');
      day.className = 'ent-activity-day';
      if (value > 0) {
        hasActivity = true;
        day.classList.add(value > ACTIVITY_THRESHOLD ? 'level-high' : 'level-low');
      }
      const formattedDate = currentDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      day.title = `${formattedDate}: ${value} ${data.activityUnit || 'unidades'}`;
      chartNode.appendChild(day);
    }

    if (!hasActivity) {
      emptyNode.textContent = 'Sem historico deste item no ano atual.';
    }
  };

  const render = (key) => {
    const data = dataset[key];
    if (!data) {
      pillEl.textContent = 'Sem dados';
      titleEl.innerHTML = 'Nenhum item encontrado';
      metaEl.textContent = 'Adicione itens na categoria para visualizar aqui.';
      progressEl.style.width = '0%';
      footEl.textContent = '';
      mediaEl.style.backgroundImage = "url('img/default_cover.png')";
      favoriteEl.innerHTML = '';
      ratingEl.innerHTML = '';
      detailsEl.innerHTML = '';
      return;
    }
    pillEl.textContent = data.label;
    titleEl.innerHTML = esc(data.title);
    favoriteEl.innerHTML = favoriteStar(data.favorite);
    ratingEl.innerHTML = starsHtml(data.rating, 'ent-star-purple');
    metaEl.textContent = data.meta;
    progressEl.style.width = `${data.progress}%`;
    footEl.textContent = data.foot;
    mediaEl.style.backgroundImage = `url('${data.image}')`;
    const detail = typeof data.details === 'function' ? data.details() : { kpis: [], rows: collectDetails(data.raw) };
    const kpisHtml = (detail.kpis || []).map((k) => `<div class="ent-kpi-chip"><span>${esc(k.label)}</span><strong>${esc(k.value)}</strong></div>`).join('');
    const rowsHtml = (detail.rows || []).map((line) => `<li>${line}</li>`).join('');
    detailsEl.innerHTML = `${kpisHtml ? `<div class="ent-stage-kpis">${kpisHtml}</div>` : ''}${rowsHtml}
      <div class="ent-activity-wrap">
        <div class="ent-activity-title">Atividade do item</div>
        <div class="ent-activity-chart"></div>
        <div class="ent-activity-legend">
          <span class="ent-legend-item"><span class="ent-legend-dot level-low"></span>1 a 30</span>
          <span class="ent-legend-item"><span class="ent-legend-dot level-high"></span>Mais de 30</span>
        </div>
        <p class="ent-activity-empty"></p>
      </div>`;
    renderActivityChart(data);
  };

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      navItems.forEach((i) => i.classList.remove('active'));
      item.classList.add('active');
      render(item.dataset.entKey);
    });
  });

  const first = navItems.find((i) => i.classList.contains('active')) || navItems[0];
  if (first) render(first.dataset.entKey);
});
