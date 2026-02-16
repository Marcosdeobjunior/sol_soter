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

    if (!todayTasks.length) {
      list.innerHTML = `
        <li class="planner-empty-state">
          <img src="img/gato.png" alt="Gato dormindo" class="planner-empty-image" />
          <p>Sem tarefas para hoje.</p>
        </li>
      `;
      return;
    }

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
    if (code === 0) return 'Ceu limpo';
    if (code > 0 && code < 4) return 'Parcialmente nublado';
    if (code >= 51 && code <= 67) return 'Chuva';
    if (code >= 71 && code <= 75) return 'Neve';
    if (code >= 95 && code <= 99) return 'Tempestade';
    return 'Condicoes variadas';
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
    const currentEl = $('#nav-weather-current');
    if (!currentEl) return;
    currentEl.innerHTML = '<i class="fas fa-cloud-sun"></i><span>Carregando clima...</span>';
    try {
      const { lat, lon } = await getCoordsPirapora();
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto`;
      const resp = await fetch(url);
      const data = await resp.json();
      const cw = data.current_weather || {};
      const dly = data.daily || {};
      const code = cw.weathercode;
      const times = Array.isArray(dly.time) ? dly.time : [];
      const todayStrBR = new Date().toLocaleDateString('pt-BR');
      const timesBR = times.map(t => new Date(t).toLocaleDateString('pt-BR'));
      let todayIdx = timesBR.indexOf(todayStrBR);
      if (todayIdx < 0) todayIdx = 0;
      const todayMax = (dly.temperature_2m_max && dly.temperature_2m_max[todayIdx] !== undefined) ? dly.temperature_2m_max[todayIdx] : cw.temperature;
      const todayMin = (dly.temperature_2m_min && dly.temperature_2m_min[todayIdx] !== undefined) ? dly.temperature_2m_min[todayIdx] : cw.temperature;
      currentEl.innerHTML = `
        <i class="${getWeatherIcon(code)}"></i>
        <span>Pirapora ${Math.round(todayMax)}&deg;/${Math.round(todayMin)}&deg;</span>
      `;
    } catch (e) {
      currentEl.innerHTML = '<i class="fas fa-cloud"></i><span>Clima indisponivel</span>';
    }
  };

  const getAllTripsUnified = () => {
    const travelsRaw = ls('travels', { travels: [] });
    const travels = Array.isArray(travelsRaw) ? travelsRaw : (travelsRaw.travels || []);
    const viagensAntigas = ls('viagensLista', []) || ls('viagens', []) || [];
    const normalize = (v) => ({
      destino: v.destination || v.destino || v.titulo || 'Viagem',
      dataIda: v.startDate || v.dataIda || null,
      dataVolta: v.endDate || v.dataVolta || null,
      descricao: v.descricao || '',
    });
    return [...travels.map(normalize), ...viagensAntigas.map(normalize)];
  };

  const renderTopTrips = () => {
    const container = $('#top-trips-body');
    if (!container) return;

    const trips = getAllTripsUnified();
    if (!trips.length) {
      container.innerHTML = '<div class="trips-widget-row"><div class="title">Nenhuma viagem cadastrada.</div><div class="meta">Cadastre em Viagens para acompanhar aqui.</div></div>';
      return;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const withDates = trips.filter(t => t.dataIda || t.dataVolta);
    const semData = trips.filter(t => !t.dataIda && !t.dataVolta);
    const futurasOuAtuais = withDates
      .filter((t) => {
        const ida = t.dataIda ? new Date(t.dataIda + 'T00:00:00') : null;
        const volta = t.dataVolta ? new Date(t.dataVolta + 'T00:00:00') : ida;
        return volta && volta.getTime() >= now.getTime();
      })
      .sort((a, b) => {
        const ad = a.dataIda ? new Date(a.dataIda + 'T00:00:00').getTime() : Number.MAX_SAFE_INTEGER;
        const bd = b.dataIda ? new Date(b.dataIda + 'T00:00:00').getTime() : Number.MAX_SAFE_INTEGER;
        return ad - bd;
      });

    if (futurasOuAtuais.length) {
      const trip = futurasOuAtuais[0];
      const inicio = trip.dataIda ? formatBRDate(trip.dataIda) : 'N/A';
      const fim = trip.dataVolta ? formatBRDate(trip.dataVolta) : 'N/A';
      container.innerHTML = `
        <div class="trips-widget-row">
          <div class="title"><i class="fas fa-map-marker-alt"></i> ${trip.destino}</div>
          <div class="meta">${inicio} - ${fim}</div>
          <div class="status">Proxima viagem com data</div>
        </div>
      `;
      return;
    }

    const realizadas = withDates
      .filter((t) => {
        const fimBase = t.dataVolta || t.dataIda;
        if (!fimBase) return false;
        const fim = new Date(fimBase + 'T00:00:00');
        return fim.getTime() < now.getTime();
      })
      .sort((a, b) => {
        const adBase = a.dataVolta || a.dataIda;
        const bdBase = b.dataVolta || b.dataIda;
        const ad = adBase ? new Date(adBase + 'T00:00:00').getTime() : 0;
        const bd = bdBase ? new Date(bdBase + 'T00:00:00').getTime() : 0;
        return bd - ad;
      });

    if (realizadas.length) {
      const trip = realizadas[0];
      const inicio = trip.dataIda ? formatBRDate(trip.dataIda) : 'N/A';
      const fim = trip.dataVolta ? formatBRDate(trip.dataVolta) : 'N/A';
      container.innerHTML = `
        <div class="trips-widget-row">
          <div class="title"><i class="fas fa-flag-checkered"></i> ${trip.destino}</div>
          <div class="meta">${inicio} - ${fim}</div>
          <div class="status">Viagem realizada</div>
        </div>
      `;
      return;
    }

    if (semData.length) {
      const rotationKey = 'index-trips-no-date-rotation';
      let idx = parseInt(localStorage.getItem(rotationKey) || '0', 10);
      if (Number.isNaN(idx) || idx < 0) idx = 0;
      const nextIdx = idx % semData.length;
      localStorage.setItem(rotationKey, String(nextIdx + 1));
      const trip = semData[nextIdx];

      container.innerHTML = `
        <div class="trips-widget-row">
          <div class="title"><i class="fas fa-route"></i> ${trip.destino}</div>
          <div class="meta">Sem data definida</div>
          <div class="status">Alternando viagens sem data</div>
        </div>
      `;
      return;
    }

    container.innerHTML = '<div class="trips-widget-row"><div class="title">Nenhuma viagem disponivel.</div></div>';
  };

  const renderAcademiaSummary = () => {
    const todayStatusEl = $('#academia-today-status');
    const todayPlanEl = $('#academia-today-plan');
    const lastTrainingEl = $('#academia-last-training');
    const lastTrainingMetaEl = $('#academia-last-training-meta');
    const nextTrainingEl = $('#academia-next-training');
    const nextTrainingMetaEl = $('#academia-next-training-meta');
    const streakEl = $('#academia-streak');
    const streakMetaEl = $('#academia-streak-meta');
    const streakValueEl = $('#academia-streak-value');
    const streakVisualEl = $('#academia-streak-visual');
    const prListEl = $('#academia-pr-list');
    const checklistEl = $('#academia-checklist');

    if (
      !todayStatusEl || !todayPlanEl || !lastTrainingEl || !lastTrainingMetaEl ||
      !nextTrainingEl || !nextTrainingMetaEl || !streakEl || !streakMetaEl ||
      !prListEl || !checklistEl
    ) return;

    const trainingDays = ls('academia-training-days-v1', {});
    const exerciseProgress = ls('academia-exercise-progress-v1', {});
    const exerciseLibrary = ls('academia-exercise-library-v1', []);
    const daySessions = ls('academia-day-sessions-v1', {});

    const WEEK_DAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
    const DAY_LABELS = {
      seg: 'Segunda',
      ter: 'Terca',
      qua: 'Quarta',
      qui: 'Quinta',
      sex: 'Sexta',
      sab: 'Sabado',
      dom: 'Domingo',
    };
    const getTodayKey = () => {
      const jsDay = new Date().getDay();
      if (jsDay === 0) return 'dom';
      if (jsDay === 1) return 'seg';
      if (jsDay === 2) return 'ter';
      if (jsDay === 3) return 'qua';
      if (jsDay === 4) return 'qui';
      if (jsDay === 5) return 'sex';
      return 'sab';
    };
    const todayDateKey = new Date().toISOString().slice(0, 10);
    const todayWeekKey = getTodayKey();
    const markedDays = WEEK_DAYS.filter((d) => Boolean(trainingDays && trainingDays[d]));
    const todaySessions = Array.isArray(daySessions && daySessions[todayDateKey])
      ? daySessions[todayDateKey]
      : [];
    const idsToday = [...new Set(
      todaySessions.flatMap((s) => Array.isArray(s.items) ? s.items : [])
    )];
    const touchedToday = new Set();
    Object.keys(exerciseProgress || {}).forEach((id) => {
      const h = Array.isArray(exerciseProgress[id] && exerciseProgress[id].historico)
        ? exerciseProgress[id].historico
        : [];
      if (h.some((item) => String(item.date || '').slice(0, 10) === todayDateKey)) {
        touchedToday.add(id);
      }
    });
    const planLabel = (() => {
      const idx = markedDays.indexOf(todayWeekKey);
      if (idx < 0) return 'Sem treino hoje';
      return `Treino ${String.fromCharCode(65 + (idx % 26))}`;
    })();
    if (!markedDays.includes(todayWeekKey)) {
      todayStatusEl.textContent = 'Descanso';
      todayPlanEl.textContent = 'Hoje nao esta marcado como dia de treino.';
    } else if (!todaySessions.length) {
      todayStatusEl.textContent = 'Nao iniciado';
      todayPlanEl.textContent = `${planLabel} previsto para hoje.`;
    } else {
      const done = idsToday.length > 0 && touchedToday.size >= idsToday.length;
      const status = done ? 'Feito' : 'Em andamento';
      const estMin = Math.max(20, idsToday.length * 8);
      todayStatusEl.textContent = `${status} - ${planLabel}`;
      todayPlanEl.textContent = `${todaySessions.length} sessao(oes), ${idsToday.length} exercicios, ~${estMin} min.`;
    }

    const libraryMap = new Map(
      (Array.isArray(exerciseLibrary) ? exerciseLibrary : []).map((e, idx) => [e.id || `ex_${idx}`, e.nome || 'Exercicio'])
    );
    const sessionDates = Object.keys(daySessions || {})
      .filter((k) => Array.isArray(daySessions[k]) && daySessions[k].length > 0)
      .sort((a, b) => new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime());
    if (!sessionDates.length) {
      lastTrainingEl.textContent = 'Nenhum treino registrado';
      lastTrainingMetaEl.textContent = 'Crie sessoes na pagina Academia.';
    } else {
      const lastKey = sessionDates[0];
      const sessions = daySessions[lastKey] || [];
      const ids = [...new Set(sessions.flatMap((s) => Array.isArray(s.items) ? s.items : []))];
      const nomes = ids.map((id) => libraryMap.get(id) || id);
      const cargaTotal = ids.reduce((acc, id) => {
        const c = Number(exerciseProgress[id] && exerciseProgress[id].carga);
        return acc + (Number.isFinite(c) ? c : 0);
      }, 0);
      const topNames = nomes.slice(0, 3).join(', ');
      const extra = nomes.length > 3 ? ` +${nomes.length - 3}` : '';
      lastTrainingEl.textContent = formatBRDate(lastKey);
      lastTrainingMetaEl.textContent = `${topNames || 'Sem exercicios'}${extra} - carga total ${Math.round(cargaTotal)} kg`;
    }

    if (!markedDays.length) {
      nextTrainingEl.textContent = 'Sem rotina definida';
      nextTrainingMetaEl.textContent = 'Marque os dias de treino na pagina Academia.';
    } else {
      let nextDay = markedDays[0];
      let nextLabel = DAY_LABELS[nextDay];
      if (markedDays.includes(todayWeekKey) && todaySessions.length === 0) {
        nextDay = todayWeekKey;
        nextLabel = 'Hoje';
      } else {
        const tIdx = WEEK_DAYS.indexOf(todayWeekKey);
        let bestDiff = 99;
        markedDays.forEach((d) => {
          const dIdx = WEEK_DAYS.indexOf(d);
          const diff = dIdx > tIdx ? (dIdx - tIdx) : (7 - tIdx + dIdx);
          if (diff > 0 && diff < bestDiff) {
            bestDiff = diff;
            nextDay = d;
          }
        });
        nextLabel = DAY_LABELS[nextDay];
      }
      const letterIdx = markedDays.indexOf(nextDay);
      const letter = String.fromCharCode(65 + Math.max(0, letterIdx));
      nextTrainingEl.textContent = `${nextLabel} - Treino ${letter}`;
      nextTrainingMetaEl.textContent = `Dia ${DAY_LABELS[nextDay] || nextDay} na sua rotina semanal.`;
    }

    if (!sessionDates.length) {
      streakEl.textContent = '0 treinos seguidos';
      streakMetaEl.textContent = 'Sem historico ainda.';
      if (streakValueEl) streakValueEl.textContent = '0';
      if (streakVisualEl) {
        streakVisualEl.classList.remove('level-low', 'level-mid', 'level-high', 'level-elite');
        streakVisualEl.classList.add('level-low');
      }
    } else {
      let streak = 1;
      for (let i = 1; i < sessionDates.length; i++) {
        const prev = new Date(sessionDates[i - 1] + 'T00:00:00').getTime();
        const curr = new Date(sessionDates[i] + 'T00:00:00').getTime();
        const diff = Math.round((prev - curr) / (1000 * 60 * 60 * 24));
        if (diff === 1) streak++;
        else break;
      }
      streakEl.textContent = `${streak} treino(s) seguidos`;
      streakMetaEl.textContent = `Ultimo registro em ${formatBRDate(sessionDates[0])}.`;
      if (streakValueEl) streakValueEl.textContent = String(streak);
      if (streakVisualEl) {
        streakVisualEl.classList.remove('level-low', 'level-mid', 'level-high', 'level-elite');
        if (streak >= 15) streakVisualEl.classList.add('level-elite');
        else if (streak >= 8) streakVisualEl.classList.add('level-high');
        else if (streak >= 4) streakVisualEl.classList.add('level-mid');
        else streakVisualEl.classList.add('level-low');
      }
    }

    const weekStartMs = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const prs = [];
    Object.keys(exerciseProgress || {}).forEach((id) => {
      const h = Array.isArray(exerciseProgress[id] && exerciseProgress[id].historico)
        ? exerciseProgress[id].historico
        : [];
      if (!h.length) return;
      const weekVals = h
        .filter((item) => new Date(item.date).getTime() >= weekStartMs)
        .map((item) => Number(item.carga))
        .filter((v) => Number.isFinite(v));
      if (!weekVals.length) return;
      const oldVals = h
        .filter((item) => new Date(item.date).getTime() < weekStartMs)
        .map((item) => Number(item.carga))
        .filter((v) => Number.isFinite(v));
      const weekMax = Math.max(...weekVals);
      const oldMax = oldVals.length ? Math.max(...oldVals) : 0;
      if (weekMax > oldMax) {
        prs.push({
          id,
          nome: libraryMap.get(id) || 'Exercicio',
          atual: weekMax,
          delta: weekMax - oldMax,
        });
      }
    });
    prs.sort((a, b) => b.delta - a.delta || b.atual - a.atual);
    if (!prs.length) {
      prListEl.innerHTML = '<li class="empty">Sem novos PRs na semana.</li>';
    } else {
      prListEl.innerHTML = prs.slice(0, 3).map((p) => {
        return `<li>${p.nome}: ${Math.round(p.atual)}kg (+${Math.round(p.delta)}kg)</li>`;
      }).join('');
    }

    const checklistKey = 'index-academia-checklist-v1';
    const checklistDate = todayDateKey;
    const checklistDef = { date: checklistDate, values: { agua: false, sono: false, pre: false, pos: false } };
    const checklistStateRaw = ls(checklistKey, checklistDef);
    const checklistState = (checklistStateRaw && checklistStateRaw.date === checklistDate)
      ? checklistStateRaw
      : checklistDef;
    const items = [
      { key: 'agua', label: 'Agua ok' },
      { key: 'sono', label: 'Sono ok' },
      { key: 'pre', label: 'Pre-treino' },
      { key: 'pos', label: 'Pos-treino' },
    ];
    checklistEl.innerHTML = items.map((item) => `
      <label class="academia-check-item">
        <input type="checkbox" data-check-key="${item.key}" ${checklistState.values[item.key] ? 'checked' : ''} />
        <span>${item.label}</span>
      </label>
    `).join('');
    checklistEl.querySelectorAll('input[data-check-key]').forEach((input) => {
      input.addEventListener('change', () => {
        const key = input.getAttribute('data-check-key');
        const state = ls(checklistKey, checklistDef);
        const next = (state && state.date === checklistDate) ? state : checklistDef;
        next.values[key] = input.checked;
        localStorage.setItem(checklistKey, JSON.stringify(next));
      });
    });
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
        <div class="dash-meta">${formatBRDate(start)} – ${formatBRDate(end)} &bull; ${status}</div>
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
        <div class="dash-meta">Visto em ${formatBRDate(ultimoFilme.dataConclusao)} &bull; Nota ${ultimoFilme.nota || 0}/5</div>
      </div>
    ` : '<p>Nenhum filme concluído.</p>';
    const serieHtml = serieAtual ? `
      <div class="dash-row">
        <div class="dash-main"><i class="fas fa-tv"></i> ${serieAtual.titulo}</div>
        <div class="dash-meta">T${serieAtual.temporadaAtual || 1} &bull; E${serieAtual.episodioAtual || 0} de ${serieAtual.totalEpisodios || 0} &bull; Próxima data: N/A</div>
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
            <div class="dash-meta">${it.time||''} &bull; ${it.category||'Geral'}</div>
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
            <div class="status">${(it.priority||'').toUpperCase()} &bull; ${loja}</div>
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

    ['count-1','count-2','count-3','count-4','count-5','count-6'].forEach(c => grid.classList.remove(c));
    grid.classList.add(`count-${Math.min((sonhos||[]).length, 6)}`);
    grid.classList.toggle('scrollable', sonhos.length > 6);
    const updateIndicators = () => {
      const maxScroll = grid.scrollWidth - grid.clientWidth;
      const atStart = grid.scrollLeft <= 1;
      const atEnd = grid.scrollLeft >= (maxScroll - 1);
      grid.classList.toggle('at-start', atStart);
      grid.classList.toggle('at-end', atEnd);
    };
    if (sonhos.length > 6) {
      updateIndicators();
      grid.addEventListener('scroll', updateIndicators, { passive: true });
    } else {
      grid.classList.remove('at-start', 'at-end');
    }

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
        const detalhes = [v.categoria, v.hospedagem, v.transporte].filter(Boolean).join(' &bull; ');
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
    renderTopTrips();
    renderFavoritesCarousel();
    renderWeatherPirapora();
    renderDreamsSection();
    renderAcademiaSummary();
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



