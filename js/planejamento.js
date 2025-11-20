// Lógica de Dropdown Global
document.querySelectorAll(".dropdown").forEach((dropdownContainer) => {
  const toggle = dropdownContainer.querySelector(".dropdown-header, .profile");
  if (toggle) {
    toggle.addEventListener("click", (event) => {
      if (event.target.tagName === "A") return;
      document.querySelectorAll(".dropdown.active").forEach((active) => {
        if (active !== dropdownContainer) active.classList.remove("active");
      });
      dropdownContainer.classList.toggle("active");
    });
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown")) {
    document
      .querySelectorAll(".dropdown.active")
      .forEach((d) => d.classList.remove("active"));
  }
});

document.addEventListener("DOMContentLoaded", () => {
  if (typeof atualizarSaldoGlobal === "function") atualizarSaldoGlobal();
});

window.addEventListener("storage", (event) => {
  if (
    event.key === "financeiro-widget" &&
    typeof atualizarSaldoGlobal === "function"
  ) {
    atualizarSaldoGlobal();
  }
});

// ===== SISTEMA RPG (GAMIFICATION) ===== //
class RPGSystem {
  constructor() {
    this.data = this.loadData();
    this.updateUI();
  }

  loadData() {
    const saved = localStorage.getItem("sol-de-soter-rpg");
    // Estrutura inicial padrão
    return saved
      ? JSON.parse(saved)
      : {
          level: 1,
          xp: 0,
          xpToNextLevel: 100,
          stats: {
            strength: { lvl: 1, xp: 0, name: "Força" },
            intelligence: { lvl: 1, xp: 0, name: "Intelecto" },
            wisdom: { lvl: 1, xp: 0, name: "Sabedoria" },
            productivity: { lvl: 1, xp: 0, name: "Produtividade" },
          },
        };
  }

  saveData() {
    localStorage.setItem("sol-de-soter-rpg", JSON.stringify(this.data));
    this.updateUI();
  }

  // Ganhar XP baseado na categoria
  gainXP(category) {
    const xpAmount = 10; // XP base por tarefa
    let statKey = "productivity"; // Default

    // Mapeamento de Categorias para Stats
    if (category === "health") statKey = "strength";
    else if (category === "study") statKey = "intelligence";
    else if (category === "financeiro" || category === "meta")
      statKey = "wisdom";
    else if (category === "sonho") statKey = "wisdom"; // Sonhos dão sabedoria

    // Atualiza Stat Específico
    const stat = this.data.stats[statKey];
    stat.xp += xpAmount;

    // Level Up do Stat Específico (Simples: lvl * 50)
    const statNextLvl = stat.lvl * 50;
    let statLeveledUp = false;
    if (stat.xp >= statNextLvl) {
      stat.lvl++;
      stat.xp -= statNextLvl;
      statLeveledUp = true;
    }

    // Atualiza XP Geral
    this.data.xp += xpAmount;
    let charLeveledUp = false;
    if (this.data.xp >= this.data.xpToNextLevel) {
      this.data.level++;
      this.data.xp -= this.data.xpToNextLevel;
      this.data.xpToNextLevel = Math.floor(this.data.xpToNextLevel * 1.2); // Curva de dificuldade
      charLeveledUp = true;
    }

    this.saveData();
    this.showToast(xpAmount, statKey, statLeveledUp, charLeveledUp);
  }

  // Atualiza Elementos da Interface (Header e Menu)
  updateUI() {
    // XP Geral no Header
    const xpPercent = (this.data.xp / this.data.xpToNextLevel) * 100;
    const headerBar = document.getElementById("header-xp-bar");
    const headerBadge = document.getElementById("header-level-badge");

    if (headerBar) headerBar.style.width = `${xpPercent}%`;
    if (headerBadge) headerBadge.textContent = this.data.level;

    // Stats Detalhados no Menu Dropdown
    this.updateStatUI("str", "strength");
    this.updateStatUI("int", "intelligence");
    this.updateStatUI("wis", "wisdom");
    this.updateStatUI("prod", "productivity");
  }

