// ===== DASHBOARD FUNCTIONALITY =====

// Classe para gerenciar dados reais das outras páginas
class DashboardDataManager {
  constructor() {
    this.storageKeys = {
      financeiro: 'financeiro-widget',
      diario: 'diario-pessoal-entradas',
      livraria: 'livraria-livros',
      cinema: 'cinema-filmes',
      mangas: 'manga-list',
      viagens: 'viagens-dados',
      sonhos: 'sonhos-objetivos'
    };
  }

  // Obtém dados financeiros reais
  getFinanceiroData() {
    try {
      const dados = localStorage.getItem(this.storageKeys.financeiro);
      if (!dados) return this.getDefaultFinanceiroData();

      const financeiro = JSON.parse(dados);
      const hoje = new Date();
      let saldo = financeiro.saldoInicial || 0;

      // Calcular saldo atual baseado nas transações
      if (financeiro.transacoes && Array.isArray(financeiro.transacoes)) {
        for (const transacao of financeiro.transacoes) {
          const dataTransacao = new Date(transacao.data);
          if (dataTransacao <= hoje) {
            if (transacao.tipo === 'entrada') {
              saldo += transacao.valor;
            } else {
              saldo -= transacao.valor;
            }
          }
        }
      }

      // Calcular variação do dia
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);
      
      let saldoOntem = financeiro.saldoInicial || 0;
      if (financeiro.transacoes && Array.isArray(financeiro.transacoes)) {
        for (const transacao of financeiro.transacoes) {
          const dataTransacao = new Date(transacao.data);
          if (dataTransacao <= ontem) {
            if (transacao.tipo === 'entrada') {
              saldoOntem += transacao.valor;
            } else {
              saldoOntem -= transacao.valor;
            }
          }
        }
      }

      const variacao = saldoOntem !== 0 ? ((saldo - saldoOntem) / saldoOntem) * 100 : 0;

      return {
        saldo: saldo,
        variacao: Math.abs(variacao),
        isPositiva: variacao >= 0
      };
    } catch (error) {
      console.warn('Erro ao carregar dados financeiros:', error);
      return this.getDefaultFinanceiroData();
    }
  }

  // Obtém dados do diário reais
  getDiarioData() {
    try {
      const dados = localStorage.getItem(this.storageKeys.diario);
      if (!dados) return this.getDefaultDiarioData();

      const entradas = JSON.parse(dados);
      if (!Array.isArray(entradas) || entradas.length === 0) {
        return this.getDefaultDiarioData();
      }

      // Ordenar por data de criação (mais recente primeiro)
      const entradasOrdenadas = entradas.sort((a, b) => 
        new Date(b.criadoEm || b.data) - new Date(a.criadoEm || a.data)
      );

      const ultimaEntrada = entradasOrdenadas[0];
      const dataEntrada = new Date(ultimaEntrada.criadoEm || ultimaEntrada.data);
      const dataFormatada = this.formatarDataRelativa(dataEntrada);

      return {
        ultimaEntrada: {
          data: dataFormatada,
          preview: ultimaEntrada.conteudo ? 
            ultimaEntrada.conteudo.substring(0, 80) + (ultimaEntrada.conteudo.length > 80 ? '...' : '') :
            'Sem conteúdo disponível'
        }
      };
    } catch (error) {
      console.warn('Erro ao carregar dados do diário:', error);
      return this.getDefaultDiarioData();
    }
  }

  // Obtém dados da biblioteca (livros, filmes, mangás)
  getBibliotecaData() {
    try {
      // Tentar livros primeiro
      let dados = localStorage.getItem(this.storageKeys.livraria);
      if (dados) {
        const livros = JSON.parse(dados);
        const livroAtual = livros.find(l => l.status === 'lendo');
        if (livroAtual) {
          return {
            mediaAtual: {
              tipo: "Livro",
              titulo: livroAtual.titulo,
              progresso: livroAtual.progresso || 0
            }
          };
        }
      }

      // Tentar filmes
      dados = localStorage.getItem(this.storageKeys.cinema);
      if (dados) {
        const filmes = JSON.parse(dados);
        const filmeAtual = filmes.find(f => f.status === 'assistindo');
        if (filmeAtual) {
          return {
            mediaAtual: {
              tipo: "Filme",
              titulo: filmeAtual.titulo,
              progresso: filmeAtual.progresso || 0
            }
          };
        }
      }

      // Tentar mangás
      dados = localStorage.getItem(this.storageKeys.mangas);
      if (dados) {
        const mangas = JSON.parse(dados);
        const mangaAtual = mangas.find(m => m.status === 'lendo');
        if (mangaAtual) {
          return {
            mediaAtual: {
              tipo: "Mangá",
              titulo: mangaAtual.titulo,
              progresso: mangaAtual.progresso || 0
            }
          };
        }
      }

      return this.getDefaultBibliotecaData();
    } catch (error) {
      console.warn('Erro ao carregar dados da biblioteca:', error);
      return this.getDefaultBibliotecaData();
    }
  }

  // Obtém dados de viagens reais
  getViagensData() {
    try {
      const dados = localStorage.getItem(this.storageKeys.viagens);
      if (!dados) return this.getDefaultViagensData();

      const viagens = JSON.parse(dados);
      if (!Array.isArray(viagens) || viagens.length === 0) {
        return this.getDefaultViagensData();
      }

      // Encontrar próxima viagem (data futura mais próxima)
      const hoje = new Date();
      const viagensFuturas = viagens.filter(v => {
        const dataViagem = new Date(v.dataInicio || v.data);
        return dataViagem > hoje;
      }).sort((a, b) => new Date(a.dataInicio || a.data) - new Date(b.dataInicio || b.data));

      if (viagensFuturas.length === 0) {
        return this.getDefaultViagensData();
      }

      const proximaViagem = viagensFuturas[0];
      const dataViagem = new Date(proximaViagem.dataInicio || proximaViagem.data);
      const diasRestantes = Math.ceil((dataViagem - hoje) / (1000 * 60 * 60 * 24));

      return {
        proximaViagem: {
          destino: proximaViagem.destino || proximaViagem.local || 'Destino não informado',
          dataPartida: dataViagem.toLocaleDateString('pt-BR'),
          diasRestantes: diasRestantes
        }
      };
    } catch (error) {
      console.warn('Erro ao carregar dados de viagens:', error);
      return this.getDefaultViagensData();
    }
  }

  // Obtém dados de sonhos reais
  getSonhosData() {
    try {
      const dados = localStorage.getItem(this.storageKeys.sonhos);
      if (!dados) return this.getDefaultSonhosData();

      const sonhos = JSON.parse(dados);
      if (!Array.isArray(sonhos) || sonhos.length === 0) {
        return this.getDefaultSonhosData();
      }

      // Encontrar sonho em progresso com maior progresso
      const sonhosAtivos = sonhos.filter(s => !s.concluido && s.progresso !== undefined)
        .sort((a, b) => b.progresso - a.progresso);

      if (sonhosAtivos.length === 0) {
        return this.getDefaultSonhosData();
      }

      const sonhoAtual = sonhosAtivos[0];
      const prazo = sonhoAtual.prazo ? new Date(sonhoAtual.prazo).toLocaleDateString('pt-BR') : 'Sem prazo definido';

      return {
        metaAtual: {
          titulo: sonhoAtual.titulo || 'Sonho sem título',
          progresso: sonhoAtual.progresso || 0,
          prazo: `Meta: ${prazo}`
        }
      };
    } catch (error) {
      console.warn('Erro ao carregar dados de sonhos:', error);
      return this.getDefaultSonhosData();
    }
  }

  // Métodos para dados padrão
  getDefaultFinanceiroData() {
    return {
      saldo: 0,
      variacao: 0,
      isPositiva: true
    };
  }

  getDefaultDiarioData() {
    return {
      ultimaEntrada: {
        data: "Nenhuma entrada",
        preview: "Nenhuma entrada do diário encontrada. Que tal escrever a primeira?"
      }
    };
  }

  getDefaultBibliotecaData() {
    return {
      mediaAtual: {
        tipo: "Mídia",
        titulo: "Nenhuma mídia em progresso",
        progresso: 0
      }
    };
  }

  getDefaultViagensData() {
    return {
      proximaViagem: {
        destino: "Nenhuma viagem planejada",
        dataPartida: "Sem data",
        diasRestantes: 0
      }
    };
  }

  getDefaultSonhosData() {
    return {
      metaAtual: {
        titulo: "Nenhum sonho ativo",
        progresso: 0,
        prazo: "Sem prazo"
      }
    };
  }

  // Utilitário para formatar data relativa
  formatarDataRelativa(data) {
    const agora = new Date();
    const diferenca = agora - data;
    const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
    const horas = Math.floor(diferenca / (1000 * 60 * 60));
    const minutos = Math.floor(diferenca / (1000 * 60));

    if (dias === 0) {
      if (horas === 0) {
        if (minutos < 5) return 'Agora mesmo';
        return `${minutos} min atrás`;
      }
      return `${horas}h atrás`;
    } else if (dias === 1) {
      return 'Ontem';
    } else if (dias < 7) {
      return `${dias} dias atrás`;
    } else {
      return data.toLocaleDateString('pt-BR');
    }
  }

  // Método principal para obter todos os dados
  getAllData() {
    return {
      financeiro: this.getFinanceiroData(),
      diario: this.getDiarioData(),
      biblioteca: this.getBibliotecaData(),
      viagens: this.getViagensData(),
      sonhos: this.getSonhosData()
    };
  }
}

