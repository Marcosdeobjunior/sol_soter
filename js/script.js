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

// ===== DASHBOARD INDEX =====
document.addEventListener('DOMContentLoaded', () => {
  const dashboardEl = document.querySelector('.dashboard');
  if (!dashboardEl) return;

  const $ = (sel) => document.querySelector(sel);
  const ls = (key, defVal) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defVal;
    } catch (_) { return defVal; }
  };

  const feedbackEl = $('#dashboard-feedback');
  const setFeedback = (msg, type = 'info') => {
    if (!feedbackEl) return;
    feedbackEl.textContent = msg;
    feedbackEl.className = `dashboard-feedback ${type}`;
    if (msg) {
      setTimeout(() => { feedbackEl.textContent = ''; feedbackEl.className = 'dashboard-feedback'; }, 4000);
    }
  };

  const formatBRDate = (d) => {
    if (!d) return 'N/A';
    try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return 'N/A'; }
  };
  const pct = (num, den) => {
    if (!den || den <= 0) return 0;
    const v = Math.max(0, Math.min(100, Math.round((num / den) * 100)));
    return v;
  };

  const renderTopPlanner = () => {
    const list = $('#planner-list');
    if (!list) return;
    const tasks = ls('sol-de-soter-tasks', []);
    const todayStr = new Date().toISOString().slice(0,10);
    const todayTasks = (tasks||[]).filter(t => t.date === todayStr).sort((a,b)=> (a.time||'') < (b.time||'') ? -1 : 1);
    list.innerHTML = todayTasks.map(t => `
      <li class="planner-item">
        <span class="title">${t.title}</span>
        <span class="meta">${t.time||''} ${t.category? '• '+t.category: ''}</span>
      </li>
    `).join('');
  };

  let carouselIndex = 0;
  let favBooks = [];
  let carouselTimer = null;
  const renderFavoritesCarousel = () => {
    const track = $('#carousel-track');
    if (!track) return;
    favBooks = (ls('livrosTracker', []) || []).filter(l => l.isFavorite);
    if (!favBooks.length) {
      track.innerHTML = '<div style="padding:12px; color: var(--texto-secundario)">Nenhum favorito.</div>';
      return;
    }
    track.innerHTML = favBooks.map(b => `
      <div class="carousel-item">
        <div class="cover" style="background-image:url('${b.capaUrl || 'img/default_cover.png'}')"></div>
      </div>
    `).join('');
    const items = [...track.querySelectorAll('.carousel-item')];
    const updatePos = () => {
      const len = favBooks.length;
      items.forEach((el, i) => {
        const rel = ((i - carouselIndex) + len) % len;
        const d = rel <= len/2 ? rel : rel - len;
        const spacing = 220;
        const offset = d * spacing;
        const scale = d === 0 ? 1.4 : (Math.abs(d) === 1 ? 1.05 : Math.abs(d) === 2 ? 0.92 : 0.85);
        const rot = d * -10;
        const z = 100 - Math.abs(d);
        el.style.transform = `translate(calc(-50% + ${offset}px), -50%) scale(${scale}) rotateY(${rot}deg)`;
        el.style.zIndex = String(z);
        el.classList.toggle('active', d === 0);
        el.style.opacity = Math.abs(d) > 3 ? '0' : '1';
      });
    };
    let startX = null;
    track.addEventListener('pointerdown', (e) => { startX = e.clientX; });
    track.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      const len = favBooks.length;
      if (dx > 30) carouselIndex = (carouselIndex - 1 + len) % len; else if (dx < -30) carouselIndex = (carouselIndex + 1) % len;
      updatePos();
      startX = null;
    });
    updatePos();
    if (carouselTimer) clearInterval(carouselTimer);
    carouselTimer = setInterval(() => {
      const len = favBooks.length;
      carouselIndex = (carouselIndex + 1) % len;
      updatePos();
    }, 6000);
  };

  const getWeatherIcon = (code) => {
    if (code === 0) return 'fas fa-sun';
    if (code > 0 && code < 4) return 'fas fa-cloud-sun';
    if (code >= 51 && code <= 67) return 'fas fa-cloud-showers-heavy';
    if (code >= 71 && code <= 75) return 'fas fa-snowflake';
    if (code >= 95 && code <= 99) return 'fas fa-bolt';
    return 'fas fa-cloud';
  };
  const getWeatherDesc = (code) => {
    if (code === 0) return 'Céu limpo';
    if (code > 0 && code < 4) return 'Parcialmente nublado';
    if (code >= 51 && code <= 67) return 'Chuva';
    if (code >= 71 && code <= 75) return 'Neve';
    if (code >= 95 && code <= 99) return 'Tempestade';
    return 'Condições variadas';
  };
  const getCoordsPirapora = async () => {
    try {
      const cached = ls('coords-pirapora', null);
      if (cached) return cached;
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent('Pirapora do Bom Jesus, Brasil')}&limit=1`);
      const data = await resp.json();
      if (data && data.length) {
        const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        localStorage.setItem('coords-pirapora', JSON.stringify(coords));
        return coords;
      }
    } catch (_) {}
    return { lat: -23.396, lon: -47.008 };
  };
  const renderWeatherPirapora = async () => {
    const currentEl = $('#weather-current');
    const forecastEl = $('#weather-forecast');
    if (!currentEl || !forecastEl) return;
    currentEl.innerHTML = '';
    forecastEl.innerHTML = '';
    try {
      const { lat, lon } = await getCoordsPirapora();
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto`;
      const resp = await fetch(url);
      const data = await resp.json();
      const cw = data.current_weather || {};
      const dly = data.daily || {};
      const code = cw.weathercode;
      const todayMax = (dly.temperature_2m_max && dly.temperature_2m_max[0] !== undefined) ? dly.temperature_2m_max[0] : cw.temperature;
      const todayMin = (dly.temperature_2m_min && dly.temperature_2m_min[0] !== undefined) ? dly.temperature_2m_min[0] : cw.temperature;
      currentEl.innerHTML = `
        <div class="wc-today">
          <div><i class="${getWeatherIcon(code)}"></i> ${getWeatherDesc(code)}</div>
          <div class="wc-temp">${Math.round(todayMax)}° / ${Math.round(todayMin)}°</div>
        </div>
      `;
      const items = [];
      const times = dly.time || [];
      for (let i = 0; i < Math.min(7, times.length); i++) {
        const dayName = new Date(times[i]).toLocaleDateString('pt-BR', { weekday: 'long' });
        const dCode = (dly.weathercode && dly.weathercode[i] !== undefined) ? dly.weathercode[i] : code;
        const tmax = dly.temperature_2m_max ? Math.round(dly.temperature_2m_max[i]) : '';
        const tmin = dly.temperature_2m_min ? Math.round(dly.temperature_2m_min[i]) : '';
        const tempNow = i === 0 && cw.temperature !== undefined ? `<span class="tcurr">${Math.round(cw.temperature)}°</span>` : '';
        items.push(`
          <div class="hf">
            <div class="day">${dayName} ${tempNow}</div>
            <div class="icon"><i class="${getWeatherIcon(dCode)}"></i></div>
            <div><span class="tmax">${tmax}°</span> / <span class="tmin">${tmin}°</span></div>
          </div>
        `);
      }
      forecastEl.innerHTML = items.join('');
    } catch (e) {
      currentEl.innerHTML = '<span style="color: var(--acento-vermelho)">Falha ao carregar clima</span>';
    }
  };

  // Viagens: próxima viagem
  const renderViagens = () => {
    const container = $('#dash-viagens-body');
    if (!container) return;
    container.innerHTML = '';
    let data = ls('travels', { travels: [] });
    const travels = Array.isArray(data) ? data : (data.travels || []);
    if (!travels.length) { container.innerHTML = '<p>Nenhuma viagem cadastrada.</p>'; return; }
    const today = new Date();
    const sorted = [...travels].sort((a, b) => {
      const ad = new Date(a.startDate || a.date || 0).getTime();
      const bd = new Date(b.startDate || b.date || 0).getTime();
      return ad - bd;
    });
    const upcoming = sorted.find(t => {
      const sd = new Date(t.startDate || t.date || 0).getTime();
      return sd >= today.setHours(0,0,0,0);
    }) || sorted[0];
    const start = upcoming.startDate || upcoming.date;
    const end = upcoming.endDate;
    const sd = start ? new Date(start) : null;
    const ed = end ? new Date(end) : null;
    let status = 'Planejado';
    if (!upcoming.destination || !start) status = 'Preparação pendente';
    else if (sd && sd.getTime() > Date.now()) {
      const days = Math.ceil((sd.getTime() - Date.now()) / (1000*60*60*24));
      status = days <= 1 ? 'Pronto' : (days <= 7 ? 'Preparando' : 'Planejado');
    } else if (ed && ed.getTime() >= Date.now()) status = 'Em andamento';
    else if (ed && ed.getTime() < Date.now()) status = 'Concluída';
    const icon = '<i class="fas fa-map-marker-alt"></i>';
    container.innerHTML = `
      <div class="dash-row">
        <div class="dash-main">${icon} ${upcoming.destination || 'Destino não informado'}</div>
        <div class="dash-meta">${formatBRDate(start)} – ${formatBRDate(end)} • ${status}</div>
      </div>
    `;
  };

  // Leitura: livro atual
  const renderLeitura = () => {
    const container = $('#dash-leitura-body');
    if (!container) return;
    const livros = ls('livrosTracker', []);
    const current = (livros || []).filter(l => !l.lido && (l.paginaAtual || 0) > 0)
      .sort((a,b) => pct(b.paginaAtual, b.totalPaginas) - pct(a.paginaAtual, a.totalPaginas))[0];
    if (!current) { container.innerHTML = '<p>Nenhum livro em leitura.</p>'; return; }
    const progress = pct(current.paginaAtual, current.totalPaginas);
    container.innerHTML = `
      <div class="dash-media">
        <div class="dash-cover" style="background-image:url('${current.capaUrl || 'img/default_cover.png'}')"></div>
        <div class="dash-info">
          <div class="dash-title">${current.titulo}</div>
          <div class="dash-sub">${current.autor}</div>
          <div class="dash-progress"><span style="width:${progress}%"></span></div>
          <div class="dash-progress-label">${progress}%</div>
        </div>
      </div>
    `;
  };

  // Entretenimento: último filme e série atual
  const renderEntretenimento = () => {
    const container = $('#dash-entretenimento-body');
    if (!container) return;
    const midias = ls('midiasTracker', []);
    const filmesAssistidos = (midias || []).filter(m => m.tipoMidia === 'filme' && m.lido);
    const ultimoFilme = filmesAssistidos.sort((a,b) => {
      const ad = a.dataConclusao ? new Date(a.dataConclusao).getTime() : 0;
      const bd = b.dataConclusao ? new Date(b.dataConclusao).getTime() : 0;
      return bd - ad;
    })[0];
    const series = (midias || []).filter(m => (m.tipoMidia === 'serie' || m.tipoMidia === 'anime') && !m.lido);
    const serieAtual = series.sort((a,b) => pct(b.episodioAtual || 0, b.totalEpisodios || 0) - pct(a.episodioAtual || 0, a.totalEpisodios || 0))[0];
    const filmeHtml = ultimoFilme ? `
      <div class="dash-row">
        <div class="dash-main"><i class="fas fa-film"></i> ${ultimoFilme.titulo}</div>
        <div class="dash-meta">Visto em ${formatBRDate(ultimoFilme.dataConclusao)} • Nota ${ultimoFilme.nota || 0}/5</div>
      </div>
    ` : '<p>Nenhum filme concluído.</p>';
    const serieHtml = serieAtual ? `
      <div class="dash-row">
        <div class="dash-main"><i class="fas fa-tv"></i> ${serieAtual.titulo}</div>
        <div class="dash-meta">T${serieAtual.temporadaAtual || 1} • E${serieAtual.episodioAtual || 0} de ${serieAtual.totalEpisodios || 0} • Próxima data: N/A</div>
      </div>
    ` : '<p>Nenhuma série em acompanhamento.</p>';
    container.innerHTML = filmeHtml + serieHtml;
  };

  // Sonhos: mais urgente
  const renderSonhos = () => {
    const container = $('#dash-sonhos-body');
    if (!container) return;
    container.innerHTML = '<p>Veja seus sonhos na seção dedicada acima.</p>';
  };

  // Compras: itens do carrinho de alta prioridade
  const renderCompras = () => {
    const container = $('#dash-compras-body');
    if (!container) return;
    container.innerHTML = '<p>Veja suas compras na seção dedicada abaixo.</p>';
  };

  // Planejamento: tarefas de hoje
  const renderPlanejamento = () => {
    const container = $('#dash-planejamento-body');
    if (!container) return;
    const tasks = ls('sol-de-soter-tasks', []);
    const todayStr = new Date().toISOString().slice(0,10);
    const todayTasks = (tasks||[]).filter(t => t.date === todayStr);
    if (!todayTasks.length) { container.innerHTML = '<p>Sem tarefas para hoje.</p>'; return; }
    const getPeriod = (time) => {
      if (!time) return 'Noite';
      const [h] = time.split(':').map(Number);
      if (h < 12) return 'Manhã'; if (h < 18) return 'Tarde'; return 'Noite';
    };
    const groups = { 'Manhã': [], 'Tarde': [], 'Noite': [] };
    todayTasks.forEach(t => { groups[getPeriod(t.time)].push(t); });
    const section = (label, items) => items.length ? `
      <div class="dash-group">
        <div class="dash-group-title">${label}</div>
        ${items.sort((a,b)=> (a.time||'') < (b.time||'') ? -1 : 1).map(it => `
          <div class="dash-row">
            <div class="dash-main"><i class="far fa-check-circle"></i> ${it.title}</div>
            <div class="dash-meta">${it.time||''} • ${it.category||'Geral'}</div>
          </div>
        `).join('')}
      </div>
    ` : '';
    container.innerHTML = section('Manhã', groups['Manhã']) + section('Tarde', groups['Tarde']) + section('Noite', groups['Noite']);
  };

  // Diário: última entrada
  const renderDiario = () => {
    const container = $('#dash-diario-body');
    if (!container) return;
    const entradas = ls('diario_entradas_v1', []);
    if (!entradas.length) { container.innerHTML = '<p>Nenhuma entrada registrada.</p>'; return; }
    const last = [...entradas].sort((a,b) => (b.data || '') < (a.data || '') ? -1 : 1)[0];
    container.innerHTML = `
      <div class="dash-row">
        <div class="dash-main"><i class="fas fa-book"></i> ${last.titulo}</div>
        <div class="dash-meta">${formatBRDate(last.data)}</div>
      </div>
      <a class="dash-link" href="diario.html">Ver entrada completa</a>
    `;
  };

  const renderCurrentReading = () => {
    const container = $('#current-reading-body');
    if (!container) return;
    const livros = ls('livrosTracker', []);
    const atual = (livros||[]).filter(l => !l.lido).sort((a,b)=> (b.paginaAtual||0) - (a.paginaAtual||0))[0];
    if (!atual) { container.innerHTML = '<p>Nenhum livro em leitura.</p>'; return; }
    const capa = atual.capaUrl || 'img/default_cover.png';
    const generos = Array.isArray(atual.generos) ? atual.generos : [];
    const tags = generos.map(g => `<span class="tag">${g}</span>`).join('');
    const prog = pct(parseInt(atual.paginaAtual||0,10), parseInt(atual.totalPaginas||0,10));
    const sinopse = atual.sinopse || atual.descricao || '';
    const nota = Number(atual.nota||0);
    const stars = Array.from({length:5}, (_,i)=> i < Math.round(nota) ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>').join('');
    container.innerHTML = `
      <div class="cr-cover" style="background-image:url('${capa}')"></div>
      <div>
        <div class="cr-title-row"><span class="cr-title">${atual.titulo||'Sem título'}</span><span class="cr-stars">${stars}</span></div>
        <div class="cr-author">${atual.autor||''}</div>
        <div class="cr-sinopse">${sinopse || '—'}</div>
        <div class="cr-tags">${tags}</div>
        <div class="cr-meta">
          <div class="item">Páginas: ${atual.paginaAtual||0}/${atual.totalPaginas||0} (${prog}%)</div>
        </div>
        <div class="cr-saga">${atual.saga? (atual.saga.nome||'')+' '+(atual.saga.volume||''): '—'}</div>
      </div>
    `;
  };

  // Seção Compras (dedicada)
  const renderCurrentShopping = () => {
    const container = document.querySelector('#current-shopping-body');
    if (!container) return;
    const wishlist = ls('wishlistItems', []);
    const priorityOrder = { urgente: 4, alta: 3, media: 2, baixa: 1 };
    const high = (wishlist || [])
      .filter(i => ['alta','urgente'].includes((i.priority||'').toLowerCase()))
      .sort((a,b) => (priorityOrder[(b.priority||'').toLowerCase()]||0) - (priorityOrder[(a.priority||'').toLowerCase()]||0));
    const cards = high.map(it => {
      let loja = 'N/A';
      try { if (it.link) loja = new URL(it.link).hostname; } catch(_) {}
      const img = it.image || 'img/default_product.png';
      return `
        <div class="shop-card">
          <img src="${img}" alt="${it.name}" loading="lazy"/>
          <div class="body">
            <div class="name">${it.name}</div>
            <div class="price">R$ ${parseFloat(it.price||0).toFixed(2)}</div>
            <div class="status">${(it.priority||'').toUpperCase()} • ${loja}</div>
          </div>
        </div>
      `;
    }).join('');
    container.innerHTML = `<div class="shop-grid">${cards || '<p>Nenhum item de prioridade alta/urgente.</p>'}</div>`;
  };

  // Sonhos - seção dedicada com overlay
  const renderDreamsSection = () => {
    const grid = document.querySelector('#dreams-grid');
    if (!grid) return;
    const sonhos = ls('sonhos-objetivos', []) || [];
    const sel = document.querySelector('#dream-select');
    if (sel) sel.innerHTML = sonhos.map((s, i) => `<option value="${i}">${s.titulo || 'Sonho'}</option>`).join('');
    grid.innerHTML = sonhos.map((s, idx) => {
      const img = s.imagem || 'img/default_dream.png';
      const titulo = s.titulo || 'Sonho';
      return `
        <div class="dream-card" data-idx="${idx}">
          <img src="${img}" alt="${titulo}" loading="lazy"/>
          <div class="title">${titulo}</div>
        </div>
      `;
    }).join('');
    grid.querySelectorAll('.dream-card').forEach(card => {
      card.addEventListener('click', () => {
        const i = parseInt(card.dataset.idx, 10);
        const s = sonhos[i];
        openDreamOverlay(s);
      });
    });

    // Upload de imagem com validação
    const input = document.querySelector('#dream-image-input');
    const btn = document.querySelector('#dream-upload-btn');
    const feedback = document.querySelector('#dream-feedback');
    if (btn) {
      btn.onclick = async () => {
        try {
          if (!sel || sel.value === '') { if (feedback) feedback.textContent = 'Selecione um sonho.'; return; }
          const file = input && input.files && input.files[0];
          if (!file) { if (feedback) feedback.textContent = 'Escolha uma imagem.'; return; }
          const allowed = ['image/png','image/jpeg','image/webp'];
          if (!allowed.includes(file.type)) { if (feedback) feedback.textContent = 'Formato inválido. Use PNG, JPEG ou WEBP.'; return; }
          const max = 2 * 1024 * 1024; // 2MB
          if (file.size > max) { if (feedback) feedback.textContent = 'Imagem muito grande (máx 2MB).'; return; }
          if (feedback) feedback.textContent = 'Carregando imagem...';
          const dataUrl = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
          const idx = parseInt(sel.value, 10);
          const list = ls('sonhos-objetivos', []) || [];
          if (!list[idx]) { if (feedback) feedback.textContent = 'Sonho não encontrado.'; return; }
          list[idx].imagem = dataUrl;
          localStorage.setItem('sonhos-objetivos', JSON.stringify(list));
          if (feedback) feedback.textContent = 'Imagem adicionada com sucesso.';
          renderDreamsSection();
        } catch (_) {
          if (feedback) feedback.textContent = 'Falha ao enviar a imagem.';
        }
      };
    }

    // Botão fechar overlay
    const closeBtn = document.querySelector('#dream-close');
    const overlayEl = document.querySelector('#dream-overlay');
    if (closeBtn) closeBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); closeDreamOverlay(); });
    if (overlayEl) overlayEl.addEventListener('click', (e) => { if (e.target === overlayEl) closeDreamOverlay(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDreamOverlay(); });
  };

  const renderDiaryWidget = () => {
    const list = $('#diary-widget-list');
    if (!list) return;
    const entradas = ls('diario_entradas_v1', []) || [];
    const recentes = entradas.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 6);
    list.innerHTML = recentes.map(e => `
      <li class="diary-item">
        <div class="date">${formatBRDate(e.data)}</div>
        <div class="text">${(e.texto||'').slice(0, 100)}${(e.texto||'').length>100?'…':''}</div>
      </li>
    `).join('');
  };

  const renderTripsSection = () => {
    const tabsEl = $('#trips-tabs');
    const listEl = $('#trip-list');
    if (!tabsEl || !listEl) return;
    const travelsRaw = ls('travels', { travels: [] });
    const travels = Array.isArray(travelsRaw) ? travelsRaw : (travelsRaw.travels || []);
    const viagensAntigas = ls('viagensLista', []) || ls('viagens', []) || [];
    const normalize = (v) => ({
      destino: v.destination || v.destino || v.titulo || 'Viagem',
      dataIda: v.startDate || v.dataIda || null,
      dataVolta: v.endDate || v.dataVolta || null,
      orcamento: v.budget || v.orcamento || null,
      categoria: v.category || v.categoria || null,
      hospedagem: v.hospedagem || null,
      transporte: v.transporte || null,
      descricao: v.descricao || '',
      imagem: v.capaUrl || v.imagem || null
    });
    const viagens = [...travels.map(normalize), ...viagensAntigas.map(normalize)];
    const today = new Date();
    const state = (v) => {
      const ida = v.dataIda ? new Date(v.dataIda) : null;
      const volta = v.dataVolta ? new Date(v.dataVolta) : null;
      if (!ida && !volta) return 'sem_data';
      const end = volta || ida;
      if (end && end < today) return 'passada';
      return 'futura';
    };
    const filters = [
      { key: 'todas', label: 'Todas' },
      { key: 'com_data', label: 'Com data' },
      { key: 'sem_data', label: 'Sem data' },
      { key: 'futura', label: 'Futuras' },
      { key: 'passada', label: 'Passadas' }
    ];
    tabsEl.innerHTML = filters.map((f,i) => `<button class="tab${i===0?' active':''}" data-key="${f.key}">${f.label}</button>`).join('');
    const renderList = (key) => {
      let arr = viagens.slice();
      if (key === 'com_data') arr = arr.filter(v => v.dataIda || v.dataVolta);
      if (key === 'sem_data') arr = arr.filter(v => !v.dataIda && !v.dataVolta);
      if (key === 'futura') arr = arr.filter(v => state(v) === 'futura');
      if (key === 'passada') arr = arr.filter(v => state(v) === 'passada');
      listEl.innerHTML = arr.map(v => {
        const foto = v.imagem || v.capaUrl || 'img/default_trip.png';
        const periodo = v.dataIda && v.dataVolta ? `${formatBRDate(v.dataIda)} — ${formatBRDate(v.dataVolta)}` : 'Sem data definida';
        const custo = v.custo || v.orcamento || 'N/A';
        const detalhes = [v.categoria, v.hospedagem, v.transporte].filter(Boolean).join(' • ');
        return `
          <div class="trip-item fade-enter fade-enter-active">
            <div class="trip-photo" style="background-image:url('${foto}')"></div>
            <div class="trip-info">
              <div class="row"><strong>${v.destino || v.titulo || 'Viagem'}</strong></div>
              <div class="row meta">${periodo}</div>
              <div class="row">Orçamento: ${custo}</div>
              ${detalhes ? `<div class="row meta">${detalhes}</div>` : ''}
              ${v.descricao ? `<div class="row">${v.descricao}</div>` : ''}
            </div>
          </div>
        `;
      }).join('') || '<p>Nenhuma viagem neste filtro.</p>';
    };
    renderList('todas');
    tabsEl.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        tabsEl.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderList(btn.dataset.key);
      });
    });
  };

  const renderCurrentEntertainment = () => {
    const container = $('#current-entertainment-body');
    if (!container) return;
    const midias = ls('midiasTracker', []) || [];
    const atual = midias.find(m => (m.tipoMidia === 'serie' || m.tipoMidia === 'anime' || m.tipoMidia === 'filme') && !m.lido) || midias.find(m => m.tipoMidia === 'filme');
    if (!atual) { container.innerHTML = '<p>Nenhuma mídia cadastrada.</p>'; return; }
    const capa = atual.capaUrl || 'img/default_entertainment.png';
    const titulo = atual.titulo || 'Entretenimento';
    const autor = atual.diretor || atual.criador || '';
    const tags = [atual.tipoMidia, atual.genero].filter(Boolean).map(t => `<span class="tag">${t}</span>`).join('');
    const prog = 0;
    const sinopse = atual.sinopse || '';
    const nota = Number(atual.nota||0);
    const stars = Array.from({length:5}, (_,i)=> i < Math.round(nota) ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>').join('');
    container.innerHTML = `
      <div class="cr-cover" style="background-image:url('${capa}')"></div>
      <div>
        <div class="cr-title-row"><span class="cr-title">${titulo}</span><span class="cr-stars">${stars}</span></div>
        <div class="cr-author">${autor}</div>
        <div class="cr-sinopse">${sinopse || '—'}</div>
        <div class="cr-tags">${tags}</div>
        <div class="cr-meta">
          <div class="item">Progresso: ${prog}%</div>
          <div class="item">Tipo: ${atual.tipoMidia || 'N/A'}</div>
        </div>
        <div class="cr-saga">${atual.franquia? (atual.franquia||'') : '—'}</div>
      </div>
    `;
  };
  const openDreamOverlay = (s) => {
    const overlay = document.querySelector('#dream-overlay');
    if (!overlay) return;
    const imgEl = document.querySelector('#dream-modal-image');
    const titleEl = document.querySelector('#dream-modal-title');
    const descEl = document.querySelector('#dream-modal-desc');
    const img = s.imagem || 'img/default_dream.png';
    if (imgEl) imgEl.style.backgroundImage = `url('${img}')`;
    if (titleEl) titleEl.textContent = s.titulo || '';
    if (descEl) descEl.textContent = s.descricao || '';
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  };
  const closeDreamOverlay = () => {
    const overlay = document.querySelector('#dream-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  };
  // Removido listener global; controlado em renderDreamsSection para evitar conflitos

  const renderAll = () => {
    renderCurrentReading();
    renderCurrentShopping();
    renderTopPlanner();
    renderFavoritesCarousel();
    renderWeatherPirapora();
    renderDreamsSection();
    renderDiaryWidget();
    renderTripsSection();
    renderCurrentEntertainment();
  };

  // Import/Export
  const exportBtn = $('#dashboard-export');
  const importBtn = $('#dashboard-import');
  const importInput = $('#dashboard-import-input');

  const doExport = () => {
    try {
      const payload = {
        meta: {
          appName: 'Sol de Sóter',
          exportDate: new Date().toISOString(),
          version: '1.0'
        },
        livraria: ls('livrosTracker', []),
        cinema: ls('midiasTracker', []),
        mangas: ls('mangasTracker', []),
        sonhos: {
          sonhos: ls('sonhos-objetivos', []),
          metas: ls('metas-objetivos', []),
          conquistas: ls('conquistas-objetivos', []),
          gamificacao: ls('gamificacao-objetivos', {})
        },
        viagens: ls('travels', { travels: [] }),
        carrinho: {
          wishlistItems: ls('wishlistItems', []),
          purchasedItems: ls('purchasedItems', []),
          cartItems: ls('cartItems', [])
        },
        financas: {
          financeiroWidget: ls('financeiro-widget', null),
          auditoria: ls('auditoria-financas-sonhos', []),
          contas: ls('financeiro-contas', [])
        },
        planejamento: {
          tasks: ls('sol-de-soter-tasks', []),
          archive: ls('sol-de-soter-tasks-archive', [])
        },
        diario: ls('diario_entradas_v1', []),
        planner: ls('studyPlannerTopics', [])
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `sol-de-soter-export-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      setFeedback('Exportação concluída', 'success');
    } catch (e) {
      console.error(e);
      setFeedback('Falha na exportação', 'error');
    }
  };

  const validateImport = (data) => {
    if (!data || !data.meta) return false;
    return true;
  };

  const applyImport = (data) => {
    try {
      if (data.livraria) localStorage.setItem('livrosTracker', JSON.stringify(data.livraria));
      if (data.cinema) localStorage.setItem('midiasTracker', JSON.stringify(data.cinema));
      if (data.mangas) localStorage.setItem('mangasTracker', JSON.stringify(data.mangas));
      if (data.sonhos) {
        localStorage.setItem('sonhos-objetivos', JSON.stringify(data.sonhos.sonhos || []));
        localStorage.setItem('metas-objetivos', JSON.stringify(data.sonhos.metas || []));
        localStorage.setItem('conquistas-objetivos', JSON.stringify(data.sonhos.conquistas || []));
        localStorage.setItem('gamificacao-objetivos', JSON.stringify(data.sonhos.gamificacao || {}));
      }
      if (data.viagens) localStorage.setItem('travels', JSON.stringify(data.viagens));
      if (data.carrinho) {
        localStorage.setItem('wishlistItems', JSON.stringify(data.carrinho.wishlistItems || []));
        localStorage.setItem('purchasedItems', JSON.stringify(data.carrinho.purchasedItems || []));
        localStorage.setItem('cartItems', JSON.stringify(data.carrinho.cartItems || []));
      }
      if (data.financas) {
        if (data.financas.financeiroWidget !== undefined) localStorage.setItem('financeiro-widget', JSON.stringify(data.financas.financeiroWidget));
        localStorage.setItem('auditoria-financas-sonhos', JSON.stringify(data.financas.auditoria || []));
        localStorage.setItem('financeiro-contas', JSON.stringify(data.financas.contas || []));
      }
      if (data.planejamento) {
        localStorage.setItem('sol-de-soter-tasks', JSON.stringify(data.planejamento.tasks || []));
        localStorage.setItem('sol-de-soter-tasks-archive', JSON.stringify(data.planejamento.archive || []));
      }
      if (data.diario) localStorage.setItem('diario_entradas_v1', JSON.stringify(data.diario));
      if (data.planner) localStorage.setItem('studyPlannerTopics', JSON.stringify(data.planner));
    } catch (e) {
      console.error('Erro aplicando import:', e);
      throw e;
    }
  };

  const onImportFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!validateImport(data)) { setFeedback('Arquivo inválido', 'error'); return; }
        applyImport(data);
        renderAll();
        setFeedback('Importação concluída', 'success');
      } catch (err) {
        console.error(err);
        setFeedback('Falha na importação', 'error');
      }
    };
    reader.onerror = () => setFeedback('Falha ao ler arquivo', 'error');
    reader.readAsText(file);
  };

  if (exportBtn) exportBtn.addEventListener('click', doExport);
  if (importBtn && importInput) {
    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) onImportFile(f);
      importInput.value = '';
    });
  }

  renderAll();
  window.addEventListener('storage', renderAll);
  // Responsividade já aplicada via CSS Grid; não é necessário re-render no resize
});