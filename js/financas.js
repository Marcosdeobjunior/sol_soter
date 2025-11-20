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


// --- NOVIDADE: ATUALIZA O SALDO QUANDO A PÁGINA CARREGA ---
document.addEventListener('DOMContentLoaded', () => {
  // Chama a função do script global para mostrar o saldo
  if (typeof atualizarSaldoGlobal === 'function') {
    atualizarSaldoGlobal();
  }
});

// Opcional: Atualiza o saldo na index.html se outra aba alterar os dados
window.addEventListener('storage', (event) => {
  if (event.key === 'financeiro-widget') {
    if (typeof atualizarSaldoGlobal === 'function') {
      atualizarSaldoGlobal();
    }
  }
});

// Estado da aplicação
const estado = {
  saldoInicial: 1000,
  mesAtual: new Date(),
  transacoes: [],
  filtroCategoria: 'todas',
  diaSelecionado: null,
  reservaEmergencia: 0,
  metaReserva: 0,
  categorias: [{
    id: 'salario',
    nome: 'Salário',
    tipoDespesa: 'nao_aplicavel'
  }, {
    id: 'alimentacao',
    nome: 'Alimentação',
    tipoDespesa: 'variavel'
  }, {
    id: 'transporte',
    nome: 'Transporte',
    tipoDespesa: 'fixa'
  }, {
    id: 'lazer',
    nome: 'Lazer',
    tipoDespesa: 'variavel'
  }, {
    id: 'outros',
    nome: 'Outros',
    tipoDespesa: 'variavel'
  }, ],
  recorrencias: [], // NOVO: Para transações recorrentes
  limites: {}, // AGORA é 'Orçamento'
  abaAtiva: 'controle',
  periodoGrafico: 'mes',
  filtroGraficoCategorias: 'todas',
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
  modalClose: document.querySelector('#modal-transacao .modal-close'),
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
  // ORÇAMENTO (antigo Limites)
  orcamentoGrid: document.getElementById('orcamento-grid'),
  btnSalvarOrcamento: document.getElementById('btn-salvar-orcamento'),
  orcamentoRenda: document.getElementById('orcamento-renda'),
  orcamentoTotal: document.getElementById('orcamento-total'),
  orcamentoSobra: document.getElementById('orcamento-sobra'),
  orcamentoSobraContainer: document.getElementById('orcamento-sobra-container'),
  // RESERVA
  widgetReserva: document.getElementById('reserva-emergencia'),
  reservaValorAtual: document.getElementById('reserva-valor'),
  reservaMetaInput: document.getElementById('reserva-meta'),
  reservaProgressoBarra: document.getElementById('reserva-progresso-barra'),
  reservaProgressoTexto: document.getElementById('reserva-progresso-texto'),
  // NOVO: RECORRÊNCIAS
  gerenciarRecorrencias: document.getElementById('gerenciar-recorrencias'),
  modalRecorrencias: document.getElementById('modal-recorrencias'),
  recorrenciasModalClose: document.getElementById('recorrencias-modal-close'),
  formRecorrencia: document.getElementById('form-recorrencia'),
  recorrenciaTipo: document.getElementById('recorrencia-tipo'),
  recorrenciaCategoria: document.getElementById('recorrencia-categoria'),
  recorrenciaValor: document.getElementById('recorrencia-valor'),
  recorrenciaDia: document.getElementById('recorrencia-dia'),
  recorrenciaId: document.getElementById('recorrencia-id'),
  recorrenciasLista: document.getElementById('recorrencias-lista'),
  // SALDO HEADER
  saldoDoDia: document.getElementById('saldo-do-dia'),
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
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`tab-${nomeAba}`).classList.add('active');
  document.querySelector(`[data-tab="${nomeAba}"]`).classList.add('active');
  estado.abaAtiva = nomeAba;

  if (nomeAba === 'planejamento') {
    setTimeout(() => {
      renderizarGraficos();
      renderizarOrcamento(); // ATUALIZADO
    }, 100);
  }
}

