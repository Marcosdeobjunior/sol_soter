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

function getRPGSystem() {
  if (window.rpgSystem && typeof window.rpgSystem.gainXP === "function") {
    return window.rpgSystem;
  }

  // Fallback para evitar quebra caso js/rpg.js falhe.
  return {
    gainXP: () => {},
  };
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
    this.selectedCalendarTaskIds = new Set();
    this.currentDragTaskIds = [];
    this.currentDragAnchorId = null;
    this.currentDragAnchorDate = null;
    this.suppressCalendarDayClick = false;
    this.isMarqueeSelecting = false;
    this.calendarMarqueeBound = false;
    this.weatherForecast = null;
    this.weatherForecastPromise = null;
    this.weatherHistoryByDate = {};
    this.weatherHistoryPromises = {};

    // Usa o sistema global de RPG compartilhado entre páginas.
    this.rpg = getRPGSystem();

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

  getWeatherIcon(code) {
    if (code === 0) return "fas fa-sun";
    if (code > 0 && code < 4) return "fas fa-cloud-sun";
    if (code >= 51 && code <= 67) return "fas fa-cloud-showers-heavy";
    if (code >= 71 && code <= 75) return "fas fa-snowflake";
    if (code >= 95 && code <= 99) return "fas fa-bolt";
    return "fas fa-cloud";
  }

  getWeatherDescription(code) {
    if (code === 0) return "Ceu limpo";
    if (code > 0 && code < 4) return "Parcialmente nublado";
    if (code >= 51 && code <= 67) return "Chuva";
    if (code >= 71 && code <= 75) return "Neve";
    if (code >= 95 && code <= 99) return "Tempestade";
    return "Condicoes variadas";
  }

  async getWeatherCoords() {
    try {
      const cached = JSON.parse(localStorage.getItem("coords-pirapora"));
      if (
        cached &&
        Number.isFinite(Number(cached.lat)) &&
        Number.isFinite(Number(cached.lon))
      ) {
        return { lat: Number(cached.lat), lon: Number(cached.lon) };
      }
    } catch (_) {}

    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          "Pirapora do Bom Jesus, Brasil"
        )}&limit=1`
      );
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        const coords = {
          lat: Number(data[0].lat),
          lon: Number(data[0].lon),
        };
        localStorage.setItem("coords-pirapora", JSON.stringify(coords));
        return coords;
      }
    } catch (_) {}

    return { lat: -23.396, lon: -47.008 };
  }

  async ensureWeatherForecast() {
    if (this.weatherForecast) return this.weatherForecast;
    if (this.weatherForecastPromise) return this.weatherForecastPromise;

    this.weatherForecastPromise = (async () => {
      try {
        const { lat, lon } = await this.getWeatherCoords();
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&hourly=weathercode,temperature_2m&forecast_days=16&timezone=auto`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error("weather_fetch_failed");
        const data = await resp.json();

        const dailyByDate = {};
        const dailyTimes = data?.daily?.time || [];
        const dailyCodes = data?.daily?.weathercode || [];
        const dailyMax = data?.daily?.temperature_2m_max || [];
        const dailyMin = data?.daily?.temperature_2m_min || [];
        dailyTimes.forEach((date, i) => {
          dailyByDate[date] = {
            code: Number(dailyCodes[i]),
            max: Number(dailyMax[i]),
            min: Number(dailyMin[i]),
          };
        });

        const hourlyByDate = {};
        const hourlyTimes = data?.hourly?.time || [];
        const hourlyCodes = data?.hourly?.weathercode || [];
        const hourlyTemp = data?.hourly?.temperature_2m || [];
        hourlyTimes.forEach((stamp, i) => {
          const [datePart, timePart] = String(stamp).split("T");
          if (!datePart || !timePart) return;
          const [hRaw, mRaw] = String(timePart).split(":");
          const hour = Number(hRaw);
          const minute = Number(mRaw || 0);
          if (!Number.isFinite(hour) || !Number.isFinite(minute)) return;
          if (!hourlyByDate[datePart]) hourlyByDate[datePart] = [];
          hourlyByDate[datePart].push({
            hour,
            minute,
            code: Number(hourlyCodes[i]),
            temp: Number(hourlyTemp[i]),
          });
        });

        this.weatherForecast = { dailyByDate, hourlyByDate };
        return this.weatherForecast;
      } catch (_) {
        this.weatherForecast = null;
        return null;
      } finally {
        this.weatherForecastPromise = null;
      }
    })();

    return this.weatherForecastPromise;
  }

  getNearestHourlyForecast(dateStr, timeStr) {
    const entries =
      this.weatherForecast?.hourlyByDate?.[dateStr] ||
      this.weatherHistoryByDate?.[dateStr]?.hourly;
    if (!Array.isArray(entries) || entries.length === 0) return null;

    const match = String(timeStr || "").match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const targetMinutes = Number(match[1]) * 60 + Number(match[2]);
    let best = null;
    let bestDiff = Infinity;
    entries.forEach((slot) => {
      const slotMinutes = slot.hour * 60 + slot.minute;
      const diff = Math.abs(slotMinutes - targetMinutes);
      if (diff < bestDiff) {
        best = slot;
        bestDiff = diff;
      }
    });
    return best;
  }

  getLocalDateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  formatDateKeyPt(dateKey) {
    const match = String(dateKey || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return dateKey;
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  getForecastEdgeDates() {
    const dailyByDate = this.weatherForecast?.dailyByDate || {};
    const keys = Object.keys(dailyByDate).sort();
    if (keys.length === 0) return { min: null, max: null };
    return { min: keys[0], max: keys[keys.length - 1] };
  }

  getDailyWeatherForDate(dateStr) {
    return (
      this.weatherForecast?.dailyByDate?.[dateStr] ||
      this.weatherHistoryByDate?.[dateStr]?.daily ||
      null
    );
  }

  async ensureHistoricalWeatherForDate(dateStr) {
    if (!dateStr) return null;
    if (this.weatherHistoryByDate[dateStr]) {
      return this.weatherHistoryByDate[dateStr];
    }
    if (this.weatherHistoryPromises[dateStr]) {
      return this.weatherHistoryPromises[dateStr];
    }

    this.weatherHistoryPromises[dateStr] = (async () => {
      const storageKey = `sol-de-soter-weather-history-${dateStr}`;
      try {
        const cached = JSON.parse(localStorage.getItem(storageKey));
        if (cached?.daily && Array.isArray(cached?.hourly)) {
          this.weatherHistoryByDate[dateStr] = cached;
          return cached;
        }
      } catch (_) {}

      try {
        const { lat, lon } = await this.getWeatherCoords();
        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&daily=weathercode,temperature_2m_max,temperature_2m_min&hourly=weathercode,temperature_2m&timezone=auto`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error("weather_archive_failed");
        const data = await resp.json();

        const daily = {
          code: Number(data?.daily?.weathercode?.[0]),
          max: Number(data?.daily?.temperature_2m_max?.[0]),
          min: Number(data?.daily?.temperature_2m_min?.[0]),
        };
        const hourly = [];
        const hTimes = data?.hourly?.time || [];
        const hCodes = data?.hourly?.weathercode || [];
        const hTemps = data?.hourly?.temperature_2m || [];
        hTimes.forEach((stamp, i) => {
          const [dPart, tPart] = String(stamp).split("T");
          if (dPart !== dateStr || !tPart) return;
          const [hRaw, mRaw] = String(tPart).split(":");
          const hour = Number(hRaw);
          const minute = Number(mRaw || 0);
          if (!Number.isFinite(hour) || !Number.isFinite(minute)) return;
          hourly.push({
            hour,
            minute,
            code: Number(hCodes[i]),
            temp: Number(hTemps[i]),
          });
        });

        if (!Number.isFinite(daily.max) || !Number.isFinite(daily.min)) {
          return null;
        }

        const payload = { daily, hourly };
        this.weatherHistoryByDate[dateStr] = payload;
        try {
          localStorage.setItem(storageKey, JSON.stringify(payload));
        } catch (_) {}
        return payload;
      } catch (_) {
        return null;
      } finally {
        delete this.weatherHistoryPromises[dateStr];
      }
    })();

    return this.weatherHistoryPromises[dateStr];
  }

  buildTaskWeatherHTML(dateStr, timeStr) {
    if (!dateStr) {
      return '<i class="fas fa-cloud"></i> Sem data para clima';
    }

    const daily = this.getDailyWeatherForDate(dateStr);
    if (!daily || !Number.isFinite(daily.max) || !Number.isFinite(daily.min)) {
      const edges = this.getForecastEdgeDates();
      if (edges.max && dateStr > edges.max) {
        return `<i class="fas fa-cloud"></i> Previsao detalhada ate ${this.formatDateKeyPt(
          edges.max
        )}`;
      }
      return '<i class="fas fa-cloud"></i> Sem previsao para a data';
    }

    const dayDesc = this.getWeatherDescription(daily.code);
    const dayIcon = this.getWeatherIcon(daily.code);
    const daySummary = `${Math.round(daily.max)}°/${Math.round(
      daily.min
    )}° ${dayDesc}`;
    if (!timeStr) {
      return `<i class="${dayIcon}"></i> ${daySummary}`;
    }

    const hourly = this.getNearestHourlyForecast(dateStr, timeStr);
    if (!hourly || !Number.isFinite(hourly.temp)) {
      return `<i class="${dayIcon}"></i> ${daySummary} | ${timeStr} sem previsao`;
    }

    const timeLabel = `${String(hourly.hour).padStart(2, "0")}:${String(
      hourly.minute
    ).padStart(2, "0")}`;
    const hourDesc = this.getWeatherDescription(hourly.code);
    const hourIcon = this.getWeatherIcon(hourly.code);
    return `<i class="${dayIcon}"></i> ${daySummary} | <i class="${hourIcon}"></i> ${timeLabel} ${Math.round(hourly.temp)}° ${hourDesc}`;
  }

  async populateTaskWeather() {
    const weatherNodes = Array.from(
      document.querySelectorAll(".task-weather[data-weather-date]")
    );
    if (weatherNodes.length === 0) return;

    const forecast = await this.ensureWeatherForecast();
    if (!forecast) {
      weatherNodes.forEach((node) => {
        node.innerHTML = '<i class="fas fa-cloud"></i> Clima indisponivel';
      });
      return;
    }

    const todayKey = this.getLocalDateKey();
    const missingPastDates = [
      ...new Set(
        weatherNodes
          .map((node) => node.dataset.weatherDate)
          .filter(
            (dateStr) =>
              dateStr &&
              !this.getDailyWeatherForDate(dateStr) &&
              String(dateStr) < todayKey
          )
      ),
    ];

    if (missingPastDates.length > 0) {
      await Promise.all(
        missingPastDates.map((dateStr) =>
          this.ensureHistoricalWeatherForDate(dateStr)
        )
      );
    }

    weatherNodes.forEach((node) => {
      const date = node.dataset.weatherDate;
      const time = node.dataset.weatherTime || "";
      node.innerHTML = this.buildTaskWeatherHTML(date, time);
    });
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

  getAcademiaTrainingsForDate(date) {
    let trainingDays = {};
    let daySessions = {};
    try {
      trainingDays =
        JSON.parse(localStorage.getItem("academia-training-days-v1")) || {};
    } catch (_) {}
    try {
      daySessions =
        JSON.parse(localStorage.getItem("academia-day-sessions-v1")) || {};
    } catch (_) {}

    const dayMap = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
    const weekdayKey = dayMap[date.getDay()];
    if (!trainingDays || !trainingDays[weekdayKey]) return [];

    const sessions = Array.isArray(daySessions?.[weekdayKey])
      ? daySessions[weekdayKey]
      : [];
    const firstSession = sessions[0] || null;
    const title =
      firstSession && (firstSession.title || firstSession.nome)
        ? `Treino: ${firstSession.title || firstSession.nome}`
        : "Treino do dia";

    return [
      {
        id: `academia-${weekdayKey}-${date.toISOString().slice(0, 10)}`,
        title,
        date: date.toISOString().slice(0, 10),
        completed: false,
        category: "health",
        type: "academia",
      },
    ];
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
    this.pruneCalendarSelection();
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
      dayEl.dataset.date = date.toISOString().slice(0, 10);
      if (date.getTime() === today.getTime()) dayEl.classList.add("today");

      dayEl.innerHTML = `<div class="calendar-day-number">${day}</div><div class="calendar-tasks"></div>`;

      this.renderCalendarTasks(date, dayEl.querySelector(".calendar-tasks"));

      dayEl.onclick = (e) => {
        if (e.target.closest(".calendar-task")) return;
        if (this.suppressCalendarDayClick) {
          this.suppressCalendarDayClick = false;
          return;
        }
        this.selectedDate = date;
        this.openTaskModal();
      };
      this.bindCalendarDayDropEvents(dayEl);
      calendar.appendChild(dayEl);
      this.applyCalendarTasksOverflow(dayEl.querySelector(".calendar-tasks"));
    }

    this.scheduleCalendarOverflowRecalc();
    this.bindCalendarMarqueeSelection();
  }

  pruneCalendarSelection() {
    const valid = new Set(this.tasks.map((t) => String(t.id)));
    const next = new Set();
    this.selectedCalendarTaskIds.forEach((id) => {
      if (valid.has(String(id))) next.add(String(id));
    });
    this.selectedCalendarTaskIds = next;
  }

  clearCalendarSelection(silent = false) {
    if (this.selectedCalendarTaskIds.size === 0) return;
    this.selectedCalendarTaskIds.clear();
    if (!silent) this.renderCalendar();
  }

  getDragTaskIdsFromEvent(event) {
    if (Array.isArray(this.currentDragTaskIds) && this.currentDragTaskIds.length) {
      return this.currentDragTaskIds.map((id) => String(id));
    }
    const dt = event?.dataTransfer;
    if (!dt) return [];
    const rawMulti = dt.getData("text/task-ids");
    if (rawMulti) {
      try {
        const parsed = JSON.parse(rawMulti);
        if (Array.isArray(parsed)) return parsed.map((id) => String(id));
      } catch (_) {}
    }
    const single = dt.getData("text/task-id");
    return single ? [String(single)] : [];
  }

  getCalendarDayTasksSorted(dateStr) {
    const toOrder = (task) =>
      Number.isFinite(Number(task.calendarOrder))
        ? Number(task.calendarOrder)
        : Number.MAX_SAFE_INTEGER;

    return this.tasks
      .filter((t) => t.date === dateStr)
      .sort((a, b) => {
        const oa = toOrder(a);
        const ob = toOrder(b);
        if (oa !== ob) return oa - ob;
        const ta = String(a.time || "");
        const tb = String(b.time || "");
        if (ta !== tb) return ta.localeCompare(tb);
        return String(a.title || "").localeCompare(String(b.title || ""));
      });
  }

  normalizeCalendarOrderForDate(dateStr) {
    const dayTasks = this.getCalendarDayTasksSorted(dateStr);
    dayTasks.forEach((task, idx) => {
      task.calendarOrder = idx + 1;
    });
  }

  moveCalendarTasksToDate(taskIds, targetDate, options = {}) {
    const beforeTaskId = options?.beforeTaskId || null;
    const preserveOffset = Boolean(options?.preserveOffset);
    const anchorTaskId = options?.anchorTaskId ? String(options.anchorTaskId) : null;
    const ids = [...new Set((taskIds || []).map((id) => String(id)))];
    if (!ids.length || !targetDate) return;

    const movable = ids
      .map((id) => this.tasks.find((t) => String(t.id) === id))
      .filter((t) => t && !t.recurring && !t.parent);
    if (!movable.length) return;

    const toDate = (dateStr) => {
      const d = new Date(`${dateStr}T00:00:00`);
      return Number.isNaN(d.getTime()) ? null : d;
    };
    const addDays = (dateStr, daysDelta) => {
      const d = toDate(dateStr);
      if (!d) return dateStr;
      d.setDate(d.getDate() + daysDelta);
      return d.toISOString().slice(0, 10);
    };

    const originalDates = new Set(movable.map((t) => t.date).filter(Boolean));
    if (preserveOffset && movable.length > 1) {
      const anchorTask =
        movable.find((t) => String(t.id) === anchorTaskId) || movable[0];
      const anchorDate = toDate(anchorTask?.date || "");
      const target = toDate(targetDate);
      const deltaDays =
        anchorDate && target
          ? Math.round((target.getTime() - anchorDate.getTime()) / 86400000)
          : 0;
      movable.forEach((task) => {
        task.date = addDays(task.date, deltaDays);
      });
    } else {
      movable.forEach((task) => {
        task.date = targetDate;
      });
    }

    const effectiveTargetDate =
      preserveOffset && movable.length > 1
        ? movable.find((t) => String(t.id) === anchorTaskId)?.date ||
          movable[0]?.date ||
          targetDate
        : targetDate;

    const movedSet = new Set(movable.map((t) => String(t.id)));
    const dayTasksWithoutMoved = this.getCalendarDayTasksSorted(effectiveTargetDate).filter(
      (t) => !movedSet.has(String(t.id))
    );
    const movedOrdered = movable.sort((a, b) => {
      const oa = Number(a.calendarOrder || Number.MAX_SAFE_INTEGER);
      const ob = Number(b.calendarOrder || Number.MAX_SAFE_INTEGER);
      if (oa !== ob) return oa - ob;
      return String(a.title || "").localeCompare(String(b.title || ""));
    });

    let merged;
    if (beforeTaskId && !preserveOffset) {
      const idx = dayTasksWithoutMoved.findIndex(
        (t) => String(t.id) === String(beforeTaskId)
      );
      merged =
        idx >= 0
          ? [
              ...dayTasksWithoutMoved.slice(0, idx),
              ...movedOrdered,
              ...dayTasksWithoutMoved.slice(idx),
            ]
          : [...dayTasksWithoutMoved, ...movedOrdered];
    } else {
      merged = [...dayTasksWithoutMoved, ...movedOrdered];
    }

    merged.forEach((task, idx) => {
      task.calendarOrder = idx + 1;
    });
    originalDates.forEach((d) => {
      if (d && d !== effectiveTargetDate) this.normalizeCalendarOrderForDate(d);
    });
    this.normalizeCalendarOrderForDate(effectiveTargetDate);

    this.selectedDate = new Date(`${effectiveTargetDate}T00:00:00`);
    this.selectedCalendarTaskIds.clear();
    this.saveTasks();
    this.renderCalendar();
  }

  compareCalendarItems(a, b) {
    const toOrder = (item) =>
      Number.isFinite(Number(item.calendarOrder))
        ? Number(item.calendarOrder)
        : Number.MAX_SAFE_INTEGER;

    if (a.type === "task" && b.type === "task") {
      const ao = toOrder(a);
      const bo = toOrder(b);
      if (ao !== bo) return ao - bo;
    } else if (a.type === "task") {
      return -1;
    } else if (b.type === "task") {
      return 1;
    }

    const at = String(a.time || "");
    const bt = String(b.time || "");
    if (at !== bt) return at.localeCompare(bt);
    return String(a.title || "").localeCompare(String(b.title || ""));
  }

  scheduleCalendarOverflowRecalc() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.querySelectorAll(".calendar-tasks").forEach((container) => {
          this.applyCalendarTasksOverflow(container, 0);
        });
      });
    });
  }

  applyCalendarTasksOverflow(container, attempt = 0) {
    if (!container) return;
    const taskEls = container.querySelectorAll(".calendar-task");
    const pageEls = container.querySelectorAll(".calendar-task-page");
    if (taskEls.length <= 2) {
      container.classList.remove("has-overflow");
      container.style.maxHeight = "";
      return;
    }

    container.classList.add("has-overflow");
    const styles = getComputedStyle(container);
    const gap = parseFloat(styles.rowGap || styles.gap || "0") || 0;
    const firstPage = pageEls[0];
    const targetHeight = firstPage
      ? Math.ceil(firstPage.getBoundingClientRect().height)
      : Math.ceil(
          taskEls[0].getBoundingClientRect().height +
            taskEls[1].getBoundingClientRect().height +
            gap
        );
    if (targetHeight <= 0 && attempt < 4) {
      requestAnimationFrame(() =>
        this.applyCalendarTasksOverflow(container, attempt + 1)
      );
      return;
    }
    if (targetHeight > 0) {
      container.style.maxHeight = `${targetHeight + 2}px`;
    } else {
      container.style.maxHeight = "";
    }
  }

  bindCalendarDayDropEvents(dayEl) {
    if (!dayEl) return;
    dayEl.addEventListener("dragover", (e) => {
      const dragIds = this.getDragTaskIdsFromEvent(e);
      if (!dragIds.length) return;
      e.preventDefault();
      dayEl.classList.add("drag-over");
    });
    dayEl.addEventListener("dragleave", (e) => {
      if (!dayEl.contains(e.relatedTarget)) {
        dayEl.classList.remove("drag-over");
      }
    });
    dayEl.addEventListener("drop", (e) => {
      e.preventDefault();
      dayEl.classList.remove("drag-over");
      const taskIds = this.getDragTaskIdsFromEvent(e);
      const targetDate = dayEl.dataset.date;
      if (!taskIds.length || !targetDate) return;
      this.moveCalendarTasksToDate(taskIds, targetDate, {
        preserveOffset: taskIds.length > 1,
        anchorTaskId: this.currentDragAnchorId,
      });
    });
  }

  moveCalendarTaskToDate(taskId, targetDate) {
    this.moveCalendarTasksToDate([taskId], targetDate);
  }

  renderCalendarTasks(date, container) {
    const tasks = [
      ...this.getTasksForDate(date),
      ...this.getAcademiaTrainingsForDate(date),
    ].sort((a, b) => this.compareCalendarItems(a, b));
    let currentPage = null;
    tasks.forEach((task, index) => {
      if (index % 2 === 0) {
        currentPage = document.createElement("div");
        currentPage.className = "calendar-task-page";
        container.appendChild(currentPage);
      }
      const el = document.createElement("div");
      let catClass = "cal-task-other";
      if (task.category === "work") catClass = "cal-task-work";
      if (task.category === "personal") catClass = "cal-task-personal";
      if (task.category === "health") catClass = "cal-task-health";
      if (task.category === "study") catClass = "cal-task-study";
      if (task.category === "financeiro") catClass = "cal-task-finance";
      if (task.type === "sonho") catClass = "cal-task-sonho";
      if (task.type === "meta") catClass = "cal-task-meta";
      if (task.type === "academia") catClass = "cal-task-academia";

      const categoryMetaMap = {
        work: { label: "Trabalho", icon: "fa-briefcase" },
        personal: { label: "Pessoal", icon: "fa-user" },
        health: { label: "Saude", icon: "fa-dumbbell" },
        study: { label: "Estudo", icon: "fa-book" },
        financeiro: { label: "Financeiro", icon: "fa-wallet" },
        sonho: { label: "Sonho", icon: "fa-star" },
        meta: { label: "Meta", icon: "fa-bullseye" },
        other: { label: "Geral", icon: "fa-layer-group" },
      };
      const priorityNormMap = {
        low: "low",
        baixa: "low",
        medium: "medium",
        media: "medium",
        high: "high",
        alta: "high",
      };
      const priorityToneMap = {
        low: "cal-priority-low",
        medium: "cal-priority-medium",
        high: "cal-priority-high",
      };
      const difficultyMap = {
        easy: { rank: "C", label: "Facil" },
        medium: { rank: "A", label: "Media" },
        hard: { rank: "S+", label: "Dificil" },
      };
      const rpgAttrMap = {
        strength: { icon: "fa-dumbbell" },
        wisdom: { icon: "fa-scroll" },
        intelligence: { icon: "fa-brain" },
        productivity: { icon: "fa-bolt" },
        sonho: { icon: "fa-scroll" },
        meta: { icon: "fa-bolt" },
      };
      const catMeta =
        categoryMetaMap[task.category] ||
        categoryMetaMap[task.type] ||
        categoryMetaMap.other;
      const normalizedPriority = priorityNormMap[String(task.priority || "").toLowerCase()] || "";
      const priorityToneClass = priorityToneMap[normalizedPriority] || "";
      const difficultyMeta = difficultyMap[task.difficulty] || null;
      const xpBase =
        task.type === "task"
          ? (typeof this.rpg.getTaskXP === "function"
              ? this.rpg.getTaskXP(task.difficulty || "medium")
              : ({ easy: 10, medium: 20, hard: 35 }[task.difficulty || "medium"] || 20))
          : task.type === "meta"
          ? 25
          : task.type === "sonho"
          ? 40
          : task.type === "estudo"
          ? 18
          : task.type === "academia"
          ? 22
          : 12;
      const rpgKey =
        task.type === "task"
          ? task.rpgCategory || "productivity"
          : task.type === "sonho"
          ? "sonho"
          : task.type === "meta"
          ? "meta"
          : task.category === "study"
          ? "intelligence"
          : "productivity";
      const rpgMeta = rpgAttrMap[rpgKey] || rpgAttrMap.productivity;
      const isMovableTask =
        task.type === "task" && !task.recurring && !task.parent;
      const isSelected =
        task.type === "task" &&
        this.selectedCalendarTaskIds.has(String(task.id));

      el.className = `calendar-task ${catClass} ${
        task.completed ? "completed" : ""
      } ${priorityToneClass} ${isMovableTask ? "calendar-task-draggable" : ""} ${
        task.type === "task" && (task.recurring || task.parent)
          ? "calendar-task-locked"
          : ""
      } ${isSelected ? "calendar-task-selected" : ""}`;
      if (task.type === "task") el.dataset.taskId = String(task.id);
      el.draggable = isMovableTask;
      if (isMovableTask) {
        el.addEventListener("dragstart", (ev) => {
          const key = String(task.id);
          const selected = this.selectedCalendarTaskIds.has(key)
            ? [...this.selectedCalendarTaskIds]
            : [key];
          if (!this.selectedCalendarTaskIds.has(key)) {
            this.selectedCalendarTaskIds = new Set([key]);
          }
          this.currentDragTaskIds = selected.map((id) => String(id));
          this.currentDragAnchorId = key;
          this.currentDragAnchorDate = task.date || null;
          el.classList.add("is-dragging");
          if (ev.dataTransfer) {
            ev.dataTransfer.setData("text/task-id", key);
            ev.dataTransfer.setData("text/task-ids", JSON.stringify(selected));
            ev.dataTransfer.effectAllowed = "move";
          }
        });
        el.addEventListener("dragend", () => {
          el.classList.remove("is-dragging");
          this.currentDragTaskIds = [];
          this.currentDragAnchorId = null;
          this.currentDragAnchorDate = null;
          document
            .querySelectorAll(".calendar-day.drag-over")
            .forEach((d) => d.classList.remove("drag-over"));
          document
            .querySelectorAll(".calendar-task.drag-over")
            .forEach((d) => d.classList.remove("drag-over"));
        });

        el.addEventListener("dragover", (ev) => {
          const dragIds = this.getDragTaskIdsFromEvent(ev);
          if (!dragIds.length) return;
          ev.preventDefault();
          ev.stopPropagation();
          el.classList.add("drag-over");
        });
        el.addEventListener("dragleave", () => {
          el.classList.remove("drag-over");
        });
        el.addEventListener("drop", (ev) => {
          const dragIds = this.getDragTaskIdsFromEvent(ev);
          const targetDate = date.toISOString().slice(0, 10);
          if (!dragIds.length || !targetDate) return;
          ev.preventDefault();
          ev.stopPropagation();
          el.classList.remove("drag-over");
          if (dragIds.includes(String(task.id))) return;
          this.moveCalendarTasksToDate(dragIds, targetDate, {
            beforeTaskId: String(task.id),
            preserveOffset: dragIds.length > 1,
            anchorTaskId: this.currentDragAnchorId,
          });
        });
      }
      el.innerHTML = `
        <div class="calendar-task-head">
          <span class="calendar-task-cat-icon" aria-hidden="true"><i class="fas ${catMeta.icon}"></i></span>
          <span class="calendar-task-title">${task.title}</span>
        </div>
        <div class="calendar-task-badges">
          <span class="calendar-badge calendar-badge-cat">${catMeta.label}</span>
          ${
            difficultyMeta
              ? `<span class="calendar-badge calendar-badge-difficulty difficulty-${task.difficulty || "medium"}"><strong>${difficultyMeta.rank}</strong></span>`
              : ""
          }
          ${
            normalizedPriority
              ? `<span class="calendar-badge calendar-badge-priority">${normalizedPriority === "low" ? "Baixa" : normalizedPriority === "medium" ? "Media" : "Alta"}</span>`
              : ""
          }
          ${
            task.type === "task" && (task.recurring || task.parent)
              ? `<span class="calendar-badge calendar-badge-lock" title="Tarefa recorrente não pode ser movida"><i class="fas fa-lock"></i></span>`
              : ""
          }
          <span class="calendar-badge calendar-badge-xp"><i class="fas ${rpgMeta.icon}"></i>+${xpBase}</span>
        </div>
      `;
      el.onclick = (e) => {
        e.stopPropagation();
        if (task.type === "task" && (e.ctrlKey || e.metaKey)) {
          const key = String(task.id);
          if (this.selectedCalendarTaskIds.has(key)) {
            this.selectedCalendarTaskIds.delete(key);
          } else {
            this.selectedCalendarTaskIds.add(key);
          }
          this.renderCalendar();
          return;
        }
        if (task.type === "task") this.editTask(task.id);
        else if (task.type === "academia") window.location.href = "academia.html";
        else this.navigateToItem(task.type, task.id);
      };
      currentPage.appendChild(el);
    });
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

  bindCalendarMarqueeSelection() {
    if (this.calendarMarqueeBound) return;
    const calendar = document.getElementById("calendar");
    if (!calendar) return;
    this.calendarMarqueeBound = true;

    let startX = 0;
    let startY = 0;
    let isActive = false;
    let isPending = false;
    let baseSelection = new Set();
    let box = null;

    const rectFromPoints = (x1, y1, x2, y2) => ({
      left: Math.min(x1, x2),
      top: Math.min(y1, y2),
      right: Math.max(x1, x2),
      bottom: Math.max(y1, y2),
    });

    const intersects = (r1, r2) =>
      r1.left < r2.right &&
      r1.right > r2.left &&
      r1.top < r2.bottom &&
      r1.bottom > r2.top;

    const clearMarquee = () => {
      if (box && box.parentNode) box.parentNode.removeChild(box);
      box = null;
      isActive = false;
      isPending = false;
      this.isMarqueeSelecting = false;
      calendar.classList.remove("is-marquee-selecting");
    };

    calendar.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      if (e.target.closest(".calendar-task")) return;
      if (e.target.closest(".calendar-header")) return;

      const calRect = calendar.getBoundingClientRect();
      startX = e.clientX - calRect.left;
      startY = e.clientY - calRect.top;
      isActive = false;
      isPending = true;
      this.isMarqueeSelecting = false;
      baseSelection =
        e.ctrlKey || e.metaKey
          ? new Set(this.selectedCalendarTaskIds)
          : new Set();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isPending && !this.isMarqueeSelecting) return;
      const calRect = calendar.getBoundingClientRect();
      const x = Math.max(0, Math.min(calRect.width, e.clientX - calRect.left));
      const y = Math.max(
        0,
        Math.min(calRect.height, e.clientY - calRect.top)
      );
      const width = Math.abs(x - startX);
      const height = Math.abs(y - startY);

      if ((width > 4 || height > 4) && isPending) {
        isPending = false;
        isActive = true;
        this.isMarqueeSelecting = true;
        this.suppressCalendarDayClick = true;
        calendar.classList.add("is-marquee-selecting");
        box = document.createElement("div");
        box.className = "calendar-selection-box";
        box.style.left = `${startX}px`;
        box.style.top = `${startY}px`;
        box.style.width = "0px";
        box.style.height = "0px";
        calendar.appendChild(box);
      }

      if (!this.isMarqueeSelecting || !box) {
        return;
      }

      const boxRect = rectFromPoints(startX, startY, x, y);
      box.style.left = `${boxRect.left}px`;
      box.style.top = `${boxRect.top}px`;
      box.style.width = `${boxRect.right - boxRect.left}px`;
      box.style.height = `${boxRect.bottom - boxRect.top}px`;

      if (!isActive) return;

      const selectionRectViewport = {
        left: calRect.left + boxRect.left,
        top: calRect.top + boxRect.top,
        right: calRect.left + boxRect.right,
        bottom: calRect.top + boxRect.bottom,
      };

      const current = new Set(baseSelection);
      calendar
        .querySelectorAll(".calendar-task-draggable[data-task-id]")
        .forEach((el) => {
          const r = el.getBoundingClientRect();
          if (
            intersects(selectionRectViewport, {
              left: r.left,
              top: r.top,
              right: r.right,
              bottom: r.bottom,
            })
          ) {
            current.add(String(el.dataset.taskId));
          }
        });

      this.selectedCalendarTaskIds = current;
      calendar
        .querySelectorAll(".calendar-task-draggable[data-task-id]")
        .forEach((el) => {
          el.classList.toggle(
            "calendar-task-selected",
            this.selectedCalendarTaskIds.has(String(el.dataset.taskId))
          );
        });
    });

    document.addEventListener("mouseup", () => {
      if (!this.isMarqueeSelecting && !isPending) return;
      if (!isActive) {
        clearMarquee();
        return;
      }
      clearMarquee();
      this.renderCalendar();
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
    this.populateTaskWeather();
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

    const categoryMetaMap = {
      work: { label: "Trabalho", icon: "fa-briefcase" },
      personal: { label: "Pessoal", icon: "fa-user" },
      health: { label: "Saude", icon: "fa-dumbbell" },
      study: { label: "Estudo", icon: "fa-book" },
      financeiro: { label: "Financeiro", icon: "fa-wallet" },
      sonho: { label: "Sonho", icon: "fa-star" },
      meta: { label: "Meta", icon: "fa-bullseye" },
      other: { label: "Geral", icon: "fa-layer-group" },
    };
    const priorityMetaMap = {
      low: { label: "Baixa", colorClass: "priority-tone-low" },
      medium: { label: "Media", colorClass: "priority-tone-medium" },
      high: { label: "Alta", colorClass: "priority-tone-high" },
    };
    const difficultyMetaMap = {
      easy: { rank: "C", label: "Facil" },
      medium: { rank: "A", label: "Media" },
      hard: { rank: "S+", label: "Dificil" },
    };
    const rpgAttrMap = {
      strength: { label: "Forca", icon: "fa-dumbbell" },
      wisdom: { label: "Sabedoria", icon: "fa-scroll" },
      intelligence: { label: "Intelecto", icon: "fa-brain" },
      productivity: { label: "Produtividade", icon: "fa-bolt" },
      livraria: { label: "Intelecto", icon: "fa-brain" },
      sonho: { label: "Sabedoria", icon: "fa-scroll" },
      meta: { label: "Produtividade", icon: "fa-bolt" },
    };

    let catClass = "cat-other";
    if (item.category === "work") catClass = "cat-work";
    else if (item.category === "personal") catClass = "cat-personal";
    else if (item.category === "health") catClass = "cat-health";
    else if (item.category === "study") catClass = "cat-study";
    else if (item.category === "financeiro") catClass = "cat-finance";

    const priorityClass = item.priority ? `${item.priority}-priority` : "";
    const completedClass = item.completed ? "completed" : "";
    const isClickable = ["sonho", "meta", "estudo"].includes(item.type);
    const categoryMeta = categoryMetaMap[item.category] || categoryMetaMap.other;
    const priorityMeta = priorityMetaMap[item.priority] || null;
    const difficultyMeta = difficultyMetaMap[item.difficulty] || null;
    const rpgCategoryKey =
      item.type === "task"
        ? item.rpgCategory || "productivity"
        : item.type === "sonho"
        ? "sonho"
        : item.type === "meta"
        ? "meta"
        : item.category === "study"
        ? "intelligence"
        : "productivity";
    const rpgMeta = rpgAttrMap[rpgCategoryKey] || rpgAttrMap.productivity;
    const xpValue =
      item.type === "task"
        ? (typeof this.rpg.getTaskXP === "function"
            ? this.rpg.getTaskXP(item.difficulty || "medium")
            : ({ easy: 10, medium: 20, hard: 35 }[item.difficulty || "medium"] || 20))
        : item.type === "meta"
        ? 25
        : item.type === "sonho"
        ? 40
        : item.type === "estudo"
        ? 18
        : 12;
    const difficultyBadge = difficultyMeta
      ? `<span class="task-pill task-difficulty-pill difficulty-${item.difficulty || "medium"}" title="Dificuldade ${difficultyMeta.label}">
           <span class="rank">${difficultyMeta.rank}</span>
           <span class="label">${difficultyMeta.label}</span>
         </span>`
      : "";
    const priorityBadge = priorityMeta
      ? `<span class="task-pill task-priority-pill ${priorityMeta.colorClass}" title="Prioridade ${priorityMeta.label}">
           <i class="fas fa-flag"></i>${priorityMeta.label}
         </span>`
      : "";
    const xpBadge = `<span class="task-pill task-xp-pill" title="XP da tarefa">
        <i class="fas ${rpgMeta.icon}"></i> +${xpValue} XP
      </span>`;
    const weatherMeta = item.date
      ? `<span class="task-weather" data-weather-date="${item.date}" data-weather-time="${item.time || ""}"><i class="fas fa-cloud-sun"></i> Carregando clima...</span>`
      : "";

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
                <div class="task-title-wrap">
                  <span class="task-category-icon" aria-hidden="true"><i class="fas ${categoryMeta.icon}"></i></span>
                  <span class="task-title">${item.title}</span>
                </div>
                <div class="task-actions">
                    ${checkBtn}
                    ${editBtn}
                </div>
            </div>
            <div class="task-badges-row">
                <span class="task-category-tag">${categoryMeta.label}</span>
                ${difficultyBadge}
                ${priorityBadge}
                ${xpBadge}
            </div>
            <div class="task-meta">
                <span><i class="far fa-calendar"></i> ${dateStr}</span>
                ${
                  item.time
                    ? `<span><i class="far fa-clock"></i> ${item.time}</span>`
                    : ""
                }
                ${weatherMeta}
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

  getFilterCount(filter) {
    let list = filter === "archived" ? this.loadArchive() : [...this.allItems];

    if (filter === "pending") list = list.filter((t) => !t.completed);
    else if (filter === "completed") list = list.filter((t) => t.completed);
    else if (filter === "no-date") list = list.filter((t) => !t.date);
    else if (
      ["work", "personal", "health", "study", "financeiro"].includes(filter)
    ) {
      list = list.filter((t) => t.category === filter);
    }

    return list.length;
  }

  renderFilterCounts() {
    const setCount = (id, value) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = value;
      el.classList.toggle("count-active", value > 0);
      el.classList.toggle("count-empty", value === 0);
    };

    setCount("count-all", this.getFilterCount("all"));
    setCount("count-pending", this.getFilterCount("pending"));
    setCount("count-completed", this.getFilterCount("completed"));
    setCount("count-no-date", this.getFilterCount("no-date"));
    setCount("count-work", this.getFilterCount("work"));
    setCount("count-personal", this.getFilterCount("personal"));
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
    this.populateTaskWeather();
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
    document.getElementById("task-difficulty").value = t.difficulty || "medium";
    document.getElementById("task-category").value = t.category || "other";
    document.getElementById("task-rpg-category").value = t.rpgCategory || "productivity";
    document.getElementById("recurring-checkbox").checked = !!t.recurring;
    document.getElementById("recurring-type").value = t.recurringType || "weekly";
    document.getElementById("recurring-options").style.display = t.recurring
      ? "block"
      : "none";
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
    let category = "productivity";
    let xpAmount = 10;

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
          category = t.rpgCategory || "productivity";
          const difficulty = t.difficulty || "medium";
          if (typeof this.rpg.getTaskXP === "function") {
            xpAmount = this.rpg.getTaskXP(difficulty);
          } else {
            const xpByDifficulty = {
              easy: 10,
              medium: 20,
              hard: 35,
            };
            xpAmount = xpByDifficulty[difficulty] || 20;
          }
        }
        this.saveTasks();
        if (gainedXP) this.rpg.gainXP(category, xpAmount);
        return;
      }
    }

    // Se for sonho/meta externo
    if (gainedXP) this.rpg.gainXP(category, xpAmount);

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
    this.renderFilterCounts();
  }

  // --- MODAL ---
  closeTaskModal() {
    document.getElementById("task-modal").classList.remove("active");
    document.body.classList.remove("task-modal-open");
  }

  openTaskModal() {
    document.body.classList.add("task-modal-open");
    document.getElementById("task-modal").classList.add("active");
    document.getElementById("task-form").reset();
    document.getElementById("recurring-options").style.display = "none";
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
      difficulty: document.getElementById("task-difficulty").value,
      category: document.getElementById("task-category").value,
      rpgCategory: document.getElementById("task-rpg-category").value,
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
    this.closeTaskModal();
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
    document.getElementById("current-month").onclick = () => {
      const today = new Date();
      this.currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
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

    const recurringCheckbox = document.getElementById("recurring-checkbox");
    const recurringOptions = document.getElementById("recurring-options");
    recurringCheckbox.onchange = () => {
      recurringOptions.style.display = recurringCheckbox.checked
        ? "block"
        : "none";
    };

    document.getElementById("add-task-btn").onclick = () =>
      this.openTaskModal();
    document.getElementById("close-modal").onclick = () =>
      this.closeTaskModal();
    document.getElementById("cancel-task").onclick = () =>
      this.closeTaskModal();
    document.getElementById("task-form").onsubmit = (e) =>
      this.handleFormSubmit(e);
    document.getElementById("archive-tasks-btn").onclick = () =>
      this.manualArchiveTasks();

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".calendar-task")) this.clearCalendarSelection();
    });

    window.addEventListener("resize", () => {
      this.scheduleCalendarOverflowRecalc();
    });
  }
}

let taskPlanner;
document.addEventListener("DOMContentLoaded", () => {
  taskPlanner = new TaskPlanner();
});





