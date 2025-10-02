// Lógica de Dropdown aprimorada para todos os menus
document.querySelectorAll('.dropdown').forEach(dropdownContainer => {
  // O gatilho pode ser o cabeçalho do dropdown ou o perfil
  const toggle = dropdownContainer.querySelector('.dropdown-header, .profile');

  if (toggle) {
    toggle.addEventListener('click', (event) => {
      // Impede que o clique no link dentro do dropdown feche o menu imediatamente
      if (event.target.tagName === 'A') return;

      // Fecha outros menus abertos
      document.querySelectorAll('.dropdown.active').forEach(activeDropdown => {
        if (activeDropdown !== dropdownContainer) {
          activeDropdown.classList.remove('active');
        }
      });

      // Abre/fecha o menu atual
      dropdownContainer.classList.toggle('active');
    });
  }
});

// Fecha todos os dropdowns ao clicar fora
document.addEventListener('click', e => {
  // Se o clique não foi dentro de um dropdown, fecha todos
  if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown.active').forEach(dropdown => {
      dropdown.classList.remove('active');
    });
  }
});


// Estado da aplicação
const estado = {
  saldoInicial: 1000,
  mesAtual: new Date(),
  transacoes: [],
  filtroCategoria: 'todas',
  diaSelecionado: null,
  categorias: [{
    id: 'salario',
    nome: 'Salário'
  }, {
    id: 'alimentacao',
    nome: 'Alimentação'
  }, {
    id: 'transporte',
    nome: 'Transporte'
  }, {
    id: 'lazer',
    nome: 'Lazer'
  }, {
    id: 'outros',
    nome: 'Outros'
  }, ],
  limites: {},
  abaAtiva: 'controle',
  periodoGrafico: 'mes',
  metasSonhos: [], // NOVO: Para armazenar metas financeiras dos sonhos
};

// Gráficos Chart.js
let chartEntradaSaida = null;
let chartCategorias = null;

// Elementos do DOM
const elementos = {
  saldoInicial: document.getElementById('saldo-inicial'),
  despesasValor: document.getElementById('despesas-valor'),
  filtroCategoria: document.getElementById('filtro-categoria'),
  melhorDia: document.getElementById('melhor-dia'),
  calendario: document.getElementById('calendario'),
  calendarioMes: document.getElementById('calendario-mes'),
  mesAnterior: document.getElementById('mes-anterior'),
  mesProximo: document.getElementById('mes-proximo'),
  modalTransacao: document.getElementById('modal-transacao'),
  formTransacao: document.getElementById('form-transacao'),
  transacaoData: document.getElementById('transacao-data'),
  transacaoTipo: document.getElementById('transacao-tipo'),
  transacaoCategoria: document.getElementById('transacao-categoria'),
  transacaoValor: document.getElementById('transacao-valor'),
  btnCancelar: document.getElementById('btn-cancelar'),
  modalClose: document.querySelector('.modal-close'),
  gerenciarCategorias: document.getElementById('gerenciar-categorias'),
  toggleCategorias: document.getElementById('toggle-categorias'),
  modalCategorias: document.getElementById('modal-categorias'),
  categoriasGerenciar: document.getElementById('categorias-gerenciar'),
  categoriasModalClose: document.getElementById('categorias-modal-close'),
  categoriaNova: document.getElementById('categoria-nova'),
  btnAdicionarCategoria: document.getElementById('btn-adicionar-categoria'),
  modalCategoria: document.getElementById('modal-categoria'),
  formCategoria: document.getElementById('form-categoria'),
  categoriaId: document.getElementById('categoria-id'),
  categoriaNome: document.getElementById('categoria-nome'),
  btnCancelarCategoria: document.getElementById('btn-cancelar-categoria'),
  categoriaModalClose: document.getElementById('categoria-modal-close'),
  categoriasLista: document.getElementById('categorias-lista'),
  limitsGrid: document.getElementById('limits-grid'),
  btnSalvarLimites: document.getElementById('btn-salvar-limites'),
  saldoDoDia: document.getElementById('saldo-do-dia'),
  metasSonhosContainer: document.getElementById('metas-sonhos-container'), // NOVO
};