// Classe principal do Dashboard
class Dashboard {
  constructor() {
    this.dataManager = new DashboardDataManager();
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

    // Atualiza dados periodicamente
    setInterval(() => {
      this.loadData();
    }, 30000); // Atualiza a cada 30 segundos

    // Escuta mudanças no localStorage para atualizar em tempo real
    window.addEventListener('storage', (e) => {
      if (Object.values(this.dataManager.storageKeys).includes(e.key)) {
        this.loadData();
      }
    });

    // Escuta eventos customizados para atualizações imediatas
    window.addEventListener('dashboardUpdate', () => {
      this.loadData();
    });
  }

  // Carrega os dados reais
  loadData() {
    const dashboardData = this.dataManager.getAllData();
    this.updateFinanceiroWidget(dashboardData.financeiro);
    this.updateDiarioWidget(dashboardData.diario);
    this.updateBibliotecaWidget(dashboardData.biblioteca);
    this.updateViagensWidget(dashboardData.viagens);
    this.updateSonhosWidget(dashboardData.sonhos);
  }

  // Atualiza widget financeiro
  updateFinanceiroWidget(data) {
    // Atualiza saldo
    const saldoElement = document.getElementById('widget-saldo');
    if (saldoElement) {
      saldoElement.textContent = this.formatCurrency(data.saldo);
    }

    // Atualiza variação
    const variacaoElement = document.getElementById('widget-variacao');
    if (variacaoElement) {
      const icon = data.isPositiva ? 'fa-arrow-up' : 'fa-arrow-down';
      const sinal = data.isPositiva ? '+' : '';
      const classe = data.isPositiva ? '' : 'negativa';
      
      variacaoElement.className = `saldo-variacao ${classe}`;
      
      if (data.variacao === 0) {
        variacaoElement.innerHTML = `
          <i class="fas fa-minus"></i>
          <span>Sem variação hoje</span>
        `;
      } else {
        variacaoElement.innerHTML = `
          <i class="fas ${icon}"></i>
          <span>${sinal}${data.variacao.toFixed(1)}% hoje</span>
        `;
      }
    }

    // Sincroniza com o saldo global (se existir)
    if (typeof atualizarSaldoGlobal === 'function') {
      atualizarSaldoGlobal();
    }
  }

