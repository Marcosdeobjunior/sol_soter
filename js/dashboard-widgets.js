// ===== DASHBOARD WIDGETS - ATUALIZAÇÕES DINÂMICAS =====

// Função para atualizar o widget da biblioteca
function atualizarWidgetBiblioteca() {
    const livros = JSON.parse(localStorage.getItem('livrosTracker')) || [];
    
    // Elementos do widget
    const totalLivrosEl = document.getElementById('total-livros');
    const livrosLidosEl = document.getElementById('livros-lidos');
    const ultimoLivroInfo = document.getElementById('ultimo-livro-info');
    const bibliotecaEmpty = document.getElementById('biblioteca-empty');
    
    if (!totalLivrosEl) return; // Se não estiver na página do dashboard, sair
    
    // Estatísticas básicas
    const totalLivros = livros.length;
    const livrosLidos = livros.filter(livro => livro.lido).length;
    
    totalLivrosEl.textContent = totalLivros;
    livrosLidosEl.textContent = livrosLidos;
    
    if (totalLivros === 0) {
        // Nenhum livro na biblioteca
        ultimoLivroInfo.style.display = 'none';
        bibliotecaEmpty.style.display = 'block';
    } else {
        // Encontrar o último livro lido ou em progresso
        const livrosEmProgresso = livros.filter(livro => !livro.lido && livro.paginaAtual > 0);
        const ultimosLivrosLidos = livros.filter(livro => livro.lido).sort((a, b) => {
            const dataA = new Date(a.dataConclusao || a.dataInicio || 0);
            const dataB = new Date(b.dataConclusao || b.dataInicio || 0);
            return dataB - dataA;
        });
        
        let ultimoLivro = null;
        
        // Priorizar livros em progresso, senão o último lido
        if (livrosEmProgresso.length > 0) {
            ultimoLivro = livrosEmProgresso.sort((a, b) => {
                const progressoA = a.paginaAtual / a.totalPaginas;
                const progressoB = b.paginaAtual / b.totalPaginas;
                return progressoB - progressoA; // Maior progresso primeiro
            })[0];
        } else if (ultimosLivrosLidos.length > 0) {
            ultimoLivro = ultimosLivrosLidos[0];
        } else {
            ultimoLivro = livros[livros.length - 1]; // Último adicionado
        }
        
        if (ultimoLivro) {
            // Atualizar informações do último livro
            const capaEl = document.getElementById('ultimo-livro-capa');
            const tituloEl = document.getElementById('ultimo-livro-titulo');
            const autorEl = document.getElementById('ultimo-livro-autor');
            const progressoEl = document.getElementById('ultimo-livro-progresso');
            const progressoTextoEl = document.getElementById('ultimo-livro-progresso-texto');
            
            capaEl.src = ultimoLivro.capaUrl || 'img/default_cover.png';
            capaEl.onerror = function() { this.src = 'img/default_cover.png'; };
            tituloEl.textContent = ultimoLivro.titulo;
            autorEl.textContent = `por ${ultimoLivro.autor}`;
            
            const progresso = ultimoLivro.totalPaginas > 0 ? 
                Math.round((ultimoLivro.paginaAtual / ultimoLivro.totalPaginas) * 100) : 0;
            
            progressoEl.style.width = `${progresso}%`;
            progressoTextoEl.textContent = ultimoLivro.lido ? 'Concluído' : `${progresso}%`;
            
            ultimoLivroInfo.style.display = 'flex';
            bibliotecaEmpty.style.display = 'none';
        } else {
            ultimoLivroInfo.style.display = 'none';
            bibliotecaEmpty.style.display = 'block';
        }
    }
}

