document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('wishlist-highlight-grid');
  if (!grid) return;

  const ls = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  };

  const items = ls('wishlistItems', []);
  const selected = (Array.isArray(items) ? items : [])
    .filter((it) => {
      const p = String(it.priority || '').toLowerCase();
      return p === 'urgente' || p === 'importante' || p === 'alta';
    })
    .sort((a, b) => {
      const score = { urgente: 3, importante: 2, alta: 2, media: 1, baixa: 0 };
      const pa = score[String(a.priority || '').toLowerCase()] || 0;
      const pb = score[String(b.priority || '').toLowerCase()] || 0;
      return pb - pa;
    });

  if (!selected.length) {
    grid.innerHTML = '<p class="wishlist-empty">Nenhum item importante/urgente na wishlist.</p>';
    return;
  }

  const asMoney = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 'R$ 0,00';
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const normalizeTag = (value) => {
    const p = String(value || '').toLowerCase();
    if (p === 'urgente') return { cls: 'urgente', label: 'Urgente' };
    return { cls: 'importante', label: 'Importante' };
  };

  grid.innerHTML = selected.map((it) => {
    const tag = normalizeTag(it.priority);
    const name = String(it.name || 'Item').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const image = it.image || 'img/default_product.png';
    return `
      <a class="wishlist-item wishlist-item-link" href="wishlist.html" aria-label="Abrir pagina wishlist">
        <img src="${image}" alt="${name}" loading="lazy" />
        <div class="wishlist-item-body">
          <div class="wishlist-item-name">${name}</div>
          <div class="wishlist-item-price">${asMoney(it.price)}</div>
          <div class="wishlist-item-tags">
            <span class="wishlist-tag ${tag.cls}">${tag.label}</span>
          </div>
        </div>
      </a>
    `;
  }).join('');
});
