// ===== GERENCIAMENTO AVANÇADO DE SONHOS E OBJETIVOS =====

class SonhosManager {
    constructor() {
        this.sonhos = this.carregarSonhos();
        this.metas = this.carregarMetas();
        this.conquistas = this.carregarConquistas();
        this.gamificacao = this.carregarGamificacao();
        this.notificacoes = this.carregarNotificacoes();
        this.sonhoEditando = null;
        this.metaEditando = null;
        this.charts = {};

        // ===== INÍCIO DA MELHORIA: ESTADOS DE FILTRO =====
        this.filtroCategoria = 'todas';
        this.filtroPrioridade = 'todas';
        this.ordenacao = 'recente';
        // ===== FIM DA MELHORIA =====
        
        this.inicializar();
    }

    inicializar() {
        this.configurarEventListeners();
        // Atualizar progresso de todos os sonhos na inicialização
        this.sonhos.forEach(sonho => this.atualizarProgressoAutomaticoSonho(sonho.id));
        this.salvarSonhos(); // Salva os progressos atualizados
        
        this.atualizarEstatisticas();
        this.renderizarSonhos();
        this.renderizarMetas();
        this.renderizarConquistas();
        this.renderizarGamificacao();
        this.atualizarSelectSonhos();
        this.inicializarCharts();
        this.verificarNotificacoes();
        this.iniciarVerificacaoPeriodicaNotificacoes();
    }

    // ===== GERENCIAMENTO DE DADOS =====
    carregarSonhos() {
        const dados = localStorage.getItem('sonhos-objetivos');
        return dados ? JSON.parse(dados) : [];
    }

    salvarSonhos() {
        localStorage.setItem('sonhos-objetivos', JSON.stringify(this.sonhos));
        this.atualizarEstatisticas();
        this.atualizarSelectSonhos();
        this.atualizarCharts();
    }

    carregarMetas() {
        const dados = localStorage.getItem('metas-objetivos');
        return dados ? JSON.parse(dados) : [];
    }

    salvarMetas() {
        localStorage.setItem('metas-objetivos', JSON.stringify(this.metas));
        this.atualizarEstatisticas();
        this.atualizarCharts();
    }

    carregarConquistas() {
        const dados = localStorage.getItem('conquistas-objetivos');
        return dados ? JSON.parse(dados) : [];
    }

    salvarConquistas() {
        localStorage.setItem('conquistas-objetivos', JSON.stringify(this.conquistas));
    }

    carregarGamificacao() {
        const dados = localStorage.getItem('gamificacao-objetivos');
        return dados ? JSON.parse(dados) : {
            nivel: 1,
            xp: 0,
            pontosSonhos: 0,
            pontosMetas: 0,
            sequenciaDias: 0,
            ultimaAtividade: null,
            badges: []
        };
    }

    salvarGamificacao() {
        localStorage.setItem('gamificacao-objetivos', JSON.stringify(this.gamificacao));
        this.renderizarGamificacao();
    }

    carregarNotificacoes() {
        const dados = localStorage.getItem('notificacoes-objetivos');
        return dados ? JSON.parse(dados) : {
            lembretes: true,
            prazosProximos: true,
            conquistas: true,
            ultimaVerificacao: null
        };
    }

    salvarNotificacoes() {
        localStorage.setItem('notificacoes-objetivos', JSON.stringify(this.notificacoes));
    }

