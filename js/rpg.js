// ===== SISTEMA RPG GLOBAL (GAMIFICATION) ===== //
class RPGSystem {
  constructor() {
    this.config = this.loadConfig();
    this.data = this.loadData();
    this.meta = this.loadMeta();
    this.ensureDataConsistency();
    this.ensureMetaConsistency();
    this.applyInactivityPenaltyIfNeeded();
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

  loadMeta() {
    const saved = localStorage.getItem("sol-de-soter-rpg-meta");
    if (!saved) {
      return {
        lifetimeXp: 0,
        xpLog: [],
        timeline: [],
        activityByDay: {},
        streak: { current: 0, best: 0, lastDate: null },
        achievements: [],
        smartNotifications: [],
        profile: { preset: "balanced", title: "Recruta de Sóter", birthDate: null },
        classSystem: { selected: "adventurer" },
        talents: { points: 0, unlocked: [] },
        economy: { coins: 0, prestige: 0 },
        equipment: { owned: [], equipped: null },
        guilds: {
          body: { level: 1, xp: 0 },
          mind: { level: 1, xp: 0 },
          wisdom: { level: 1, xp: 0 },
          execution: { level: 1, xp: 0 },
        },
        areaBosses: {
          strength: { name: "Colosso de Ferro", hpPct: 100, phase: 1, defeated: false },
          intelligence: { name: "Arqui-lich Mental", hpPct: 100, phase: 1, defeated: false },
          wisdom: { name: "Oráculo Sombrio", hpPct: 100, phase: 1, defeated: false },
          productivity: { name: "Mestre da Inércia", hpPct: 100, phase: 1, defeated: false },
        },
        penalty: { lastAppliedDate: null },
        boss: {
          name: "Titã da Disciplina",
          targetXp: 2000,
          phase: 1,
          hpPct: 100,
          defeated: false,
        },
      };
    }
    try {
      return JSON.parse(saved);
    } catch (_) {
      return this.loadMetaDefaults();
    }
  }

  loadMetaDefaults() {
    return {
      lifetimeXp: 0,
      xpLog: [],
      timeline: [],
      activityByDay: {},
      streak: { current: 0, best: 0, lastDate: null },
      achievements: [],
      smartNotifications: [],
      profile: { preset: "balanced", title: "Recruta de Sóter", birthDate: null },
      classSystem: { selected: "adventurer" },
      talents: { points: 0, unlocked: [] },
      economy: { coins: 0, prestige: 0 },
      equipment: { owned: [], equipped: null },
      guilds: {
        body: { level: 1, xp: 0 },
        mind: { level: 1, xp: 0 },
        wisdom: { level: 1, xp: 0 },
        execution: { level: 1, xp: 0 },
      },
      areaBosses: {
        strength: { name: "Colosso de Ferro", hpPct: 100, phase: 1, defeated: false },
        intelligence: { name: "Arqui-lich Mental", hpPct: 100, phase: 1, defeated: false },
        wisdom: { name: "Oráculo Sombrio", hpPct: 100, phase: 1, defeated: false },
        productivity: { name: "Mestre da Inércia", hpPct: 100, phase: 1, defeated: false },
      },
      penalty: { lastAppliedDate: null },
      boss: {
        name: "Titã da Disciplina",
        targetXp: 2000,
        phase: 1,
        hpPct: 100,
        defeated: false,
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

  ensureMetaConsistency() {
    const d = this.loadMetaDefaults();
    if (!this.meta || typeof this.meta !== "object") this.meta = d;
    this.meta.lifetimeXp = Math.max(0, Number(this.meta.lifetimeXp) || 0);
    this.meta.xpLog = Array.isArray(this.meta.xpLog) ? this.meta.xpLog : [];
    this.meta.timeline = Array.isArray(this.meta.timeline) ? this.meta.timeline : [];
    this.meta.activityByDay =
      this.meta.activityByDay && typeof this.meta.activityByDay === "object"
        ? this.meta.activityByDay
        : {};
    this.meta.streak = {
      current: Math.max(0, Number(this.meta.streak?.current) || 0),
      best: Math.max(0, Number(this.meta.streak?.best) || 0),
      lastDate: this.meta.streak?.lastDate || null,
    };
    this.meta.achievements = Array.isArray(this.meta.achievements)
      ? this.meta.achievements
      : [];
    this.meta.smartNotifications = Array.isArray(this.meta.smartNotifications)
      ? this.meta.smartNotifications
      : [];
    this.meta.profile = {
      preset: this.meta.profile?.preset || "balanced",
      title: this.meta.profile?.title || "Recruta de Sóter",
      birthDate: this.normalizeBirthDate(this.meta.profile?.birthDate),
    };
    this.meta.classSystem = {
      selected: this.meta.classSystem?.selected || "adventurer",
    };
    this.meta.talents = {
      points: Math.max(0, Number(this.meta.talents?.points) || 0),
      unlocked: Array.isArray(this.meta.talents?.unlocked) ? this.meta.talents.unlocked : [],
    };
    this.meta.economy = {
      coins: Math.max(0, Number(this.meta.economy?.coins) || 0),
      prestige: Math.max(0, Number(this.meta.economy?.prestige) || 0),
    };
    this.meta.equipment = {
      owned: Array.isArray(this.meta.equipment?.owned) ? this.meta.equipment.owned : [],
      equipped: this.meta.equipment?.equipped || null,
    };
    this.meta.guilds = this.meta.guilds && typeof this.meta.guilds === "object"
      ? this.meta.guilds
      : d.guilds;
    ["body", "mind", "wisdom", "execution"].forEach((key) => {
      const g = this.meta.guilds[key] || {};
      this.meta.guilds[key] = {
        level: Math.max(1, Number(g.level) || 1),
        xp: Math.max(0, Number(g.xp) || 0),
      };
    });
    this.meta.areaBosses = this.meta.areaBosses && typeof this.meta.areaBosses === "object"
      ? this.meta.areaBosses
      : d.areaBosses;
    ["strength", "intelligence", "wisdom", "productivity"].forEach((key) => {
      const b = this.meta.areaBosses[key] || {};
      this.meta.areaBosses[key] = {
        name: b.name || d.areaBosses[key].name,
        hpPct: Math.max(0, Math.min(100, Number(b.hpPct) || 100)),
        phase: Math.min(4, Math.max(1, Number(b.phase) || 1)),
        defeated: Boolean(b.defeated),
      };
    });
    this.meta.penalty = {
      lastAppliedDate: this.meta.penalty?.lastAppliedDate || null,
    };
    this.meta.boss = {
      name: this.meta.boss?.name || "Titã da Disciplina",
      targetXp: Math.max(500, Number(this.meta.boss?.targetXp) || 2000),
      phase: Math.min(4, Math.max(1, Number(this.meta.boss?.phase) || 1)),
      hpPct: Math.max(0, Math.min(100, Number(this.meta.boss?.hpPct) || 100)),
      defeated: Boolean(this.meta.boss?.defeated),
    };
  }

  saveMeta() {
    localStorage.setItem("sol-de-soter-rpg-meta", JSON.stringify(this.meta));
  }

  normalizeBirthDate(value) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
    const date = new Date(`${trimmed}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  }

  getProfileMeta() {
    return JSON.parse(JSON.stringify(this.meta.profile || {}));
  }

  updateProfileMeta(nextProfile = {}) {
    const current = this.meta.profile || {};
    this.meta.profile = {
      ...current,
      ...nextProfile,
      birthDate: this.normalizeBirthDate(
        Object.prototype.hasOwnProperty.call(nextProfile, "birthDate")
          ? nextProfile.birthDate
          : current.birthDate
      ),
    };
    this.saveMeta();
    this.updateUI();
  }

  getLocalDateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  getDayDiff(fromKey, toKey) {
    if (!fromKey || !toKey) return 0;
    const from = new Date(`${fromKey}T00:00:00`);
    const to = new Date(`${toKey}T00:00:00`);
    from.setHours(0, 0, 0, 0);
    to.setHours(0, 0, 0, 0);
    return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  }

  getClassDefinitions() {
    return {
      adventurer: { label: "Aventureiro", bonus: { all: 1.0 }, desc: "Build equilibrada." },
      warrior: { label: "Guerreiro", bonus: { strength: 1.18, productivity: 1.05 }, desc: "Domina força e execução." },
      arcanist: { label: "Arcanista", bonus: { intelligence: 1.2, wisdom: 1.08 }, desc: "Foco em conhecimento e estratégia." },
      tactician: { label: "Estrategista", bonus: { productivity: 1.16, wisdom: 1.1 }, desc: "Perito em planejamento." },
    };
  }

  getTalentDefinitions() {
    return [
      { id: "talent_momentum", label: "Impulso", cost: 1, bonus: { all: 1.05 } },
      { id: "talent_focus", label: "Foco Mental", cost: 1, bonus: { intelligence: 1.08 } },
      { id: "talent_discipline", label: "Disciplina", cost: 2, bonus: { productivity: 1.1 } },
      { id: "talent_vigor", label: "Vigor", cost: 2, bonus: { strength: 1.1 } },
      { id: "talent_sage", label: "Sábio", cost: 2, bonus: { wisdom: 1.1 } },
      { id: "talent_legend", label: "Lenda", cost: 3, bonus: { all: 1.12 } },
    ];
  }

  getShopCatalog() {
    return [
      { id: "shop_focus_potion", label: "Poção do Foco", cost: 120, type: "consumable", bonus: { intelligence: 1.15 } },
      { id: "shop_titan_gauntlet", label: "Manopla Titânica", cost: 240, type: "equipment", slot: "mainHand" },
      { id: "shop_oracle_charm", label: "Amuleto Oracular", cost: 260, type: "equipment", slot: "amulet" },
      { id: "shop_executor_boots", label: "Botas da Execução", cost: 230, type: "equipment", slot: "boots" },
    ];
  }

  getEquipmentCatalog() {
    return {
      shop_titan_gauntlet: { id: "shop_titan_gauntlet", label: "Manopla Titânica", bonus: { strength: 1.16 } },
      shop_oracle_charm: { id: "shop_oracle_charm", label: "Amuleto Oracular", bonus: { wisdom: 1.14 } },
      shop_executor_boots: { id: "shop_executor_boots", label: "Botas da Execução", bonus: { productivity: 1.14 } },
    };
  }

  getGuildDefinitions() {
    return {
      body: { label: "Guilda do Corpo", stat: "strength" },
      mind: { label: "Guilda da Mente", stat: "intelligence" },
      wisdom: { label: "Conclave da Sabedoria", stat: "wisdom" },
      execution: { label: "Ordem da Execução", stat: "productivity" },
    };
  }

  addTimelineEvent(type, text) {
    this.meta.timeline.unshift({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      at: new Date().toISOString(),
      type,
      text,
    });
    this.meta.timeline = this.meta.timeline.slice(0, 250);
  }

  getEffectiveXpMultiplier(statKey) {
    let mult = 1;
    const cls = this.getClassDefinitions()[this.meta.classSystem.selected] || this.getClassDefinitions().adventurer;
    if (cls.bonus.all) mult *= cls.bonus.all;
    if (cls.bonus[statKey]) mult *= cls.bonus[statKey];

    const unlocked = new Set(this.meta.talents.unlocked || []);
    this.getTalentDefinitions().forEach((talent) => {
      if (!unlocked.has(talent.id)) return;
      if (talent.bonus.all) mult *= talent.bonus.all;
      if (talent.bonus[statKey]) mult *= talent.bonus[statKey];
    });

    const eq = this.getEquipmentCatalog()[this.meta.equipment.equipped || ""];
    if (eq?.bonus?.all) mult *= eq.bonus.all;
    if (eq?.bonus?.[statKey]) mult *= eq.bonus[statKey];

    mult += (this.meta.economy.prestige || 0) * 0.01;
    return Math.max(0.5, Math.min(3, mult));
  }

  getAdjustedXp(baseXp, statKey) {
    const mult = this.getEffectiveXpMultiplier(statKey || "productivity");
    return Math.max(1, Math.round((Number(baseXp) || 0) * mult));
  }

  buyShopItem(itemId) {
    const item = this.getShopCatalog().find((it) => it.id === itemId);
    if (!item) return { ok: false, reason: "Item inválido." };
    if ((this.meta.economy.coins || 0) < item.cost) return { ok: false, reason: "Moedas insuficientes." };
    this.meta.economy.coins -= item.cost;
    if (item.type === "equipment") {
      if (!this.meta.equipment.owned.includes(item.id)) this.meta.equipment.owned.push(item.id);
      this.addTimelineEvent("shop", `Comprou ${item.label}.`);
    } else {
      this.addTimelineEvent("shop", `Consumiu ${item.label}.`);
      if (item.bonus?.intelligence) {
        this.meta.smartNotifications.unshift({
          id: `${Date.now()}-boost`,
          message: "Poção ativa: +inteligência no próximo ciclo.",
          kind: "success",
          at: new Date().toISOString(),
        });
      }
    }
    this.saveMeta();
    return { ok: true };
  }

  equipItem(itemId) {
    if (!this.meta.equipment.owned.includes(itemId)) return { ok: false, reason: "Você não possui este item." };
    this.meta.equipment.equipped = itemId;
    this.addTimelineEvent("equipment", `Equipou ${this.getEquipmentCatalog()[itemId]?.label || itemId}.`);
    this.saveMeta();
    return { ok: true };
  }

  unlockTalent(talentId) {
    const talent = this.getTalentDefinitions().find((t) => t.id === talentId);
    if (!talent) return { ok: false, reason: "Talento inválido." };
    if (this.meta.talents.unlocked.includes(talentId)) return { ok: false, reason: "Talento já desbloqueado." };
    if (this.meta.talents.points < talent.cost) return { ok: false, reason: "Pontos insuficientes." };
    this.meta.talents.points -= talent.cost;
    this.meta.talents.unlocked.push(talentId);
    this.addTimelineEvent("talent", `Desbloqueou talento: ${talent.label}.`);
    this.saveMeta();
    return { ok: true };
  }

  setPlayerClass(classId) {
    if (!this.getClassDefinitions()[classId]) return { ok: false, reason: "Classe inválida." };
    this.meta.classSystem.selected = classId;
    this.addTimelineEvent("class", `Escolheu a classe ${this.getClassDefinitions()[classId].label}.`);
    this.saveMeta();
    return { ok: true };
  }

  updateAreaBossByStat(statKey, xpAmount) {
    const b = this.meta.areaBosses[statKey];
    if (!b || b.defeated) return;
    const damage = Math.max(1, Math.round((Number(xpAmount) || 0) * 0.06));
    b.hpPct = Math.max(0, b.hpPct - damage);
    b.phase = Math.min(4, Math.max(1, Math.ceil((100 - b.hpPct) / 25)));
    if (b.hpPct <= 0) {
      b.defeated = true;
      this.meta.economy.coins += 120;
      this.addSmartNotification(`Boss da área derrotado: ${b.name} (+120 moedas).`, "success");
      this.addTimelineEvent("boss", `Derrotou ${b.name}.`);
    }
  }

  updateGuildByStat(statKey, xpAmount) {
    const map = {
      strength: "body",
      intelligence: "mind",
      wisdom: "wisdom",
      productivity: "execution",
    };
    const guildKey = map[statKey];
    if (!guildKey) return;
    const guild = this.meta.guilds[guildKey];
    guild.xp += Math.max(0, Number(xpAmount) || 0);
    const threshold = guild.level * 280;
    if (guild.xp >= threshold) {
      guild.xp -= threshold;
      guild.level += 1;
      this.meta.economy.coins += 45;
      this.addTimelineEvent("guild", `${this.getGuildDefinitions()[guildKey].label} subiu para nível ${guild.level}.`);
    }
  }

  getPredictiveInsights() {
    const today = new Date();
    let total = 0;
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = this.getLocalDateKey(d);
      const xp = Number(this.meta.activityByDay[key]) || 0;
      total += xp;
      count += 1;
    }
    const avg = total / Math.max(1, count);
    const toNextLvl = Math.max(0, this.data.xpToNextLevel - this.data.xp);
    const daysToLevel = avg > 0 ? Math.ceil(toNextLvl / avg) : null;
    return {
      avgDailyXp: Math.round(avg),
      daysToLevel,
      nextLevelAt: daysToLevel !== null ? this.getLocalDateKey(new Date(Date.now() + daysToLevel * 86400000)) : null,
    };
  }

  canPrestige() {
    return this.data.level >= 30;
  }

  performPrestige() {
    if (!this.canPrestige()) return { ok: false, reason: "Nível mínimo para prestígio: 30." };
    this.meta.economy.prestige += 1;
    this.meta.economy.coins += 300;
    this.data.level = 1;
    this.data.xp = 0;
    this.data.xpToNextLevel = this.getXpToNextForLevel(1);
    Object.keys(this.data.stats).forEach((k) => {
      this.data.stats[k].lvl = 1;
      this.data.stats[k].xp = 0;
    });
    this.addTimelineEvent("prestige", `Realizou Prestígio ${this.meta.economy.prestige}.`);
    this.addSmartNotification("Prestígio realizado: bônus permanente de XP aumentado.", "success");
    this.saveData();
    this.saveMeta();
    return { ok: true };
  }

  addSmartNotification(message, kind = "info") {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this.meta.smartNotifications.unshift({
      id,
      message,
      kind,
      at: new Date().toISOString(),
    });
    this.meta.smartNotifications = this.meta.smartNotifications.slice(0, 80);
    this.saveMeta();
  }

  applyInactivityPenaltyIfNeeded() {
    const today = this.getLocalDateKey();
    const lastDate = this.meta.streak.lastDate;
    if (!lastDate) return;
    if (this.meta.penalty.lastAppliedDate === today) return;
    const diff = this.getDayDiff(lastDate, today);
    if (diff < 3) return;

    const penaltyPct = Math.min(0.25, 0.03 * (diff - 1));
    const lost = Math.max(0, Math.floor(this.data.xp * penaltyPct));
    if (lost > 0) {
      this.data.xp = Math.max(0, this.data.xp - lost);
      this.meta.streak.current = 0;
      this.meta.penalty.lastAppliedDate = today;
      this.saveData();
      this.addSmartNotification(
        `Penalidade leve aplicada por ${diff} dias sem atividade: -${lost} XP.`,
        "warning"
      );
    }
  }

  trackProgressEvent(xpAmount, source, statKey = null) {
    const today = this.getLocalDateKey();
    const nowIso = new Date().toISOString();
    const xp = Math.max(0, Number(xpAmount) || 0);

    this.meta.lifetimeXp += xp;
    this.meta.economy.coins += Math.max(1, Math.floor(xp * 0.28));
    this.meta.xpLog.unshift({
      at: nowIso,
      source: source || "general",
      xp,
      level: this.data.level,
    });
    this.meta.xpLog = this.meta.xpLog.slice(0, 300);

    this.meta.activityByDay[today] = (Number(this.meta.activityByDay[today]) || 0) + xp;

    const last = this.meta.streak.lastDate;
    const diff = this.getDayDiff(last, today);
    if (!last) {
      this.meta.streak.current = 1;
    } else if (diff === 0) {
      this.meta.streak.current = Math.max(1, this.meta.streak.current);
    } else if (diff === 1) {
      this.meta.streak.current += 1;
    } else {
      this.meta.streak.current = 1;
    }
    this.meta.streak.best = Math.max(this.meta.streak.best, this.meta.streak.current);
    this.meta.streak.lastDate = today;

    this.updateAchievements();
    this.updateBossState();
    if (statKey) {
      this.updateAreaBossByStat(statKey, xp);
      this.updateGuildByStat(statKey, xp);
    }
    this.updateProfileTitle();
    this.addTimelineEvent("xp", `+${xp} XP em ${source || "geral"}.`);
    this.saveMeta();
  }

  updateProfileTitle() {
    const lvl = this.data.level;
    const streak = this.meta.streak.current;
    let title = "Recruta de Sóter";
    if (lvl >= 10) title = "Guardião de Sóter";
    if (lvl >= 20) title = "Mestre de Sóter";
    if (streak >= 14) title = "Senhor da Consistência";
    if (lvl >= 30 && streak >= 21) title = "Lenda de Sóter";
    this.meta.profile.title = title;
  }

  unlockAchievement(id, label) {
    if (this.meta.achievements.some((a) => a.id === id)) return;
    this.meta.achievements.push({ id, label, at: new Date().toISOString() });
    this.addSmartNotification(`Conquista desbloqueada: ${label}`, "success");
    this.addTimelineEvent("achievement", `Conquista: ${label}.`);
  }

  updateAchievements() {
    const lvl = this.data.level;
    const streak = this.meta.streak.current;
    const books = (this.data.stats.intelligence?.lvl || 1) >= 10;
    if (lvl >= 5) this.unlockAchievement("lvl5", "Nível 5");
    if (lvl >= 10) this.unlockAchievement("lvl10", "Nível 10");
    if (lvl >= 20) this.unlockAchievement("lvl20", "Nível 20");
    if (streak >= 3) this.unlockAchievement("streak3", "Streak 3 dias");
    if (streak >= 7) this.unlockAchievement("streak7", "Streak 7 dias");
    if (streak >= 14) this.unlockAchievement("streak14", "Streak 14 dias");
    if (books) this.unlockAchievement("mind10", "Mente Afiada");
  }

  updateBossState() {
    const boss = this.meta.boss;
    const progress = Math.min(1, this.meta.lifetimeXp / boss.targetXp);
    const phase = Math.min(4, Math.max(1, Math.ceil(progress * 4)));
    boss.phase = phase;
    boss.hpPct = Math.max(0, Math.round((1 - progress) * 100));
    if (progress >= 1 && !boss.defeated) {
      boss.defeated = true;
      this.addSmartNotification(`Boss derrotado: ${boss.name}!`, "success");
    }
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
      ["intelligence", "intelecto", "study", "livraria", "cinema", "manga", "mangas", "entretenimento"].includes(
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

    const statKey = this.getStatKeyByCategory(category) || "productivity";
    const adjustedXp = this.getAdjustedXp(xpAmount, statKey);
    const prevLevel = this.data.level;
    const statLeveledUp = this.applyXpToStat(statKey, adjustedXp);
    const charLeveledUp = this.applyXpToCharacter(adjustedXp);
    const levelsGained = Math.max(0, this.data.level - prevLevel);
    if (levelsGained > 0) {
      this.meta.talents.points += levelsGained;
      this.addSmartNotification(`+${levelsGained} ponto(s) de talento.`, "info");
    }

    this.saveData();
    this.trackProgressEvent(adjustedXp, statKey || normalizedCategory || "general", statKey);
    this.showToast(
      adjustedXp,
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

    const adjustedXp = this.getAdjustedXp(xpAmount, "wisdom");
    const prevLevel = this.data.level;
    const statLeveledUp = this.applyXpToStat("wisdom", adjustedXp);
    const charLeveledUp = this.applyXpToCharacter(adjustedXp);
    const levelsGained = Math.max(0, this.data.level - prevLevel);
    if (levelsGained > 0) this.meta.talents.points += levelsGained;

    this.saveData();
    this.trackProgressEvent(adjustedXp, "diario", "wisdom");
    this.showToast(adjustedXp, "wisdom", statLeveledUp, charLeveledUp);
  }

  gainCustomXP(amount, type) {
    const statKey = this.getStatKeyByCategory(type) || "productivity";
    const adjustedXp = this.getAdjustedXp(amount, statKey);
    const prevLevel = this.data.level;
    const charLeveledUp = this.applyXpToCharacter(adjustedXp);
    const levelsGained = Math.max(0, this.data.level - prevLevel);
    if (levelsGained > 0) this.meta.talents.points += levelsGained;
    this.saveData();
    this.trackProgressEvent(adjustedXp, type || "general", statKey);
    this.showToast(adjustedXp, type || "general", false, charLeveledUp);
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

function recordBibliotecaXp(statKey, amount) {
  const xp = Math.max(0, Number(amount) || 0);
  if (xp <= 0) return;

  const rawStat = String(statKey || "").toLowerCase();
  let stat = "intelligence";
  if (["wisdom", "sabedoria"].includes(rawStat)) stat = "wisdom";
  if (["intelligence", "intelecto"].includes(rawStat)) stat = "intelligence";

  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const dateKey = `${y}-${m}-${day}`;

  let history = {};
  try {
    history = JSON.parse(localStorage.getItem("sol-de-soter-biblioteca-xp-history") || "{}");
  } catch (_) {
    history = {};
  }
  if (!history[dateKey] || typeof history[dateKey] !== "object") {
    history[dateKey] = { intelligence: 0, wisdom: 0, total: 0 };
  }

  history[dateKey][stat] = Math.max(0, Number(history[dateKey][stat]) || 0) + xp;
  history[dateKey].total = Math.max(0, Number(history[dateKey].total) || 0) + xp;
  localStorage.setItem("sol-de-soter-biblioteca-xp-history", JSON.stringify(history));
}

window.recordBibliotecaXp = recordBibliotecaXp;
