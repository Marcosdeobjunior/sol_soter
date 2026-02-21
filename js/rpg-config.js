function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

class PerfilRPGPage {
  constructor() {
    this.feedbackEl = document.getElementById("perfil-feedback");
    this.rpg = window.rpgSystem || null;

    if (!this.rpg) {
      this.setFeedback(
        "Sistema RPG não carregado. Verifique js/rpg.js nesta página.",
        false
      );
      return;
    }

    this.bindEvents();
    this.fillForm();
    this.renderOverview();
  }

  setFeedback(message, success = true) {
    this.feedbackEl.textContent = message;
    this.feedbackEl.classList.toggle("ok", success);
  }

  fillForm() {
    const cfg = this.rpg.getConfig();

    document.getElementById("base-xp").value =
      cfg.progression.baseXpToNextLevel;
    document.getElementById("growth-multiplier").value =
      cfg.progression.levelGrowthMultiplier;
    document.getElementById("stat-factor").value = cfg.progression.statLevelFactor;

    document.getElementById("xp-easy").value = cfg.rewards.taskEasy;
    document.getElementById("xp-medium").value = cfg.rewards.taskMedium;
    document.getElementById("xp-hard").value = cfg.rewards.taskHard;

    document.getElementById("rank-bronze").value = cfg.ranks.bronzeMax;
    document.getElementById("rank-prata").value = cfg.ranks.prataMax;
    document.getElementById("rank-ouro").value = cfg.ranks.ouroMax;
    document.getElementById("rank-diamante").value = cfg.ranks.diamanteMax;
    document.getElementById("rank-platina").value = cfg.ranks.platinaMax;
  }

  renderOverview() {
    const data = this.rpg.data;
    const rank = this.rpg.getRankByLevel(data.level);
    const xpPercent = Math.min(
      100,
      Math.round((data.xp / data.xpToNextLevel) * 100)
    );

    document.getElementById("perfil-level").textContent = data.level;
    document.getElementById("perfil-rank").textContent = rank;
    document.getElementById("perfil-next-xp").textContent = data.xpToNextLevel;
    document.getElementById("perfil-current-xp").textContent = data.xp;
    document.getElementById("perfil-progress-fill").style.width = `${xpPercent}%`;
    document.getElementById(
      "perfil-progress-text"
    ).textContent = `${data.xp} / ${data.xpToNextLevel} XP`;

    document.getElementById(
      "stat-strength"
    ).textContent = `Lvl ${data.stats.strength.lvl} · ${data.stats.strength.xp} XP`;
    document.getElementById(
      "stat-intelligence"
    ).textContent = `Lvl ${data.stats.intelligence.lvl} · ${data.stats.intelligence.xp} XP`;
    document.getElementById(
      "stat-wisdom"
    ).textContent = `Lvl ${data.stats.wisdom.lvl} · ${data.stats.wisdom.xp} XP`;
    document.getElementById(
      "stat-productivity"
    ).textContent = `Lvl ${data.stats.productivity.lvl} · ${data.stats.productivity.xp} XP`;
  }

  bindEvents() {
    document.getElementById("rpg-config-form").addEventListener("submit", (e) => {
      e.preventDefault();

      const nextConfig = {
        progression: {
          baseXpToNextLevel: toNumber(
            document.getElementById("base-xp").value,
            100
          ),
          levelGrowthMultiplier: toNumber(
            document.getElementById("growth-multiplier").value,
            1.2
          ),
          statLevelFactor: toNumber(
            document.getElementById("stat-factor").value,
            50
          ),
        },
        rewards: {
          taskEasy: toNumber(document.getElementById("xp-easy").value, 10),
          taskMedium: toNumber(document.getElementById("xp-medium").value, 20),
          taskHard: toNumber(document.getElementById("xp-hard").value, 35),
        },
        ranks: {
          bronzeMax: toNumber(document.getElementById("rank-bronze").value, 10),
          prataMax: toNumber(document.getElementById("rank-prata").value, 20),
          ouroMax: toNumber(document.getElementById("rank-ouro").value, 30),
          diamanteMax: toNumber(
            document.getElementById("rank-diamante").value,
            40
          ),
          platinaMax: toNumber(document.getElementById("rank-platina").value, 50),
        },
      };

      this.rpg.updateConfig(nextConfig);
      this.fillForm();
      this.renderOverview();
      this.setFeedback("Configurações do RPG salvas com sucesso.", true);
    });

    document.getElementById("btn-reset-config").addEventListener("click", () => {
      if (!confirm("Restaurar configurações padrão do RPG?")) return;
      this.rpg.resetConfig();
      this.fillForm();
      this.renderOverview();
      this.setFeedback("Configurações restauradas para o padrão.", true);
    });

    document.getElementById("btn-recalc-threshold").addEventListener("click", () => {
      this.rpg.recalculateCurrentLevelThreshold();
      this.renderOverview();
      this.setFeedback(
        "XP do próximo nível recalculado com base na configuração atual.",
        true
      );
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (typeof atualizarSaldoGlobal === "function") atualizarSaldoGlobal();
  new PerfilRPGPage();
});