  updateStatUI(idSuffix, statKey) {
    const stat = this.data.stats[statKey];
    const nextLvl = stat.lvl * 50;
    const percent = (stat.xp / nextLvl) * 100;

    const lvlEl = document.getElementById(`lvl-${idSuffix}`);
    const barEl = document.getElementById(`bar-${idSuffix}`);

    if (lvlEl) lvlEl.textContent = stat.lvl;
    if (barEl) barEl.style.width = `${percent}%`;
  }

  showToast(xp, type, statLevelUp, charLevelUp) {
    const container = document.getElementById("rpg-toast-container");
    if (!container) return;

    // Ícones
    const icons = {
      strength: '<i class="fas fa-dumbbell"></i>',
      intelligence: '<i class="fas fa-brain"></i>',
      wisdom: '<i class="fas fa-scroll"></i>',
      productivity: '<i class="fas fa-briefcase"></i>',
    };

    // Notificação de XP
    const toast = document.createElement("div");
    toast.className = `rpg-toast toast-${
      type === "strength"
        ? "str"
        : type === "intelligence"
        ? "int"
        : type === "wisdom"
        ? "wis"
        : "prod"
    }`;
    toast.innerHTML = `${icons[type]} <span>+<span class="rpg-toast-xp">${xp} XP</span> em ${this.data.stats[type].name}</span>`;
    container.appendChild(toast);

    // Notificação de Level Up (Personagem)
    if (charLevelUp) {
      setTimeout(() => {
        const lvlToast = document.createElement("div");
        lvlToast.className = "rpg-toast toast-levelup";
        lvlToast.innerHTML = `<i class="fas fa-crown" style="color:gold"></i> <span>Level Up! Nível <span class="rpg-toast-xp">${this.data.level}</span></span>`;
        container.appendChild(lvlToast);
        setTimeout(() => lvlToast.remove(), 4500);
      }, 500);
    }

    // Remove toast após animação
    setTimeout(() => toast.remove(), 4500);
  }
}

// ===== CLASSE PRINCIPAL DE PLANEJAMENTO ===== //

class TaskPlanner {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = new Date();

    // Configuração de Paginação (ALTERADO PARA 5)
    this.currentPage = 1;
    this.itemsPerPage = 5;

    this.tasks = this.loadTasks();
    this.sonhos = this.loadSonhos();
    this.metas = this.loadMetas();
    this.estudos = this.loadEstudos();

    this.allItems = [];
    this.currentFilter = "all";
    this.currentSearchTerm = "";
    this.editingTaskId = null;

    // Inicializa RPG
    this.rpg = new RPGSystem();