// Função para calcular e renderizar o saldo do dia
function calcularSaldoDoDia() {
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);

  let saldo = estado.saldoInicial;

  for (const transacao of estado.transacoes) {
    if (transacao.data <= hoje) {
      if (transacao.tipo === 'entrada') {
        saldo += transacao.valor;
      } else if (transacao.tipo === 'saida' || transacao.tipo === 'reserva') {
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
    elementos.saldoDoDia.style.color = saldoAtual >= 0 ? '#fff' : 'var(--cor-saida)';
  }
}

// Funções de manipulação de dados
function carregarDados() {
  const dadosSalvos = localStorage.getItem('financeiro-widget');

  if (dadosSalvos) {
    try {
      const dados = JSON.parse(dadosSalvos);

      if (typeof dados.saldoInicial === 'number' && !isNaN(dados.saldoInicial) && dados.saldoInicial >= 0) {
        estado.saldoInicial = dados.saldoInicial;
      }

      if (Array.isArray(dados.transacoes)) {
        estado.transacoes = dados.transacoes.map(t => ({
          ...t,
          data: stringParaData(t.data)
        }));
      }

      if (Array.isArray(dados.categorias)) {
        estado.categorias = dados.categorias.map(c => ({
          ...c,
          tipoDespesa: c.tipoDespesa || 'variavel'
        }));
        if (!estado.categorias.find(c => c.id === 'outros')) {
          estado.categorias.push({
            id: 'outros',
            nome: 'Outros',
            tipoDespesa: 'variavel'
          });
        }
        const salarioCat = estado.categorias.find(c => c.id === 'salario');
        if (salarioCat && salarioCat.nome === 'Salário') {
          salarioCat.tipoDespesa = 'nao_aplicavel';
        }
        if (!estado.categorias.find(c => c.id === 'sonhos')) {
          estado.categorias.push({ id: 'sonhos', nome: 'Sonhos', tipoDespesa: 'variavel' });
        }
      }

      // NOVO: Carregar recorrências
      if (Array.isArray(dados.recorrencias)) {
        estado.recorrencias = dados.recorrencias;
      }

      if (typeof dados.reservaEmergencia === 'number') {
        estado.reservaEmergencia = dados.reservaEmergencia;
      }
      if (typeof dados.metaReserva === 'number') {
        estado.metaReserva = dados.metaReserva;
      }

      if (dados.limites && typeof dados.limites === 'object') {
        estado.limites = dados.limites;
      }

      elementos.saldoInicial.value = estado.saldoInicial;
      elementos.reservaMetaInput.value = estado.metaReserva;
      renderizarCategorias();
      atualizarSelectsCategorias();
    } catch (erro) {
      console.error('Erro ao carregar dados:', erro);
      // Resetar para valores padrão
      estado.saldoInicial = 1000;
      estado.transacoes = [];
      estado.recorrencias = [];
      estado.reservaEmergencia = 0;
      estado.metaReserva = 0;
      elementos.saldoInicial.value = estado.saldoInicial;
      elementos.reservaMetaInput.value = estado.metaReserva;
    }
  } else {
    elementos.saldoInicial.value = estado.saldoInicial;
    elementos.reservaMetaInput.value = estado.metaReserva;
  }
}

function salvarDados() {
  const transacoesParaSalvar = estado.transacoes.map(t => ({
    ...t,
    data: dataParaString(t.data)
  }));

  const dados = {
    saldoInicial: estado.saldoInicial,
    transacoes: transacoesParaSalvar,
    categorias: estado.categorias,
    recorrencias: estado.recorrencias, // NOVO
    limites: estado.limites,
    reservaEmergencia: estado.reservaEmergencia,
    metaReserva: estado.metaReserva
  };

  localStorage.setItem('financeiro-widget', JSON.stringify(dados));
}

function calcularDespesasMes() {
  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  const despesasMes = estado.transacoes.filter(t =>
    t.tipo === 'saida' &&
    t.data >= primeiroDiaMes &&
    t.data <= ultimoDiaMes
  );

  const totalDespesas = despesasMes.reduce((total, t) => total + t.valor, 0);
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

  if (estado.abaAtiva === 'planejamento') {
    renderizarGraficos();
    renderizarOrcamento();
  }
}

function removerTransacao(id) {
  const transacao = estado.transacoes.find(t => t.id === id);
  if (transacao && transacao.tipo === 'reserva') {
    estado.reservaEmergencia -= transacao.valor;
    if (estado.reservaEmergencia < 0) estado.reservaEmergencia = 0;
  }

  estado.transacoes = estado.transacoes.filter(t => t.id !== id);
  salvarDados();
  renderizarCalendario();
  calcularMelhorDia();
  calcularDespesasMes();
  renderizarSaldoDoDia();
  renderizarReservaWidget();

  if (estado.abaAtiva === 'planejamento') {
    renderizarGraficos();
    renderizarOrcamento();
  }
}

function filtrarTransacoes(transacoes) {
  if (estado.filtroCategoria === 'todas') {
    return transacoes;
  }
  return transacoes.filter(t => t.categoria === estado.filtroCategoria);
}

function adicionarCategoria(nome, tipoDespesa) {
  if (!nome || nome.trim() === '') {
    alert('Por favor, informe um nome para a categoria.');
    return false;
  }
  const nomeNormalizado = nome.trim().toLowerCase();
  const categoriaExistente = estado.categorias.find(c => c.nome.toLowerCase() === nomeNormalizado);

  if (categoriaExistente) {
    alert('Já existe uma categoria com este nome.');
    return false;
  }

  const novaCategoria = {
    id: gerarId(),
    nome: nome.trim(),
    tipoDespesa: tipoDespesa
  };

  estado.categorias.push(novaCategoria);
  salvarDados();
  renderizarCategorias();
  atualizarSelectsCategorias();

  if (estado.abaAtiva === 'planejamento') {
    renderizarOrcamento();
  }
  return true;
}

function editarCategoria(id, novoNome, tipoDespesa) {
  if (!novoNome || novoNome.trim() === '') {
    alert('Por favor, informe um nome para a categoria.');
    return false;
  }
  const nomeNormalizado = novoNome.trim().toLowerCase();
  const categoriaExistente = estado.categorias.find(c => c.nome.toLowerCase() === nomeNormalizado && c.id !== id);

  if (categoriaExistente) {
    alert('Já existe uma categoria com este nome.');
    return false;
  }

  const categoria = estado.categorias.find(c => c.id === id);
  if (categoria) {
    categoria.nome = novoNome.trim();
    categoria.tipoDespesa = tipoDespesa;
    salvarDados();
    renderizarCategorias();
    atualizarSelectsCategorias();
    renderizarCalendario();

    if (estado.abaAtiva === 'planejamento') {
      renderizarGraficos();
      renderizarOrcamento();
    }
    return true;
  }
  return false;
}

function removerCategoria(id) {
  const transacoesComCategoria = estado.transacoes.filter(t => t.categoria === id);
  if (transacoesComCategoria.length > 0) {
    alert('Não é possível excluir esta categoria pois existem transações associadas a ela.');
    return false;
  }

  // NOVO: Verificar recorrências
  const recorrenciasComCategoria = estado.recorrencias.filter(r => r.categoria === id);
  if (recorrenciasComCategoria.length > 0) {
    alert('Não é possível excluir esta categoria pois existem recorrências associadas a ela.');
    return false;
  }

  estado.categorias = estado.categorias.filter(c => c.id !== id);
  delete estado.limites[id]; // Remove do orçamento
  salvarDados();
  renderizarCategorias();
  atualizarSelectsCategorias();

  if (estado.abaAtiva === 'planejamento') {
    renderizarGraficos();
    renderizarOrcamento();
  }
  return true;
}

// --- NOVAS FUNÇÕES DE RECORRÊNCIA ---

function renderizarRecorrencias() {
  const container = elementos.recorrenciasLista;
  if (!container) return;
  container.innerHTML = '';

  if (estado.recorrencias.length === 0) {
    container.innerHTML = '<p>Nenhuma recorrência cadastrada.</p>';
    return;
  }

  estado.recorrencias.sort((a, b) => a.diaDoMes - b.diaDoMes).forEach(rec => {
    const categoria = estado.categorias.find(c => c.id === rec.categoria);
    const nomeCategoria = categoria ? categoria.nome : 'N/A';
    const eRecorrencia = document.createElement('div');
    eRecorrencia.className = 'recorrencia-item';

    const valorClasse = rec.tipo === 'entrada' ? 'valor-entrada' : 'valor-despesa';

    eRecorrencia.innerHTML = `
      <div class="recorrencia-detalhes">
        Dia <strong>${rec.diaDoMes}</strong>: ${nomeCategoria}
        <span class="${valorClasse}">(${formatarMoeda(rec.valor)})</span>
      </div>
      <div class="recorrencia-acoes">
        <span class="recorrencia-editar" data-id="${rec.id}">✎</span>
        <span class="recorrencia-excluir" data-id="${rec.id}">✕</span>
      </div>
    `;
    container.appendChild(eRecorrencia);
  });

  // Add event listeners
  container.querySelectorAll('.recorrencia-editar').forEach(btn => {
    btn.addEventListener('click', () => {
      const rec = estado.recorrencias.find(r => r.id === btn.dataset.id);
      if (rec) {
        elementos.recorrenciaId.value = rec.id;
        elementos.recorrenciaTipo.value = rec.tipo;
        elementos.recorrenciaCategoria.value = rec.categoria;
        elementos.recorrenciaValor.value = rec.valor;
        elementos.recorrenciaDia.value = rec.diaDoMes;
      }
    });
  });
  container.querySelectorAll('.recorrencia-excluir').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Deseja realmente excluir esta recorrência?')) {
        removerRecorrencia(btn.dataset.id);
      }
    });
  });
}

