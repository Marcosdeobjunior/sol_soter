class PerfilRPGPage {
  constructor() {
    this.rpg = window.rpgSystem || null;
    this.chartCanvas = document.getElementById("rpg-status-chart");
    this.radarCanvas = document.getElementById("rpg-radar-chart");

    if (!this.rpg) return;

    this.bindEvents();
    this.bindPresetActions();
    this.bindRpgActions();
    this.bindInventoryActions();
    this.render();
  }

  bindEvents() {
    window.addEventListener("storage", (event) => {
      if (
        event.key === "sol-de-soter-rpg" ||
        event.key === "sol-de-soter-rpg-config" ||
        event.key === "sol-de-soter-rpg-meta"
      ) {
        this.render();
      }
    });
  }

  bindPresetActions() {
    document.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const preset = btn.getAttribute("data-preset") || "balanced";
        this.rpg.meta.profile.preset = preset;
        this.rpg.addSmartNotification(`Preset de build alterado para ${this.getPresetLabel(preset)}.`, "info");
        this.rpg.saveMeta();
        this.render();
      });
    });
  }

  bindRpgActions() {
    const classSelect = document.getElementById("rpg-class-select");
    if (classSelect) {
      classSelect.addEventListener("change", () => {
        const result = this.rpg.setPlayerClass(classSelect.value);
        if (!result.ok) this.rpg.addSmartNotification(result.reason, "warning");
        this.render();
      });
    }

    const prestigeBtn = document.getElementById("rpg-prestige-btn");
    if (prestigeBtn) {
      prestigeBtn.addEventListener("click", () => {
        const result = this.rpg.performPrestige();
        if (!result.ok) this.rpg.addSmartNotification(result.reason, "warning");
        this.render();
      });
    }
  }

  bindInventoryActions() {
    const openBtn = document.getElementById("rpg-open-inventory");
    const closeBtn = document.getElementById("rpg-close-inventory");
    const modal = document.getElementById("rpg-inventory-modal");
    if (!modal) return;

    if (openBtn) {
      openBtn.addEventListener("click", () => {
        this.renderInventory();
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
      });
    }
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
      }
    });
  }

  render() {
    const data = this.rpg.data;
    const rank = this.rpg.getRankByLevel(data.level);
    const rankLabel = this.getRankLabel(rank);
    const xpPercent = Math.min(100, Math.round((data.xp / data.xpToNextLevel) * 100));
    const totalStats =
      data.stats.strength.lvl +
      data.stats.intelligence.lvl +
      data.stats.wisdom.lvl +
      data.stats.productivity.lvl;
    const powerScore = data.level * 120 + totalStats * 35 + data.xp;
    const nextRank = this.getNextRankInfo(data.level);

    this.setText("perfil-level", data.level);
    this.setText("perfil-rank", rankLabel);
    this.setText("perfil-current-xp", data.xp);
    this.setText("perfil-next-xp", data.xpToNextLevel);
    this.setText("perfil-progress-text", `${data.xp} / ${data.xpToNextLevel} XP`);
    this.setText("perfil-rank-pill", rankLabel);
    this.setText("perfil-rank-desc", this.getRankDescription(rank));
    this.setText("perfil-classe", this.getBuildClass(data.stats));
    this.setText("perfil-class-atual", `Classe atual: ${this.getClassLabel(this.rpg.meta.classSystem?.selected)}`);
    this.setText("perfil-power-score", powerScore);
    this.setText("perfil-total-stats", totalStats);
    this.setText("perfil-next-rank", nextRank);
    this.setWidth("perfil-progress-fill", xpPercent);
    this.applyRankTheme(rank);

    this.renderStat("strength", "stat-strength", "stat-fill-strength");
    this.renderStat("intelligence", "stat-intelligence", "stat-fill-intelligence");
    this.renderStat("wisdom", "stat-wisdom", "stat-fill-wisdom");
    this.renderStat("productivity", "stat-productivity", "stat-fill-productivity");

    this.drawStatusChart();
    this.drawRadarChart();
    this.renderAchievements();
    this.renderStreak();
    this.renderAreaRanking();
    this.renderTitles();
    this.renderBoss();
    this.renderAreaBosses();
    this.renderGuilds();
    this.renderHeatmap();
    this.renderPreset();
    this.renderClassSystem();
    this.renderTalentTree();
    this.renderShopEquipment();
    this.renderPrestige();
    this.renderBattleLog();
    this.renderSmartAlerts();
    this.renderTimeline();
    this.renderInsights();
  }

  renderStat(statKey, textId, fillId) {
    const stat = this.rpg.data.stats[statKey];
    const factor = this.rpg.config.progression.statLevelFactor;
    const nextLvlXp = Math.max(1, stat.lvl * factor);
    const pct = Math.min(100, Math.round((stat.xp / nextLvlXp) * 100));

    this.setText(textId, `Lvl ${stat.lvl} · ${stat.xp} XP`);
    this.setWidth(fillId, pct);
  }

  drawStatusChart() {
    if (!this.chartCanvas) return;
    const ctx = this.chartCanvas.getContext("2d");
    if (!ctx) return;

    const stats = this.rpg.data.stats;
    const points = [
      { label: "Força", value: stats.strength.lvl, color: "#f38ba8" },
      { label: "Intelecto", value: stats.intelligence.lvl, color: "#89b4fa" },
      { label: "Sabedoria", value: stats.wisdom.lvl, color: "#f9e2af" },
      { label: "Produtividade", value: stats.productivity.lvl, color: "#a6e3a1" },
    ];

    const maxValue = Math.max(5, ...points.map((item) => item.value));
    const w = this.chartCanvas.width;
    const h = this.chartCanvas.height;
    const padding = 44;
    const chartW = w - padding * 2;
    const chartH = h - padding * 2;
    const barGap = 24;
    const barW = (chartW - barGap * (points.length - 1)) / points.length;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#121212";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(w - padding, y);
      ctx.stroke();
    }

    ctx.font = '12px "Russo One", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    points.forEach((item, idx) => {
      const x = padding + idx * (barW + barGap);
      const barH = (item.value / maxValue) * chartH;
      const y = padding + chartH - barH;

      ctx.fillStyle = item.color;
      ctx.fillRect(x, y, barW, barH);

      ctx.fillStyle = "#f0f0f0";
      ctx.fillText(item.label, x + barW / 2, h - padding + 8);
      ctx.fillText(`Lvl ${item.value}`, x + barW / 2, y - 18);
    });
  }

  drawRadarChart() {
    if (!this.radarCanvas) return;
    const ctx = this.radarCanvas.getContext("2d");
    if (!ctx) return;

    const stats = this.rpg.data.stats;
    const values = [stats.strength.lvl, stats.intelligence.lvl, stats.wisdom.lvl, stats.productivity.lvl];
    const labels = ["Força", "Intelecto", "Sabedoria", "Produtividade"];
    const maxValue = Math.max(5, ...values);

    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.34;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#121212";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    for (let l = 1; l <= 4; l++) {
      const r = (radius * l) / 4;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = -Math.PI / 2 + (Math.PI * 2 * i) / 4;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + (Math.PI * 2 * i) / 4;
      const x = cx + Math.cos(a) * radius;
      const y = cy + Math.sin(a) * radius;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + (Math.PI * 2 * i) / 4;
      const r = (values[i] / maxValue) * radius;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(203,166,247,0.32)";
    ctx.fill();
    ctx.strokeStyle = "#cba6f7";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '12px "Russo One", sans-serif';
    ctx.fillStyle = "#f0f0f0";
    labels.forEach((label, i) => {
      const a = -Math.PI / 2 + (Math.PI * 2 * i) / 4;
      const x = cx + Math.cos(a) * (radius + 18);
      const y = cy + Math.sin(a) * (radius + 18);
      ctx.textAlign = "center";
      ctx.fillText(label, x, y);
    });
  }

  renderAchievements() {
    const container = document.getElementById("rpg-achievements");
    if (!container) return;
    const achievements = (this.rpg.meta.achievements || []).map((a) => ({
      label: a.label,
      at: a.at,
      source: "rpg",
    }));
    let sonhosAchievements = [];
    try {
      const sonhosRaw = JSON.parse(localStorage.getItem("conquistas-objetivos") || "[]");
      if (Array.isArray(sonhosRaw)) {
        sonhosAchievements = sonhosRaw.map((c) => ({
          label: c?.titulo || "Conquista de Sonhos",
          at: c?.data || new Date().toISOString(),
          source: "sonhos",
        }));
      }
    } catch (_err) {
      sonhosAchievements = [];
    }

    const allAchievements = [...achievements, ...sonhosAchievements]
      .filter((a) => a && a.label)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    if (!allAchievements.length) {
      container.innerHTML = '<div class="badge-item"><strong>Sem conquistas</strong><span>Ganhe XP para desbloquear.</span></div>';
      return;
    }
    container.innerHTML = allAchievements
      .slice(0, 12)
      .map((a) => `<div class="badge-item"><strong>${a.label}</strong><span>${this.formatDate(a.at)}${a.source === "sonhos" ? " • Sonhos" : ""}</span></div>`)
      .join("");
  }

  renderStreak() {
    const streakBase = this.rpg.meta.streak || { current: 0, best: 0, lastDate: null };
    const streak = {
      ...streakBase,
      current: 0,
      best: 0,
      lastDate: null,
    };
    this.setText("rpg-streak-current", `${streak.current} dias`);
    this.setText("rpg-streak-best", `${streak.best} dias`);
    this.setText("rpg-streak-last", `Última atividade: ${streak.lastDate ? this.formatDate(streak.lastDate) : "-"}`);

    this.setText("rpg-streak-current-top", streak.current);
    const flames = document.getElementById("rpg-streak-flames");
    const topWrap = document.getElementById("perfil-streak-top-right");
    const flamesDisplay = document.getElementById("rpg-streak-flames-display");
    const streakCard = document.getElementById("perfil-streak-card");
    if (!flames) return;

    const levelClass = streak.current >= 20
      ? "streak-level-strong"
      : streak.current >= 5
        ? "streak-level-simple"
        : "streak-level-none";

    [topWrap, streakCard].forEach((el) => {
      if (!el) return;
      el.classList.remove("streak-level-none", "streak-level-simple", "streak-level-strong");
      el.classList.add(levelClass);
    });

    if (streak.current < 5) {
      flames.innerHTML = "";
      if (flamesDisplay) flamesDisplay.innerHTML = "";
    } else {
      const visible = Math.min(8, Math.max(0, streak.current));
      const iconsTop = Array.from({ length: visible }, () => '<i class="fas fa-fire" aria-hidden="true"></i>');
      if (streak.current > 8) iconsTop.push(`<span class="streak-top-overflow">+${streak.current - 8}</span>`);
      flames.innerHTML = iconsTop.join("");

      if (flamesDisplay) {
        const iconsDisplay = Array.from({ length: visible }, () => '<i class="fas fa-fire" aria-hidden="true"></i>');
        if (streak.current > 8) {
          iconsDisplay.push(`<span class="streak-display-overflow">+${streak.current - 8}</span>`);
        }
        flamesDisplay.innerHTML = iconsDisplay.join("");
      }
    }

    if (topWrap) {
      const last = streak.lastDate ? this.formatDate(streak.lastDate) : "-";
      topWrap.title = `Streak atual: ${streak.current} dias | Melhor: ${streak.best} | Última atividade: ${last}`;
    }
  }

  renderAreaRanking() {
    const list = document.getElementById("rpg-area-ranking");
    if (!list) return;
    const stats = this.rpg.data.stats;
    const rows = [
      { area: "Corpo", lvl: stats.strength.lvl },
      { area: "Mente", lvl: stats.intelligence.lvl },
      { area: "Sabedoria", lvl: stats.wisdom.lvl },
      { area: "Execução", lvl: stats.productivity.lvl },
    ].sort((a, b) => b.lvl - a.lvl);
    list.innerHTML = rows
      .map((r, i) => `<li><span>#${i + 1} ${r.area}</span><strong>Lvl ${r.lvl}</strong></li>`)
      .join("");
  }

  renderTitles() {
    const current = this.rpg.meta.profile?.title || "Recruta de Sóter";
    const list = document.getElementById("rpg-title-list");
    this.setText("rpg-current-title", current);
    if (!list) return;
    const titles = [
      "Recruta de Sóter",
      "Guardião de Sóter",
      "Mestre de Sóter",
      "Senhor da Consistência",
      "Lenda de Sóter",
    ];
    list.innerHTML = titles
      .map((t) => `<div class="title-item ${t === current ? "active" : ""}">${t}</div>`)
      .join("");
  }

  renderBoss() {
    const boss = this.rpg.meta.boss || { name: "Titã da Disciplina", phase: 1, hpPct: 100, defeated: false };
    this.setText("rpg-boss-name", boss.name);
    this.setText("rpg-boss-hp", `${boss.hpPct}%`);
    this.setText("rpg-boss-phase", `${boss.phase}/4`);
    this.setText("rpg-lifetime-xp", this.rpg.meta.lifetimeXp || 0);
    this.setText("rpg-boss-status", boss.defeated ? "Derrotado" : "Em combate");
    this.setWidth("rpg-boss-fill", Math.max(0, Math.min(100, boss.hpPct)));
  }

  renderAreaBosses() {
    const container = document.getElementById("rpg-area-bosses");
    if (!container) return;
    const bosses = this.rpg.meta.areaBosses || {};
    const map = {
      strength: "Força",
      intelligence: "Intelecto",
      wisdom: "Sabedoria",
      productivity: "Produtividade",
    };
    container.innerHTML = Object.keys(map)
      .map((key) => {
        const b = bosses[key] || { hpPct: 100, phase: 1, defeated: false, name: map[key] };
        return `
          <div class="area-boss-item">
            <strong>${b.name}</strong>
            <div class="perfil-progress">
              <div class="perfil-progress-head">
                <span>${map[key]}</span>
                <span>${b.hpPct}%</span>
              </div>
              <div class="perfil-progress-bar"><div class="perfil-progress-fill" style="width:${Math.max(0, Math.min(100, b.hpPct))}%"></div></div>
            </div>
            <small>Fase ${b.phase}/4 • ${b.defeated ? "Derrotado" : "Ativo"}</small>
          </div>
        `;
      })
      .join("");
  }

  renderGuilds() {
    const container = document.getElementById("rpg-guilds");
    if (!container) return;
    const guilds = this.rpg.meta.guilds || {};
    const defs = this.rpg.getGuildDefinitions();
    container.innerHTML = Object.keys(defs)
      .map((key) => {
        const g = guilds[key] || { level: 1, xp: 0 };
        const threshold = g.level * 280;
        const pct = Math.round((g.xp / Math.max(1, threshold)) * 100);
        return `
          <div class="guild-item">
            <strong>${defs[key].label}</strong>
            <div class="perfil-progress">
              <div class="perfil-progress-head">
                <span>Nível ${g.level}</span>
                <span>${g.xp}/${threshold}</span>
              </div>
              <div class="perfil-progress-bar"><div class="perfil-progress-fill" style="width:${Math.max(0, Math.min(100, pct))}%"></div></div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  renderHeatmap() {
    const container = document.getElementById("rpg-heatmap");
    if (!container) return;
    const map = this.rpg.meta.activityByDay || {};
    const days = [];
    const today = new Date();
    for (let i = 69; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = this.toDateKey(d);
      days.push({ key, xp: Number(map[key]) || 0 });
    }
    const max = Math.max(1, ...days.map((d) => d.xp));
    container.innerHTML = days
      .map((d) => {
        const pct = d.xp / max;
        const alpha = d.xp <= 0 ? 0.08 : 0.25 + pct * 0.75;
        return `<div class="heat-cell" title="${d.key}: ${d.xp} XP" style="background: rgba(203,166,247,${alpha.toFixed(2)})"></div>`;
      })
      .join("");
  }

  renderPreset() {
    const preset = this.rpg.meta.profile?.preset || "balanced";
    document.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-preset") === preset);
    });
    this.setText("rpg-preset-desc", `Preset atual: ${this.getPresetLabel(preset)}.`);
  }

  renderClassSystem() {
    const select = document.getElementById("rpg-class-select");
    const desc = document.getElementById("rpg-class-desc");
    const classes = this.rpg.getClassDefinitions();
    const current = this.rpg.meta.classSystem?.selected || "adventurer";
    if (select) select.value = current;
    if (desc) desc.textContent = classes[current]?.desc || "Build equilibrada.";
  }

  renderInventory() {
    const content = document.getElementById("rpg-inventory-content");
    if (!content) return;

    const catalog = this.rpg.getEquipmentCatalog();
    const ownedIds = Array.isArray(this.rpg.meta.equipment?.owned) ? this.rpg.meta.equipment.owned : [];
    const equippedId = this.rpg.meta.equipment?.equipped || null;

    const ownedItems = ownedIds
      .map((id) => catalog[id])
      .filter(Boolean);

    if (!ownedItems.length) {
      content.innerHTML = `
        <div class="inventory-grid-frame">
          <div class="inventory-grid">
            <div class="inventory-slot filled">
              <div class="inventory-item">
                <strong><i class="fas fa-bag-shopping"></i> Inventario vazio</strong>
                <div>Compre itens na Loja para aparecerem aqui.</div>
              </div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const slots = ownedItems.map((item) => {
      const bonus = Object.entries(item.bonus || {})
        .map(([stat, mult]) => `${stat} x${Number(mult).toFixed(2)}`)
        .join(" | ");
      const equippedTag = item.id === equippedId ? " (Equipado)" : "";

      return `
        <div class="inventory-slot filled">
          <div class="inventory-item">
            <strong><i class="fas fa-shield-alt"></i> ${item.label}${equippedTag}</strong>
            <div>${bonus || "Sem bonus"}</div>
          </div>
        </div>
      `;
    });

    content.innerHTML = `
      <div class="inventory-grid-frame">
        <div class="inventory-grid">
          ${slots.join("")}
        </div>
      </div>
    `;
  }

  renderTalentTree() {
    const container = document.getElementById("rpg-talent-tree");
    if (!container) return;
    const points = this.rpg.meta.talents?.points || 0;
    this.setText("rpg-talent-points", points);
    const unlocked = new Set(this.rpg.meta.talents?.unlocked || []);
    const talents = this.rpg.getTalentDefinitions();
    container.innerHTML = talents
      .map((talent) => {
        const isUnlocked = unlocked.has(talent.id);
        const disabled = isUnlocked || points < talent.cost;
        return `
          <div class="talent-node ${isUnlocked ? "unlocked" : ""}">
            <strong>${talent.label}</strong>
            <div>Custo: ${talent.cost}</div>
            <button class="perfil-btn ${isUnlocked ? "" : "primary"}" data-talent-id="${talent.id}" ${disabled ? "disabled" : ""}>
              ${isUnlocked ? "Desbloqueado" : "Desbloquear"}
            </button>
          </div>
        `;
      })
      .join("");
    container.querySelectorAll("[data-talent-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-talent-id");
        const result = this.rpg.unlockTalent(id);
        if (!result.ok) this.rpg.addSmartNotification(result.reason, "warning");
        this.render();
      });
    });
  }

  renderShopEquipment() {
    this.setText("rpg-coins", this.rpg.meta.economy?.coins || 0);
    const equipped = this.rpg.meta.equipment?.equipped;
    const eqLabel = equipped ? (this.rpg.getEquipmentCatalog()[equipped]?.label || equipped) : "Nenhum";
    this.setText("rpg-equipped-item", eqLabel);

    const container = document.getElementById("rpg-shop-list");
    if (!container) return;
    const shop = this.rpg.getShopCatalog();
    const owned = new Set(this.rpg.meta.equipment?.owned || []);
    container.innerHTML = shop
      .map((item) => {
        const isOwned = owned.has(item.id);
        const canEquip = item.type === "equipment" && isOwned;
        return `
          <div class="shop-item">
            <strong>${item.label}</strong>
            <div>${item.cost} moedas</div>
            <button class="perfil-btn primary" data-buy-item="${item.id}">Comprar</button>
            ${canEquip ? `<button class="perfil-btn" data-equip-item="${item.id}">Equipar</button>` : ""}
          </div>
        `;
      })
      .join("");

    container.querySelectorAll("[data-buy-item]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const result = this.rpg.buyShopItem(btn.getAttribute("data-buy-item"));
        if (!result.ok) this.rpg.addSmartNotification(result.reason, "warning");
        this.render();
      });
    });
    container.querySelectorAll("[data-equip-item]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const result = this.rpg.equipItem(btn.getAttribute("data-equip-item"));
        if (!result.ok) this.rpg.addSmartNotification(result.reason, "warning");
        this.render();
      });
    });
  }

  renderPrestige() {
    this.setText("rpg-prestige-tokens", this.rpg.meta.economy?.prestige || 0);
    const btn = document.getElementById("rpg-prestige-btn");
    if (btn) btn.disabled = !this.rpg.canPrestige();
  }

  renderBattleLog() {
    const list = document.getElementById("rpg-battle-log");
    if (!list) return;
    const log = this.rpg.meta.xpLog || [];
    if (!log.length) {
      list.innerHTML = '<li>Sem eventos de XP por enquanto.</li>';
      return;
    }
    list.innerHTML = log
      .slice(0, 20)
      .map((e) => `<li>+${e.xp} XP em ${this.formatSource(e.source)} · ${this.formatDateTime(e.at)}</li>`)
      .join("");
  }

  renderSmartAlerts() {
    const list = document.getElementById("rpg-smart-alerts");
    if (!list) return;
    const alerts = this.rpg.meta.smartNotifications || [];
    if (!alerts.length) {
      list.innerHTML = '<li>Sem alertas no momento.</li>';
      return;
    }
    list.innerHTML = alerts
      .slice(0, 20)
      .map((a) => `<li>[${a.kind || "info"}] ${a.message}</li>`)
      .join("");
  }

  renderTimeline() {
    const list = document.getElementById("rpg-timeline");
    if (!list) return;
    const timeline = this.rpg.meta.timeline || [];
    if (!timeline.length) {
      list.innerHTML = "<li>Sem eventos na timeline.</li>";
      return;
    }
    list.innerHTML = timeline
      .slice(0, 20)
      .map((e) => `<li>[${e.type}] ${e.text} • ${this.formatDateTime(e.at)}</li>`)
      .join("");
  }

  renderInsights() {
    const list = document.getElementById("rpg-insights");
    if (!list) return;
    const insight = this.rpg.getPredictiveInsights();
    const lines = [];
    lines.push(`Média diária (7 dias): ${insight.avgDailyXp} XP.`);
    if (insight.daysToLevel !== null) {
      lines.push(`Previsão de nível: ${insight.daysToLevel} dia(s) (aprox. ${insight.nextLevelAt || "-"})`);
    } else {
      lines.push("Sem dados suficientes para previsão de nível.");
    }
    const nextRank = this.getNextRankInfo(this.rpg.data.level);
    lines.push(`Previsão de rank: ${nextRank}.`);
    list.innerHTML = lines.map((l) => `<li>${l}</li>`).join("");
  }

  getRankLabel(rank) {
    const map = {
      bronze: "Bronze",
      prata: "Prata",
      ouro: "Ouro",
      diamante: "Diamante",
      platina: "Platina",
      profissional: "Profissional",
    };
    return map[rank] || "Bronze";
  }

  applyRankTheme(rank) {
    const card = document.getElementById("perfil-aventureiro-card");
    if (!card) return;
    const rankClasses = [
      "rank-theme-bronze",
      "rank-theme-prata",
      "rank-theme-ouro",
      "rank-theme-diamante",
      "rank-theme-platina",
      "rank-theme-profissional",
    ];
    card.classList.remove(...rankClasses);
    card.classList.add(`rank-theme-${rank}`);
  }

  getRankDescription(rank) {
    const map = {
      bronze: "Base sólida: sua jornada começou.",
      prata: "Consistência crescente e foco diário.",
      ouro: "Performance acima da média.",
      diamante: "Alto desempenho em múltiplos status.",
      platina: "Elite da produtividade e disciplina.",
      profissional: "Lenda viva do seu próprio jogo.",
    };
    return map[rank] || "Construindo seu legado.";
  }

  getBuildClass(stats) {
    const ordered = [
      { label: "Guardião da Força", value: stats.strength.lvl },
      { label: "Arcanista do Intelecto", value: stats.intelligence.lvl },
      { label: "Oráculo da Sabedoria", value: stats.wisdom.lvl },
      { label: "Estrategista da Produtividade", value: stats.productivity.lvl },
    ].sort((a, b) => b.value - a.value);
    return ordered[0].label;
  }

  getNextRankInfo(level) {
    const lvl = Number(level) || 1;
    const ranks = this.rpg.config.ranks;
    if (lvl <= ranks.bronzeMax) return `${Math.max(0, ranks.bronzeMax + 1 - lvl)} níveis`;
    if (lvl <= ranks.prataMax) return `${Math.max(0, ranks.prataMax + 1 - lvl)} níveis`;
    if (lvl <= ranks.ouroMax) return `${Math.max(0, ranks.ouroMax + 1 - lvl)} níveis`;
    if (lvl <= ranks.diamanteMax) return `${Math.max(0, ranks.diamanteMax + 1 - lvl)} níveis`;
    if (lvl <= ranks.platinaMax) return `${Math.max(0, ranks.platinaMax + 1 - lvl)} níveis`;
    return "Rank máximo";
  }

  getPresetLabel(preset) {
    const map = {
      balanced: "Balanceado",
      study: "Foco Estudo",
      fitness: "Foco Físico",
      finance: "Foco Financeiro",
    };
    return map[preset] || "Balanceado";
  }

  getClassLabel(classId) {
    const defs = this.rpg.getClassDefinitions();
    return defs[classId]?.label || "Aventureiro";
  }

  formatSource(source) {
    const s = String(source || "general").toLowerCase();
    const map = {
      strength: "Força",
      intelligence: "Intelecto",
      wisdom: "Sabedoria",
      productivity: "Produtividade",
      diario: "Diário",
      meta: "Meta",
      sonho: "Sonho",
      general: "Geral",
    };
    return map[s] || source;
  }

  formatDate(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("pt-BR");
  }

  formatDateTime(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  setWidth(id, value) {
    const el = document.getElementById(id);
    if (el) el.style.width = `${value}%`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (typeof atualizarSaldoGlobal === "function") atualizarSaldoGlobal();
  new PerfilRPGPage();
});
