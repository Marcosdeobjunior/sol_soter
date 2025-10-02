// ===== DASHBOARD FUNCTIONALITY =====

// Dados simulados para os widgets
const dashboardData = {
  financeiro: {
    saldo: 2847.50,
    variacao: 2.5,
    isPositiva: true
  },
  diario: {
    ultimaEntrada: {
      data: "Hoje, 15:30",
      preview: "Hoje foi um dia produtivo. Consegui finalizar o projeto do dashboard e estou muito satisfeito com o resultado..."
    }
  },
  biblioteca: {
    mediaAtual: {
      tipo: "Livro",
      titulo: "O Hobbit - J.R.R. Tolkien",
      progresso: 65
    }
  },
  viagens: {
    proximaViagem: {
      destino: "Paris, França",
      dataPartida: "15 de Dezembro",
      diasRestantes: 45
    }
  },
  sonhos: {
    metaAtual: {
      titulo: "Aprender Francês",
      progresso: 40,
      prazo: "Junho 2025"
    }
  }
};

// Classe principal do Dashboard
class Dashboard {
  constructor() {
    this.initializeWidgets();
    this.setupEventListeners();
    this.loadData();
  }

  // Inicializa os widgets
  initializeWidgets() {
    this.widgets = {
      financeiro: document.querySelector('.widget-financeiro'),
      diario: document.querySelector('.widget-diario'),
      biblioteca: document.querySelector('.widget-biblioteca'),
      viagens: document.querySelector('.widget-viagens'),
      sonhos: document.querySelector('.widget-sonhos')
    };
  }

  // Configura os event listeners
  setupEventListeners() {
    // Adiciona clique nos widgets para navegação
    Object.keys(this.widgets).forEach(widgetKey => {
      const widget = this.widgets[widgetKey];
      if (widget) {
        widget.addEventListener('click', (e) => {
          e.preventDefault();
          this.navigateToSection(widget.dataset.link);
        });

        // Adiciona efeito de ripple no clique
        widget.addEventListener('mousedown', this.createRippleEffect);
      }
    });

    // Atualiza dados periodicamente (simulação)
    setInterval(() => {
      this.updateFinanceiroWidget();
    }, 30000); // Atualiza a cada 30 segundos
  }

  // Carrega os dados iniciais
  loadData() {
    this.updateFinanceiroWidget();
    this.updateDiarioWidget();
    this.updateBibliotecaWidget();
    this.updateViagensWidget();
    this.updateSonhosWidget();
  }