  // Atualiza widget diário
  updateDiarioWidget(data) {
    const dataElement = document.getElementById('widget-entrada-data');
    const previewElement = document.getElementById('widget-entrada-preview');
    
    if (dataElement) dataElement.textContent = data.ultimaEntrada.data;
    if (previewElement) previewElement.textContent = data.ultimaEntrada.preview;
  }

  // Atualiza widget biblioteca
  updateBibliotecaWidget(data) {
    const tipoElement = document.getElementById('widget-media-tipo');
    const tituloElement = document.getElementById('widget-media-titulo');
    const progressoFillElement = document.getElementById('widget-progresso-fill');
    const progressoTextoElement = document.getElementById('widget-progresso-texto');
    
    if (tipoElement) tipoElement.textContent = data.mediaAtual.tipo;
    if (tituloElement) tituloElement.textContent = data.mediaAtual.titulo;
    if (progressoFillElement) progressoFillElement.style.width = `${data.mediaAtual.progresso}%`;
    if (progressoTextoElement) progressoTextoElement.textContent = `${data.mediaAtual.progresso}%`;
  }

  // Atualiza widget viagens
  updateViagensWidget(data) {
    const destinoElement = document.getElementById('widget-destino');
    const dataPartidaElement = document.getElementById('widget-data-partida');
    const countdownElement = document.getElementById('widget-countdown');
    
    if (destinoElement) destinoElement.textContent = data.proximaViagem.destino;
    if (dataPartidaElement) dataPartidaElement.textContent = data.proximaViagem.dataPartida;
    if (countdownElement) {
      if (data.proximaViagem.diasRestantes > 0) {
        countdownElement.innerHTML = `
          <i class="fas fa-clock"></i>
          <span>${data.proximaViagem.diasRestantes} dias</span>
        `;
      } else {
        countdownElement.innerHTML = `
          <i class="fas fa-calendar-times"></i>
          <span>Sem viagens</span>
        `;
      }
    }
  }

  // Atualiza widget sonhos
  updateSonhosWidget(data) {
    const tituloElement = document.getElementById('widget-meta-titulo');
    const progressoFillElement = document.getElementById('widget-meta-fill');
    const progressoTextoElement = document.getElementById('widget-meta-texto');
    const prazoElement = document.getElementById('widget-meta-prazo');
    
    if (tituloElement) tituloElement.textContent = data.metaAtual.titulo;
    if (progressoFillElement) progressoFillElement.style.width = `${data.metaAtual.progresso}%`;
    if (progressoTextoElement) progressoTextoElement.textContent = `${data.metaAtual.progresso}%`;
    if (prazoElement) prazoElement.textContent = data.metaAtual.prazo;
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

  // Força atualização dos dados
  forceUpdate() {
    this.loadData();
  }

  // Método público para outras páginas dispararem atualização
  static triggerUpdate() {
    window.dispatchEvent(new CustomEvent('dashboardUpdate'));
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
    
    // Adiciona dashboard ao objeto global para debug e acesso externo
    window.dashboard = dashboard;
    
    // Adiciona método global para outras páginas dispararem atualização
    window.updateDashboard = () => Dashboard.triggerUpdate();
    
    console.log('Dashboard inicializado com dados reais das páginas');
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
