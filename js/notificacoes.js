document.addEventListener('DOMContentLoaded', () => {
  class NotificationManager {
    constructor() {
      this.dismissedKey = 'sol-de-soter-dismissed-notifications';
      this.bell = document.getElementById('notification-bell');
      this.countBadge = document.getElementById('notification-count');
      this.panel = document.getElementById('notification-panel');
      this.list = document.getElementById('notification-list');

      if (!this.bell) return;

      this.notifications = [];
      this.dismissedNotifications = this.loadDismissedNotifications();
      this.bindEvents();
      this.setupPanelActions();
      this.fetchAllNotifications();
    }

    bindEvents() {
      this.bell.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePanel();
      });

      window.addEventListener('resize', () => {
        if (this.panel.classList.contains('active')) this.alignPanelPointer();
      });

      document.addEventListener('click', (e) => {
        if (!this.panel.contains(e.target)) this.closePanel();
      });
    }

    togglePanel() {
      this.panel.classList.toggle('active');
      if (this.panel.classList.contains('active')) {
        requestAnimationFrame(() => this.alignPanelPointer());
      }
    }

    closePanel() {
      this.panel.classList.remove('active');
    }

    alignPanelPointer() {
      if (!this.bell || !this.panel) return;
      const bellRect = this.bell.getBoundingClientRect();
      const panelRect = this.panel.getBoundingClientRect();
      if (!panelRect.width) return;

      const centerX = bellRect.left + (bellRect.width / 2) - panelRect.left;
      const triangleHalf = 9;
      const clamped = Math.max(triangleHalf, Math.min(panelRect.width - triangleHalf, centerX));
      this.panel.style.setProperty('--notification-pointer-x', `${clamped}px`);
    }

    setupPanelActions() {
      const header = this.panel.querySelector('.notification-panel-header');
      if (!header) return;

      let clearBtn = header.querySelector('.notification-clear-btn');
      if (!clearBtn) {
        clearBtn = document.createElement('button');
        clearBtn.className = 'notification-clear-btn';
        clearBtn.type = 'button';
        clearBtn.textContent = 'Limpar';
        header.appendChild(clearBtn);
      }

      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.clearAllNotifications();
      });
      this.clearBtn = clearBtn;
    }

    loadDismissedNotifications() {
      try {
        const data = JSON.parse(localStorage.getItem(this.dismissedKey)) || [];
        return new Set(Array.isArray(data) ? data : []);
      } catch (_) {
        return new Set();
      }
    }

    saveDismissedNotifications() {
      localStorage.setItem(
        this.dismissedKey,
        JSON.stringify([...this.dismissedNotifications])
      );
    }

    getNotificationId(notif) {
      return notif.id || `${notif.type}|${notif.text}|${notif.timestamp}`;
    }

    dismissNotification(notif) {
      this.dismissedNotifications.add(this.getNotificationId(notif));
      this.saveDismissedNotifications();
    }

    clearAllNotifications() {
      this.notifications.forEach((notif) => this.dismissNotification(notif));
      this.notifications = [];
      this.render();
      this.closePanel();
    }

    handleNotificationClick(notif) {
      if (notif.url) {
        window.location.href = notif.url;
      }
    }

    dismissSingleNotification(notif, itemEl) {
      this.dismissNotification(notif);
      if (itemEl) itemEl.remove();
      this.notifications = this.notifications.filter(
        (n) => this.getNotificationId(n) !== this.getNotificationId(notif)
      );
      this.render();
    }

    fetchAllNotifications() {
      this.notifications = [];

      const metas = this.getMetasNotifications();
      const tarefas = this.getTarefasNotifications();
      const tarefasSemData = this.getNoDateTasksReminderNotifications();
      const financas = this.getFinancasNotifications();
      const conquistas = this.getConquistasNotifications();
      const estudos = this.getEstudosNotifications();
      const biblioteca = this.getBibliotecaNotifications();

      const allNotifications = [
        ...metas,
        ...tarefas,
        ...tarefasSemData,
        ...financas,
        ...conquistas,
        ...estudos,
        ...biblioteca,
      ];

      this.notifications = allNotifications.filter(
        (notif) => !this.dismissedNotifications.has(this.getNotificationId(notif))
      );

      this.render();
    }

    getMetasNotifications() {
      const metas = JSON.parse(localStorage.getItem('metas-objetivos')) || [];
      const notifications = [];
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const umaSemanaEmMs = 7 * 24 * 60 * 60 * 1000;

      metas
        .filter((meta) => meta.prazo && meta.status !== 'concluida')
        .forEach((meta) => {
          const prazo = new Date(meta.prazo + 'T00:00:00');
          const diff = prazo.getTime() - hoje.getTime();

          if (diff >= 0 && diff <= umaSemanaEmMs) {
            const diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24));
            notifications.push({
              id: `meta-${meta.id || `${meta.titulo}-${meta.prazo}`}`,
              icon: 'fa-bullseye',
              type: 'meta',
              text: `A meta "${meta.titulo}" vence em ${diasRestantes} dia(s).`,
              timestamp: `Prazo: ${prazo.toLocaleDateString('pt-BR')}`,
              url: 'sonhos.html',
            });
          }
        });
      return notifications;
    }

    getTarefasNotifications() {
      const tarefas = JSON.parse(localStorage.getItem('sol-de-soter-tasks')) || [];
      const notifications = [];
      const hojeFormatado = new Date().toISOString().slice(0, 10);

      tarefas
        .filter((tarefa) => tarefa.date === hojeFormatado && !tarefa.completed)
        .forEach((tarefa) => {
          notifications.push({
            id: `tarefa-hoje-${tarefa.id || tarefa.title}`,
            icon: 'fa-tasks',
            type: 'tarefa',
            text: `Tarefa para hoje: "${tarefa.title}".`,
            timestamp: `Prioridade: ${tarefa.priority || 'N/A'}`,
            url: 'planejamento.html',
          });
        });
      return notifications;
    }

    getNoDateTasksReminderNotifications() {
      const reminderKey = 'sol-de-soter-no-date-tasks-last-reminder';
      const tarefas = JSON.parse(localStorage.getItem('sol-de-soter-tasks')) || [];
      const tarefasSemData = tarefas.filter((tarefa) => !tarefa.date && !tarefa.completed);

      if (tarefasSemData.length === 0) {
        localStorage.removeItem(reminderKey);
        return [];
      }

      const hoje = this.getDateKeyLocal(new Date());
      const ultimoLembrete = localStorage.getItem(reminderKey);

      if (ultimoLembrete && ultimoLembrete !== hoje) {
        const diasDesdeUltimo = this.daysBetweenDateKeys(ultimoLembrete, hoje);
        if (diasDesdeUltimo < 3) return [];
      }

      if (!ultimoLembrete || ultimoLembrete !== hoje) {
        localStorage.setItem(reminderKey, hoje);
      }

      const limiteNomes = 4;
      const titulos = tarefasSemData.slice(0, limiteNomes).map((t) => `"${t.title}"`);
      const restantes = tarefasSemData.length - limiteNomes;
      const complemento = restantes > 0 ? ` e mais ${restantes}.` : '.';

      return [
        {
          id: `tarefas-sem-data-${hoje}`,
          icon: 'fa-calendar-xmark',
          type: 'tarefa-sem-data',
          text: `Tarefas sem data (${tarefasSemData.length}): ${titulos.join(', ')}${complemento}`,
          timestamp: 'Lembrete recorrente: a cada 3 dias',
          url: 'planejamento.html',
        },
      ];
    }

    getDateKeyLocal(date) {
      const ano = date.getFullYear();
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const dia = String(date.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    }

    daysBetweenDateKeys(startKey, endKey) {
      const start = new Date(`${startKey}T00:00:00`);
      const end = new Date(`${endKey}T00:00:00`);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const diff = end.getTime() - start.getTime();
      return Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    getEstudosNotifications() {
      const topics = JSON.parse(localStorage.getItem('studyPlannerTopics')) || [];
      const notifications = [];
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      topics.forEach((topic) => {
        if (!topic.nextReviewAt) return;
        const reviewDate = new Date(topic.nextReviewAt);
        reviewDate.setHours(0, 0, 0, 0);

        if (reviewDate.getTime() <= hoje.getTime()) {
          notifications.push({
            id: `estudo-${topic.id || `${topic.name}-${topic.nextReviewAt}`}`,
            icon: 'fa-book-open',
            type: 'estudo',
            text: `Revisao de estudo: "${topic.name}".`,
            timestamp: `Curso: ${topic.course || 'Geral'}`,
            url: 'estudos.html',
          });
        }
      });
      return notifications;
    }

    getFinancasNotifications() {
      return [];
    }

    getConquistasNotifications() {
      return [];
    }

    getBibliotecaNotifications() {
      const toInt = (value) => parseInt(value || 0, 10) || 0;
      const parseDate = (value) => {
        if (!value) return null;
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
      };
      const daysDiff = (from, to) => {
        const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
        const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
        return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
      };

      const livros = JSON.parse(localStorage.getItem('livrosTracker') || '[]');
      const midias = JSON.parse(localStorage.getItem('midiasTracker') || '[]');
      const mangas = JSON.parse(localStorage.getItem('mangasTracker') || '[]');
      const historicoLivrosPorItem = JSON.parse(localStorage.getItem('historicoProgressoLivros') || '{}');
      const historicoMangaPorItem = JSON.parse(localStorage.getItem('historicoProgressoMangasItens') || '{}');
      const historicoMidiaPorItem = JSON.parse(localStorage.getItem('historicoProgressoMidiaItens') || '{}');

      const normalizeBooks = (items, source) => (items || []).map((item) => ({
        source,
        id: String(item && item.id ? item.id : item && item.titulo ? item.titulo : ''),
        title: (item && item.titulo) || 'Item sem título',
        done: Boolean(item && item.lido),
        startDate: parseDate(item && item.dataInicio),
      }));

      const allItems = [
        ...normalizeBooks(livros, 'livraria'),
        ...normalizeBooks(midias, 'cinema'),
        ...normalizeBooks(mangas, 'mangas'),
      ].filter((item) => !item.done);

      const getLastProgressDate = (entry) => {
        const historyObj = entry.source === 'livraria'
          ? historicoLivrosPorItem
          : entry.source === 'mangas'
            ? historicoMangaPorItem
            : historicoMidiaPorItem;

        let latest = null;
        Object.entries(historyObj || {}).forEach(([dateKey, payload]) => {
          let value = 0;
          if (entry.source === 'livraria') value = toInt(payload && payload.books && payload.books[entry.id]);
          else value = toInt(payload && payload.items && payload.items[entry.id]);
          if (value <= 0) return;
          if (!latest || String(dateKey) > String(latest)) latest = String(dateKey);
        });
        return latest;
      };

      const today = new Date();
      const riskItems = allItems
        .map((entry) => {
          const lastProgressKey = getLastProgressDate(entry);
          let inactiveDays = null;
          if (lastProgressKey) {
            inactiveDays = daysDiff(today, new Date(`${lastProgressKey}T00:00:00`));
          } else if (entry.startDate) {
            inactiveDays = daysDiff(today, entry.startDate);
          }
          return { ...entry, inactiveDays };
        })
        .filter((entry) => Number.isFinite(entry.inactiveDays) && entry.inactiveDays >= 10)
        .sort((a, b) => b.inactiveDays - a.inactiveDays)
        .slice(0, 3);

      return riskItems.map((entry) => ({
        id: `biblioteca-risco-${entry.source}-${entry.id}`,
        icon: 'fa-triangle-exclamation',
        type: 'biblioteca-risco',
        text: `"${entry.title}" está em risco de abandono.`,
        timestamp: `${entry.inactiveDays} dia(s) sem progresso`,
        url: 'biblioteca.html',
      }));
    }

    render() {
      const count = this.notifications.length;
      if (count > 0) {
        this.countBadge.textContent = count;
        this.countBadge.style.display = 'flex';
      } else {
        this.countBadge.style.display = 'none';
      }
      if (this.clearBtn) this.clearBtn.style.display = count > 0 ? 'inline-flex' : 'none';

      this.list.innerHTML = '';

      if (count === 0) {
        this.list.innerHTML = `
          <li class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>Nenhuma notificacao nova</p>
          </li>
        `;
        return;
      }

      this.notifications.forEach((notif) => {
        const item = document.createElement('li');
        item.className = 'notification-item notification-item-clickable';
        item.setAttribute('role', 'button');
        item.tabIndex = 0;

        const iconWrap = document.createElement('div');
        iconWrap.className = `notification-icon ${notif.type}`;
        const icon = document.createElement('i');
        icon.className = `fas ${notif.icon}`;
        iconWrap.appendChild(icon);

        const content = document.createElement('div');
        content.className = 'notification-content';
        const p = document.createElement('p');
        p.textContent = notif.text;
        const span = document.createElement('span');
        span.textContent = notif.timestamp;
        content.appendChild(p);
        content.appendChild(span);

        const dismissBtn = document.createElement('button');
        dismissBtn.className = 'notification-dismiss-btn';
        dismissBtn.type = 'button';
        dismissBtn.setAttribute('aria-label', 'Dispensar notificacao');
        dismissBtn.innerHTML = '<i class="fas fa-times"></i>';
        dismissBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.dismissSingleNotification(notif, item);
        });

        item.appendChild(iconWrap);
        item.appendChild(content);
        item.appendChild(dismissBtn);
        item.addEventListener('click', () => this.handleNotificationClick(notif));
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleNotificationClick(notif);
          }
        });
        this.list.appendChild(item);
      });
    }
  }

  new NotificationManager();
});