    // ===== EVENT LISTENERS =====
    configurarEventListeners() {
// Botões principais
	        document.getElementById('btn-novo-sonho').addEventListener('click', () => this.abrirModalSonho());
	        document.getElementById('btn-nova-meta').addEventListener('click', () => this.abrirModalMeta());
	        document.getElementById('btn-refresh-charts').addEventListener('click', () => this.atualizarCharts());

	        // Delegação de eventos para os botões dos cards de sonhos e metas
	        document.getElementById('sonhos-grid').addEventListener('click', (e) => this.handleSonhoCardAction(e));
	        document.getElementById('metas-list').addEventListener('click', (e) => this.handleMetaCardAction(e));

	        // Formulários
        document.getElementById('form-sonho').addEventListener('submit', (e) => this.salvarSonho(e));
        document.getElementById('form-meta').addEventListener('submit', (e) => this.salvarMeta(e));

        // Abas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.trocarAba(e.target.dataset.tab));
        });

	        // Fechar modais ao clicar fora
	        document.addEventListener('click', (e) => {
	            if (e.target.classList.contains('modal')) {
	                fecharModais();
	            }
	        });
	
	        // Tecla ESC para fechar modais
	        document.addEventListener('keydown', (e) => {
	            if (e.key === 'Escape') {
	                fecharModais();
	            }
	        });

        // O Accordion de Metas será tratado dentro de handleMetaCardAction para evitar conflito com os botões.
	        // Se o clique não for um botão de ação, ele pode ser o header do accordion.
	        // A função handleMetaCardAction será responsável por isso.

        // ===== INÍCIO DA MELHORIA: LISTENERS DOS FILTROS =====
        document.getElementById('filtro-categoria').addEventListener('change', (e) => {
            this.filtroCategoria = e.target.value;
            this.renderizarSonhos();
        });

        document.getElementById('filtro-prioridade').addEventListener('change', (e) => {
            this.filtroPrioridade = e.target.value;
            this.renderizarSonhos();
        });

        document.getElementById('ordenacao-sonhos').addEventListener('change', (e) => {
            this.ordenacao = e.target.value;
            this.renderizarSonhos();
        });
        // ===== FIM DA MELHORIA =====
	    }

	    // ===== HANDLERS DE AÇÃO DE CARD (NOVO) =====
	    handleSonhoCardAction(e) {
	        const btn = e.target.closest('.btn-icon');
	        if (!btn) return;

	        const card = e.target.closest('.sonho-card');
	        if (!card) return;
	        
	        // O ID agora está no atributo data-sonho-id do botão ou do card pai
	        const sonhoId = btn.dataset.sonhoId || card.dataset.sonhoId;
	        
	        if (!sonhoId) {
	            console.error('ID do Sonho não encontrado no card ou botão.');
	            return;
	        }

	        if (btn.classList.contains('edit')) {
	            const sonho = this.sonhos.find(s => s.id === sonhoId);
	            if (sonho) this.abrirModalSonho(sonho);
	        } else if (btn.classList.contains('complete')) {
	            this.concluirSonho(sonhoId);
	        } else if (btn.title === 'Ajustar Progresso Manual') {
	            this.ajustarProgresso(sonhoId);
	        } else if (btn.classList.contains('delete')) {
	            this.excluirSonho(sonhoId);
	        }
	    }

	    handleMetaCardAction(e) {
	        const btn = e.target.closest('.btn-icon');
	        const header = e.target.closest('.metas-grupo-header');

	        // 1. Tratar o clique no header do accordion
	        if (header && !btn) {
	            this.toggleMetaAccordion(header);
	            return;
	        }
	        
	        if (!btn) return;

	        const item = e.target.closest('.meta-item');
	        if (!item) return;

	        // O ID agora está no atributo data-meta-id do botão ou do item pai
	        const metaId = btn.dataset.metaId || item.dataset.metaId;
	        
	        if (!metaId) {
	            console.error('ID da Meta não encontrado no card ou botão.');
	            return;
	        }
	        
	        const meta = this.metas.find(m => m.id === metaId);
	        if (!meta) return;


	        if (btn.classList.contains('edit')) {
	            this.abrirModalMeta(meta);
	        } else if (btn.classList.contains('delete')) {
	            this.excluirMeta(metaId);
	        } else if (btn.title === 'Iniciar' || btn.title === 'Retomar') {
	            this.alterarStatusMeta(metaId, 'progresso');
	        } else if (btn.title === 'Concluir') {
	            this.alterarStatusMeta(metaId, 'concluida');
	        } else if (btn.title === 'Pausar') {
	            this.alterarStatusMeta(metaId, 'pausada');
	        }
	    }
	    // ===== FIM DOS HANDLERS DE AÇÃO DE CARD =====


	    // ===== GERENCIAMENTO DE ABAS =====
    trocarAba(aba) {
        // Atualizar botões
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${aba}"]`).classList.add('active');

        // Atualizar conteúdo
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`tab-${aba}`).classList.add('active');

        // Renderizar conteúdo específico se necessário
        if (aba === 'sonhos') {
            this.renderizarSonhos();
        } else if (aba === 'metas') {
            this.renderizarMetas();
        } else if (aba === 'conquistas') {
            this.renderizarConquistas();
        } else if (aba === 'gamificacao') {
            this.renderizarGamificacao();
        }
    }

    // ===== ESTATÍSTICAS =====
    atualizarEstatisticas() {
        const totalSonhos = this.sonhos.filter(s => !s.concluido).length;
        const sonhosConcluidos = this.sonhos.filter(s => s.concluido).length;
        const metasAtivas = this.metas.filter(m => m.status !== 'concluida').length;
        
        // Calcular progresso médio (agora baseado nos progressos automáticos e manuais)
        const sonhosAtivosComProgresso = this.sonhos.filter(s => !s.concluido);
        const progressoMedio = sonhosAtivosComProgresso.length > 0 
            ? Math.round(sonhosAtivosComProgresso.reduce((acc, s) => acc + s.progresso, 0) / sonhosAtivosComProgresso.length)
            : 0;

        document.getElementById('total-sonhos').textContent = totalSonhos;
        document.getElementById('sonhos-concluidos').textContent = sonhosConcluidos;
        document.getElementById('progresso-medio').textContent = `${progressoMedio}%`;
        document.getElementById('metas-ativas').textContent = metasAtivas;
    }

    // ===== GRÁFICOS E VISUALIZAÇÕES =====
    inicializarCharts() {
        this.criarChartCategorias();
        this.criarChartStatus();
        this.criarChartPrazos();
        this.criarChartEvolucao();
    }

    criarChartCategorias() {
        const ctx = document.getElementById('chart-categorias').getContext('2d');
        
        // Contar sonhos por categoria
        const categorias = {};
        this.sonhos.forEach(sonho => {
            categorias[sonho.categoria] = (categorias[sonho.categoria] || 0) + 1;
        });

        const cores = ['#89b4fa', '#a6e3a1', '#f38ba8', '#fab387', '#f5c2e7', '#cba6f7', '#94e2d5', '#f9e2af'];
        
        this.charts.categorias = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categorias).map(cat => this.getNomeCategoria(cat)),
                datasets: [{
                    data: Object.values(categorias),
                    backgroundColor: cores.slice(0, Object.keys(categorias).length),
                    borderWidth: 2,
                    borderColor: '#1e1e2e'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#cdd6f4',
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    }

    criarChartStatus() {
        const ctx = document.getElementById('chart-status').getContext('2d');
        
        const pendentes = this.sonhos.filter(s => !s.concluido && s.progresso === 0).length;
        const emProgresso = this.sonhos.filter(s => !s.concluido && s.progresso > 0).length;
        const concluidos = this.sonhos.filter(s => s.concluido).length;

        this.charts.status = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Pendentes', 'Em Progresso', 'Concluídos'],
                datasets: [{
                    data: [pendentes, emProgresso, concluidos],
                    backgroundColor: ['#fab387', '#89b4fa', '#a6e3a1'],
                    borderWidth: 2,
                    borderColor: '#1e1e2e'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#cdd6f4',
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    }

    criarChartPrazos() {
        const ctx = document.getElementById('chart-prazos').getContext('2d');
        
        const hoje = new Date();
        const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate());
        const proximosTresMeses = new Date(hoje.getFullYear(), hoje.getMonth() + 3, hoje.getDate());

        const metasProximoMes = this.metas.filter(m => {
            if (!m.prazo || m.status === 'concluida') return false;
            const prazo = new Date(m.prazo);
            return prazo <= proximoMes;
        }).length;

        const metasProximosTresMeses = this.metas.filter(m => {
            if (!m.prazo || m.status === 'concluida') return false;
            const prazo = new Date(m.prazo);
            return prazo > proximoMes && prazo <= proximosTresMeses;
        }).length;

        const metasLongoPrazo = this.metas.filter(m => {
            if (!m.prazo || m.status === 'concluida') return false;
            const prazo = new Date(m.prazo);
            return prazo > proximosTresMeses;
        }).length;

        this.charts.prazos = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Próximo Mês', 'Próximos 3 Meses', 'Longo Prazo'],
                datasets: [{
                    label: 'Metas por Prazo',
                    data: [metasProximoMes, metasProximosTresMeses, metasLongoPrazo],
                    backgroundColor: ['#f38ba8', '#fab387', '#a6e3a1'],
                    borderWidth: 1,
                    borderColor: '#1e1e2e'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#cdd6f4',
                            stepSize: 1
                        },
                        grid: {
                            color: '#45475a'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#cdd6f4'
                        },
                        grid: {
                            color: '#45475a'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    criarChartEvolucao() {
        const ctx = document.getElementById('chart-evolucao').getContext('2d');
        
        // Simular dados de evolução mensal (últimos 6 meses)
        const meses = [];
        const sonhosConcluidos = [];
        const metasConcluidas = [];
        
        for (let i = 5; i >= 0; i--) {
            const data = new Date();
            data.setMonth(data.getMonth() - i);
            meses.push(data.toLocaleDateString('pt-BR', { month: 'short' }));
            
            // Contar conquistas do mês
            const inicioMes = new Date(data.getFullYear(), data.getMonth(), 1);
            const fimMes = new Date(data.getFullYear(), data.getMonth() + 1, 0);
            
            const sonhosMes = this.sonhos.filter(s => {
                if (!s.dataConclusao) return false;
                const dataConclusao = new Date(s.dataConclusao);
                return dataConclusao >= inicioMes && dataConclusao <= fimMes;
            }).length;
            
            const metasMes = this.metas.filter(m => {
                if (!m.dataConclusao) return false;
                const dataConclusao = new Date(m.dataConclusao);
                return dataConclusao >= inicioMes && dataConclusao <= fimMes;
            }).length;
            
            sonhosConcluidos.push(sonhosMes);
            metasConcluidas.push(metasMes);
        }

        this.charts.evolucao = new Chart(ctx, {
            type: 'line',
            data: {
                labels: meses,
                datasets: [
                    {
                        label: 'Sonhos Realizados',
                        data: sonhosConcluidos,
                        borderColor: '#89b4fa',
                        backgroundColor: 'rgba(137, 180, 250, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Metas Concluídas',
                        data: metasConcluidas,
                        borderColor: '#a6e3a1',
                        backgroundColor: 'rgba(166, 227, 161, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#cdd6f4',
                            stepSize: 1
                        },
                        grid: {
                            color: '#45475a'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#cdd6f4'
                        },
                        grid: {
                            color: '#45475a'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#cdd6f4',
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    }

    atualizarCharts() {
        // Destruir gráficos existentes
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        
        // Recriar gráficos
        this.inicializarCharts();
        
        this.mostrarNotificacao('Gráficos atualizados!', 'sucesso');
    }

    // ===== GERENCIAMENTO DE SONHOS =====
    abrirModalSonho(sonho = null) {
        this.sonhoEditando = sonho;
        const modal = document.getElementById('modal-sonho');
        const form = document.getElementById('form-sonho');
        const title = document.getElementById('modal-title');

        if (sonho) {
            title.textContent = 'Editar Sonho';
            this.preencherFormularioSonho(sonho);
        } else {
            title.textContent = 'Novo Sonho';
            form.reset();
        }

        modal.classList.add('active');
        document.getElementById('sonho-titulo').focus();
    }

	    fecharModalSonho() {
	        document.getElementById('modal-sonho').classList.remove('active');
	        this.sonhoEditando = null;
	    }

    preencherFormularioSonho(sonho) {
        document.getElementById('sonho-titulo').value = sonho.titulo;
        document.getElementById('sonho-descricao').value = sonho.descricao || '';
        document.getElementById('sonho-categoria').value = sonho.categoria;
        document.getElementById('sonho-prioridade').value = sonho.prioridade;
        document.getElementById('sonho-prazo').value = sonho.prazo || '';
        document.getElementById('sonho-custo').value = sonho.custo || '';
    }

    salvarSonho(e) {
        e.preventDefault();
        
        const dados = {
            titulo: document.getElementById('sonho-titulo').value.trim(),
            descricao: document.getElementById('sonho-descricao').value.trim(),
            categoria: document.getElementById('sonho-categoria').value,
            prioridade: document.getElementById('sonho-prioridade').value,
            prazo: document.getElementById('sonho-prazo').value,
            custo: parseFloat(document.getElementById('sonho-custo').value) || 0,
            progresso: 0, // Será 0 no início (ou recalculado se for edição)
            concluido: false,
            dataCriacao: new Date().toISOString(),
            dataAtualizacao: new Date().toISOString()
        };

        if (!dados.titulo) {
            this.mostrarNotificacao('Por favor, preencha o título do sonho.', 'erro');
            return;
        }

        if (this.sonhoEditando) {
            // Editar sonho existente
            const index = this.sonhos.findIndex(s => s.id === this.sonhoEditando.id);
            // Mantém o progresso existente se for edição, pois ele é controlado pelas metas
            dados.progresso = this.sonhoEditando.progresso; 
            this.sonhos[index] = { ...this.sonhoEditando, ...dados, dataAtualizacao: new Date().toISOString() };
            // Recalcula o progresso caso as metas já existam
            this.atualizarProgressoAutomaticoSonho(this.sonhoEditando.id);
        } else {
            // Criar novo sonho
            dados.id = Date.now().toString();
            this.sonhos.push(dados);
            
            // Adicionar XP por criar sonho
            this.adicionarXP(10, 'Novo sonho criado!');
        }

        this.salvarSonhos();
        this.renderizarSonhos();
        this.fecharModalSonho();
        
        this.mostrarNotificacao(this.sonhoEditando ? 'Sonho atualizado com sucesso!' : 'Sonho criado com sucesso!', 'sucesso');
    }

    excluirSonho(id) {
        if (confirm('Tem certeza que deseja excluir este sonho? Esta ação não pode ser desfeita.')) {
            this.sonhos = this.sonhos.filter(s => s.id !== id);
            // Remover metas relacionadas
            this.metas = this.metas.filter(m => m.sonhoId !== id);
            
            this.salvarSonhos();
            this.salvarMetas();
            this.renderizarSonhos();
            this.renderizarMetas();
            
            this.mostrarNotificacao('Sonho excluído com sucesso!', 'sucesso');
        }
    }

    // Função para conclusão MANUAL (chamada pelo botão)
    concluirSonho(id) {
        const sonho = this.sonhos.find(s => s.id === id);
        if (!sonho) return;

        // Verificação de segurança: este botão só deve funcionar para sonhos SEM metas
        const metasDoSonho = this.metas.filter(m => m.sonhoId === id).length;
        
        if (metasDoSonho > 0) {
            this.mostrarNotificacao('Este sonho é concluído automaticamente ao completar todas as metas.', 'aviso');
            return;
        }

        if (confirm(`Parabéns! Deseja marcar "${sonho.titulo}" como realizado?`)) {
            sonho.concluido = true;
            sonho.progresso = 100;
            sonho.dataConclusao = new Date().toISOString();

            // Adicionar às conquistas
            this.adicionarConquista({
                tipo: 'sonho',
                titulo: `Sonho Realizado: ${sonho.titulo}`,
                descricao: sonho.descricao || 'Parabéns por realizar este sonho!',
                data: new Date().toISOString(),
                icone: 'star'
            });

            // Sistema de gamificação
            const pontosGanhos = this.calcularPontosSonho(sonho);
            this.gamificacao.pontosSonhos += pontosGanhos;
            this.adicionarXP(pontosGanhos, `Sonho realizado! +${pontosGanhos} pontos`);
            this.verificarBadges();

            this.salvarSonhos();
            this.salvarGamificacao();
            this.renderizarSonhos();
            this.renderizarConquistas();
            this.renderizarGamificacao();
            
            this.mostrarNotificacao('🎉 Parabéns! Sonho realizado!', 'sucesso');
        }
    }

    // ===== NOVA FUNÇÃO =====
    // Função para conclusão AUTOMÁTICA (chamada pelo sistema)
    marcarSonhoComoConcluidoAutomaticamente(id) {
        const sonho = this.sonhos.find(s => s.id === id);
        if (!sonho || sonho.concluido) return; // Não fazer nada se já estiver concluído

        sonho.concluido = true;
        sonho.progresso = 100;
        sonho.dataConclusao = new Date().toISOString();

        // Adicionar às conquistas
        this.adicionarConquista({
            tipo: 'sonho',
            titulo: `Sonho Realizado: ${sonho.titulo}`,
            descricao: `Concluído automaticamente ao completar todas as ${this.metas.filter(m => m.sonhoId === id).length} metas!`,
            data: new Date().toISOString(),
            icone: 'star'
        });

        // Sistema de gamificação
        const pontosGanhos = this.calcularPontosSonho(sonho);
        this.gamificacao.pontosSonhos += pontosGanhos;
        this.adicionarXP(pontosGanhos, `Sonho realizado! +${pontosGanhos} pontos`);
        this.verificarBadges();

        this.salvarSonhos();
        this.salvarGamificacao();
        this.renderizarSonhos();
        this.renderizarConquistas();
        this.renderizarGamificacao();
        
        this.mostrarNotificacao(`🎉 Parabéns! Sonho "${sonho.titulo}" realizado automaticamente!`, 'sucesso');
    }

    // ===== LÓGICA DE PROGRESSO ATUALIZADA =====
    atualizarProgressoAutomaticoSonho(sonhoId) {
        const sonho = this.sonhos.find(s => s.id === sonhoId);
        if (!sonho) return;

        const metasDoSonho = this.metas.filter(m => m.sonhoId === sonhoId);
        
        if (metasDoSonho.length > 0) {
            const metasConcluidas = metasDoSonho.filter(m => m.status === 'concluida').length;
            const novoProgresso = Math.round((metasConcluidas / metasDoSonho.length) * 100);
            
            if (sonho.progresso !== novoProgresso) {
                 const progressoAnterior = sonho.progresso;
                 sonho.progresso = novoProgresso;
                 sonho.dataAtualizacao = new Date().toISOString();
                 
                 // Adicionar XP por progresso
                if (sonho.progresso > progressoAnterior) {
                    const xpGanho = Math.floor((sonho.progresso - progressoAnterior) / 10);
                    if (xpGanho > 0) {
                        this.adicionarXP(xpGanho, `Progresso em "${sonho.titulo}"`);
                    }
                }
                
                this.salvarSonhos();
                this.salvarGamificacao();
            }

            // ===== NOVA LÓGICA DE CONCLUSÃO AUTOMÁTICA =====
            if (novoProgresso === 100 && !sonho.concluido) {
                this.marcarSonhoComoConcluidoAutomaticamente(sonhoId);
            }
            // ===== FIM DA NOVA LÓGICA =====

        }
        // Se não houver metas, o progresso permanece manual (como definido em ajustarProgresso ou 0)
    }

    // Função SÓ para progresso MANUAL
    atualizarProgressoSonho(id, novoProgresso) {
        const sonho = this.sonhos.find(s => s.id === id);
        if (sonho) {
            const progressoAnterior = sonho.progresso;
            sonho.progresso = Math.max(0, Math.min(100, novoProgresso));
            sonho.dataAtualizacao = new Date().toISOString();
            
            // Adicionar XP por progresso
            if (sonho.progresso > progressoAnterior) {
                const xpGanho = Math.floor((sonho.progresso - progressoAnterior) / 10);
                if (xpGanho > 0) {
                    this.adicionarXP(xpGanho, `Progresso em "${sonho.titulo}"`);
                }
            }
            
            this.salvarSonhos();
            this.salvarGamificacao();
            this.renderizarSonhos();
        }
    }

    renderizarSonhos() {
        const container = document.getElementById('sonhos-grid');
        const emptyState = document.getElementById('empty-sonhos');
        
        // ===== LÓGICA DE FILTRO E ORDENAÇÃO (Existente) =====
        
        let sonhosFiltrados = this.sonhos.filter(s => !s.concluido);

        // 1. Aplicar Filtro de Categoria
        if (this.filtroCategoria !== 'todas') {
            sonhosFiltrados = sonhosFiltrados.filter(s => s.categoria === this.filtroCategoria);
        }

        // 2. Aplicar Filtro de Prioridade
        if (this.filtroPrioridade !== 'todas') {
            sonhosFiltrados = sonhosFiltrados.filter(s => s.prioridade === this.filtroPrioridade);
        }

        // 3. Aplicar Ordenação
        const prioridadeValor = { 'alta': 3, 'media': 2, 'baixa': 1 };
        
        switch (this.ordenacao) {
            case 'recente':
                sonhosFiltrados.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
                break;
            case 'prazo':
                sonhosFiltrados.sort((a, b) => {
                    if (!a.prazo) return 1;
                    if (!b.prazo) return -1;
                    return new Date(a.prazo) - new Date(b.prazo);
                });
                break;
            case 'prioridade':
                sonhosFiltrados.sort((a, b) => (prioridadeValor[b.prioridade] || 0) - (prioridadeValor[a.prioridade] || 0));
                break;
            case 'progresso':
                sonhosFiltrados.sort((a, b) => b.progresso - a.progresso);
                break;
        }
        
        const sonhosAtivos = sonhosFiltrados; 
        
        // ===== FIM DA LÓGICA DE FILTRO =====
        
        if (sonhosAtivos.length === 0) {
            container.innerHTML = ''; // Limpa o grid
            container.style.display = 'none';
            emptyState.style.display = 'block';
            // Ajusta a mensagem do estado vazio se filtros estiverem ativos
            if (this.sonhos.filter(s => !s.concluido).length > 0) {
                emptyState.querySelector('h3').textContent = 'Nenhum sonho encontrado';
                emptyState.querySelector('p').textContent = 'Tente ajustar seus filtros ou cadastre um novo sonho!';
                emptyState.querySelector('button').style.display = 'none';
            } else {
                 emptyState.querySelector('h3').textContent = 'Nenhum sonho cadastrado';
                 emptyState.querySelector('p').textContent = 'Comece criando seu primeiro sonho e transforme-o em realidade!';
                 emptyState.querySelector('button').style.display = 'inline-flex';
            }
            return;
        }

        container.style.display = 'grid';
        emptyState.style.display = 'none';

        container.innerHTML = sonhosAtivos.map(sonho => this.criarCardSonho(sonho)).join('');
    }

    // ===== FUNÇÃO DE RENDERIZAÇÃO DE CARD ATUALIZADA =====
    criarCardSonho(sonho) {
        const prazoFormatado = sonho.prazo ? new Date(sonho.prazo).toLocaleDateString('pt-BR') : 'Sem prazo';
        const custoFormatado = sonho.custo > 0 ? `R$ ${sonho.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
        
        // ===== NOVAS VARIÁVEIS DE METAS =====
        const metasDoSonho = this.metas.filter(m => m.sonhoId === sonho.id);
        const totalMetas = metasDoSonho.length;
        const metasConcluidas = metasDoSonho.filter(m => m.status === 'concluida').length;

	        // Botão de progresso manual (só aparece se não houver metas)
	        const botaoProgressoManual = `
	            <button class="btn-icon" data-sonho-id="${sonho.id}" title="Ajustar Progresso Manual">
	                <i class="fas fa-sliders-h"></i>
	            </button>
	        `;
	
	        // Botão de conclusão manual (só aparece se não houver metas)
	        const botaoConcluirManual = `
	            <button class="btn-icon complete" data-sonho-id="${sonho.id}" title="Marcar como Realizado">
	                <i class="fas fa-check"></i>
	            </button>
	        `;
        
        // Novo elemento de contador de metas (só aparece se houver metas)
        const infoMetas = `
            <div class="sonho-metas-info">
                <i class="fas fa-bullseye"></i>
                <span>Metas: ${metasConcluidas} / ${totalMetas}</span>
            </div>
        `;
        // ===== FIM DAS NOVAS VARIÁVEIS =====

        return `
	            <div class="sonho-card" data-sonho-id="${sonho.id}">
                <div class="sonho-header">
                    <div class="sonho-categoria categoria-${sonho.categoria}">${this.getNomeCategoria(sonho.categoria)}</div>
                    <h3 class="sonho-titulo">${sonho.titulo}</h3>
                    ${sonho.descricao ? `<p class="sonho-descricao">${sonho.descricao}</p>` : ''}
                </div>
                <div class="sonho-body">
                    <div class="sonho-info">
                        <span class="sonho-prazo">📅 ${prazoFormatado}</span>
                        <span class="sonho-prioridade prioridade-${sonho.prioridade}">${this.getNomePrioridade(sonho.prioridade)}</span>
                    </div>
                    ${custoFormatado ? `<div class="sonho-custo">💰 ${custoFormatado}</div>` : ''}
                    
	                    ${totalMetas > 0 ? infoMetas : ''}
	                    <div class="sonho-progresso">
                        <div class="progresso-label">
                            <span>Progresso ${totalMetas > 0 ? '(Auto)' : ''}</span>
                            <span>${sonho.progresso}%</span>
                        </div>
                        <div class="progresso-bar">
                            <div class="progresso-fill" style="width: ${sonho.progresso}%"></div>
                        </div>
                    </div>
                    <div class="sonho-actions">
	                        <button class="btn-icon edit" data-sonho-id="${sonho.id}" title="Editar">
	                            <i class="fas fa-edit"></i>
	                        </button>
	                        
	                        ${totalMetas === 0 ? botaoProgressoManual : ''}
	                        ${totalMetas === 0 ? botaoConcluirManual : ''}
	                        <button class="btn-icon delete" data-sonho-id="${sonho.id}" title="Excluir">
	                            <i class="fas fa-trash"></i>
	                        </button>
                    </div>
                </div>
            </div>
        `;
    }


    ajustarProgresso(id) {
        // Esta função agora só é chamada se não houver metas
        const sonho = this.sonhos.find(s => s.id === id);
        if (sonho) {
            const novoProgresso = prompt(`Qual o progresso atual de "${sonho.titulo}"? (0-100)`, sonho.progresso);
            if (novoProgresso !== null) {
                const progresso = parseInt(novoProgresso);
                if (!isNaN(progresso) && progresso >= 0 && progresso <= 100) {
                    this.atualizarProgressoSonho(id, progresso); // Chama a função de progresso manual
                } else {
                    this.mostrarNotificacao('Por favor, insira um valor entre 0 e 100.', 'erro');
                }
            }
        }
    }

    // ===== GERENCIAMENTO DE METAS =====
    abrirModalMeta(meta = null) {
        this.metaEditando = meta;
        const modal = document.getElementById('modal-meta');
        const form = document.getElementById('form-meta');

        if (meta) {
            this.preencherFormularioMeta(meta);
        } else {
            form.reset();
        }

        modal.classList.add('active');
        document.getElementById('meta-sonho').focus();
    }

    fecharModalMeta() {
        document.getElementById('modal-meta').classList.remove('active');
        this.metaEditando = null;
    }

    preencherFormularioMeta(meta) {
        document.getElementById('meta-sonho').value = meta.sonhoId;
        document.getElementById('meta-titulo').value = meta.titulo;
        document.getElementById('meta-descricao').value = meta.descricao || '';
        document.getElementById('meta-prazo').value = meta.prazo;
        document.getElementById('meta-tipo').value = meta.tipo;
    }

    salvarMeta(e) {
        e.preventDefault();
        
        const dados = {
            sonhoId: document.getElementById('meta-sonho').value,
            titulo: document.getElementById('meta-titulo').value.trim(),
            descricao: document.getElementById('meta-descricao').value.trim(),
            prazo: document.getElementById('meta-prazo').value,
            tipo: document.getElementById('meta-tipo').value,
            status: 'pendente',
            dataCriacao: new Date().toISOString(),
            dataAtualizacao: new Date().toISOString()
        };

        if (!dados.sonhoId || !dados.titulo || !dados.prazo) {
            this.mostrarNotificacao('Por favor, preencha todos os campos obrigatórios.', 'erro');
            return;
        }

        if (this.metaEditando) {
            // Editar meta existente
            const index = this.metas.findIndex(m => m.id === this.metaEditando.id);
            this.metas[index] = { ...this.metaEditando, ...dados, dataAtualizacao: new Date().toISOString() };
        } else {
            // Criar nova meta
            dados.id = Date.now().toString();
            this.metas.push(dados);
            
            // Adicionar XP por criar meta
            this.adicionarXP(5, 'Nova meta criada!');
        }

        this.salvarMetas();
        this.salvarGamificacao();
        
        // ===== ATUALIZAR PROGRESSO E RENDERIZAR SONHOS =====
        this.atualizarProgressoAutomaticoSonho(dados.sonhoId);
        this.renderizarSonhos(); // Atualiza a grid de sonhos (progresso)
        // ===== FIM DA ATUALIZAÇÃO =====

        this.renderizarMetas(); // Atualiza a lista de metas
        this.fecharModalMeta();
        
        this.mostrarNotificacao(this.metaEditando ? 'Meta atualizada com sucesso!' : 'Meta criada com sucesso!', 'sucesso');
    }

    toggleMetaAccordion(header) {
        const content = header.nextElementSibling;
        const icon = header.querySelector('.fas');

        if (content.style.maxHeight) {
            // Fechar
            content.style.maxHeight = null;
            header.classList.remove('active');
            icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
        } else {
            // Abrir
            content.style.maxHeight = content.scrollHeight + "px";
            header.classList.add('active');
            icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
        }
    }

    alterarStatusMeta(id, novoStatus) {
        const meta = this.metas.find(m => m.id === id);
	        if (meta) {
	            // Se o status for 'progresso' e o novo status for 'progresso', não faz nada
	            if (meta.status === 'progresso' && novoStatus === 'progresso') return;
	            
	            meta.status = novoStatus;
	            meta.dataAtualizacao = new Date().toISOString();
	            
	            if (novoStatus === 'concluida') {
                meta.dataConclusao = new Date().toISOString();
                
                // Adicionar às conquistas
                this.adicionarConquista({
                    tipo: 'meta',
                    titulo: `Meta Concluída: ${meta.titulo}`,
                    descricao: meta.descricao || 'Parabéns por concluir esta meta!',
                    data: new Date().toISOString(),
                    icone: 'bullseye'
                });

                // Sistema de gamificação
                const pontosGanhos = this.calcularPontosMeta(meta);
                this.gamificacao.pontosMetas += pontosGanhos;
                this.adicionarXP(pontosGanhos, `Meta concluída! +${pontosGanhos} pontos`);
                this.verificarBadges();
                
                this.salvarGamificacao();
            }
            
            this.salvarMetas();

            // ===== ATUALIZAR PROGRESSO E RENDERIZAR SONHOS =====
            this.atualizarProgressoAutomaticoSonho(meta.sonhoId);
            this.renderizarSonhos(); // Atualiza a grid de sonhos (progresso)
            // ===== FIM DA ATUALIZAÇÃO =====

            this.renderizarMetas();
            this.renderizarConquistas();
            this.renderizarGamificacao();
        }
    }

    excluirMeta(id) {
        if (confirm('Tem certeza que deseja excluir esta meta?')) {
            // ===== CAPTURAR SONHOID ANTES DE EXCLUIR =====
            const meta = this.metas.find(m => m.id === id);
            const sonhoId = meta ? meta.sonhoId : null;
            // ===== FIM DA CAPTURA =====

            this.metas = this.metas.filter(m => m.id !== id);
            this.salvarMetas();

            // ===== ATUALIZAR PROGRESSO E RENDERIZAR SONHOS =====
            if (sonhoId) {
                this.atualizarProgressoAutomaticoSonho(sonhoId);
                this.renderizarSonhos(); // Atualiza a grid de sonhos (progresso)
            }
            // ===== FIM DA ATUALIZAÇÃO =====
            
            this.renderizarMetas();
            this.mostrarNotificacao('Meta excluída com sucesso!', 'sucesso');
        }
    }

    renderizarMetas() {
        const container = document.getElementById('metas-list');
        const emptyState = document.getElementById('empty-metas');
        
        if (this.metas.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'block';
        emptyState.style.display = 'none';

        // Agrupar metas por sonho E calcular estatísticas
        const metasPorSonho = this.metas.reduce((acc, meta) => {
            const sonho = this.sonhos.find(s => s.id === meta.sonhoId);
            const sonhoTitulo = sonho ? sonho.titulo : 'Sonho não encontrado';
            
            if (!acc[sonhoTitulo]) {
                acc[sonhoTitulo] = {
                    metas: [],
                    total: 0,
                    concluidas: 0
                };
            }
            
            acc[sonhoTitulo].metas.push(meta);
            acc[sonhoTitulo].total++;
            if (meta.status === 'concluida') {
                acc[sonhoTitulo].concluidas++;
            }
            
            return acc;
        }, {});

        // Ordenar metas dentro de cada grupo (concluídas por último)
        Object.values(metasPorSonho).forEach(grupo => {
            grupo.metas.sort((a, b) => {
                if (a.status === 'concluida' && b.status !== 'concluida') return 1;
                if (a.status !== 'concluida' && b.status === 'concluida') return -1;
                return new Date(a.prazo) - new Date(b.prazo); // Ordenar por prazo
            });
        });

        container.innerHTML = Object.entries(metasPorSonho).map(([sonhoTitulo, dados]) => `
            <div class="metas-grupo">
                <button class="metas-grupo-header">
                    <div class="metas-header-titulo">
                        <i class="fas fa-chevron-right"></i>
                        ${sonhoTitulo}
                    </div>
                    <span class="metas-header-summary">
                        ${dados.concluidas} / ${dados.total} metas
                    </span>
                </button>
                <div class="metas-grupo-content">
                    ${dados.metas.map(meta => this.criarItemMeta(meta)).join('')}
                </div>
            </div>
        `).join('');
    }

    criarItemMeta(meta) {
        const prazoFormatado = new Date(meta.prazo).toLocaleDateString('pt-BR');
        const statusClass = `status-${meta.status}`;
        const statusTexto = this.getNomeStatus(meta.status);
        
        return `
	            <div class="meta-item" data-meta-id="${meta.id}">
                <div class="meta-header">
                    <div class="meta-info">
                        <h4>${meta.titulo}</h4>
                        <span class="meta-sonho-ref">${this.getNomeTipo(meta.tipo)}</span>
                    </div>
                    <div class="meta-status ${statusClass}">${statusTexto}</div>
                </div>
                ${meta.descricao ? `<p class="meta-descricao">${meta.descricao}</p>` : ''}
                <div class="meta-footer">
                    <span class="meta-prazo">📅 ${prazoFormatado}</span>
                    <div class="meta-actions">
	                        ${meta.status !== 'concluida' ? `
	                            ${meta.status === 'progresso' ? `
	                                <button class="btn-icon pause" data-meta-id="${meta.id}" title="Pausar">
	                                    <i class="fas fa-pause"></i>
	                                </button>
	                            ` : ''}
	                            <button class="btn-icon" data-meta-id="${meta.id}" title="${meta.status === 'progresso' ? 'Concluir' : meta.status === 'pausada' ? 'Retomar' : 'Iniciar'}">
	                                <i class="fas fa-${meta.status === 'progresso' ? 'check' : meta.status === 'pausada' ? 'redo' : 'play'}"></i>
	                            </button>
	                        ` : ''}
	                        <button class="btn-icon edit" data-meta-id="${meta.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
	                        <button class="btn-icon delete" data-meta-id="${meta.id}" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    atualizarSelectSonhos() {
        const select = document.getElementById('meta-sonho');
        const sonhosAtivos = this.sonhos.filter(s => !s.concluido);
        
        select.innerHTML = '<option value="">Selecione um sonho</option>' + 
            sonhosAtivos.map(sonho => `<option value="${sonho.id}">${sonho.titulo}</option>`).join('');
    }

    // ===== CONQUISTAS =====
    adicionarConquista(conquista) {
        conquista.id = Date.now().toString();
        this.conquistas.unshift(conquista); // Adicionar no início
        this.salvarConquistas();
        
        // Mostrar notificação de conquista
        this.mostrarNotificacao(`🏆 ${conquista.titulo}`, 'sucesso');
    }

    renderizarConquistas() {
        const container = document.getElementById('conquistas-timeline');
        const emptyState = document.getElementById('empty-conquistas');
        
        if (this.conquistas.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'block';
        emptyState.style.display = 'none';

        container.innerHTML = this.conquistas.map(conquista => `
            <div class="conquista-item">
                <div class="conquista-icon">
                    <i class="fas fa-${conquista.icone}"></i>
                </div>
                <div class="conquista-content">
                    <h4 class="conquista-titulo">${conquista.titulo}</h4>
                    <p class="conquista-data">${new Date(conquista.data).toLocaleDateString('pt-BR')}</p>
                    <p class="conquista-descricao">${conquista.descricao}</p>
                </div>
            </div>
        `).join('');
    }

    // ===== SISTEMA DE GAMIFICAÇÃO =====
    adicionarXP(quantidade, motivo) {
        this.gamificacao.xp += quantidade;
        
        // Verificar se subiu de nível
        const nivelAnterior = this.gamificacao.nivel;
        const novoNivel = this.calcularNivel(this.gamificacao.xp);
        
        if (novoNivel > nivelAnterior) {
            this.gamificacao.nivel = novoNivel;
            this.mostrarNotificacao(`🎉 Parabéns! Você subiu para o nível ${novoNivel}!`, 'sucesso');
            
            // Adicionar conquista de nível
            this.adicionarConquista({
                tipo: 'nivel',
                titulo: `Nível ${novoNivel} Alcançado!`,
                descricao: `Você alcançou o nível ${novoNivel} com ${this.gamificacao.xp} XP total.`,
                data: new Date().toISOString(),
                icone: 'trophy'
            });
        }
        
        // Atualizar sequência de dias
        this.atualizarSequenciaDias();
        
        this.salvarGamificacao();
    }

    calcularNivel(xp) {
        // Cada nível requer 100 XP a mais que o anterior
        return Math.floor(xp / 100) + 1;
    }

    calcularXPProximoNivel(nivel) {
        return nivel * 100;
    }

    calcularPontosSonho(sonho) {
        let pontos = 50; // Base
        
        // Bônus por prioridade
        if (sonho.prioridade === 'alta') pontos += 20;
        else if (sonho.prioridade === 'media') pontos += 10;
        
        // Bônus por categoria
        if (sonho.categoria === 'profissional' || sonho.categoria === 'educacao') pontos += 15;
        
        return pontos;
    }

    calcularPontosMeta(meta) {
        let pontos = 20; // Base
        
        // Bônus por tipo
        if (meta.tipo === 'habito') pontos += 10;
        else if (meta.tipo === 'resultado') pontos += 15;
        
        return pontos;
    }

    atualizarSequenciaDias() {
        const hoje = new Date().toDateString();
        const ultimaAtividade = this.gamificacao.ultimaAtividade;
        
        if (ultimaAtividade) {
            const ultimaData = new Date(ultimaAtividade).toDateString();
            const ontem = new Date();
            ontem.setDate(ontem.getDate() - 1);
            
            if (ultimaData === hoje) {
                // Já teve atividade hoje, não alterar sequência
                return;
            } else if (ultimaData === ontem.toDateString()) {
                // Atividade ontem, continuar sequência
                this.gamificacao.sequenciaDias += 1;
            } else {
                // Quebrou a sequência
                this.gamificacao.sequenciaDias = 1;
            }
        } else {
            // Primeira atividade
            this.gamificacao.sequenciaDias = 1;
        }
        
        this.gamificacao.ultimaAtividade = new Date().toISOString();
    }

    verificarBadges() {
        const badges = [
            {
                id: 'primeiro_sonho',
                nome: 'Primeiro Sonho',
                descricao: 'Criou seu primeiro sonho',
                icone: 'star',
                condicao: () => this.sonhos.length >= 1
            },
            {
                id: 'sonhador_dedicado',
                nome: 'Sonhador Dedicado',
                descricao: 'Criou 5 sonhos',
                icone: 'heart',
                condicao: () => this.sonhos.length >= 5
            },
            {
                id: 'realizador',
                nome: 'Realizador',
                descricao: 'Concluiu seu primeiro sonho',
                icone: 'trophy',
                condicao: () => this.sonhos.filter(s => s.concluido).length >= 1
            },
            {
                id: 'mestre_dos_sonhos',
                nome: 'Mestre dos Sonhos',
                descricao: 'Concluiu 10 sonhos',
                icone: 'crown',
                condicao: () => this.sonhos.filter(s => s.concluido).length >= 10
            },
            {
                id: 'planejador',
                nome: 'Planejador',
                descricao: 'Criou 10 metas',
                icone: 'bullseye',
                condicao: () => this.metas.length >= 10
            },
            {
                id: 'persistente',
                nome: 'Persistente',
                descricao: 'Manteve sequência de 7 dias',
                icone: 'fire',
                condicao: () => this.gamificacao.sequenciaDias >= 7
            },
            {
                id: 'nivel_5',
                nome: 'Experiente',
                descricao: 'Alcançou o nível 5',
                icone: 'medal',
                condicao: () => this.gamificacao.nivel >= 5
            }
        ];

        badges.forEach(badge => {
            if (badge.condicao() && !this.gamificacao.badges.includes(badge.id)) {
                this.gamificacao.badges.push(badge.id);
                
                // Adicionar conquista de badge
                this.adicionarConquista({
                    tipo: 'badge',
                    titulo: `Distintivo Conquistado: ${badge.nome}`,
                    descricao: badge.descricao,
                    data: new Date().toISOString(),
                    icone: badge.icone
                });
            }
        });
    }

    renderizarGamificacao() {
        // Atualizar informações de nível
        document.getElementById('nivel-badge').textContent = this.gamificacao.nivel;
        document.getElementById('xp-atual').textContent = this.gamificacao.xp;
        
        const xpProximoNivel = this.calcularXPProximoNivel(this.gamificacao.nivel);
        document.getElementById('xp-proximo').textContent = xpProximoNivel;
        
        const xpAtualNivel = this.gamificacao.xp - ((this.gamificacao.nivel - 1) * 100);
        const porcentagemXP = (xpAtualNivel / 100) * 100;
        document.getElementById('xp-fill').style.width = `${porcentagemXP}%`;
        
        // Atualizar pontuação
        document.getElementById('pontos-sonhos').textContent = this.gamificacao.pontosSonhos;
        document.getElementById('pontos-metas').textContent = this.gamificacao.pontosMetas;
        document.getElementById('sequencia-dias').textContent = this.gamificacao.sequenciaDias;
        
        // Renderizar badges
        this.renderizarBadges();
    }

    renderizarBadges() {
        const container = document.getElementById('badges-grid');
        const emptyState = document.getElementById('empty-badges');
        
        const todosOsBadges = [
            { id: 'primeiro_sonho', nome: 'Primeiro Sonho', icone: 'star' },
            { id: 'sonhador_dedicado', nome: 'Sonhador Dedicado', icone: 'heart' },
            { id: 'realizador', nome: 'Realizador', icone: 'trophy' },
            { id: 'mestre_dos_sonhos', nome: 'Mestre dos Sonhos', icone: 'crown' },
            { id: 'planejador', nome: 'Planejador', icone: 'bullseye' },
            { id: 'persistente', nome: 'Persistente', icone: 'fire' },
            { id: 'nivel_5', nome: 'Experiente', icone: 'medal' }
        ];

        if (this.gamificacao.badges.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'grid';
        emptyState.style.display = 'none';

        container.innerHTML = todosOsBadges.map(badge => {
            const conquistado = this.gamificacao.badges.includes(badge.id);
            return `
                <div class="badge-item ${conquistado ? 'conquistado' : ''}">
                    <div class="badge-icon">
                        <i class="fas fa-${badge.icone}"></i>
                    </div>
                    <div class="badge-nome">${badge.nome}</div>
                </div>
            `;
        }).join('');
    }

    // ===== NOTIFICAÇÕES E LEMBRETES =====
    verificarNotificacoes() {
        const hoje = new Date();
        const proximaSemana = new Date();
        proximaSemana.setDate(hoje.getDate() + 7);

        // Verificar metas próximas do prazo
        const metasProximas = this.metas.filter(meta => {
            if (meta.status === 'concluida' || !meta.prazo) return false;
            const prazo = new Date(meta.prazo);
            return prazo <= proximaSemana && prazo >= hoje;
        });

        metasProximas.forEach(meta => {
            const diasRestantes = Math.ceil((new Date(meta.prazo) - hoje) / (1000 * 60 * 60 * 24));
            this.mostrarNotificacao(
                `⏰ Meta "${meta.titulo}" vence em ${diasRestantes} dia(s)!`,
                'aviso'
            );
        });

        // Verificar sonhos sem progresso há muito tempo
        const sonhosSemProgresso = this.sonhos.filter(sonho => {
            if (sonho.concluido) return false;
            const ultimaAtualizacao = new Date(sonho.dataAtualizacao);
            const diasSemAtualizacao = (hoje - ultimaAtualizacao) / (1000 * 60 * 60 * 24);
            return diasSemAtualizacao > 7;
        });

        if (sonhosSemProgresso.length > 0) {
            this.mostrarNotificacao(
                `💭 Você tem ${sonhosSemProgresso.length} sonho(s) sem progresso há mais de uma semana.`,
                'aviso'
            );
        }
    }

    iniciarVerificacaoPeriodicaNotificacoes() {
        // Verificar notificações a cada 30 minutos
        setInterval(() => {
            this.verificarNotificacoes();
        }, 30 * 60 * 1000);
    }

    mostrarNotificacao(mensagem, tipo = 'sucesso') {
        // Criar container se não existir
        let container = document.querySelector('.notificacoes-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notificacoes-container';
            document.body.appendChild(container);
        }

        // Criar elemento de notificação
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao-item ${tipo}`;
        notificacao.innerHTML = `
            <div class="notificacao-header">
                <div class="notificacao-titulo">${tipo === 'sucesso' ? 'Sucesso' : tipo === 'aviso' ? 'Aviso' : 'Erro'}</div>
                <button class="notificacao-fechar" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notificacao-texto">${mensagem}</div>
        `;

        container.appendChild(notificacao);

        // Remover após 5 segundos
        setTimeout(() => {
            if (notificacao.parentNode) {
                notificacao.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notificacao.parentNode) {
                        notificacao.parentNode.removeChild(notificacao);
                    }
                }, 300);
            }
        }, 5000);
    }

    // ===== COMPARTILHAMENTO SOCIAL =====
    gerarMensagemCompartilhamento() {
        const sonhosConcluidos = this.sonhos.filter(s => s.concluido).length;
        const metasConcluidas = this.metas.filter(m => m.status === 'concluida').length;
        const nivel = this.gamificacao.nivel;
        
        return `🌟 Acabei de alcançar o nível ${nivel} no Sol de Sóter! 
📈 ${sonhosConcluidos} sonhos realizados e ${metasConcluidas} metas concluídas!
💪 Transformando sonhos em realidade, um passo de cada vez! #SolDeSoter #Objetivos #Conquistas`;
    }

    // ===== UTILITÁRIOS =====
    getNomeCategoria(categoria) {
        const categorias = {
            pessoal: 'Pessoal',
            profissional: 'Profissional',
            financeiro: 'Financeiro',
            saude: 'Saúde',
            relacionamento: 'Relacionamento',
            educacao: 'Educação',
            viagem: 'Viagem',
            hobby: 'Hobby'
        };
        return categorias[categoria] || categoria;
    }

    getNomePrioridade(prioridade) {
        const prioridades = {
            baixa: 'Baixa',
            media: 'Média',
            alta: 'Alta'
        };
        return prioridades[prioridade] || prioridade;
    }

    getNomeStatus(status) {
        const statuses = {
            pendente: 'Pendente',
            progresso: 'Em Progresso',
            concluida: 'Concluída'
        };
        return statuses[status] || status;
    }

    getNomeTipo(tipo) {
        const tipos = {
            acao: 'Ação',
            habito: 'Hábito',
            resultado: 'Resultado'
        };
        return tipos[tipo] || tipo;
    }

    fecharModais() {
        this.fecharModalSonho();
        this.fecharModalMeta();
    }
}

// ===== FUNÇÕES GLOBAIS =====
function abrirModalSonho() {
    sonhosManager.abrirModalSonho();
}

	function fecharModalSonho() {
	    sonhosManager.fecharModalSonho();
	}
	
	function abrirModalMeta() {
	    sonhosManager.abrirModalMeta();
	}
	
	function fecharModalMeta() {
	    sonhosManager.fecharModalMeta();
	}

// ===== FUNÇÕES DE COMPARTILHAMENTO =====
function compartilharTwitter() {
    const mensagem = sonhosManager.gerarMensagemCompartilhamento();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
}

function compartilharFacebook() {
    const mensagem = sonhosManager.gerarMensagemCompartilhamento();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
}

function compartilharWhatsApp() {
    const mensagem = sonhosManager.gerarMensagemCompartilhamento();
    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
}

function copiarLink() {
    const mensagem = sonhosManager.gerarMensagemCompartilhamento();
    navigator.clipboard.writeText(mensagem).then(() => {
        sonhosManager.mostrarNotificacao('Mensagem copiada para a área de transferência!', 'sucesso');
    }).catch(() => {
        sonhosManager.mostrarNotificacao('Erro ao copiar mensagem.', 'erro');
    });
}

	// ===== FUNÇÕES GLOBAIS PARA FECHAMENTO DE MODAIS =====
	function fecharModais() {
	    // Fecha todos os modais
	    document.querySelectorAll('.modal').forEach(modal => {
	        modal.classList.remove('active');
	    });
	    // Limpa o estado de edição
	    if (window.sonhosManager) {
	        window.sonhosManager.sonhoEditando = null;
	        window.sonhosManager.metaEditando = null;
	    }
	}

	// ===== INICIALIZAÇÃO =====
	let sonhosManager; // Mantido para as funções globais abaixo
	
	document.addEventListener('DOMContentLoaded', () => {
	    sonhosManager = new SonhosManager();
	    window.sonhosManager = sonhosManager; // <<< CORREÇÃO APLICADA AQUI
	    
	    // Atualizar saldo global se disponível
	    if (typeof atualizarSaldoGlobal === 'function') {
	        atualizarSaldoGlobal();
	    }
	});

// Atualizar saldo quando dados financeiros mudarem
window.addEventListener('storage', (event) => {
    if (event.key === 'financeiro-widget' && typeof atualizarSaldoGlobal === 'function') {
        atualizarSaldoGlobal();
    }
});