    this.getAllItems();
    this.init();
  }

  init() {
    this.archiveOldTasks();
    this.renderCalendar();
    this.renderTasks();
    this.renderTodayColumn();
    this.updateStats();
    this.bindEvents();
  }

  // --- DATA LOADING ---
  loadTasks() {
    return JSON.parse(localStorage.getItem("sol-de-soter-tasks")) || [];
  }
  loadSonhos() {
    return JSON.parse(localStorage.getItem("sonhos-objetivos")) || [];
  }
  loadMetas() {
    return JSON.parse(localStorage.getItem("metas-objetivos")) || [];
  }
  loadEstudos() {
    return JSON.parse(localStorage.getItem("studyPlannerTopics")) || [];
  }
  loadArchive() {
    return JSON.parse(localStorage.getItem("sol-de-soter-tasks-archive")) || [];
  }

  getAllItems() {
    // Mapeamento para unificar formato
    const formatSonho = (s) => ({
      id: `sonho-${s.id}`,
      title: s.titulo,
      description: s.descricao,
      date: s.prazo,
      completed: s.concluido,
      category: "sonho",
      type: "sonho",
      priority: s.prioridade,
    });

    const formatMeta = (m) => ({
      id: `meta-${m.id}`,
      title: m.titulo,
      description: m.descricao,
      date: m.prazo,
      completed: m.status === "concluida",
      category: "meta",
      type: "meta",
    });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const formatEstudo = (e) => {
      const reviewDate = new Date(e.nextReviewAt);
      reviewDate.setHours(0, 0, 0, 0);
      return {
        id: `estudo-${e.id}`,
        title: e.name,
        description: `[Estudo] ${e.desc || ""} (${e.course})`,
        date: new Date(e.nextReviewAt).toISOString().slice(0, 10),
        completed: reviewDate.getTime() < hoje.getTime(), // Atrasado conta como "check" visual
        category: "study",
        priority: e.priority,
        type: "estudo",
      };
    };

    const tarefas = this.tasks.map((t) => ({ ...t, type: "task" }));
    const sonhos = this.sonhos
      .filter((s) => s.prazo && !s.concluido)
      .map(formatSonho);
    const metas = this.metas
      .filter((m) => m.prazo && m.status !== "concluida")
      .map(formatMeta);
    const estudos = this.estudos
      .filter((e) => e.nextReviewAt)
      .map(formatEstudo);

    this.allItems = [...tarefas, ...sonhos, ...metas, ...estudos];
  }

  saveTasks() {
    localStorage.setItem("sol-de-soter-tasks", JSON.stringify(this.tasks));
    this.getAllItems();
    this.updateStats();
    this.renderTasks();
    this.renderTodayColumn();
    this.renderCalendar();
  }

  // --- ARQUIVAMENTO ---
  archiveOldTasks() {
    const limit = new Date();
    limit.setMonth(limit.getMonth() - 2);
    const toArchive = this.tasks.filter(
      (t) => t.completed && t.completedAt && new Date(t.completedAt) < limit
    );
    if (toArchive.length > 0) {
      const keep = this.tasks.filter((t) => !toArchive.includes(t));
      const archive = this.loadArchive();
      localStorage.setItem(
        "sol-de-soter-tasks-archive",
        JSON.stringify([...archive, ...toArchive])
      );
      this.tasks = keep;
      this.saveTasks();
    }
  }

  manualArchiveTasks() {
    const completed = this.tasks.filter((t) => t.completed);
    if (completed.length === 0) return alert("Nada concluído para arquivar.");
    if (confirm(`Arquivar ${completed.length} tarefas concluídas?`)) {
      const keep = this.tasks.filter((t) => !t.completed);
      const archive = this.loadArchive();
      localStorage.setItem(
        "sol-de-soter-tasks-archive",
        JSON.stringify([...archive, ...completed])
      );
      this.tasks = keep;
      this.saveTasks();
      alert("Tarefas arquivadas!");
    }
  }

  // --- CALENDÁRIO ---
  renderCalendar() {
    const calendar = document.getElementById("calendar");
    const monthYear = document.getElementById("current-month-year");
    const months = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    monthYear.textContent = `${
      months[this.currentDate.getMonth()]
    } ${this.currentDate.getFullYear()}`;
    calendar.innerHTML = "";

    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    weekDays.forEach((day) => {
      const h = document.createElement("div");
      h.className = "calendar-header";
      h.textContent = day;
      calendar.appendChild(h);
    });

    const firstDay = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      1
    ).getDay();
    const daysInMonth = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      0
    ).getDate();

    for (let i = 0; i < firstDay; i++) {
      const d = document.createElement("div");
      d.className = "calendar-day other-month";
      calendar.appendChild(d);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth(),
        day
      );
      const dayEl = document.createElement("div");
      dayEl.className = "calendar-day";
      if (date.getTime() === today.getTime()) dayEl.classList.add("today");

      dayEl.innerHTML = `<div class="calendar-day-number">${day}</div><div class="calendar-tasks"></div>`;

      this.renderCalendarTasks(date, dayEl.querySelector(".calendar-tasks"));

      dayEl.onclick = (e) => {
        if (e.target.closest(".calendar-task")) return;
        this.selectedDate = date;
        this.openTaskModal();
      };
      calendar.appendChild(dayEl);
    }
  }

  renderCalendarTasks(date, container) {
    const tasks = this.getTasksForDate(date);
    tasks.slice(0, 4).forEach((task) => {
      const el = document.createElement("div");
      let catClass = "cal-task-other";
      if (task.category === "work") catClass = "cal-task-work";
      if (task.category === "personal") catClass = "cal-task-personal";
      if (task.category === "health") catClass = "cal-task-health";
      if (task.category === "study") catClass = "cal-task-study";
      if (task.category === "financeiro") catClass = "cal-task-finance";
      if (task.type === "sonho") catClass = "cal-task-sonho";
      if (task.type === "meta") catClass = "cal-task-meta";

      el.className = `calendar-task ${catClass} ${
        task.completed ? "completed" : ""
      }`;
      el.textContent = task.title;
      el.onclick = (e) => {
        e.stopPropagation();
        if (task.type === "task") this.editTask(task.id);
        else this.navigateToItem(task.type, task.id);
      };
      container.appendChild(el);
    });
    if (tasks.length > 4) {
      const more = document.createElement("div");
      more.style.fontSize = "0.7rem";
      more.style.color = "#888";
      more.textContent = `+${tasks.length - 4} mais`;
      container.appendChild(more);
    }
  }

  getTasksForDate(date) {
    return this.allItems.filter((t) => {
      if (!t.date) return false;
      const tDate = new Date(t.date + "T00:00:00");
      return (
        tDate.getFullYear() === date.getFullYear() &&
        tDate.getMonth() === date.getMonth() &&
        tDate.getDate() === date.getDate()
      );
    });
  }

  // --- RENDERIZAÇÃO DA LISTA PRINCIPAL ---
  renderTasks() {
    const list = document.getElementById("tasks-list");
    const filtered = this.getFilteredTasks();

    filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    });

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / this.itemsPerPage);
    if (this.currentPage > totalPages) this.currentPage = totalPages || 1;

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const pageItems = filtered.slice(start, end);

    list.innerHTML = "";
    if (pageItems.length === 0) {
      list.innerHTML = `<div style="text-align:center; padding:40px; color:var(--texto-secundario);">Nenhum item encontrado.</div>`;
    } else {
      pageItems.forEach(
        (task) => (list.innerHTML += this.createTaskHTML(task))
      );
    }

    this.renderPagination(totalItems);
  }

  renderPagination(totalItems) {
    const container = document.getElementById("pagination-controls");
    container.innerHTML = "";
    const totalPages = Math.ceil(totalItems / this.itemsPerPage);
    if (totalPages <= 1) return;

    const prev = document.createElement("button");
    prev.className = "page-btn";
    prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prev.onclick = () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderTasks();
      }
    };
    if (this.currentPage === 1) prev.disabled = true;
    container.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.className = `page-btn ${i === this.currentPage ? "active" : ""}`;
      btn.textContent = i;
      btn.onclick = () => {
        this.currentPage = i;
        this.renderTasks();
      };
      container.appendChild(btn);
    }

    const next = document.createElement("button");
    next.className = "page-btn";
    next.innerHTML = '<i class="fas fa-chevron-right"></i>';
    next.onclick = () => {
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.renderTasks();
      }
    };
    if (this.currentPage === totalPages) next.disabled = true;
    container.appendChild(next);
  }

  createTaskHTML(item) {
    const dateStr = item.date
      ? new Date(item.date + "T00:00:00").toLocaleDateString("pt-BR")
      : "Sem data";

    let catClass = "cat-other";
    if (item.category === "work") catClass = "cat-work";
    else if (item.category === "personal") catClass = "cat-personal";
    else if (item.category === "health") catClass = "cat-health";
    else if (item.category === "study") catClass = "cat-study";
    else if (item.category === "financeiro") catClass = "cat-finance";

    const priorityClass = item.priority ? `${item.priority}-priority` : "";
    const completedClass = item.completed ? "completed" : "";
    const isClickable = ["sonho", "meta", "estudo"].includes(item.type);

    const editBtn =
      item.type === "task"
        ? `<button class="task-action-btn" onclick="taskPlanner.editTask('${item.id}')"><i class="fas fa-edit"></i></button>
         <button class="task-action-btn delete-btn" onclick="taskPlanner.deleteTask('${item.id}')"><i class="fas fa-trash"></i></button>`
        : "";

    const checkBtn =
      item.type !== "estudo"
        ? `<button class="task-action-btn complete-btn" onclick="event.stopPropagation(); taskPlanner.toggleTaskCompletion('${
            item.id
          }')">
            <i class="fas ${item.completed ? "fa-undo" : "fa-check"}"></i>
         </button>`
        : "";

    return `
        <div class="task-item ${catClass} ${priorityClass} ${completedClass}" onclick="${
      isClickable
        ? `taskPlanner.navigateToItem('${item.type}','${item.id}')`
        : ""
    }">
            <div class="task-header">
                <span class="task-title">${item.title}</span>
                <div class="task-actions">
                    ${checkBtn}
                    ${editBtn}
                </div>
            </div>
            <div class="task-meta">
                <span class="task-category-tag">${
                  item.category || "Geral"
                }</span>
                <span><i class="far fa-calendar"></i> ${dateStr}</span>
                ${
                  item.time
                    ? `<span><i class="far fa-clock"></i> ${item.time}</span>`
                    : ""
                }
            </div>
        </div>
      `;
  }

  getFilteredTasks() {
    let list =
      this.currentFilter === "archived"
        ? this.loadArchive()
        : [...this.allItems];
    const term = this.currentSearchTerm.toLowerCase();

    if (this.currentFilter === "pending")
      list = list.filter((t) => !t.completed);
    else if (this.currentFilter === "completed")
      list = list.filter((t) => t.completed);
    else if (this.currentFilter === "no-date")
      list = list.filter((t) => !t.date);
    else if (
      ["work", "personal", "health", "study", "financeiro"].includes(
        this.currentFilter
      )
    ) {
      list = list.filter((t) => t.category === this.currentFilter);
    }

    if (term) list = list.filter((t) => t.title.toLowerCase().includes(term));
    return list;
  }

  setFilter(filter) {
    this.currentFilter = filter;
    this.currentPage = 1;
    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));
    const btn = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
    if (btn) btn.classList.add("active");
    this.renderTasks();
  }

  renderTodayColumn() {
    const container = document.getElementById("today-tasks-list");
    const dateDisplay = document.getElementById("today-date-display");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    dateDisplay.textContent = today.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
    });

    const todayTasks = this.allItems.filter((t) => {
      if (!t.date) return false;
      const d = new Date(t.date + "T00:00:00");
      return d.getTime() === today.getTime() && !t.completed;
    });

    container.innerHTML = "";
    if (todayTasks.length === 0) {
      container.innerHTML = `<p style="font-size:0.85rem; color:var(--texto-secundario); text-align:center;">Nada para hoje.</p>`;
      return;
    }

    todayTasks
      .slice(0, 5)
      .forEach((task) => (container.innerHTML += this.createTaskHTML(task)));
    if (todayTasks.length > 5) {
      container.innerHTML += `<div style="text-align:center; font-size:0.8rem; color:var(--texto-sutil); margin-top:5px;">+${
        todayTasks.length - 5
      } tarefas</div>`;
    }
  }

  // --- ACTIONS ---
  addTask(data) {
    const task = {
      id: Date.now().toString(36),
      ...data,
      completed: false,
      createdAt: new Date(),
    };
    this.tasks.push(task);

    if (data.recurring && data.date) {
      let nextDate = new Date(data.date + "T00:00:00");
      for (let i = 1; i <= 5; i++) {
        if (data.recurringType === "daily")
          nextDate.setDate(nextDate.getDate() + 1);
        if (data.recurringType === "weekly")
          nextDate.setDate(nextDate.getDate() + 7);
        if (data.recurringType === "monthly")
          nextDate.setMonth(nextDate.getMonth() + 1);

        this.tasks.push({
          ...task,
          id: task.id + "-" + i,
          date: nextDate.toISOString().slice(0, 10),
          parent: task.id,
        });
      }
    }
    this.saveTasks();
  }

  editTask(id) {
    const t = this.tasks.find((x) => x.id === id);
    if (!t) return;
    this.openTaskModal();
    document.getElementById("task-title").value = t.title;
    document.getElementById("task-description").value = t.description || "";
    document.getElementById("task-date").value = t.date || "";
    document.getElementById("task-time").value = t.time || "";
    document.getElementById("task-priority").value = t.priority || "";
    document.getElementById("task-category").value = t.category || "other";
    this.editingTaskId = id;
    document.getElementById("modal-title").textContent = "Editar Tarefa";
  }

  deleteTask(id) {
    if (confirm("Excluir tarefa?")) {
      this.tasks = this.tasks.filter((t) => t.id !== id);
      this.saveTasks();
    }
  }

  // CORE RPG LOGIC ON COMPLETION
  toggleTaskCompletion(id) {
    let gainedXP = false;
    let category = "other";

    if (id.startsWith("sonho-")) {
      const sid = id.replace("sonho-", "");
      const s = this.sonhos.find((x) => x.id == sid);
      if (s) {
        s.concluido = !s.concluido;
        if (s.concluido) {
          gainedXP = true;
          category = "sonho";
        }
        localStorage.setItem("sonhos-objetivos", JSON.stringify(this.sonhos));
      }
    } else if (id.startsWith("meta-")) {
      const mid = id.replace("meta-", "");
      const m = this.metas.find((x) => x.id == mid);
      if (m) {
        m.status = m.status === "concluida" ? "pendente" : "concluida";
        if (m.status === "concluida") {
          gainedXP = true;
          category = "meta";
        }
        localStorage.setItem("metas-objetivos", JSON.stringify(this.metas));
      }
    } else {
      const t = this.tasks.find((x) => x.id === id);
      if (t) {
        t.completed = !t.completed;
        t.completedAt = t.completed ? new Date().toISOString() : null;
        if (t.completed) {
          gainedXP = true;
          category = t.category;
        }
        this.saveTasks();
        // Se ganhou XP, processa
        if(gainedXP && window.rpgSystem) window.rpgSystem.gainXP(category);
        return;
      }
    }

    // Se for sonho/meta externo
    if (gainedXP) this.rpg.gainXP(category);

    // Recarrega
    this.sonhos = this.loadSonhos();
    this.metas = this.loadMetas();
    this.getAllItems();
    this.renderTasks();
    this.renderTodayColumn();
    this.renderCalendar();
    this.updateStats();
  }

  updateStats() {
    const total = this.allItems.length;
    const pending = this.allItems.filter((t) => !t.completed).length;
    const completed = total - pending;
    const rate = total ? Math.round((completed / total) * 100) : 0;

    document.getElementById("total-tasks").textContent = total;
    document.getElementById("pending-tasks").textContent = pending;
    document.getElementById("completed-tasks").textContent = completed;
    document.getElementById("completion-rate").textContent = rate + "%";
  }

  // --- MODAL ---
  openTaskModal() {
    document.getElementById("task-modal").classList.add("active");
    document.getElementById("task-form").reset();
    this.editingTaskId = null;
    document.getElementById("modal-title").textContent = "Nova Tarefa";
    if (this.selectedDate) {
      document.getElementById("task-date").value = this.selectedDate
        .toISOString()
        .slice(0, 10);
    }
  }

  handleFormSubmit(e) {
    e.preventDefault();
    const data = {
      title: document.getElementById("task-title").value,
      description: document.getElementById("task-description").value,
      date: document.getElementById("no-date-checkbox").checked
        ? null
        : document.getElementById("task-date").value,
      time: document.getElementById("task-time").value,
      priority: document.getElementById("task-priority").value,
      category: document.getElementById("task-category").value,
      recurring: document.getElementById("recurring-checkbox").checked,
      recurringType: document.getElementById("recurring-type").value,
    };

    if (this.editingTaskId) {
      const idx = this.tasks.findIndex((t) => t.id === this.editingTaskId);
      if (idx > -1) {
        this.tasks[idx] = { ...this.tasks[idx], ...data };
        this.saveTasks();
      }
    } else {
      this.addTask(data);
    }
    document.getElementById("task-modal").classList.remove("active");
  }

  navigateToItem(type, id) {
    if (type === "sonho") location.href = "sonhos.html";
    if (type === "estudo") location.href = "estudos.html";
  }

  bindEvents() {
    document.getElementById("prev-month").onclick = () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderCalendar();
    };
    document.getElementById("next-month").onclick = () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderCalendar();
    };

    document.querySelectorAll(".filter-btn").forEach((btn) => {
      if (btn.dataset.filter)
        btn.onclick = () => this.setFilter(btn.dataset.filter);
    });

    document.getElementById("task-search").oninput = (e) => {
      this.currentSearchTerm = e.target.value;
      this.renderTasks();
    };

    document.getElementById("add-task-btn").onclick = () =>
      this.openTaskModal();
    document.getElementById("close-modal").onclick = () =>
      document.getElementById("task-modal").classList.remove("active");
    document.getElementById("cancel-task").onclick = () =>
      document.getElementById("task-modal").classList.remove("active");
    document.getElementById("task-form").onsubmit = (e) =>
      this.handleFormSubmit(e);
    document.getElementById("archive-tasks-btn").onclick = () =>
      this.manualArchiveTasks();
  }
}

let taskPlanner;
document.addEventListener("DOMContentLoaded", () => {
  taskPlanner = new TaskPlanner();
});