// Funções auxiliares
function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatarMoeda(valor) {
  return `R$ ${valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

function dataParaString(data) {
  return data.toISOString();
}

function stringParaData(dataString) {
  return new Date(dataString);
}

function mesmoDia(data1, data2) {
  return data1.getDate() === data2.getDate() &&
    data1.getMonth() === data2.getMonth() &&
    data1.getFullYear() === data2.getFullYear();
}

function obterNomeMes(data) {
  return data.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  });
}

// Funções de navegação de abas
function alternarAba(nomeAba) {
  // Ocultar todas as abas
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  // Remover classe active de todos os botões
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });

  // Mostrar aba selecionada
  document.getElementById(`tab-${nomeAba}`).classList.add('active');

  // Ativar botão correspondente
  document.querySelector(`[data-tab="${nomeAba}"]`).classList.add('active');

  estado.abaAtiva = nomeAba;

  // Se for a aba de planejamento, renderizar gráficos
  if (nomeAba === 'planejamento') {
    setTimeout(() => {
      renderizarGraficos();
      renderizarLimites();
    }, 100);
  }
}

// Função para calcular e renderizar o saldo do dia
function calcularSaldoDoDia() {
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999); // Fim do dia atual

  let saldo = estado.saldoInicial;

  // Somar todas as transações até hoje (inclusive)
  for (const transacao of estado.transacoes) {
    if (transacao.data <= hoje) {
      if (transacao.tipo === 'entrada') {
        saldo += transacao.valor;
      } else {
        saldo -= transacao.valor;
      }
    }
  }

  return saldo;
}

function renderizarSaldoDoDia() {
  const saldoAtual = calcularSaldoDoDia();

  if (elementos.saldoDoDia) {
    elementos.saldoDoDia.textContent = formatarMoeda(saldoAtual);

    // Alterar cor baseada no saldo
    if (saldoAtual >= 0) {
      elementos.saldoDoDia.style.color = 'var(--color-primary)';
    } else {
      elementos.saldoDoDia.style.color = 'var(--color-danger)';
    }
  }
}

// Funções de manipulação de dados
function carregarDados() {
  const dadosSalvos = localStorage.getItem('financeiro-widget');

  if (dadosSalvos) {
    try {
      const dados = JSON.parse(dadosSalvos);

      // Validar saldo inicial
      if (typeof dados.saldoInicial === 'number' && !isNaN(dados.saldoInicial) && dados.saldoInicial >= 0) {
        estado.saldoInicial = dados.saldoInicial;
      }

      // Carregar transações
      if (Array.isArray(dados.transacoes)) {
        estado.transacoes = dados.transacoes.map(t => ({
          ...t,
          data: stringParaData(t.data)
        }));
      }

      // Carregar categorias
      if (Array.isArray(dados.categorias)) {
        estado.categorias = dados.categorias;

        // Garantir que a categoria "Outros" sempre exista
        if (!estado.categorias.find(c => c.id === 'outros')) {
          estado.categorias.push({
            id: 'outros',
            nome: 'Outros'
          });
        }
      }

      // Carregar limites
      if (dados.limites && typeof dados.limites === 'object') {
        estado.limites = dados.limites;
      }

      // Atualizar interface
      elementos.saldoInicial.value = estado.saldoInicial;
      renderizarCategorias();
      atualizarSelectsCategorias();
    } catch (erro) {
      console.error('Erro ao carregar dados:', erro);
      // Resetar para valores padrão em caso de erro
      estado.saldoInicial = 1000;
      estado.transacoes = [];
      elementos.saldoInicial.value = estado.saldoInicial;
    }
  } else {
    // Primeira execução, definir valores padrão
    elementos.saldoInicial.value = estado.saldoInicial;
  }
}

function salvarDados() {
  // Converter objetos Date para strings antes de salvar
  const transacoesParaSalvar = estado.transacoes.map(t => ({
    ...t,
    data: dataParaString(t.data)
  }));

  const dados = {
    saldoInicial: estado.saldoInicial,
    transacoes: transacoesParaSalvar,
    categorias: estado.categorias,
    limites: estado.limites
  };

  localStorage.setItem('financeiro-widget', JSON.stringify(dados));
}

function calcularDespesasMes() {
  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  // Filtrar apenas as saídas (despesas) do mês atual
  const despesasMes = estado.transacoes.filter(t =>
    t.tipo === 'saida' &&
    t.data >= primeiroDiaMes &&
    t.data <= ultimoDiaMes
  );

  // Somar todas as despesas
  const totalDespesas = despesasMes.reduce((total, t) => total + t.valor, 0);

  // Atualizar o elemento na interface
  elementos.despesasValor.textContent = formatarMoeda(totalDespesas);

  return totalDespesas;
}

function adicionarTransacao(transacao) {
  estado.transacoes.push(transacao);
  salvarDados();
  renderizarCalendario();
  calcularMelhorDia();
  calcularDespesasMes();
  renderizarSaldoDoDia();
  renderizarMetasSonhos(); // ATUALIZADO: Re-renderiza metas após transação

  // Atualizar gráficos se estiver na aba de planejamento
  if (estado.abaAtiva === 'planejamento') {
    renderizarGraficos();
    renderizarLimites();
  }
}

function removerTransacao(id) {
  estado.transacoes = estado.transacoes.filter(t => t.id !== id);
  salvarDados();
  renderizarCalendario();
  calcularMelhorDia();
  calcularDespesasMes();
  renderizarSaldoDoDia();
  renderizarMetasSonhos(); // ATUALIZADO: Re-renderiza metas após transação

  // Atualizar gráficos se estiver na aba de planejamento
  if (estado.abaAtiva === 'planejamento') {
    renderizarGraficos();
    renderizarLimites();
  }
}

function filtrarTransacoes(transacoes) {
  if (estado.filtroCategoria === 'todas') {
    return transacoes;
  }
  return transacoes.filter(t => t.categoria === estado.filtroCategoria);
}

function adicionarCategoria(nome) {
  if (!nome || nome.trim() === '') {
    alert('Por favor, informe um nome para a categoria.');
    return false;
  }

  // Verificar se já existe uma categoria com o mesmo nome
  const nomeNormalizado = nome.trim().toLowerCase();
  const categoriaExistente = estado.categorias.find(c => c.nome.toLowerCase() === nomeNormalizado);

  if (categoriaExistente) {
    alert('Já existe uma categoria com este nome.');
    return false;
  }

  const novaCategoria = {
    id: gerarId(),
    nome: nome.trim()
  };

  estado.categorias.push(novaCategoria);
  salvarDados();
  renderizarCategorias();
  atualizarSelectsCategorias();

  // Atualizar limites se estiver na aba de planejamento
  if (estado.abaAtiva === 'planejamento') {
    renderizarLimites();
  }

  return true;
}

function editarCategoria(id, novoNome) {
  if (!novoNome || novoNome.trim() === '') {
    alert('Por favor, informe um nome para a categoria.');
    return false;
  }

  // Verificar se já existe outra categoria com o mesmo nome
  const nomeNormalizado = novoNome.trim().toLowerCase();
  const categoriaExistente = estado.categorias.find(c => c.nome.toLowerCase() === nomeNormalizado && c.id !== id);

  if (categoriaExistente) {
    alert('Já existe uma categoria com este nome.');
    return false;
  }

  const categoria = estado.categorias.find(c => c.id === id);
  if (categoria) {
    categoria.nome = novoNome.trim();
    salvarDados();
    renderizarCategorias();
    atualizarSelectsCategorias();
    renderizarCalendario(); // Atualizar o calendário para refletir o novo nome da categoria

    // Atualizar gráficos e limites se estiver na aba de planejamento
    if (estado.abaAtiva === 'planejamento') {
      renderizarGraficos();
      renderizarLimites();
    }

    return true;
  }

  return false;
}

function removerCategoria(id) {
  const categoriaParaRemover = estado.categorias.find(c => c.id === id);

  // ATUALIZADO: Impedir exclusão de categorias de metas de sonhos
  if (categoriaParaRemover && categoriaParaRemover.isMetaSonho) {
    alert('Não é possível excluir uma categoria de meta de sonho. Exclua o sonho na página de Sonhos.');
    return false;
  }

  // Verificar se existem transações usando esta categoria
  const transacoesComCategoria = estado.transacoes.filter(t => t.categoria === id);

  if (transacoesComCategoria.length > 0) {
    alert('Não é possível excluir esta categoria pois existem transações associadas a ela.');
    return false;
  }

  estado.categorias = estado.categorias.filter(c => c.id !== id);

  // Remover limite da categoria também
  delete estado.limites[id];

  salvarDados();
  renderizarCategorias();
  atualizarSelectsCategorias();

  // Atualizar gráficos e limites se estiver na aba de planejamento
  if (estado.abaAtiva === 'planejamento') {
    renderizarGraficos();
    renderizarLimites();
  }

  return true;
}


// --- INÍCIO: NOVAS FUNÇÕES DE INTEGRAÇÃO COM SONHOS ---

// Carrega sonhos com custo do localStorage e cria categorias de economia se necessário.
function carregarMetasSonhos() {
  const sonhoseObjetivos = localStorage.getItem('sonhos-objetivos');
  if (sonhoseObjetivos) {
    try {
      const todosSonhos = JSON.parse(sonhoseObjetivos);
      estado.metasSonhos = todosSonhos.filter(s => s.custo > 0 && !s.concluido);

      let categoriasForamModificadas = false;

      estado.metasSonhos.forEach(sonho => {
        // Verifica se já existe uma categoria para esta meta de sonho
        const categoriaExistente = estado.categorias.find(c => c.sonhoId === sonho.id);

        if (!categoriaExistente) {
          // Cria uma nova categoria de economia para o sonho
          const novaCategoriaMeta = {
            id: `meta_${sonho.id}`, // ID previsível
            nome: `Meta: ${sonho.titulo}`,
            isMetaSonho: true, // Flag especial para identificação
            sonhoId: sonho.id
          };
          estado.categorias.push(novaCategoriaMeta);
          categoriasForamModificadas = true;
        }
      });

      if (categoriasForamModificadas) {
        salvarDados(); // Salva as novas categorias
        atualizarSelectsCategorias(); // Atualiza os dropdowns da interface
      }

    } catch (e) {
      console.error("Erro ao carregar metas dos sonhos:", e);
      estado.metasSonhos = [];
    }
  }
}

// Renderiza o card de progresso para cada meta financeira.
function renderizarMetasSonhos() {
  if (!elementos.metasSonhosContainer) return;
  elementos.metasSonhosContainer.innerHTML = ''; // Limpa o contêiner

  const titulo = document.createElement('div');
  titulo.className = 'metas-sonhos-titulo';
  titulo.innerHTML = `<i class="fas fa-piggy-bank"></i> Metas Financeiras (Sonhos)`;
  elementos.metasSonhosContainer.appendChild(titulo);

  if (estado.metasSonhos.length === 0) {
    elementos.metasSonhosContainer.innerHTML += `<div class="meta-sonho-empty">Nenhuma meta financeira de sonhos encontrada.</div>`;
    return;
  }

  estado.metasSonhos.forEach(sonho => {
    // Encontra a categoria de economia correspondente
    const categoriaMeta = estado.categorias.find(c => c.sonhoId === sonho.id);
    if (!categoriaMeta) return;

    // Calcula o total economizado para esta meta (soma de todas as entradas nesta categoria)
    const totalSalvo = estado.transacoes
      .filter(t => t.tipo === 'entrada' && t.categoria === categoriaMeta.id)
      .reduce((total, t) => total + t.valor, 0);

    // Calcula o progresso percentual
    const progressoPercentual = Math.min((totalSalvo / sonho.custo) * 100, 100);

    // Atualiza o progresso no localStorage de Sonhos para manter a sincronia
    atualizarProgressoSonhoNoLocalStorage(sonho.id, parseFloat(progressoPercentual));

    // Cria e adiciona o elemento HTML da meta no contêiner
    const item = document.createElement('div');
    item.className = 'meta-sonho-item';
    item.innerHTML = `
      <div class="meta-sonho-header">
        <div class="meta-sonho-nome">${sonho.titulo}</div>
        <div class="meta-sonho-valores">
          <strong>${formatarMoeda(totalSalvo)}</strong> / ${formatarMoeda(sonho.custo)}
        </div>
      </div>
      <div class="meta-sonho-progresso-bar">
        <div class="meta-sonho-progresso-fill" style="width: ${progressoPercentual.toFixed(2)}%;"></div>
      </div>
    `;
    elementos.metasSonhosContainer.appendChild(item);
  });
}

// Atualiza a propriedade 'progresso' de um sonho específico no localStorage.
function atualizarProgressoSonhoNoLocalStorage(sonhoId, novoProgresso) {
  const sonhoseObjetivos = localStorage.getItem('sonhos-objetivos');
  if (sonhoseObjetivos) {
    try {
      let todosSonhos = JSON.parse(sonhoseObjetivos);
      const sonhoIndex = todosSonhos.findIndex(s => s.id === sonhoId);

      if (sonhoIndex !== -1) {
        // Apenas atualiza se o valor do progresso mudou
        if (todosSonhos[sonhoIndex].progresso !== novoProgresso) {
          todosSonhos[sonhoIndex].progresso = novoProgresso;
          localStorage.setItem('sonhos-objetivos', JSON.stringify(todosSonhos));
        }
      }
    } catch (e) {
      console.error("Erro ao atualizar progresso do sonho no localStorage:", e);
    }
  }
}

// --- FIM: NOVAS FUNÇÕES DE INTEGRAÇÃO COM SONHOS ---


// Funções de cálculo para gráficos
function obterDadosEntradaSaida(periodo) {
  const hoje = new Date();
  let dataInicio, dataFim;
  let labels = [];

  switch (periodo) {
    case 'mes':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      // Gerar labels para cada dia do mês
      for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
        labels.push(d.getDate().toString());
      }
      break;

    case 'semestre':
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();

      if (mesAtual < 6) {
        // Primeiro semestre
        dataInicio = new Date(anoAtual, 0, 1);
        dataFim = new Date(anoAtual, 5, 30);
      } else {
        // Segundo semestre
        dataInicio = new Date(anoAtual, 6, 1);
        dataFim = new Date(anoAtual, 11, 31);
      }

      // Gerar labels para cada mês do semestre
      for (let m = dataInicio.getMonth(); m <= dataFim.getMonth(); m++) {
        const data = new Date(anoAtual, m, 1);
        labels.push(data.toLocaleDateString('pt-BR', {
          month: 'short'
        }));
      }
      break;

    case 'ano':
      dataInicio = new Date(hoje.getFullYear(), 0, 1);
      dataFim = new Date(hoje.getFullYear(), 11, 31);

      // Gerar labels para cada mês do ano
      for (let m = 0; m < 12; m++) {
        const data = new Date(hoje.getFullYear(), m, 1);
        labels.push(data.toLocaleDateString('pt-BR', {
          month: 'short'
        }));
      }
      break;
  }

  // Filtrar transações no período
  const transacoesPeriodo = estado.transacoes.filter(t =>
    t.data >= dataInicio && t.data <= dataFim
  );

  // Calcular entradas e saídas por período
  const entradas = new Array(labels.length).fill(0);
  const saidas = new Array(labels.length).fill(0);

  transacoesPeriodo.forEach(t => {
    let indice;

    switch (periodo) {
      case 'mes':
        indice = t.data.getDate() - 1;
        break;
      case 'semestre':
        indice = t.data.getMonth() - dataInicio.getMonth();
        break;
      case 'ano':
        indice = t.data.getMonth();
        break;
    }

    if (indice >= 0 && indice < labels.length) {
      if (t.tipo === 'entrada') {
        entradas[indice] += t.valor;
      } else {
        saidas[indice] += t.valor;
      }
    }
  });

  return {
    labels,
    entradas,
    saidas
  };
}

function obterDadosCategorias(periodo) {
  const hoje = new Date();
  let dataInicio, dataFim;

  switch (periodo) {
    case 'mes':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      break;
    case 'semestre':
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();

      if (mesAtual < 6) {
        dataInicio = new Date(anoAtual, 0, 1);
        dataFim = new Date(anoAtual, 5, 30);
      } else {
        dataInicio = new Date(anoAtual, 6, 1);
        dataFim = new Date(anoAtual, 11, 31);
      }
      break;
    case 'ano':
      dataInicio = new Date(hoje.getFullYear(), 0, 1);
      dataFim = new Date(hoje.getFullYear(), 11, 31);
      break;
  }

  // Filtrar apenas saídas no período
  const saidasPeriodo = estado.transacoes.filter(t =>
    t.tipo === 'saida' && t.data >= dataInicio && t.data <= dataFim
  );

  // Agrupar por categoria
  const gastosPorCategoria = {};

  saidasPeriodo.forEach(t => {
    if (!gastosPorCategoria[t.categoria]) {
      gastosPorCategoria[t.categoria] = 0;
    }
    gastosPorCategoria[t.categoria] += t.valor;
  });

  // Converter para arrays para o gráfico
  const labels = [];
  const valores = [];
  const cores = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
  ];

  Object.entries(gastosPorCategoria).forEach(([categoriaId, valor], index) => {
    const categoria = estado.categorias.find(c => c.id === categoriaId);
    labels.push(categoria ? categoria.nome : categoriaId);
    valores.push(valor);
  });

  return {
    labels,
    valores,
    cores: cores.slice(0, labels.length)
  };
}

// Funções de renderização de gráficos
function renderizarGraficos() {
  renderizarGraficoEntradaSaida();
  renderizarGraficoCategorias();
}

function renderizarGraficoEntradaSaida() {
  const ctx = document.getElementById('chart-entrada-saida');
  if (!ctx) return;

  const dados = obterDadosEntradaSaida(estado.periodoGrafico);

  if (chartEntradaSaida) {
    chartEntradaSaida.destroy();
  }

  chartEntradaSaida = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dados.labels,
      datasets: [{
        label: 'Entradas',
        data: dados.entradas,
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4
      }, {
        label: 'Saídas',
        data: dados.saidas,
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#e0e0e0'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#e0e0e0'
          },
          grid: {
            color: '#333333'
          }
        },
        y: {
          ticks: {
            color: '#e0e0e0',
            callback: function(value) {
              return formatarMoeda(value);
            }
          },
          grid: {
            color: '#333333'
          }
        }
      }
    }
  });
}

function renderizarGraficoCategorias() {
  const ctx = document.getElementById('chart-categorias');
  if (!ctx) return;

  const dados = obterDadosCategorias(estado.periodoGrafico);

  if (chartCategorias) {
    chartCategorias.destroy();
  }

  if (dados.valores.length === 0) {
    // Se não há dados, mostrar gráfico vazio
    chartCategorias = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Nenhum gasto registrado'],
        datasets: [{
          data: [1],
          backgroundColor: ['#333333']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#e0e0e0'
            }
          }
        }
      }
    });
    return;
  }

  chartCategorias = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: dados.labels,
      datasets: [{
        data: dados.valores,
        backgroundColor: dados.cores
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#e0e0e0'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = formatarMoeda(context.parsed);
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// Funções de limites de gastos
function renderizarLimites() {
  const container = elementos.limitsGrid;
  if (!container) return;
  container.innerHTML = '';

  estado.categorias.forEach(categoria => {
    const limitItem = document.createElement('div');
    limitItem.className = 'limit-item';

    // Calcular gasto atual da categoria no mês
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const gastoAtual = estado.transacoes
      .filter(t =>
        t.tipo === 'saida' &&
        t.categoria === categoria.id &&
        t.data >= primeiroDiaMes &&
        t.data <= ultimoDiaMes
      )
      .reduce((total, t) => total + t.valor, 0);

    const limite = estado.limites[categoria.id] || 0;

    // Determinar status do limite
    let status = '';
    let statusClass = '';

    if (limite > 0) {
      const percentual = (gastoAtual / limite) * 100;

      if (percentual >= 100) {
        status = `Limite excedido! (${percentual.toFixed(1)}%)`;
        statusClass = 'exceeded';
        limitItem.classList.add('exceeded');
      } else if (percentual >= 80) {
        status = `Atenção: ${percentual.toFixed(1)}% do limite`;
        statusClass = 'warning';
        limitItem.classList.add('warning');
      } else {
        status = `${percentual.toFixed(1)}% do limite`;
      }
    }

    limitItem.innerHTML = `
            <div class="limit-label">
                ${categoria.nome}
                <div style="font-size: 0.8rem; color: var(--color-text-secondary);">
                    Gasto atual: ${formatarMoeda(gastoAtual)}
                </div>
            </div>
            <input type="number" class="limit-input" 
                   data-categoria="${categoria.id}" 
                   value="${limite}" 
                   min="0" step="0.01" 
                   placeholder="Limite mensal">
            <div class="limit-status ${statusClass}">${status}</div>
        `;

    container.appendChild(limitItem);
  });
}

function salvarLimites() {
  const inputs = document.querySelectorAll('.limit-input');

  inputs.forEach(input => {
    const categoriaId = input.dataset.categoria;
    const valor = parseFloat(input.value) || 0;
    estado.limites[categoriaId] = valor;
  });

  salvarDados();
  renderizarLimites();

  alert('Limites salvos com sucesso!');
}

// Funções de cálculo
function calcularSaldoDia(data) {
  // Calcular o saldo até o final do dia especificado
  const dataFimDia = new Date(data);
  dataFimDia.setHours(23, 59, 59, 999);

  let saldo = estado.saldoInicial;

  for (const transacao of estado.transacoes) {
    if (transacao.data <= dataFimDia) {
      if (transacao.tipo === 'entrada') {
        saldo += transacao.valor;
      } else {
        saldo -= transacao.valor;
      }
    }
  }

  return saldo;
}

function calcularMelhorDia() {
  const hoje = new Date();
  const fimDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  let melhorDia = null;
  let maiorPontuacao = -Infinity;
  let valorDisponivel = 0;
  let valorRecomendado = 0;

  // Função interna para verificar se as contas podem ser quitadas
  function verificarContasQuitadas() {
    const todasSaidasMes = estado.transacoes.filter(t =>
      t.tipo === 'saida' &&
      t.data.getMonth() === hoje.getMonth() &&
      t.data.getFullYear() === hoje.getFullYear()
    ).reduce((total, t) => total + t.valor, 0);

    const todasEntradasMes = estado.transacoes.filter(t =>
      t.tipo === 'entrada' &&
      t.data.getMonth() === hoje.getMonth() &&
      t.data.getFullYear() === hoje.getFullYear()
    ).reduce((total, t) => total + t.valor, 0);

    return (estado.saldoInicial + todasEntradasMes) >= (todasSaidasMes + 200);
  }

  if (!verificarContasQuitadas()) {
    elementos.melhorDia.innerHTML = '<i class="fas fa-calendar-day"></i> Melhor dia para comprar: Não disponível (saldo insuficiente para quitar contas e manter reserva de R$ 200)';
    return;
  }

  // Verificar cada dia a partir de hoje
  for (let dia = new Date(hoje); dia <= fimDoMes; dia.setDate(dia.getDate() + 1)) {
    let saldoAteDia = calcularSaldoDia(dia);

    // Subtrair despesas futuras no mês
    const despesasFuturas = estado.transacoes.filter(t =>
      t.tipo === 'saida' &&
      t.data > dia &&
      t.data.getMonth() === hoje.getMonth() &&
      t.data.getFullYear() === hoje.getFullYear()
    ).reduce((total, t) => total + t.valor, 0);

    const saldoFuturoConsiderado = saldoAteDia - despesasFuturas;

    if (saldoFuturoConsiderado >= 200) {
      // Pontuação simples baseada no saldo disponível
      let pontuacao = saldoAteDia;

      if (pontuacao > maiorPontuacao) {
        maiorPontuacao = pontuacao;
        melhorDia = new Date(dia);
        valorDisponivel = saldoFuturoConsiderado - 200;
        valorRecomendado = valorDisponivel * 0.3;
      }
    }
  }


  if (melhorDia) {
    elementos.melhorDia.innerHTML = `<i class="fas fa-calendar-day"></i> Melhor dia para comprar: <strong>${melhorDia.getDate()} de ${melhorDia.toLocaleDateString('pt-BR', { month: 'long' })}</strong><br>
        <span class="valor-disponivel">Valor recomendado para gastar: <strong>${formatarMoeda(valorRecomendado)}</strong></span><br>
        <span class="valor-disponivel">Valor total disponível: <strong>${formatarMoeda(valorDisponivel)}</strong></span>`;
  } else {
    elementos.melhorDia.innerHTML = '<i class="fas fa-calendar-day"></i> Melhor dia para comprar: Não disponível (nenhum dia com saldo futuro suficiente)';
  }
}


// Funções de renderização
function renderizarCalendario() {
  // Limpar dias
  while (elementos.calendario.children.length > 7) {
    elementos.calendario.removeChild(elementos.calendario.lastChild);
  }

  elementos.calendarioMes.innerHTML = `<i class="fas fa-calendar-alt"></i> ${obterNomeMes(estado.mesAtual)}`;

  const primeiroDiaMes = new Date(estado.mesAtual.getFullYear(), estado.mesAtual.getMonth(), 1);
  const ultimoDiaMes = new Date(estado.mesAtual.getFullYear(), estado.mesAtual.getMonth() + 1, 0);
  const diasNoMes = ultimoDiaMes.getDate();
  const diaDaSemanaInicio = primeiroDiaMes.getDay();

  // Preencher dias vazios no início
  for (let i = 0; i < diaDaSemanaInicio; i++) {
    const elementoVazio = document.createElement('div');
    elementoVazio.className = 'dia dia-outro-mes';
    elementos.calendario.appendChild(elementoVazio);
  }

  // Renderizar dias do mês
  for (let i = 1; i <= diasNoMes; i++) {
    const data = new Date(estado.mesAtual.getFullYear(), estado.mesAtual.getMonth(), i);
    const elementoDia = criarElementoDia(data, false);
    elementos.calendario.appendChild(elementoDia);
  }
}

function criarElementoDia(data, outroMes) {
  const elementoDia = document.createElement('div');
  elementoDia.className = 'dia';

  if (outroMes) {
    elementoDia.classList.add('dia-outro-mes');
  }

  // Número do dia
  const numeroDia = document.createElement('div');
  numeroDia.className = 'dia-numero';
  numeroDia.textContent = data.getDate();
  elementoDia.appendChild(numeroDia);

  // Evento de clique
  elementoDia.addEventListener('click', () => abrirModalTransacao(data));


  // Saldo do dia
  const saldoDia = calcularSaldoDia(data);
  const saldoElement = document.createElement('div');
  saldoElement.className = 'dia-saldo';
  saldoElement.textContent = formatarMoeda(saldoDia);
  elementoDia.appendChild(saldoElement);

  // Transações
  const transacoesDia = filtrarTransacoes(estado.transacoes.filter(t => mesmoDia(t.data, data)));
  if (transacoesDia.length > 0) {
    const listaTransacoes = document.createElement('div');
    listaTransacoes.className = 'transacoes-lista';
    transacoesDia.forEach(transacao => {
      const itemTransacao = document.createElement('div');
      const categoria = estado.categorias.find(c => c.id === transacao.categoria);
      const nomeCategoria = categoria ? categoria.nome : 'N/A';
      itemTransacao.className = `transacao transacao-${transacao.tipo}`;
      itemTransacao.innerHTML = `
                <span>${nomeCategoria}: ${formatarMoeda(transacao.valor)}</span>
                <span class="transacao-excluir" data-id="${transacao.id}">x</span>
            `;
      listaTransacoes.appendChild(itemTransacao);
    });
    elementoDia.appendChild(listaTransacoes);

    listaTransacoes.querySelectorAll('.transacao-excluir').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        removerTransacao(btn.dataset.id);
      });
    });
  }

  return elementoDia;
}

function renderizarCategorias() {
  const container = elementos.categoriasLista;
  if (!container) return;
  container.innerHTML = '';

  estado.categorias.forEach(categoria => {
    // ATUALIZADO: Mostrar categorias de meta, mas desabilitar ações
    if (categoria.isMetaSonho) return; // Vamos ocultá-las da lista de gerenciamento para simplificar

    const categoriaItem = document.createElement('div');
    categoriaItem.className = 'categoria-item';

    const acoesHTML = `
      <div class="categoria-acoes">
        <span class="categoria-editar" data-id="${categoria.id}">✎</span>
        <span class="categoria-excluir" data-id="${categoria.id}">✕</span>
      </div>`;

    categoriaItem.innerHTML = `
      <div class="categoria-nome">${categoria.nome}</div>
      ${acoesHTML}
    `;
    container.appendChild(categoriaItem);
  });

  // Adiciona event listeners apenas aos botões de categorias gerenciáveis
  container.querySelectorAll('.categoria-editar').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = estado.categorias.find(c => c.id === btn.dataset.id);
      if (cat) abrirModalEditarCategoria(cat);
    });
  });
  container.querySelectorAll('.categoria-excluir').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = estado.categorias.find(c => c.id === btn.dataset.id);
      if (cat && confirm(`Deseja realmente excluir a categoria "${cat.nome}"?`)) {
        removerCategoria(cat.id);
      }
    });
  });
}


function atualizarSelectsCategorias() {
  elementos.transacaoCategoria.innerHTML = '';
  elementos.filtroCategoria.innerHTML = '';

  const todasOption = document.createElement('option');
  todasOption.value = 'todas';
  todasOption.textContent = 'Todas as categorias';
  elementos.filtroCategoria.appendChild(todasOption);

  estado.categorias.forEach(categoria => {
    const optionTransacao = document.createElement('option');
    optionTransacao.value = categoria.id;
    optionTransacao.textContent = categoria.nome;
    elementos.transacaoCategoria.appendChild(optionTransacao);

    const optionFiltro = document.createElement('option');
    optionFiltro.value = categoria.id;
    optionFiltro.textContent = categoria.nome;
    elementos.filtroCategoria.appendChild(optionFiltro);
  });

  elementos.filtroCategoria.value = estado.filtroCategoria;
}

// Funções de interação (modais)
function abrirModalTransacao(data) {
  estado.diaSelecionado = data;
  elementos.transacaoData.value = dataParaString(data);
  elementos.formTransacao.reset();
  elementos.modalTransacao.style.display = 'flex';
}

function fecharModalTransacao() {
  elementos.modalTransacao.style.display = 'none';
}

function abrirModalCategorias() {
  renderizarCategorias(); // Garante que a lista no modal está atualizada
  elementos.modalCategorias.style.display = 'flex';
}

function fecharModalCategorias() {
  elementos.modalCategorias.style.display = 'none';
}

function abrirModalEditarCategoria(categoria) {
  elementos.categoriaId.value = categoria.id;
  elementos.categoriaNome.value = categoria.nome;
  elementos.modalCategoria.style.display = 'flex';
}

function fecharModalEditarCategoria() {
  elementos.modalCategoria.style.display = 'none';
}

// Funções de exportação/importação
function exportarDados() {
  const dados = JSON.stringify({
    saldoInicial: estado.saldoInicial,
    transacoes: estado.transacoes.map(t => ({ ...t,
      data: dataParaString(t.data)
    })),
    categorias: estado.categorias,
    limites: estado.limites
  }, null, 2);
  const blob = new Blob([dados], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'financeiro-dados.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importarDados(arquivo) {
  const leitor = new FileReader();
  leitor.onload = function(e) {
    try {
      const dados = JSON.parse(e.target.result);
      if (typeof dados.saldoInicial === 'number') estado.saldoInicial = dados.saldoInicial;
      if (Array.isArray(dados.transacoes)) {
        estado.transacoes = dados.transacoes.map(t => ({ ...t,
          data: stringParaData(t.data)
        }));
      }
      if (Array.isArray(dados.categorias)) estado.categorias = dados.categorias;
      if (dados.limites && typeof dados.limites === 'object') estado.limites = dados.limites;

      salvarDados();
      // Re-renderizar tudo
      elementos.saldoInicial.value = estado.saldoInicial;
      carregarMetasSonhos(); // ATUALIZADO: Recarregar metas após importação
      renderizarCategorias();
      atualizarSelectsCategorias();
      renderizarCalendario();
      renderizarMetasSonhos(); // ATUALIZADO: Renderizar metas após importação
      calcularMelhorDia();
      calcularDespesasMes();
      renderizarSaldoDoDia();
      if (estado.abaAtiva === 'planejamento') {
        renderizarGraficos();
        renderizarLimites();
      }

      alert('Dados importados com sucesso!');
    } catch (err) {
      alert('Erro ao importar dados: ' + err.message);
    }
  };
  leitor.readAsText(arquivo);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  carregarDados();
  carregarMetasSonhos(); // ATUALIZADO: Carrega as metas dos sonhos
  renderizarCalendario();
  renderizarCategorias();
  atualizarSelectsCategorias();
  renderizarMetasSonhos(); // ATUALIZADO: Renderiza as metas na inicialização
  calcularMelhorDia();
  calcularDespesasMes();
  renderizarSaldoDoDia();


  // Navegação de abas
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      alternarAba(button.dataset.tab);
    });
  });

  // Seletores de período dos gráficos
  document.querySelectorAll('.period-button').forEach(button => {
    button.addEventListener('click', () => {
      estado.periodoGrafico = button.dataset.period;
      // Atualiza botões
      button.parentElement.querySelectorAll('.period-button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      // Re-renderiza gráficos
      renderizarGraficos();
    });
  });

  // Salvar Limites
  if (elementos.btnSalvarLimites) {
    elementos.btnSalvarLimites.addEventListener('click', salvarLimites);
  }


  // Controles principais
  elementos.saldoInicial.addEventListener('change', function() {
    const novoSaldo = parseFloat(this.value) || 0;
    if (novoSaldo >= 0) {
      estado.saldoInicial = novoSaldo;
      salvarDados();
      renderizarCalendario();
      calcularMelhorDia();
      renderizarSaldoDoDia();
    }
  });

  elementos.filtroCategoria.addEventListener('change', function() {
    estado.filtroCategoria = this.value;
    renderizarCalendario();
  });

  elementos.mesAnterior.addEventListener('click', function() {
    estado.mesAtual.setMonth(estado.mesAtual.getMonth() - 1);
    renderizarCalendario();
  });

  elementos.mesProximo.addEventListener('click', function() {
    estado.mesAtual.setMonth(estado.mesAtual.getMonth() + 1);
    renderizarCalendario();
  });

  // Formulário de Transação
  elementos.formTransacao.addEventListener('submit', function(e) {
    e.preventDefault();
    const transacao = {
      id: gerarId(),
      data: estado.diaSelecionado,
      tipo: elementos.transacaoTipo.value,
      categoria: elementos.transacaoCategoria.value,
      valor: parseFloat(elementos.transacaoValor.value)
    };
    if (transacao.valor > 0) {
      adicionarTransacao(transacao);
      fecharModalTransacao();
    }
  });

  elementos.btnCancelar.addEventListener('click', fecharModalTransacao);
  elementos.modalClose.addEventListener('click', fecharModalTransacao);

  // Gerenciar Categorias
  elementos.gerenciarCategorias.addEventListener('click', abrirModalCategorias);
  elementos.categoriasModalClose.addEventListener('click', fecharModalCategorias);

  elementos.btnAdicionarCategoria.addEventListener('click', function() {
    const nome = elementos.categoriaNova.value.trim();
    if (adicionarCategoria(nome)) {
      elementos.categoriaNova.value = '';
      renderizarCategorias(); // Re-renderiza a lista no modal
    }
  });

  elementos.formCategoria.addEventListener('submit', function(e) {
    e.preventDefault();
    const id = elementos.categoriaId.value;
    const nome = elementos.categoriaNome.value.trim();
    if (editarCategoria(id, nome)) {
      fecharModalEditarCategoria();
    }
  });

  elementos.btnCancelarCategoria.addEventListener('click', fecharModalEditarCategoria);
  elementos.categoriaModalClose.addEventListener('click', fecharModalEditarCategoria);

  // Toggle de visibilidade da lista de categorias
  elementos.toggleCategorias.addEventListener('click', function() {
    const lista = elementos.categoriasLista;
    const icone = this.querySelector('i');
    lista.classList.toggle('oculto');
    if (lista.classList.contains('oculto')) {
      icone.className = 'fas fa-eye';
      this.innerHTML = '<i class="fas fa-eye"></i> Mostrar';
    } else {
      icone.className = 'fas fa-eye-slash';
      this.innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar';
    }
  });

  // Exportar/Importar
  document.getElementById('btn-exportar').addEventListener('click', exportarDados);
  document.getElementById('btn-importar').addEventListener('click', () => {
    document.getElementById('input-importar').click();
  });
  document.getElementById('input-importar').addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      importarDados(e.target.files[0]);
    }
  });

  // Fechar modais ao clicar fora
  window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
});