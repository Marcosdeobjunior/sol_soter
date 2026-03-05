(function () {
  'use strict';

  const VERSION = '2.0';

  const moduleMap = {
    livraria: ['livrosTracker'],
    cinema: ['midiasTracker'],
    mangas: ['mangasTracker'],
    sonhos: ['sonhos-objetivos', 'metas-objetivos', 'conquistas-objetivos', 'gamificacao-objetivos'],
    viagens: ['travels'],
    carrinho: ['wishlistItems', 'purchasedItems', 'cartItems', 'wishlistShoppingListsV1'],
    financas: ['financeiro-widget', 'auditoria-financas-sonhos', 'financeiro-contas'],
    planejamento: ['sol-de-soter-tasks', 'sol-de-soter-tasks-archive'],
    diario: ['diario_entradas_v1'],
    estudos: ['studyPlannerTopics'],
    academia: ['academia-body-photo-v1', 'academia-profile-v1', 'academia-weight-history-v1', 'academia-training-days-v1', 'academia-diet-v1', 'academia-exercise-progress-v1', 'academia-exercise-library-v1', 'academia-day-sessions-v1']
  };

  const safeGet = (key) => {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return localStorage.getItem(key); }
  };

  const safeSet = (key, value) => {
    if (value === undefined) return;
    if (typeof value === 'string') localStorage.setItem(key, value);
    else localStorage.setItem(key, JSON.stringify(value));
  };

  const exportGlobal = () => {
    const payload = {
      meta: {
        appName: 'Sol de Sóter',
        schemaVersion: VERSION,
        exportDate: new Date().toISOString(),
        type: 'global'
      },
      modules: {}
    };

    Object.entries(moduleMap).forEach(([moduleName, keys]) => {
      payload.modules[moduleName] = {};
      keys.forEach((k) => {
        payload.modules[moduleName][k] = safeGet(k);
      });
    });

    return payload;
  };

  const exportModule = (moduleName) => {
    const keys = moduleMap[moduleName] || [];
    const payload = {
      meta: {
        appName: 'Sol de Sóter',
        schemaVersion: VERSION,
        exportDate: new Date().toISOString(),
        type: 'module',
        module: moduleName
      },
      modules: {
        [moduleName]: {}
      }
    };
    keys.forEach((k) => {
      payload.modules[moduleName][k] = safeGet(k);
    });
    return payload;
  };

  const applyImport = (payload) => {
    if (!payload || !payload.meta || !payload.modules) throw new Error('Arquivo inválido');
    const schemaVersion = String(payload.meta.schemaVersion || payload.meta.version || '1.0');
    if (!schemaVersion) throw new Error('Versão ausente');

    Object.entries(payload.modules).forEach(([moduleName, records]) => {
      if (!moduleMap[moduleName]) return;
      Object.entries(records || {}).forEach(([k, v]) => safeSet(k, v));
    });
  };

  const downloadJSON = (data, prefix) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${prefix}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 0);
  };

  const ensureOverlay = () => {
    let overlay = document.getElementById('data-portability-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'data-portability-overlay';
    overlay.className = 'app-overlay';

    const moduleOptions = Object.keys(moduleMap).map((m) => `<option value="${m}">${m}</option>`).join('');
    overlay.innerHTML = `
      <div class="app-dialog" role="dialog" aria-modal="true" aria-labelledby="data-portability-title">
        <h3 id="data-portability-title">Backup e Restauração</h3>
        <div class="app-row">
          <button type="button" id="dp-export-global">Exportar Global</button>
          <select id="dp-module-select" aria-label="Selecionar módulo">${moduleOptions}</select>
          <button type="button" id="dp-export-module">Exportar Módulo</button>
          <button type="button" id="dp-import-trigger">Importar JSON</button>
          <input type="file" id="dp-import-input" accept="application/json" hidden />
        </div>
        <div class="app-portability-grid" id="dp-modules-preview"></div>
        <p class="app-portability-feedback" id="dp-feedback">Atalho: Ctrl+Shift+B</p>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  };

  const setFeedback = (msg) => {
    const el = document.getElementById('dp-feedback');
    if (el) el.textContent = msg;
  };

  const renderPreview = () => {
    const root = document.getElementById('dp-modules-preview');
    if (!root) return;
    root.innerHTML = Object.entries(moduleMap).map(([moduleName, keys]) => {
      const count = keys.reduce((acc, key) => {
        const value = safeGet(key);
        if (Array.isArray(value)) return acc + value.length;
        if (value && typeof value === 'object') return acc + 1;
        if (value != null) return acc + 1;
        return acc;
      }, 0);
      return `<div class="app-search-item"><div class="app-search-title">${moduleName}</div><div class="app-search-meta">registros estimados: ${count}</div></div>`;
    }).join('');
  };

  const open = () => {
    const overlay = ensureOverlay();
    overlay.classList.add('open');
    renderPreview();
  };

  const close = () => {
    const overlay = document.getElementById('data-portability-overlay');
    if (overlay) overlay.classList.remove('open');
  };

  const wire = () => {
    const overlay = ensureOverlay();
    if (overlay.dataset.wired === '1') return;
    overlay.dataset.wired = '1';

    const exportGlobalBtn = overlay.querySelector('#dp-export-global');
    const exportModuleBtn = overlay.querySelector('#dp-export-module');
    const moduleSelect = overlay.querySelector('#dp-module-select');
    const importTrigger = overlay.querySelector('#dp-import-trigger');
    const importInput = overlay.querySelector('#dp-import-input');

    exportGlobalBtn.addEventListener('click', () => {
      downloadJSON(exportGlobal(), 'sol-de-soter-backup-global');
      setFeedback('Backup global exportado.');
    });

    exportModuleBtn.addEventListener('click', () => {
      const moduleName = moduleSelect.value;
      if (!moduleName) return;
      downloadJSON(exportModule(moduleName), `sol-de-soter-backup-${moduleName}`);
      setFeedback(`Backup do módulo ${moduleName} exportado.`);
    });

    importTrigger.addEventListener('click', () => importInput.click());

    importInput.addEventListener('change', (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const payload = JSON.parse(String(reader.result || '{}'));
          applyImport(payload);
          renderPreview();
          setFeedback('Importação concluída. Recarregue a página se necessário.');
        } catch (error) {
          setFeedback(`Falha na importação: ${error.message}`);
        }
      };
      reader.onerror = () => setFeedback('Falha ao ler arquivo de importação.');
      reader.readAsText(file);
      importInput.value = '';
    });
  };

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      wire();
      open();
      return;
    }
    if (e.key === 'Escape') close();
  });

  document.addEventListener('click', (e) => {
    const overlay = document.getElementById('data-portability-overlay');
    if (overlay && e.target === overlay) close();
  });

  window.SDSDataPortability = { exportGlobal, exportModule, applyImport, open };
})();
