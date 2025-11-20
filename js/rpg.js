// ===== SISTEMA RPG GLOBAL (GAMIFICATION) ===== //
class RPGSystem {
  constructor() {
    this.data = this.loadData();
    this.init();
  }

  init() {
    this.updateUI();
    this.bindEvents();
  }

  loadData() {
    const saved = localStorage.getItem("sol-de-soter-rpg");
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

  gainXP(category) {
    const xpAmount = 10;
    let statKey = null; // Inicializa como null para indicar que não afeta estatística

    if (category === "health" || category === "academia") statKey = "strength";
    else if (
      category === "study" ||
      category === "livraria" ||
      category === "cinema"
    )
      statKey = "intelligence";
    else if (category === "financeiro") statKey = "wisdom";
    // Metas e Sonhos agora afetam APENAS o nível geral, não as estatísticas

    let statLeveledUp = false;
    if (statKey) {
      const stat = this.data.stats[statKey];
      stat.xp += xpAmount;

      const statNextLvl = stat.lvl * 50;
      if (stat.xp >= statNextLvl) {
        stat.lvl++;
        stat.xp -= statNextLvl;
        statLeveledUp = true;
      }
    }

    this.data.xp += xpAmount;
    let charLeveledUp = false;
    if (this.data.xp >= this.data.xpToNextLevel) {
      this.data.level++;
      this.data.xp -= this.data.xpToNextLevel;
      this.data.xpToNextLevel = Math.floor(this.data.xpToNextLevel * 1.2);
      charLeveledUp = true;
    }

    this.saveData();
    // Passa a categoria original para o toast, mas usa statKey para o ícone se existir
    this.showToast(xpAmount, statKey || category, statLeveledUp, charLeveledUp);
  }

  updateUI() {
    // Header Elements
    const headerBar = document.getElementById("header-xp-bar");
    const headerBadge = document.getElementById("header-level-badge");

    if (headerBar && headerBadge) {
      const xpPercent = (this.data.xp / this.data.xpToNextLevel) * 100;
      headerBar.style.width = `${xpPercent}%`;
      headerBadge.textContent = this.data.level;
    }

    // Dropdown Stats
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
    // Cria container se não existir (para páginas que não têm o HTML base)
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
      meta: '<i class="fas fa-bullseye"></i>', // Novo ícone para metas
      sonho: '<i class="fas fa-star"></i>', // Novo ícone para sonhos
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
    } else {
      toastText = `<span>+<span class="rpg-toast-xp">${xp} XP</span> em ${this.data.stats[type].name}</span>`;
    }

    toast.innerHTML = `${icons[type] || icons.productivity} ${toastText}`;
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
    // Sincroniza abas diferentes quando o localStorage muda
    window.addEventListener("storage", (event) => {
      if (event.key === "sol-de-soter-rpg") {
        this.data = JSON.parse(event.newValue);
        this.updateUI();
      }
    });
  }
}

// Inicializa globalmente
const rpgSystem = new RPGSystem();
window.rpgSystem = rpgSystem; // Disponível no console e outros scripts