function salvarRecorrencia(e) {
  e.preventDefault();
  const id = elementos.recorrenciaId.value;
  const novaRecorrencia = {
    tipo: elementos.recorrenciaTipo.value,
    categoria: elementos.recorrenciaCategoria.value,
    valor: parseFloat(elementos.recorrenciaValor.value),
    diaDoMes: parseInt(elementos.recorrenciaDia.value)
  };

  if (novaRecorrencia.valor <= 0 || isNaN(novaRecorrencia.valor)) {
    alert('Valor inválido.');
    return;
  }
  if (novaRecorrencia.diaDoMes < 1 || novaRecorrencia.diaDoMes > 31 || isNaN(novaRecorrencia.diaDoMes)) {
    alert('Dia do mês inválido (deve ser entre 1 e 31).');
    return;
  }

  if (id) {
    // Editar
    const index = estado.recorrencias.findIndex(r => r.id === id);
    if (index > -1) {
      estado.recorrencias[index] = { ...estado.recorrencias[index],
        ...novaRecorrencia
      };
    }
  } else {
    // Adicionar
    novaRecorrencia.id = gerarId();
    estado.recorrencias.push(novaRecorrencia);
  }

  salvarDados();
  renderizarRecorrencias();
  renderizarCalendario(); // Atualiza provisões
  calcularMelhorDia(); // Recalcula com base nas novas recorrências
  if (estado.abaAtiva === 'planejamento') {
    renderizarOrcamento(); // Atualiza Renda Prevista
  }
  elementos.formRecorrencia.reset();
  elementos.recorrenciaId.value = '';
}

function removerRecorrencia(id) {
  estado.recorrencias = estado.recorrencias.filter(r => r.id !== id);
  salvarDados();
  renderizarRecorrencias();
  renderizarCalendario();
  calcularMelhorDia();
  if (estado.abaAtiva === 'planejamento') {
    renderizarOrcamento();
  }
}

function abrirModalRecorrencias() {
  elementos.formRecorrencia.reset();
  elementos.recorrenciaId.value = '';
  renderizarRecorrencias();
  elementos.modalRecorrencias.style.display = 'flex';
}

function fecharModalRecorrencias() {
  elementos.modalRecorrencias.style.display = 'none';
}

// --- FIM RECORRÊNCIAS ---