  // Atualiza widget financeiro
  updateFinanceiroWidget() {
    const data = dashboardData.financeiro;
    
    // Atualiza saldo
    const saldoElement = document.getElementById('widget-saldo');
    if (saldoElement) {
      saldoElement.textContent = this.formatCurrency(data.saldo);
    }

    // Atualiza variação
    const variacaoElement = document.getElementById('widget-variacao');
    if (variacaoElement) {
      const icon = data.isPositiva ? 'fa-arrow-up' : 'fa-arrow-down';
      const sinal = data.isPositiva ? '+' : '-';
      const classe = data.isPositiva ? '' : 'negativa';
      
      variacaoElement.className = `saldo-variacao ${classe}`;
      variacaoElement.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${sinal}${Math.abs(data.variacao)}% hoje</span>
      `;
    }

    // Sincroniza com o saldo global (se existir)
    if (typeof atualizarSaldoGlobal === 'function') {
      atualizarSaldoGlobal();
    }
  }

  // Atualiza widget diário
  updateDiarioWidget() {
    const data = dashboardData.diario.ultimaEntrada;
    
    const dataElement = document.getElementById('widget-entrada-data');
    const previewElement = document.getElementById('widget-entrada-preview');
    
    if (dataElement) dataElement.textContent = data.data;
    if (previewElement) previewElement.textContent = data.preview;
  }

  // Atualiza widget biblioteca
  updateBibliotecaWidget() {
    const data = dashboardData.biblioteca.mediaAtual;
    
    const tipoElement = document.getElementById('widget-media-tipo');
    const tituloElement = document.getElementById('widget-media-titulo');
    const progressoFillElement = document.getElementById('widget-progresso-fill');
    const progressoTextoElement = document.getElementById('widget-progresso-texto');
    
    if (tipoElement) tipoElement.textContent = data.tipo;
    if (tituloElement) tituloElement.textContent = data.titulo;
    if (progressoFillElement) progressoFillElement.style.width = `${data.progresso}%`;
    if (progressoTextoElement) progressoTextoElement.textContent = `${data.progresso}%`;
  }

  // Atualiza widget viagens
  updateViagensWidget() {
    const data = dashboardData.viagens.proximaViagem;
    
    const destinoElement = document.getElementById('widget-destino');
    const dataPartidaElement = document.getElementById('widget-data-partida');
    const countdownElement = document.getElementById('widget-countdown');
    
    if (destinoElement) destinoElement.textContent = data.destino;
    if (dataPartidaElement) dataPartidaElement.textContent = data.dataPartida;
    if (countdownElement) {
      countdownElement.innerHTML = `
        <i class="fas fa-clock"></i>
        <span>${data.diasRestantes} dias</span>
      `;
    }
  }

  // Atualiza widget sonhos
  updateSonhosWidget() {
    const data = dashboardData.sonhos.metaAtual;
    
    const tituloElement = document.getElementById('widget-meta-titulo');
    const progressoFillElement = document.getElementById('widget-meta-fill');
    const progressoTextoElement = document.getElementById('widget-meta-texto');
    const prazoElement = document.getElementById('widget-meta-prazo');
    
    if (tituloElement) tituloElement.textContent = data.titulo;
    if (progressoFillElement) progressoFillElement.style.width = `${data.progresso}%`;
    if (progressoTextoElement) progressoTextoElement.textContent = `${data.progresso}%`;
    if (prazoElement) prazoElement.textContent = `Meta: ${data.prazo}`;
  }

  // Navega para uma seção específica
  navigateToSection(link) {
    if (link && link !== '#') {
      // Adiciona uma pequena animação antes de navegar
      const widget = event.currentTarget;
      widget.style.transform = 'scale(0.95)';
      
      setTimeout(() => {
        window.location.href = link;
      }, 150);
    }
  }

  // Cria efeito ripple no clique
  createRippleEffect(e) {
    const widget = e.currentTarget;
    const rect = widget.getBoundingClientRect();
    const ripple = document.createElement('div');
    
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(137, 180, 250, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
      z-index: 1;
    `;
    
    widget.style.position = 'relative';
    widget.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  // Formata valores monetários
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  // Simula atualização de dados (para demonstração)
  simulateDataUpdate() {
    // Simula variação no saldo
    const variacao = (Math.random() - 0.5) * 100; // -50 a +50
    dashboardData.financeiro.saldo += variacao;
    dashboardData.financeiro.variacao = (variacao / dashboardData.financeiro.saldo) * 100;
    dashboardData.financeiro.isPositiva = variacao >= 0;

    // Simula progresso na biblioteca
    if (Math.random() > 0.7) {
      dashboardData.biblioteca.mediaAtual.progresso = Math.min(100, 
        dashboardData.biblioteca.mediaAtual.progresso + Math.floor(Math.random() * 5)
      );
    }

    // Simula progresso nos sonhos
    if (Math.random() > 0.8) {
      dashboardData.sonhos.metaAtual.progresso = Math.min(100,
        dashboardData.sonhos.metaAtual.progresso + Math.floor(Math.random() * 3)
      );
    }

    // Atualiza countdown de viagem
    if (dashboardData.viagens.proximaViagem.diasRestantes > 0) {
      // Simula passagem do tempo (para demonstração, reduz aleatoriamente)
      if (Math.random() > 0.9) {
        dashboardData.viagens.proximaViagem.diasRestantes--;
      }
    }

    this.loadData();
  }
}

// Utilitários para localStorage (preparação para dados reais)
const DashboardStorage = {
  // Salva dados no localStorage
  saveData(key, data) {
    try {
      localStorage.setItem(`dashboard_${key}`, JSON.stringify(data));
    } catch (error) {
      console.warn('Erro ao salvar dados no localStorage:', error);
    }
  },

  // Carrega dados do localStorage
  loadData(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(`dashboard_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.warn('Erro ao carregar dados do localStorage:', error);
      return defaultValue;
    }
  },

  // Remove dados do localStorage
  removeData(key) {
    try {
      localStorage.removeItem(`dashboard_${key}`);
    } catch (error) {
      console.warn('Erro ao remover dados do localStorage:', error);
    }
  }
};

// Adiciona CSS para animação de ripple
const rippleCSS = `
  @keyframes ripple {
    to {
      transform: scale(2);
      opacity: 0;
    }
  }
`;

// Injeta CSS de animação
const style = document.createElement('style');
style.textContent = rippleCSS;
document.head.appendChild(style);

// Inicializa o dashboard quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  // Verifica se estamos na página do dashboard
  if (document.querySelector('.dashboard-section')) {
    const dashboard = new Dashboard();
    
    // Adiciona dashboard ao objeto global para debug
    window.dashboard = dashboard;
    
    // Simula atualizações de dados para demonstração
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      setInterval(() => {
        dashboard.simulateDataUpdate();
      }, 60000); // Atualiza a cada minuto em desenvolvimento
    }
  }
});

// Integração com sistema de notificações (se existir)
if (typeof window.notificationSystem !== 'undefined') {
  // Adiciona notificações relacionadas ao dashboard
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (typeof addNotification === 'function') {
        addNotification('Dashboard carregado com sucesso!', 'success');
      }
    }, 2000);
  });
}

// Exporta para uso em outros módulos (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Dashboard, DashboardStorage };
}
