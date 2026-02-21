document.addEventListener('DOMContentLoaded', () => {
  const cards = Array.from(document.querySelectorAll('.trip-filter-card'));
  const balloonEl = document.getElementById('trip-balloon');
  const mediaEl = document.getElementById('trip-balloon-media');
  const pillEl = document.getElementById('trip-balloon-pill');
  const datesEl = document.getElementById('trip-balloon-dates');
  const titleEl = document.getElementById('trip-balloon-title');
  const metaEl = document.getElementById('trip-balloon-meta');
  const descEl = document.getElementById('trip-balloon-desc');
  const navEl = document.getElementById('trip-balloon-nav');
  const prevBtn = document.getElementById('trip-balloon-prev');
  const nextBtn = document.getElementById('trip-balloon-next');
  const countEl = document.getElementById('trip-balloon-count');
  const mapEl = document.getElementById('trip-balloon-map');
  const mapNoteEl = document.getElementById('trip-balloon-map-note');

  if (!cards.length || !balloonEl || !mediaEl || !pillEl || !datesEl || !titleEl || !metaEl || !descEl || !navEl || !prevBtn || !nextBtn || !countEl || !mapEl || !mapNoteEl) return;

  const ls = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  };

  const formatBR = (value) => {
    if (!value) return 'Sem data';
    const d = new Date(String(value) + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return 'Sem data';
    return d.toLocaleDateString('pt-BR');
  };

  const normalize = (v) => ({
    destino: v.destination || v.destino || v.titulo || 'Viagem',
    dataIda: v.startDate || v.dataIda || null,
    dataVolta: v.endDate || v.dataVolta || null,
    categoria: v.category || v.categoria || '',
    orcamento: v.budget || v.orcamento || '',
    imagem: v.image || v.imagem || v.capaUrl || '',
    localDescription: v.localDescription || v.descricaoLocal || v.descricao || '',
    coords: v.coords || null,
  });

  const travelsRaw = ls('travels', { travels: [] });
  const travels = Array.isArray(travelsRaw) ? travelsRaw : (travelsRaw.travels || []);
  const legacy = ls('viagensLista', []) || ls('viagens', []) || [];
  const all = [...travels.map(normalize), ...legacy.map(normalize)];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const toDate = (v) => (v ? new Date(v + 'T00:00:00') : null);
  const getState = (trip) => {
    const ida = toDate(trip.dataIda);
    const volta = toDate(trip.dataVolta) || ida;
    if (!ida && !volta) return 'nodate';
    if (volta && volta < today) return 'past';
    return 'upcoming';
  };

  const groups = {
    past: all
      .filter((t) => getState(t) === 'past')
      .sort((a, b) => (toDate(b.dataVolta || b.dataIda)?.getTime() || 0) - (toDate(a.dataVolta || a.dataIda)?.getTime() || 0)),
    upcoming: all
      .filter((t) => getState(t) === 'upcoming')
      .sort((a, b) => (toDate(a.dataIda || a.dataVolta)?.getTime() || Number.MAX_SAFE_INTEGER) - (toDate(b.dataIda || b.dataVolta)?.getTime() || Number.MAX_SAFE_INTEGER)),
    nodate: all.filter((t) => getState(t) === 'nodate'),
  };

  const filterTag = {
    past: 'Concluida',
    upcoming: 'Proxima',
    nodate: 'Sem data',
  };
  const groupIndex = { past: 0, upcoming: 0, nodate: 0 };
  let activeGroup = 'past';
  const geocodeCache = new Map();
  const hasLeaflet = typeof window.L !== 'undefined';
  const mapBounds = hasLeaflet ? window.L.latLngBounds([[-85, -180], [85, 180]]) : null;
  const defaultMapCenter = [-14.235, -51.925];
  const defaultMapZoom = 3;
  const focusMapZoom = 6;
  let tripMap = null;
  let tripMarker = null;
  let renderToken = 0;
  const goToTravelsPage = () => {
    window.location.href = 'viagens.html';
  };

  const shouldIgnoreBalloonClick = (target) => {
    if (!target || !(target instanceof Element)) return false;
    if (target.closest('.trip-balloon-nav-btn')) return true;
    if (target.closest('a, button, input, textarea, select, label')) return true;
    if (target.closest('#trip-balloon-map')) return true;
    if (target.closest('.leaflet-control-container, .leaflet-popup, .leaflet-marker-icon')) return true;
    return false;
  };

  const setMapNote = (text) => {
    mapNoteEl.textContent = text;
  };

  const initTripMap = () => {
    if (tripMap || !hasLeaflet || !mapBounds) {
      if (!hasLeaflet) setMapNote('Mapa indisponivel no momento.');
      return;
    }

    tripMap = L.map(mapEl, {
      minZoom: defaultMapZoom,
      maxZoom: 16,
      maxBounds: mapBounds,
      maxBoundsViscosity: 1.0,
      worldCopyJump: false,
      zoomSnap: 1,
    }).setView(defaultMapCenter, defaultMapZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      noWrap: true,
    }).addTo(tripMap);
  };

  const readCoords = (coords) => {
    if (!coords || typeof coords !== 'object') return null;
    const lat = Number(coords.lat);
    const lng = Number(coords.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  };

  const geocodeDestination = async (destination) => {
    const query = String(destination || '').trim();
    if (!query) return null;

    const cacheKey = query.toLowerCase();
    if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey);

    try {
      const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=pt&format=json`);
      const geoData = await geoResponse.json();
      if (geoData && Array.isArray(geoData.results) && geoData.results.length > 0) {
        const first = geoData.results[0];
        const coords = readCoords({ lat: first.latitude, lng: first.longitude });
        geocodeCache.set(cacheKey, coords);
        return coords;
      }
    } catch (_) {
      // Fallback abaixo.
    }

    try {
      const nominatimResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const nominatimData = await nominatimResponse.json();
      if (Array.isArray(nominatimData) && nominatimData.length > 0) {
        const first = nominatimData[0];
        const coords = readCoords({ lat: first.lat, lng: first.lon });
        geocodeCache.set(cacheKey, coords);
        return coords;
      }
    } catch (_) {
      // Sem coordenadas.
    }

    geocodeCache.set(cacheKey, null);
    return null;
  };

  const renderTripMap = async (trip, token) => {
    if (!tripMap) return;

    if (tripMarker) {
      tripMap.removeLayer(tripMarker);
      tripMarker = null;
    }

    if (!trip) {
      tripMap.setView(defaultMapCenter, defaultMapZoom, { animate: false });
      setMapNote('Sem viagem para exibir no mapa.');
      requestAnimationFrame(() => tripMap.invalidateSize());
      return;
    }

    setMapNote('Buscando localizacao da viagem no mapa...');
    const coords = readCoords(trip.coords) || await geocodeDestination(trip.destino);
    if (token !== renderToken) return;

    if (!coords) {
      tripMap.setView(defaultMapCenter, defaultMapZoom, { animate: false });
      setMapNote('Nao foi possivel localizar este destino no mapa.');
      requestAnimationFrame(() => tripMap.invalidateSize());
      return;
    }

    tripMarker = L.marker([coords.lat, coords.lng]).addTo(tripMap);
    tripMarker.bindPopup(trip.destino || 'Viagem');
    tripMap.setView([coords.lat, coords.lng], focusMapZoom, { animate: false });
    setMapNote(`Mapa centralizado em: ${trip.destino || 'Destino da viagem'}.`);
    requestAnimationFrame(() => tripMap.invalidateSize());
  };

  const alignBalloonPointer = (cardEl) => {
    if (!cardEl) return;
    const cardRect = cardEl.getBoundingClientRect();
    const balloonRect = balloonEl.getBoundingClientRect();
    if (!balloonRect.width) return;
    const centerX = (cardRect.left + cardRect.width / 2) - balloonRect.left;
    const clamped = Math.max(20, Math.min(balloonRect.width - 20, centerX));
    balloonEl.style.setProperty('--trip-balloon-pointer-x', `${clamped}px`);
  };

  const renderBalloon = async (key) => {
    renderToken += 1;
    const token = renderToken;
    const list = groups[key] || [];
    if (!list.length) groupIndex[key] = 0;
    else groupIndex[key] = ((groupIndex[key] % list.length) + list.length) % list.length;
    const trip = list[groupIndex[key]] || null;
    if (!trip) {
      mediaEl.style.backgroundImage = "url('img/default_trip.png')";
      pillEl.textContent = filterTag[key] || 'Viagem';
      datesEl.textContent = 'Sem registros';
      titleEl.textContent = 'Nenhuma viagem neste grupo';
      metaEl.textContent = 'Adicione viagens na pagina Viagens para preencher este bloco.';
      descEl.textContent = 'Sem descricao disponivel.';
      navEl.style.display = 'none';
      await renderTripMap(null, token);
      return;
    }

    const periodo = trip.dataIda && trip.dataVolta
      ? `${formatBR(trip.dataIda)} - ${formatBR(trip.dataVolta)}`
      : trip.dataIda
        ? `Partida em ${formatBR(trip.dataIda)}`
        : trip.dataVolta
          ? `Retorno em ${formatBR(trip.dataVolta)}`
          : 'Sem data definida';

    mediaEl.style.backgroundImage = `url('${trip.imagem || 'img/default_trip.png'}')`;
    pillEl.textContent = trip.categoria || filterTag[key] || 'Viagem';
    datesEl.textContent = periodo;
    titleEl.textContent = trip.destino || 'Viagem';

    const metaParts = [];
    if (trip.orcamento) metaParts.push(`Orcamento: R$ ${Number(trip.orcamento).toFixed(2)}`);
    if (trip.categoria) metaParts.push(`Tipo: ${trip.categoria}`);
    metaEl.textContent = metaParts.join(' • ') || 'Sem metadados adicionais.';

    descEl.textContent = trip.localDescription || 'Sem descricao do local. Edite a viagem para adicionar detalhes.';
    navEl.style.display = list.length > 1 ? 'inline-flex' : 'none';
    countEl.textContent = `${groupIndex[key] + 1}/${list.length}`;
    await renderTripMap(trip, token);
  };

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      cards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      activeGroup = card.dataset.tripFilter;
      void renderBalloon(activeGroup);
      requestAnimationFrame(() => alignBalloonPointer(card));
    });
  });

  const firstActive = cards.find((c) => c.classList.contains('active')) || cards[0];
  if (firstActive) {
    activeGroup = firstActive.dataset.tripFilter;
    initTripMap();
    void renderBalloon(activeGroup);
    requestAnimationFrame(() => alignBalloonPointer(firstActive));
  }

  balloonEl.classList.add('is-clickable');
  balloonEl.setAttribute('role', 'link');
  balloonEl.setAttribute('tabindex', '0');
  balloonEl.setAttribute('aria-label', 'Abrir pagina de viagens');

  balloonEl.addEventListener('click', (event) => {
    if (shouldIgnoreBalloonClick(event.target)) return;
    goToTravelsPage();
  });

  balloonEl.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    goToTravelsPage();
  });

  prevBtn.addEventListener('click', () => {
    const list = groups[activeGroup] || [];
    if (list.length <= 1) return;
    groupIndex[activeGroup] = (groupIndex[activeGroup] - 1 + list.length) % list.length;
    void renderBalloon(activeGroup);
  });

  nextBtn.addEventListener('click', () => {
    const list = groups[activeGroup] || [];
    if (list.length <= 1) return;
    groupIndex[activeGroup] = (groupIndex[activeGroup] + 1) % list.length;
    void renderBalloon(activeGroup);
  });

  window.addEventListener('resize', () => {
    const activeCard = cards.find((c) => c.classList.contains('active'));
    if (activeCard) alignBalloonPointer(activeCard);
  });
});
