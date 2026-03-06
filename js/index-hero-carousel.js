document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('dream-hero-track');
  const titleEl = document.getElementById('dream-hero-title');
  const descEl = document.getElementById('dream-hero-desc');
  const badgeEl = document.getElementById('dream-hero-badge');
  const thumbsEl = document.getElementById('dream-hero-thumbs');
  const linkEl = document.getElementById('dream-hero-link');

  if (!track || !titleEl || !descEl || !thumbsEl || !badgeEl || !linkEl) return;

  const ls = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  };

  const dreamsRaw = ls('sonhos-objetivos', []);
  const dreamsList = Array.isArray(dreamsRaw) ? dreamsRaw : [];
  const categoryLabel = (value) => {
    const key = String(value || '').toLowerCase().trim();
    const map = {
      pessoal: 'Pessoal',
      profissional: 'Profissional',
      educacao: 'Educacao',
      saude: 'Saude',
      financeiro: 'Financeiro',
      viagem: 'Viagem',
      viagens: 'Viagens',
      outros: 'Outros',
    };
    if (map[key]) return map[key];
    if (!key) return 'Sonho';
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  const slidesData = dreamsList
    .filter((d) => d && d.imagem)
    .map((d) => ({
      title: d.titulo || 'Sonho',
      description: d.descricao || 'Transforme este sonho em um plano com metas claras.',
      image: d.imagem,
      category: categoryLabel(d.categoria),
    }));

  if (!slidesData.length) {
    slidesData.push(
      {
        title: 'Seu próximo sonho começa aqui',
        description: 'Cadastre sonhos para ver suas imagens em destaque neste carrossel.',
        image: 'img/default_dream.png',
        category: 'Sonho',
      },
      {
        title: 'Visualize seus objetivos',
        description: 'Use a página de Sonhos para adicionar imagens e acompanhar o progresso.',
        image: 'img/soldesoter_logo.png',
        category: 'Sonho',
      }
    );
  }

  track.innerHTML = slidesData
    .map((slide, index) => `<div class="dream-hero-slide ${index === 0 ? 'active' : ''}" style="background-image:url('${slide.image}')"></div>`)
    .join('');

  const slides = Array.from(track.querySelectorAll('.dream-hero-slide'));

  let current = 0;
  let timer = null;

  const getVisibleIndexes = () => {
    if (slidesData.length <= 3) return slidesData.map((_, i) => i);
    return [
      (current - 1 + slidesData.length) % slidesData.length,
      current,
      (current + 1) % slidesData.length,
    ];
  };

  const renderThumbs = () => {
    const visible = getVisibleIndexes();
    thumbsEl.innerHTML = visible
      .map((realIdx) => {
        const slide = slidesData[realIdx];
        return `<button class="dream-hero-thumb ${realIdx === current ? 'active' : ''}" data-hero-index="${realIdx}" style="background-image:url('${slide.image}')" aria-label="Ir para sonho ${realIdx + 1}"></button>`;
      })
      .join('');

    Array.from(thumbsEl.querySelectorAll('.dream-hero-thumb')).forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const idx = Number(thumb.dataset.heroIndex || 0);
        render(idx);
        start();
      });
    });
  };

  const render = (idx) => {
    current = (idx + slidesData.length) % slidesData.length;
    slides.forEach((el, i) => el.classList.toggle('active', i === current));
    renderThumbs();

    const data = slidesData[current];
    titleEl.textContent = data.title;
    descEl.textContent = data.description;
    badgeEl.textContent = data.category || 'Sonho';
  };

  const next = () => render(current + 1);

  const start = () => {
    if (timer) clearInterval(timer);
    timer = setInterval(next, 6500);
  };

  linkEl.addEventListener('click', () => {
    if (timer) clearInterval(timer);
  });

  render(0);
  start();
});


