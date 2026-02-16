// ===== SISTEMA RPG GLOBAL (GAMIFICATION) ===== //
class RPGSystem {
  constructor() {
    this.config = this.loadConfig();
    this.data = this.loadData();
    this.ensureDataConsistency();
    this.init();
  }

  init() {
    this.updateUI();
    this.bindEvents();
  }

  getDefaultConfig() {
    return {
      progression: {
        baseXpToNextLevel: 100,
        levelGrowthMultiplier: 1.2,
        statLevelFactor: 50,
      },
      rewards: {
        taskEasy: 10,
        taskMedium: 20,
        taskHard: 35,
      },
      ranks: {
        bronzeMax: 10,
        prataMax: 20,
        ouroMax: 30,
        diamanteMax: 40,
        platinaMax: 50,
      },
    };
  }

  sanitizeConfig(config) {
    const toInt = (value, fallback, min = 1) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return fallback;
      return Math.max(min, Math.round(num));
    };

    const toFloat = (value, fallback, min = 1.01, max = 3) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return fallback;
      return Math.min(max, Math.max(min, num));
    };

    const cleaned = {
      progression: {
        baseXpToNextLevel: toInt(
          config.progression.baseXpToNextLevel,
          100,
          10
        ),
        levelGrowthMultiplier: toFloat(
          config.progression.levelGrowthMultiplier,
          1.2,
          1.01,
          3
        ),
        statLevelFactor: toInt(config.progression.statLevelFactor, 50, 10),
      },
      rewards: {
        taskEasy: toInt(config.rewards.taskEasy, 10, 1),
        taskMedium: toInt(config.rewards.taskMedium, 20, 1),
        taskHard: toInt(config.rewards.taskHard, 35, 1),
      },
      ranks: {
        bronzeMax: toInt(config.ranks.bronzeMax, 10, 1),
        prataMax: toInt(config.ranks.prataMax, 20, 2),
        ouroMax: toInt(config.ranks.ouroMax, 30, 3),
        diamanteMax: toInt(config.ranks.diamanteMax, 40, 4),
        platinaMax: toInt(config.ranks.platinaMax, 50, 5),
      },
    };

    // Garante ordem crescente.
    cleaned.ranks.prataMax = Math.max(
      cleaned.ranks.prataMax,
      cleaned.ranks.bronzeMax + 1
    );
    cleaned.ranks.ouroMax = Math.max(
      cleaned.ranks.ouroMax,
      cleaned.ranks.prataMax + 1
    );
    cleaned.ranks.diamanteMax = Math.max(
      cleaned.ranks.diamanteMax,
      cleaned.ranks.ouroMax + 1
    );
    cleaned.ranks.platinaMax = Math.max(
      cleaned.ranks.platinaMax,
      cleaned.ranks.diamanteMax + 1
    );

    return cleaned;
  }

  loadConfig() {
    const defaults = this.getDefaultConfig();
    const saved = localStorage.getItem("sol-de-soter-rpg-config");

    if (!saved) return defaults;

    try {
      const parsed = JSON.parse(saved);
      return this.sanitizeConfig({
        progression: { ...defaults.progression, ...(parsed.progression || {}) },
        rewards: { ...defaults.rewards, ...(parsed.rewards || {}) },
        ranks: { ...defaults.ranks, ...(parsed.ranks || {}) },
      });
    } catch (error) {
      return defaults;
    }
  }

  saveConfig() {
    localStorage.setItem("sol-de-soter-rpg-config", JSON.stringify(this.config));
  }

  getConfig() {
    return JSON.parse(JSON.stringify(this.config));
  }

  updateConfig(nextConfig) {
    this.config = this.sanitizeConfig({
      progression: {
        ...this.config.progression,
        ...(nextConfig.progression || {}),
      },
      rewards: {
        ...this.config.rewards,
        ...(nextConfig.rewards || {}),
      },
      ranks: {
        ...this.config.ranks,
        ...(nextConfig.ranks || {}),
      },
    });
    this.saveConfig();
    this.updateUI();
  }

  resetConfig() {
    this.config = this.getDefaultConfig();
    this.saveConfig();
    this.updateUI();
  }

  loadData() {
    const saved = localStorage.getItem("sol-de-soter-rpg");
    return saved
      ? JSON.parse(saved)
      : {
          level: 1,
          xp: 0,
          xpToNextLevel: this.getXpToNextForLevel(1),
          stats: {
            strength: { lvl: 1, xp: 0, name: "Força" },
            intelligence: { lvl: 1, xp: 0, name: "Intelecto" },
            wisdom: { lvl: 1, xp: 0, name: "Sabedoria" },
            productivity: { lvl: 1, xp: 0, name: "Produtividade" },
          },
        };
  }

  ensureDataConsistency() {
    if (!this.data || typeof this.data !== "object") {
      this.data = this.loadData();
    }

    this.data.level = Math.max(1, Number(this.data.level) || 1);
    this.data.xp = Math.max(0, Number(this.data.xp) || 0);
    this.data.xpToNextLevel = Math.max(
      1,
      Number(this.data.xpToNextLevel) || this.getXpToNextForLevel(this.data.level)
    );

    if (!this.data.stats || typeof this.data.stats !== "object") {
      this.data.stats = {};
    }

    const defaultStats = this.getDefaultDataStats();
    Object.keys(defaultStats).forEach((key) => {
      if (!this.data.stats[key] || typeof this.data.stats[key] !== "object") {
        this.data.stats[key] = defaultStats[key];
      }
      this.data.stats[key].lvl = Math.max(1, Number(this.data.stats[key].lvl) || 1);
      this.data.stats[key].xp = Math.max(0, Number(this.data.stats[key].xp) || 0);
      this.data.stats[key].name = this.data.stats[key].name || defaultStats[key].name;
    });
  }

  getDefaultDataStats() {
    return {
      strength: { lvl: 1, xp: 0, name: "Força" },
      intelligence: { lvl: 1, xp: 0, name: "Intelecto" },
      wisdom: { lvl: 1, xp: 0, name: "Sabedoria" },
      productivity: { lvl: 1, xp: 0, name: "Produtividade" },
    };
  }

  saveData() {
    localStorage.setItem("sol-de-soter-rpg", JSON.stringify(this.data));
    this.updateUI();
  }

  getXpToNextForLevel(level) {
    const lvl = Math.max(1, Number(level) || 1);
    let xpToNext = this.config.progression.baseXpToNextLevel;
    for (let i = 1; i < lvl; i++) {
      xpToNext = Math.floor(xpToNext * this.config.progression.levelGrowthMultiplier);
    }
    return xpToNext;
  }

  getTaskXP(difficulty) {
    const diff = String(difficulty || "medium").toLowerCase();
    if (diff === "easy") return this.config.rewards.taskEasy;
    if (diff === "hard") return this.config.rewards.taskHard;
    return this.config.rewards.taskMedium;
  }

  recalculateCurrentLevelThreshold() {
    this.data.xpToNextLevel = this.getXpToNextForLevel(this.data.level);
    this.saveData();
  }

  getStatKeyByCategory(category) {
    const normalizedCategory = String(category || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (["strength", "forca", "health", "academia"].includes(normalizedCategory)) {
      return "strength";
    }

    if (
      ["intelligence", "intelecto", "study", "livraria", "cinema"].includes(
        normalizedCategory
      )
    ) {
      return "intelligence";
    }

    if (
      ["wisdom", "sabedoria", "financeiro", "meta", "sonho"].includes(
        normalizedCategory
      )
    ) {
      return "wisdom";
    }

    if (
      ["productivity", "produtividade", "work", "personal"].includes(
        normalizedCategory
      )
    ) {
      return "productivity";
    }

    return null;
  }

  applyXpToStat(statKey, xpAmount) {
    if (!statKey || !this.data.stats[statKey]) return false;

    const stat = this.data.stats[statKey];
    stat.xp += xpAmount;

    let statLeveledUp = false;
    const statFactor = this.config.progression.statLevelFactor;

    while (stat.xp >= stat.lvl * statFactor) {
      stat.lvl++;
      stat.xp -= (stat.lvl - 1) * statFactor;
      statLeveledUp = true;
    }

    return statLeveledUp;
  }

  applyXpToCharacter(xpAmount) {
    this.data.xp += xpAmount;

    let charLeveledUp = false;
    while (this.data.xp >= this.data.xpToNextLevel) {
      this.data.level++;
      this.data.xp -= this.data.xpToNextLevel;
      this.data.xpToNextLevel = Math.floor(
        this.data.xpToNextLevel * this.config.progression.levelGrowthMultiplier
      );
      charLeveledUp = true;
    }

    return charLeveledUp;
  }

  gainXP(category, xpAmount = 10) {
    const normalizedCategory = String(category || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const statKey = this.getStatKeyByCategory(category);
    const statLeveledUp = this.applyXpToStat(statKey, xpAmount);
    const charLeveledUp = this.applyXpToCharacter(xpAmount);

    this.saveData();
    this.showToast(
      xpAmount,
      statKey || normalizedCategory || "general",
      statLeveledUp,
      charLeveledUp
    );
  }

  gainDiaryXP(entry) {
    const text = entry && entry.conteudoTexto ? entry.conteudoTexto : "";
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    let xpAmount = 10;
    if (words >= 50) xpAmount += 5;
    if (words >= 150) xpAmount += 10;
    if (entry && Array.isArray(entry.tags)) {
      xpAmount += Math.min(10, entry.tags.length * 2);
    }
    if (entry && entry.favorito) xpAmount += 5;

    const statLeveledUp = this.applyXpToStat("wisdom", xpAmount);
    const charLeveledUp = this.applyXpToCharacter(xpAmount);

    this.saveData();
    this.showToast(xpAmount, "wisdom", statLeveledUp, charLeveledUp);
  }

  gainCustomXP(amount, type) {
    const charLeveledUp = this.applyXpToCharacter(amount);
    this.saveData();
    this.showToast(amount, type || "general", false, charLeveledUp);
  }

  updateUI() {
    const headerBar = document.getElementById("header-xp-bar");
    const headerBadge = document.getElementById("header-level-badge");

    if (headerBar && headerBadge) {
      const xpPercent = (this.data.xp / this.data.xpToNextLevel) * 100;
      headerBar.style.width = `${xpPercent}%`;
      headerBadge.textContent = this.data.level;
    }

    this.applyProfileRankTheme(this.data.level);

    this.updateStatUI("str", "strength");
    this.updateStatUI("int", "intelligence");
    this.updateStatUI("wis", "wisdom");
    this.updateStatUI("prod", "productivity");
  }

  updateStatUI(idSuffix, statKey) {
    const stat = this.data.stats[statKey];
    if (!stat) return;

    const nextLvl = stat.lvl * this.config.progression.statLevelFactor;
    const percent = (stat.xp / nextLvl) * 100;

    const lvlEl = document.getElementById(`lvl-${idSuffix}`);
    const barEl = document.getElementById(`bar-${idSuffix}`);

    if (lvlEl) lvlEl.textContent = stat.lvl;
    if (barEl) barEl.style.width = `${percent}%`;
  }

  showToast(xp, type, statLevelUp, charLevelUp) {
    let container = document.getElementById("rpg-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "rpg-toast-container";
      container.className = "rpg-toast-container";
      document.body.appendChild(container);
    }

    const icons = {
      strength: '<i class="fas fa-dumbbell"></i>',
      intelligence: '<i class="fas fa-brain"></i>',
      wisdom: '<i class="fas fa-scroll"></i>',
      productivity: '<i class="fas fa-briefcase"></i>',
      meta: '<i class="fas fa-bullseye"></i>',
      sonho: '<i class="fas fa-star"></i>',
      general: '<i class="fas fa-star"></i>',
    };

    const toastType =
      type === "strength"
        ? "str"
        : type === "intelligence"
        ? "int"
        : type === "wisdom"
        ? "wis"
        : type === "productivity"
        ? "prod"
        : "general";
    const toast = document.createElement("div");
    toast.className = `rpg-toast toast-${toastType}`;

    let toastText;
    if (type === "meta") {
      toastText = `<span>+<span class="rpg-toast-xp">${xp} XP</span> (Meta)</span>`;
    } else if (type === "sonho") {
      toastText = `<span>+<span class="rpg-toast-xp">${xp} XP</span> (Sonho)</span>`;
    } else if (this.data.stats[type]) {
      toastText = `<span>+<span class="rpg-toast-xp">${xp} XP</span> em ${this.data.stats[type].name}</span>`;
    } else {
      toastText = `<span>+<span class="rpg-toast-xp">${xp} XP</span></span>`;
    }

    toast.innerHTML = `${icons[type] || icons.general} ${toastText}`;
    container.appendChild(toast);

    if (charLevelUp) {
      setTimeout(() => {
        const lvlToast = document.createElement("div");
        lvlToast.className = "rpg-toast toast-levelup";
        lvlToast.innerHTML = `<i class="fas fa-crown" style="color:gold"></i> <span>Level Up! Nível <span class="rpg-toast-xp">${this.data.level}</span></span>`;
        container.appendChild(lvlToast);
        setTimeout(() => lvlToast.remove(), 4500);
      }, 500);
    }

    setTimeout(() => toast.remove(), 4500);
  }

  bindEvents() {
    window.addEventListener("storage", (event) => {
      if (event.key === "sol-de-soter-rpg") {
        if (!event.newValue) return;
        this.data = JSON.parse(event.newValue);
        this.ensureDataConsistency();
        this.updateUI();
      }

      if (event.key === "sol-de-soter-rpg-config") {
        this.config = this.loadConfig();
        this.updateUI();
      }
    });
  }

  getRankByLevel(level) {
    const lvl = Number(level) || 1;
    if (lvl <= this.config.ranks.bronzeMax) return "bronze";
    if (lvl <= this.config.ranks.prataMax) return "prata";
    if (lvl <= this.config.ranks.ouroMax) return "ouro";
    if (lvl <= this.config.ranks.diamanteMax) return "diamante";
    if (lvl <= this.config.ranks.platinaMax) return "platina";
    return "profissional";
  }

  applyProfileRankTheme(level) {
    const rank = this.getRankByLevel(level);
    const profileEls = Array.from(
      document.querySelectorAll(".profile.rpg-profile-trigger, .profile")
    );
    const rankClasses = [
      "rank-bronze",
      "rank-prata",
      "rank-ouro",
      "rank-diamante",
      "rank-platina",
      "rank-profissional",
    ];

    profileEls.forEach((el) => {
      el.classList.remove(...rankClasses);
      el.classList.add(`rank-${rank}`);
      el.setAttribute("data-rank", rank);
      el.setAttribute("title", `Ranking: ${rank}`);
    });
  }
}

// Inicializa globalmente
const rpgSystem = new RPGSystem();
window.rpgSystem = rpgSystem;