// Função para atualizar o widget de planejamento
function atualizarWidgetPlanejamento() {
    // Carregar dados de tarefas, sonhos e metas
    const tarefas = JSON.parse(localStorage.getItem('sol-de-soter-tasks')) || [];
    const sonhos = JSON.parse(localStorage.getItem('sonhos-objetivos')) || [];
    const metas = JSON.parse(localStorage.getItem('metas-objetivos')) || [];
    
    // Elementos do widget
    const totalTarefasEl = document.getElementById('total-tarefas');
    const tarefasPendentesEl = document.getElementById('tarefas-pendentes');
    const proximaTarefaInfo = document.getElementById('proxima-tarefa-info');
    const planejamentoEmpty = document.getElementById('planejamento-empty');
    
    if (!totalTarefasEl) return; // Se não estiver na página do dashboard, sair
    
    // Combinar todos os itens (similar ao planejamento.js)
    const sonhosFormatados = sonhos
        .filter(sonho => sonho.prazo && !sonho.concluido)
        .map(sonho => ({
            id: `sonho-${sonho.id}`,
            titulo: sonho.titulo,
            data: sonho.prazo,
            concluido: sonho.concluido,
            categoria: sonho.categoria,
            tipo: 'sonho'
        }));
    
    const metasFormatadas = metas
        .filter(meta => meta.prazo && meta.status !== 'concluida')
        .map(meta => ({
            id: `meta-${meta.id}`,
            titulo: meta.titulo,
            data: meta.prazo,
            concluido: meta.status === 'concluida',
            categoria: 'meta',
            tipo: 'meta'
        }));
    
    const tarefasFormatadas = tarefas.map(tarefa => ({
        ...tarefa,
        titulo: tarefa.title,
        concluido: tarefa.completed,
        data: tarefa.date,
        tipo: 'tarefa'
    }));
    
    const todosItens = [...tarefasFormatadas, ...sonhosFormatados, ...metasFormatadas];
    
    // Estatísticas
    const totalTarefas = todosItens.length;
    const tarefasPendentes = todosItens.filter(item => !item.concluido).length;
    
    totalTarefasEl.textContent = totalTarefas;
    tarefasPendentesEl.textContent = tarefasPendentes;
    
    if (totalTarefas === 0) {
        proximaTarefaInfo.style.display = 'none';
        planejamentoEmpty.style.display = 'block';
    } else {
        // Encontrar próxima tarefa (não concluída e com data mais próxima)
        const hoje = new Date();
        const tarefasPendentesComData = todosItens
            .filter(item => !item.concluido && item.data)
            .sort((a, b) => {
                const dataA = new Date(a.data);
                const dataB = new Date(b.data);
                return dataA - dataB;
            });
        
        if (tarefasPendentesComData.length > 0) {
            const proximaTarefa = tarefasPendentesComData[0];
            
            const tituloEl = document.getElementById('proxima-tarefa-titulo');
            const dataEl = document.getElementById('proxima-tarefa-data');
            const categoriaEl = document.getElementById('proxima-tarefa-categoria');
            
            tituloEl.textContent = proximaTarefa.titulo;
            
            const dataFormatada = new Date(proximaTarefa.data).toLocaleDateString('pt-BR');
            dataEl.textContent = dataFormatada;
            
            // Mapear categorias
            const categoriasMap = {
                'work': 'Trabalho',
                'personal': 'Pessoal',
                'health': 'Saúde',
                'study': 'Estudos',
                'viagem': 'Viagem',
                'profissional': 'Profissional',
                'financeiro': 'Financeiro',
                'meta': 'Meta',
                'sonho': 'Sonho',
                'tarefa': 'Tarefa'
            };
            
            const categoriaTexto = categoriasMap[proximaTarefa.categoria] || 
                                 categoriasMap[proximaTarefa.tipo] || 'Outros';
            categoriaEl.textContent = categoriaTexto;
            
            proximaTarefaInfo.style.display = 'block';
            planejamentoEmpty.style.display = 'none';
        } else {
            proximaTarefaInfo.style.display = 'none';
            planejamentoEmpty.style.display = 'block';
        }
    }
}

// Função principal para atualizar todos os widgets
function atualizarTodosWidgets() {
    atualizarWidgetBiblioteca();
    atualizarWidgetPlanejamento();
}

// Função global para ser chamada por outras páginas
window.updateDashboard = atualizarTodosWidgets;

// Escutar mudanças no localStorage
window.addEventListener('storage', (e) => {
    if (e.key === 'livrosTracker') {
        atualizarWidgetBiblioteca();
    }
    if (e.key === 'sol-de-soter-tasks' || e.key === 'sonhos-objetivos' || e.key === 'metas-objetivos') {
        atualizarWidgetPlanejamento();
    }
});

// Escutar evento customizado de atualização
window.addEventListener('dashboardUpdate', atualizarTodosWidgets);

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que outros scripts carregaram
    setTimeout(atualizarTodosWidgets, 100);
});

console.log('Dashboard Widgets carregado');