// Funções de cálculo para gráficos
function obterDadosEntradaSaida(periodo) {
  const hoje = new Date();
  let dataInicio, dataFim;
  let labels = [];

  switch (periodo) {
    case 'mes':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
        labels.push(d.getDate().toString());
      }
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
      for (let m = 0; m < 12; m++) {
        const data = new Date(hoje.getFullYear(), m, 1);
        labels.push(data.toLocaleDateString('pt-BR', {
          month: 'short'
        }));
      }
      break;
  }

  const transacoesPeriodo = estado.transacoes.filter(t =>
    t.data >= dataInicio && t.data <= dataFim
  );

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
      } else if (t.tipo === 'saida') {
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

// ATUALIZADO: Retorna dados para Orçado vs. Gasto
function obterDadosCategorias(periodo, filtroTipoDespesa = 'todas') {
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

  // 1. Filtrar categorias relevantes
  const categoriasFiltradas = estado.categorias.filter(c => {
    if (c.tipoDespesa === 'nao_aplicavel') return false;
    if (filtroTipoDespesa === 'todas') return true;
    return c.tipoDespesa === filtroTipoDespesa;
  });

  // 2. Calcular gastos do período
  const saidasPeriodo = estado.transacoes.filter(t =>
    t.tipo === 'saida' && t.data >= dataInicio && t.data <= dataFim
  );

  const gastosPorCategoria = {};
  saidasPeriodo.forEach(t => {
    if (!gastosPorCategoria[t.categoria]) {
      gastosPorCategoria[t.categoria] = 0;
    }
    gastosPorCategoria[t.categoria] += t.valor;
  });

  // 3. Montar arrays alinhados
  const labels = [];
  const dataGastos = [];
  const dataOrcado = [];

  categoriasFiltradas.forEach(cat => {
    labels.push(cat.nome);
    dataGastos.push(gastosPorCategoria[cat.id] || 0);
    // 'limites' agora é 'orçamento'. Pega o valor do orçamento.
    // Se for período 'semestre' or 'ano', multiplicamos o orçamento mensal
    let orcado = estado.limites[cat.id] || 0;
    if (periodo === 'semestre') orcado *= 6;
    if (periodo === 'ano') orcado *= 12;
    dataOrcado.push(orcado);
  });

  return {
    labels,
    dataGastos,
    dataOrcado
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
        borderColor: '#4caf50', // CORRIGIDO: Valor literal
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4
      }, {
        label: 'Saídas',
        data: dados.saidas,
        borderColor: '#f44336', // CORRIGIDO: Valor literal
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
            color: '#e0e0e0' // CORRIGIDO: Valor literal
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#e0e0e0' // CORRIGIDO: Valor literal
          },
          grid: {
            color: '#4a4a4a' // CORRIGIDO: Valor literal
          }
        },
        y: {
          ticks: {
            color: '#e0e0e0', // CORRIGIDO: Valor literal
            callback: function(value) {
              return formatarMoeda(value);
            }
          },
          grid: {
            color: '#4a4a4a' // CORRIGIDO: Valor literal
          }
        }
      }
    }
  });
}

