(function () {
  'use strict';

  const ensureSkipLink = () => {
    if (document.querySelector('.app-skip-link')) return;
    const link = document.createElement('a');
    link.href = '#main-content';
    link.className = 'app-skip-link';
    link.textContent = 'Ir para o conteúdo';
    document.body.prepend(link);

    const main = document.querySelector('main');
    if (main && !main.id) main.id = 'main-content';
  };

  const normalizeShell = () => {
    document.body.classList.add('app-shell');

    const hasShapes = document.querySelector('.index-bg-shapes');
    const header = document.querySelector('header');
    if (!hasShapes && header && document.querySelector('link[href*="css/style.css"]')) {
      document.body.classList.add('index-page');
      const shapes = document.createElement('div');
      shapes.className = 'index-bg-shapes';
      shapes.setAttribute('aria-hidden', 'true');
      shapes.innerHTML = '<span class="shape s1"></span><span class="shape s2"></span><span class="shape s3"></span><span class="shape s4"></span><span class="shape s5"></span>';
      document.body.insertBefore(shapes, document.body.firstChild);
    }
  };

  const makeImagesLazy = () => {
    document.querySelectorAll('img').forEach((img) => {
      if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
    });

    const logo = document.querySelector('header .logo-link img');
    if (logo) {
      logo.setAttribute('loading', 'eager');
      logo.setAttribute('decoding', 'sync');
    }
  };

  const ensureAriaLabels = () => {
    document.querySelectorAll('button').forEach((btn) => {
      if (btn.getAttribute('aria-label')) return;
      const text = (btn.textContent || '').replace(/\s+/g, ' ').trim();
      const title = btn.getAttribute('title');
      if (text) {
        btn.setAttribute('aria-label', text);
      } else if (title) {
        btn.setAttribute('aria-label', title);
      }
    });

    document.querySelectorAll('.dropdown-toggle').forEach((btn) => {
      if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', 'Abrir submenu');
      btn.setAttribute('aria-haspopup', 'true');
    });
  };

  const watchModalState = () => {
    const modalSelectors = '.modal, .app-overlay, .notification-panel.active, .notification-panel.open';
    const sync = () => {
      const hasOpen = Array.from(document.querySelectorAll(modalSelectors)).some((el) => {
        if (el.classList.contains('modal') || el.classList.contains('app-overlay')) {
          return el.classList.contains('active') || el.classList.contains('open');
        }
        return true;
      });
      document.body.classList.toggle('app-modal-open', hasOpen);
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'] });
    sync();
  };

  document.addEventListener('DOMContentLoaded', () => {
    normalizeShell();
    ensureSkipLink();
    makeImagesLazy();
    ensureAriaLabels();
    watchModalState();
  });
})();
