(function () {
  'use strict';

  const safeJSON = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch {
      return fallback;
    }
  };

  const normalize = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const buildIndex = () => {
    const entries = [];
    const push = (title, meta, href, tags) => entries.push({ title, meta, href, tags: normalize(tags || `${title} ${meta}`) });

    const staticPages = [
      ['Início', 'Dashboard principal', 'index.html'],
      ['Wishlist', 'Compras e listas', 'wishlist.html'],
      ['Planejamento', 'Tarefas e calendário', 'planejamento.html'],
      ['Sonhos', 'Objetivos e metas', 'sonhos.html'],
      ['Viagens', 'Planejamento de viagens', 'viagens.html'],
      ['Academia', 'Treino e dieta', 'academia.html'],
      ['Finanças', 'Controle financeiro', 'financas.html'],
      ['Diário', 'Entradas e reflexões', 'diario.html'],
      ['Livraria', 'Leituras', 'livraria.html'],
      ['Cinema', 'Filmes e séries', 'cinema.html'],
      ['Mangás', 'Leituras de mangá', 'mangas.html'],
      ['Estudos', 'Planner de estudos', 'estudos.html']
    ];

    staticPages.forEach(([title, meta, href]) => push(title, meta, href));

    safeJSON('wishlistItems', []).forEach((item) => push(item.name || 'Item wishlist', `Wishlist · R$ ${Number(item.price || 0).toFixed(2)}`, 'wishlist.html', `${item.name} wishlist compra`));
    safeJSON('sol-de-soter-tasks', []).forEach((item) => push(item.title || 'Tarefa', `Planejamento · ${item.category || 'geral'}`, 'planejamento.html', `${item.title} ${item.description || ''}`));
    safeJSON('sonhos-objetivos', []).forEach((item) => push(item.titulo || 'Sonho', 'Sonhos', 'sonhos.html', `${item.titulo} ${item.descricao || ''}`));
    safeJSON('metas-objetivos', []).forEach((item) => push(item.titulo || item.nome || 'Meta', 'Sonhos · Meta', 'sonhos.html', `${item.titulo || item.nome}`));
    safeJSON('livrosTracker', []).forEach((item) => push(item.titulo || 'Livro', `Livraria · ${item.autor || 'autor'}`, 'livraria.html', `${item.titulo} ${item.autor || ''}`));
    safeJSON('midiasTracker', []).forEach((item) => push(item.titulo || 'Mídia', 'Cinema', 'cinema.html', `${item.titulo} ${item.genero || ''}`));
    safeJSON('mangasTracker', []).forEach((item) => push(item.titulo || 'Mangá', `Mangás · ${item.autor || 'autor'}`, 'mangas.html', `${item.titulo} ${item.autor || ''}`));
    safeJSON('travels', { travels: [] }).travels?.forEach((item) => push(item.name || 'Viagem', `Viagens · ${item.location || 'local'}`, 'viagens.html', `${item.name} ${item.location || ''}`));

    return entries;
  };

  const ensureOverlay = () => {
    let overlay = document.getElementById('global-search-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'global-search-overlay';
    overlay.className = 'app-overlay';
    overlay.innerHTML = `
      <div class="app-dialog" role="dialog" aria-modal="true" aria-labelledby="global-search-title">
        <h3 id="global-search-title">Busca Global</h3>
        <div class="app-row"><input id="global-search-input" class="app-search-input" type="search" placeholder="Buscar em todo o site..." aria-label="Buscar em todo o site" /></div>
        <div id="global-search-results" class="app-search-results"></div>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  };

  const renderResults = (query) => {
    const root = document.getElementById('global-search-results');
    if (!root) return;
    const index = buildIndex();
    const q = normalize(query || '');
    const results = q ? index.filter((it) => it.tags.includes(q)).slice(0, 20) : index.slice(0, 12);

    if (!results.length) {
      root.innerHTML = '<p class="app-search-meta">Nenhum resultado encontrado.</p>';
      return;
    }

    root.innerHTML = results.map((item) => `
      <a class="app-search-item" href="${item.href}">
        <div class="app-search-title">${item.title}</div>
        <div class="app-search-meta">${item.meta}</div>
      </a>
    `).join('');
  };

  const open = () => {
    const overlay = ensureOverlay();
    overlay.classList.add('open');
    renderResults('');
    const input = document.getElementById('global-search-input');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 0);
    }
  };

  const close = () => {
    const overlay = document.getElementById('global-search-overlay');
    if (overlay) overlay.classList.remove('open');
  };

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      open();
      return;
    }
    if (e.key === 'Escape') close();
  });

  document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'global-search-input') {
      renderResults(e.target.value);
    }
  });

  document.addEventListener('click', (e) => {
    const overlay = document.getElementById('global-search-overlay');
    if (!overlay) return;
    if (e.target === overlay) close();
  });
})();