// ATUALIZADO: Gráfico de Barras (Orçado vs. Gasto)
function renderizarGraficoCategorias() {
  const ctx = document.getElementById('chart-categorias');
  if (!ctx) return;

  const dados = obterDadosCategorias(estado.periodoGrafico, estado.filtroGraficoCategorias);

  if (chartCategorias) {
    chartCategorias.destroy();
  }

  chartCategorias = new Chart(ctx, {
    type: 'bar', // MUDADO PARA 'bar'
    data: {
      labels: dados.labels,
      datasets: [{
        label: 'Gasto',
        data: dados.dataGastos,
        backgroundColor: '#f44336', // CORRIGIDO: Valor literal
      }, {
        label: 'Orçado',
        data: dados.dataOrcado,
        backgroundColor: '#89b4fa', // CORRIGIDO: Valor literal
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#e0e0e0' // CORRIGIDO: Valor literal
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = formatarMoeda(context.parsed.y);
              return `${label}: ${value}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#e0e0e0' // CORRIGIDO: Valor literal
          },
          grid: {
            color: '#4a4a4a' // CORRIGIDO: Valor literal
          }
        },
        y: {
          ticks: {
            color: '#e0e0e0', // CORRIGIDO: Valor literal
            callback: function(value) {
              return formatarMoeda(value);
            }
          },
          grid: {
            color: '#4a4a4a' // CORRIGIDO: Valor literal
          }
        }
      }
    }
  });
}

// ATUALIZADO: Funções de Orçamento (antigo Limites)
function renderizarOrcamento() {
  const container = elementos.orcamentoGrid;
  if (!container) return;
  container.innerHTML = '';

  let rendaPrevista = 0;
  estado.recorrencias.forEach(rec => {
    if (rec.tipo === 'entrada') {
      rendaPrevista += rec.valor;
    }
  });

  let totalOrcado = 0;
  Object.values(estado.limites).forEach(valor => {
    totalOrcado += valor;
  });

  const sobra = rendaPrevista - totalOrcado;

  // Atualizar resumo
  elementos.orcamentoRenda.textContent = formatarMoeda(rendaPrevista);
  elementos.orcamentoTotal.textContent = formatarMoeda(totalOrcado);
  elementos.orcamentoSobra.textContent = formatarMoeda(sobra);

  // Cor da sobra
  if (sobra > 0) {
    elementos.orcamentoSobra.style.color = 'var(--cor-entrada)';
  } else if (sobra < 0) {
    elementos.orcamentoSobra.style.color = 'var(--cor-saida)';
  } else {
    elementos.orcamentoSobra.style.color = 'var(--acento-amarelo)';
  }


  const categoriasDeDespesa = estado.categorias.filter(c => c.tipoDespesa !== 'nao_aplicavel');

  categoriasDeDespesa.forEach(categoria => {
    const orcamentoItem = document.createElement('div');
    orcamentoItem.className = 'orcamento-item';

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

    const orcado = estado.limites[categoria.id] || 0;
    const tagTipo = categoria.tipoDespesa === 'fixa' ? 'Fixa' : 'Variável';
    const tagClass = categoria.tipoDespesa === 'fixa' ? 'limit-tag-fixa' : 'limit-tag-variavel';

    let percentual = 0;
    if (orcado > 0) {
      percentual = (gastoAtual / orcado) * 100;
    } else if (gastoAtual > 0) {
      percentual = 100; // Gastou sem ter orçado
    }

    if (percentual >= 100) {
      orcamentoItem.classList.add('exceeded');
    } else if (percentual >= 80) {
      orcamentoItem.classList.add('warning');
    }

    const gastoFormatado = formatarMoeda(gastoAtual);
    const orcadoFormatado = formatarMoeda(orcado);
    const restante = formatarMoeda(orcado - gastoAtual);
    const statusTexto = orcado > 0 ? `${gastoFormatado} de ${orcadoFormatado} (Resta: ${restante})` : `${gastoFormatado} gastos (sem orçamento)`;

    orcamentoItem.innerHTML = `
      <div class="orcamento-label">
        <span>${categoria.nome}</span>
        <span class="limit-tag ${tagClass}">${tagTipo}</span>
      </div>
      <input type="number" class="orcamento-input" 
             data-categoria="${categoria.id}" 
             value="${orcado}" 
             min="0" step="0.01" 
             placeholder="Orçamento mensal">
      <div class="orcamento-status-texto">${statusTexto}</div>
      <div class="orcamento-progresso">
          <div class="orcamento-progresso-barra" style="width: ${Math.min(percentual, 100)}%;"></div>
      </div>
    `;

    container.appendChild(orcamentoItem);
  });
}

function salvarOrcamento() {
  const inputs = document.querySelectorAll('.orcamento-input');
  let totalOrcado = 0;

  inputs.forEach(input => {
    const categoriaId = input.dataset.categoria;
    const valor = parseFloat(input.value) || 0;
    estado.limites[categoriaId] = valor;
    totalOrcado += valor;
  });

  salvarDados();
  renderizarOrcamento(); // Re-renderiza para atualizar barras e resumo
  renderizarGraficoCategorias(); // Atualiza o gráfico

  alert('Orçamento salvo com sucesso!');
}


// Funções de cálculo
function calcularSaldoDia(data) {
  const dataFimDia = new Date(data);
  dataFimDia.setHours(23, 59, 59, 999);
  let saldo = estado.saldoInicial;
  for (const transacao of estado.transacoes) {
    if (transacao.data <= dataFimDia) {
      if (transacao.tipo === 'entrada') {
        saldo += transacao.valor;
      } else if (transacao.tipo === 'saida' || transacao.tipo === 'reserva') {
        saldo -= transacao.valor;
      }
    }
  }
  return saldo;
}

// ATUALIZADO: Agora considera recorrências futuras
function calcularMelhorDia() {
  const hoje = new Date();
  const mes = hoje.getMonth();
  const ano = hoje.getFullYear();
  const fimDoMes = new Date(ano, mes + 1, 0);
  let melhorDia = null;
  let maiorPontuacao = -Infinity;
  let valorDisponivel = 0;
  let valorRecomendado = 0;
  const reservaSeguranca = 200;

  // Função interna para verificar contas
  function verificarContasQuitadas() {
    // Despesas e reservas REAIS do mês
    const todasSaidasReais = estado.transacoes.filter(t =>
      (t.tipo === 'saida' || t.tipo === 'reserva') &&
      t.data.getMonth() === mes &&
      t.data.getFullYear() === ano
    ).reduce((total, t) => total + t.valor, 0);

    // Entradas REAIS do mês
    const todasEntradasReais = estado.transacoes.filter(t =>
      t.tipo === 'entrada' &&
      t.data.getMonth() === mes &&
      t.data.getFullYear() === ano
    ).reduce((total, t) => total + t.valor, 0);

    // NOVO: Despesas RECORRENTES (provisionadas) do mês
    const despesasRecorrentes = estado.recorrencias
      .filter(rec => rec.tipo === 'saida')
      .reduce((total, rec) => total + rec.valor, 0);

    // NOVO: Entradas RECORRENTES (provisionadas) do mês
    const entradasRecorrentes = estado.recorrencias
      .filter(rec => rec.tipo === 'entrada')
      .reduce((total, rec) => total + rec.valor, 0);

    // Comparamos o "planejado total" (real + recorrente)
    // A lógica é: o saldo inicial + renda total (real+prevista) tem que cobrir as saídas totais (real+prevista) + reserva
    // Nota: Isso assume que recorrências não são duplicadas com transações reais.
    // Por simplicidade, vamos somar o *total* provisionado vs. *total* gasto.
    // Usaremos a Renda Prevista (só de recorrências) e o Total Orçado (de limites)
    
    let rendaPrevista = estado.recorrencias
      .filter(rec => rec.tipo === 'entrada')
      .reduce((total, rec) => total + rec.valor, 0);
      
    let totalOrcado = Object.values(estado.limites).reduce((total, valor) => total + valor, 0);

    // Se o usuário não orçou (limites), usamos as recorrências de saída
    if (totalOrcado === 0) {
        totalOrcado = estado.recorrencias
          .filter(rec => rec.tipo === 'saida')
          .reduce((total, rec) => total + rec.valor, 0);
    }

    return (estado.saldoInicial + rendaPrevista) >= (totalOrcado + reservaSeguranca);
  }

  if (!verificarContasQuitadas()) {
    elementos.melhorDia.innerHTML = `<i class="fas fa-calendar-day"></i> Melhor dia para comprar: Não disponível (orçamento não cobre despesas e reserva de ${formatarMoeda(reservaSeguranca)})`;
    return;
  }

  // Verificar cada dia a partir de hoje
  for (let dia = new Date(hoje); dia <= fimDoMes; dia.setDate(dia.getDate() + 1)) {
    let saldoAteDia = calcularSaldoDia(dia);

    // Despesas REAIS futuras no mês
    const despesasReaisFuturas = estado.transacoes.filter(t =>
      (t.tipo === 'saida' || t.tipo === 'reserva') &&
      t.data > dia &&
      t.data.getMonth() === mes &&
      t.data.getFullYear() === ano
    ).reduce((total, t) => total + t.valor, 0);

    // NOVO: Despesas RECORRENTES futuras no mês
    const despesasRecorrentesFuturas = estado.recorrencias
      .filter(rec =>
        rec.tipo === 'saida' &&
        rec.diaDoMes > dia.getDate() &&
        // Verifica se já não foi lançada uma transação real
        !estado.transacoes.some(t =>
          t.categoria === rec.categoria && // Aproximação. Ideal seria t.recorrenciaId
          t.tipo === 'saida' &&
          t.data.getMonth() === mes &&
          t.data.getDate() === rec.diaDoMes
        )
      )
      .reduce((total, rec) => total + rec.valor, 0);

    const despesasFuturas = despesasReaisFuturas + despesasRecorrentesFuturas;
    const saldoFuturoConsiderado = saldoAteDia - despesasFuturas;

    if (saldoFuturoConsiderado >= reservaSeguranca) {
      let pontuacao = saldoAteDia; // Pontuação simples
      if (pontuacao > maiorPontuacao) {
        maiorPontuacao = pontuacao;
        melhorDia = new Date(dia);
        valorDisponivel = saldoFuturoConsiderado - reservaSeguranca;
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
  while (elementos.calendario.children.length > 7) {
    elementos.calendario.removeChild(elementos.calendario.lastChild);
  }
  elementos.calendarioMes.innerHTML = `<i class="fas fa-calendar-alt"></i> ${obterNomeMes(estado.mesAtual)}`;
  const primeiroDiaMes = new Date(estado.mesAtual.getFullYear(), estado.mesAtual.getMonth(), 1);
  const ultimoDiaMes = new Date(estado.mesAtual.getFullYear(), estado.mesAtual.getMonth() + 1, 0);
  const diasNoMes = ultimoDiaMes.getDate();
  const diaDaSemanaInicio = primeiroDiaMes.getDay();

  for (let i = 0; i < diaDaSemanaInicio; i++) {
    const elementoVazio = document.createElement('div');
    elementoVazio.className = 'dia dia-outro-mes';
    elementos.calendario.appendChild(elementoVazio);
  }
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

  const numeroDia = document.createElement('div');
  numeroDia.className = 'dia-numero';
  numeroDia.textContent = data.getDate();
  elementoDia.appendChild(numeroDia);

  elementoDia.addEventListener('click', () => abrirModalTransacao(data));

  const saldoDia = calcularSaldoDia(data);
  const saldoElement = document.createElement('div');
  saldoElement.className = 'dia-saldo';
  saldoElement.textContent = formatarMoeda(saldoDia);
  elementoDia.appendChild(saldoElement);

  // Lista de transações (reais + provisionadas)
  const listaTransacoes = document.createElement('div');
  listaTransacoes.className = 'transacoes-lista';

  // 1. Transações REAIS
  const transacoesDia = filtrarTransacoes(estado.transacoes.filter(t => mesmoDia(t.data, data)));
  transacoesDia.forEach(transacao => {
    const itemTransacao = document.createElement('div');
    let nomeCategoria;
    if (transacao.categoria === 'sonhos') {
      const titulo = (carregarSonhos().find(s => s.id === transacao.sonhoId) || {}).titulo;
      nomeCategoria = titulo ? `Sonhos - ${titulo}` : 'Sonhos';
    } else {
      const categoria = estado.categorias.find(c => c.id === transacao.categoria);
      nomeCategoria = categoria ? categoria.nome : 'N/A';
    }
    itemTransacao.className = `transacao transacao-${transacao.tipo}`;
    itemTransacao.innerHTML = `
      <span>${nomeCategoria}: ${formatarMoeda(transacao.valor)}</span>
      <span class="transacao-excluir" data-id="${transacao.id}">x</span>
    `;
    listaTransacoes.appendChild(itemTransacao);
  });

  // 2. NOVO: Transações PROVISIONADAS (Recorrências)
  // Apenas se for o mês atual
  const hoje = new Date();
  if (data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear()) {
    const recorrenciasDia = estado.recorrencias.filter(rec => rec.diaDoMes === data.getDate());
    
    recorrenciasDia.forEach(rec => {
        // Ocultar se já existir uma transação real da mesma categoria no dia
        const jaLancado = transacoesDia.some(t => t.categoria === rec.categoria && t.tipo === rec.tipo);
        
        if (!jaLancado) {
            const itemProvisionado = document.createElement('div');
            const categoria = estado.categorias.find(c => c.id === rec.categoria);
            const nomeCategoria = categoria ? categoria.nome : 'N/A';
            itemProvisionado.className = `transacao transacao-provisionada transacao-${rec.tipo}`; // Usa tipo p/ cor
            itemProvisionado.innerHTML = `
              <span>🕒 ${nomeCategoria}: ${formatarMoeda(rec.valor)}</span>
            `;
            listaTransacoes.appendChild(itemProvisionado);
        }
    });
  }

  elementoDia.appendChild(listaTransacoes);

  // Event listener de exclusão (só para transações reais)
  listaTransacoes.querySelectorAll('.transacao-excluir').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      removerTransacao(btn.dataset.id);
    });
  });

  return elementoDia;
}

function renderizarReservaWidget() {
  if (!elementos.widgetReserva) return;
  elementos.reservaValorAtual.textContent = formatarMoeda(estado.reservaEmergencia);
  elementos.reservaMetaInput.value = estado.metaReserva;
  let percentual = 0;
  if (estado.metaReserva > 0) {
    percentual = (estado.reservaEmergencia / estado.metaReserva) * 100;
  }
  if (percentual > 100) {
    percentual = 100;
  }
  if (percentual >= 100 && estado.metaReserva > 0) {
    elementos.widgetReserva.classList.add('meta-completa');
    elementos.reservaProgressoTexto.textContent = 'Meta Atingida!';
  } else {
    elementos.widgetReserva.classList.remove('meta-completa');
    elementos.reservaProgressoTexto.textContent = `${percentual.toFixed(1)}%`;
  }
  elementos.reservaProgressoBarra.style.width = `${percentual}%`;
}


function renderizarCategorias() {
  const container = elementos.categoriasLista;
  if (!container) return;
  container.innerHTML = '';

  estado.categorias.forEach(categoria => {
    const categoriaItem = document.createElement('div');
    categoriaItem.className = 'categoria-item';
    let tagTipo = '';
    if (categoria.tipoDespesa === 'fixa') {
      tagTipo = '<span class="limit-tag limit-tag-fixa">Fixa</span>';
    } else if (categoria.tipoDespesa === 'variavel') {
      tagTipo = '<span class="limit-tag limit-tag-variavel">Variável</span>';
    } else {
      tagTipo = '<span class="limit-tag limit-tag-nao_aplicavel">N/A</span>';
    }

    categoriaItem.innerHTML = `
      <div class="categoria-nome">${categoria.nome}</div>
      <div class="categoria-acoes">
        ${tagTipo}
        <span class="categoria-editar" data-id="${categoria.id}">✎</span>
        <span class="categoria-excluir" data-id="${categoria.id}">✕</span>
      </div>
    `;
    container.appendChild(categoriaItem);
  });

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
  // Limpar selects
  elementos.transacaoCategoria.innerHTML = '';
  elementos.filtroCategoria.innerHTML = '';
  elementos.recorrenciaCategoria.innerHTML = ''; // NOVO

  // Opção "Todas" para filtro
  const todasOption = document.createElement('option');
  todasOption.value = 'todas';
  todasOption.textContent = 'Todas as categorias';
  elementos.filtroCategoria.appendChild(todasOption);

  // Popular com categorias
  estado.categorias.forEach(categoria => {
    const optionTransacao = document.createElement('option');
    optionTransacao.value = categoria.id;
    optionTransacao.textContent = categoria.nome;
    elementos.transacaoCategoria.appendChild(optionTransacao);

    const optionFiltro = document.createElement('option');
    optionFiltro.value = categoria.id;
    optionFiltro.textContent = categoria.nome;
    elementos.filtroCategoria.appendChild(optionFiltro);

    // NOVO: Popular select de recorrências
    const optionRecorrencia = document.createElement('option');
    optionRecorrencia.value = categoria.id;
    optionRecorrencia.textContent = categoria.nome;
    elementos.recorrenciaCategoria.appendChild(optionRecorrencia);
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
  renderizarCategorias();
  document.getElementById('categoria-nova-variavel').checked = true;
  elementos.modalCategorias.style.display = 'flex';
}

function fecharModalCategorias() {
  elementos.modalCategorias.style.display = 'none';
}

function abrirModalEditarCategoria(categoria) {
  elementos.categoriaId.value = categoria.id;
  elementos.categoriaNome.value = categoria.nome;
  const tipoDespesa = categoria.tipoDespesa || 'variavel';
  const radioToSelect = document.getElementById(`categoria-edit-${tipoDespesa}`);
  if (radioToSelect) {
    radioToSelect.checked = true;
  } else {
    document.getElementById('categoria-edit-variavel').checked = true;
  }
  elementos.modalCategoria.style.display = 'flex';
}

function fecharModalEditarCategoria() {
  elementos.modalCategoria.style.display = 'none';
}

// Funções de exportação/importação GLOBAIS
function exportarDadosFinanceiros() {
  const dados = {
    saldoInicial: estado.saldoInicial,
    transacoes: estado.transacoes.map(t => ({
      ...t,
      data: dataParaString(t.data)
    })),
    categorias: estado.categorias,
    recorrencias: estado.recorrencias, // NOVO
    limites: estado.limites,
    reservaEmergencia: estado.reservaEmergencia,
    metaReserva: estado.metaReserva
  };
  return dados;
}

function importarDadosFinanceiros(dados) {
  try {
    if (typeof dados.saldoInicial === 'number') estado.saldoInicial = dados.saldoInicial;
    if (Array.isArray(dados.transacoes)) {
      estado.transacoes = dados.transacoes.map(t => ({
        ...t,
        data: stringParaData(t.data)
      }));
    }
    if (Array.isArray(dados.categorias)) {
      estado.categorias = dados.categorias.map(c => ({
        ...c,
        tipoDespesa: c.tipoDespesa || 'variavel'
      }));
    }
    if (Array.isArray(dados.recorrencias)) estado.recorrencias = dados.recorrencias; // NOVO
    if (dados.limites && typeof dados.limites === 'object') estado.limites = dados.limites;
    if (typeof dados.reservaEmergencia === 'number') estado.reservaEmergencia = dados.reservaEmergencia;
    if (typeof dados.metaReserva === 'number') estado.metaReserva = dados.metaReserva;

    salvarDados();

    // Re-renderizar tudo
    elementos.saldoInicial.value = estado.saldoInicial;
    renderizarCategorias();
    atualizarSelectsCategorias();
    renderizarCalendario();
    renderizarReservaWidget();
    calcularMelhorDia();
    calcularDespesasMes();
    renderizarSaldoDoDia();
    if (estado.abaAtiva === 'planejamento') {
      renderizarGraficos();
      renderizarOrcamento();
    }

    console.log('Dados financeiros importados com sucesso!');
  } catch (err) {
    console.error('Erro ao importar dados financeiros: ' + err.message);
  }
}

window.exportarDadosFinanceiros = exportarDadosFinanceiros;
window.importarDadosFinanceiros = importarDadosFinanceiros;


// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  carregarDados();
  renderizarCalendario();
  renderizarCategorias();
  atualizarSelectsCategorias();
  renderizarReservaWidget();
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
  document.querySelectorAll('.period-selector').forEach(button => {
    button.addEventListener('click', () => {
      if (button.closest('#chart-categorias-filter')) return;
      estado.periodoGrafico = button.dataset.period;
      button.parentElement.querySelectorAll('.period-button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      renderizarGraficos();
    });
  });

  // Filtro do gráfico de categorias
  const filtroCategoriasContainer = document.getElementById('chart-categorias-filter');
  if (filtroCategoriasContainer) {
    filtroCategoriasContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('period-button')) {
        filtroCategoriasContainer.querySelectorAll('.period-button').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        estado.filtroGraficoCategorias = e.target.dataset.filter;
        renderizarGraficoCategorias();
      }
    });
  }

  // Salvar Orçamento (antigo Limites)
  if (elementos.btnSalvarOrcamento) {
    elementos.btnSalvarOrcamento.addEventListener('click', salvarOrcamento);
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

  if (elementos.reservaMetaInput) {
    elementos.reservaMetaInput.addEventListener('change', function() {
      const novaMeta = parseFloat(this.value) || 0;
      if (novaMeta >= 0) {
        estado.metaReserva = novaMeta;
        salvarDados();
        renderizarReservaWidget();
      }
    });
  }

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
    const tipo = elementos.transacaoTipo.value;
    const valor = parseFloat(elementos.transacaoValor.value);
    if (valor <= 0) {
      alert("O valor deve ser positivo.");
      return;
    }
    if (tipo === 'reserva') {
      const saldoDisponivelDia = calcularSaldoDia(estado.diaSelecionado);
      if (valor > saldoDisponivelDia) {
        alert(`Saldo insuficiente para transferir ${formatarMoeda(valor)}.\nSaldo disponível no dia ${estado.diaSelecionado.toLocaleDateString('pt-BR')}: ${formatarMoeda(saldoDisponivelDia)}`);
        return;
      }
      estado.reservaEmergencia += valor;
    }
    const transacao = {
      id: gerarId(),
      data: estado.diaSelecionado,
      tipo: tipo,
      categoria: elementos.transacaoCategoria.value,
      valor: valor
    };
    adicionarTransacao(transacao);
    try {
      const log = JSON.parse(localStorage.getItem('auditoria-financas-sonhos') || '[]');
      log.push({ tipo: 'transacao', fonte: 'calendario', data: new Date().toISOString(), transacao });
      localStorage.setItem('auditoria-financas-sonhos', JSON.stringify(log));
    } catch (_) {}
    if (tipo === 'reserva') {
      renderizarReservaWidget();
    }
    fecharModalTransacao();
  });


  elementos.btnCancelar.addEventListener('click', fecharModalTransacao);
  elementos.modalClose.addEventListener('click', fecharModalTransacao);

  // Gerenciar Categorias
  elementos.gerenciarCategorias.addEventListener('click', abrirModalCategorias);
  elementos.categoriasModalClose.addEventListener('click', fecharModalCategorias);

  elementos.btnAdicionarCategoria.addEventListener('click', function() {
    const nome = elementos.categoriaNova.value.trim();
    const tipoDespesa = document.querySelector('input[name="categoria-nova-tipo"]:checked').value;
    if (adicionarCategoria(nome, tipoDespesa)) {
      elementos.categoriaNova.value = '';
      document.getElementById('categoria-nova-variavel').checked = true;
      renderizarCategorias();
    }
  });

  elementos.formCategoria.addEventListener('submit', function(e) {
    e.preventDefault();
    const id = elementos.categoriaId.value;
    const nome = elementos.categoriaNome.value.trim();
    const tipoDespesa = document.querySelector('input[name="categoria-tipo-despesa"]:checked').value;
    if (editarCategoria(id, nome, tipoDespesa)) {
      fecharModalEditarCategoria();
    }
  });

  elementos.btnCancelarCategoria.addEventListener('click', fecharModalEditarCategoria);
  elementos.categoriaModalClose.addEventListener('click', fecharModalEditarCategoria);

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

  // NOVO: Gerenciar Recorrências
  elementos.gerenciarRecorrencias.addEventListener('click', abrirModalRecorrencias);
  elementos.recorrenciasModalClose.addEventListener('click', fecharModalRecorrencias);
  elementos.formRecorrencia.addEventListener('submit', salvarRecorrencia);

  // Fechar modais ao clicar fora
  window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
  window.addEventListener('storage', function(e) {
    if (e.key === 'sonhos-objetivos' || e.key === 'sonhos-fundos') {
      if (estado.abaAtiva === 'fundos') {
        renderizarFundosSonhos();
      }
    }
  });
});