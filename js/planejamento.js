// ===== PLANEJAMENTO DE TAREFAS - FUNCIONALIDADES ===== //

class TaskPlanner {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        
        // Carrega dados
        this.tasks = this.loadTasks();
        this.sonhos = this.loadSonhos();
        this.metas = this.loadMetas();
        
        // Inicializa propriedades
        this.allItems = [];
        this.getAllItems(); // Popula this.allItems
        
        this.currentFilter = 'all';
        this.currentSearchTerm = ''; // NOVO: Para o campo de busca
        this.editingTaskId = null;
        
        this.init();
    }

    init() {
        this.archiveOldTasks(); // NOVO: Arquiva tarefas antigas ao iniciar
        this.renderCalendar();
        this.renderTasks();
        this.updateStats();
        this.bindEvents();
    }

    // ===== GERENCIAMENTO DE DADOS ===== //
    loadTasks() {
        const saved = localStorage.getItem('sol-de-soter-tasks');
        return saved ? JSON.parse(saved) : [];
    }

    loadSonhos() {
        const dados = localStorage.getItem('sonhos-objetivos');
        return dados ? JSON.parse(dados) : [];
    }
    
    loadMetas() {
        const dados = localStorage.getItem('metas-objetivos');
        return dados ? JSON.parse(dados) : [];
    }

    /**
     * NOVO: Carrega as tarefas arquivadas
     */
    loadArchive() {
        const archive = localStorage.getItem('sol-de-soter-tasks-archive');
        return archive ? JSON.parse(archive) : [];
    }

    // MODIFICADO: Apenas atualiza this.allItems, não retorna
    getAllItems() {
        // Mapeia sonhos para o formato de tarefa
        const sonhosFormatados = this.sonhos
            .filter(sonho => sonho.prazo && !sonho.concluido) // Apenas sonhos com prazo e não concluídos
            .map(sonho => ({
                id: `sonho-${sonho.id}`,
                title: sonho.titulo,
                description: sonho.descricao,
                date: sonho.prazo,
                completed: sonho.concluido,
                category: sonho.categoria,
                priority: sonho.prioridade,
                type: 'sonho' // Adiciona um tipo para diferenciação
            }));

        // Mapeia metas para o formato de tarefa
        const metasFormatadas = this.metas
            .filter(meta => meta.prazo && meta.status !== 'concluida') // Apenas metas com prazo e não concluídas
            .map(meta => ({
                id: `meta-${meta.id}`,
                title: meta.titulo,
                description: meta.descricao,
                date: meta.prazo,
                completed: meta.status === 'concluida',
                category: 'meta', // Categoria genérica
                type: 'meta' // Adiciona um tipo para diferenciação
            }));

        const tarefasComTipo = this.tasks.map(task => ({ ...task, type: 'task' }));

        // Combina tudo e ATUALIZA a propriedade da classe
        this.allItems = [...tarefasComTipo, ...sonhosFormatados, ...metasFormatadas];
    }


    saveTasks() {
        localStorage.setItem('sol-de-soter-tasks', JSON.stringify(this.tasks));
        // Recarrega todos os itens para manter a consistência
        this.getAllItems(); // ATUALIZA this.allItems
        this.updateStats();
        this.renderTasks();
        this.renderCalendar();
    }
    
    // ===== NOVAS FUNÇÕES DE ARQUIVAMENTO ===== //

    /**
     * Arquiva tarefas concluídas há mais de 2 meses.
     * Roda automaticamente na inicialização.
     */
    archiveOldTasks() {
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        const tasksToArchive = this.tasks.filter(task => 
            task.completed && task.completedAt && new Date(task.completedAt) < twoMonthsAgo
        );

        if (tasksToArchive.length > 0) {
            const tasksToKeep = this.tasks.filter(task => 
                !task.completed || !task.completedAt || new Date(task.completedAt) >= twoMonthsAgo
            );
            
            const archive = localStorage.getItem('sol-de-soter-tasks-archive');
            const oldArchive = archive ? JSON.parse(archive) : [];
            const newArchive = [...oldArchive, ...tasksToArchive];
            
            localStorage.setItem('sol-de-soter-tasks-archive', JSON.stringify(newArchive));
            this.tasks = tasksToKeep;
            this.saveTasks(); // Salva as tarefas mantidas e atualiza a UI
            console.log(`Arquivadas ${tasksToArchive.length} tarefas antigas.`);
        }
    }

    /**
     * Arquiva manualmente TODAS as tarefas concluídas.
     * Acionado pelo botão na UI.
     */
    manualArchiveTasks() {
        const tasksToArchive = this.tasks.filter(task => task.completed);

        if (tasksToArchive.length === 0) {
            alert('Nenhuma tarefa concluída para arquivar.');
            return;
        }

        if (confirm(`Arquivar ${tasksToArchive.length} tarefa(s) concluída(s)? Elas sairão da lista principal.`)) {
            const tasksToKeep = this.tasks.filter(task => !task.completed);
            
            const archive = localStorage.getItem('sol-de-soter-tasks-archive');
            const oldArchive = archive ? JSON.parse(archive) : [];
            const newArchive = [...oldArchive, ...tasksToArchive];
            
            localStorage.setItem('sol-de-soter-tasks-archive', JSON.stringify(newArchive));
            this.tasks = tasksToKeep;
            this.saveTasks(); // Salva as tarefas mantidas e atualiza a UI
            alert('Tarefas arquivadas com sucesso.');
        }
    }

    // =========================================== //

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // ===== CALENDÁRIO ===== //
    renderCalendar() {
        const calendar = document.getElementById('calendar');
        const monthYear = document.getElementById('current-month-year');
        
        const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        monthYear.textContent = `${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

        calendar.innerHTML = '';

        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        weekDays.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-header';
            header.textContent = day;
            calendar.appendChild(header);
        });

        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const prevMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 0);
        for (let i = startingDayOfWeek; i > 0; i--) {
            const dayElement = this.createDayElement(
                prevMonth.getDate() - i + 1,
                this.currentDate.getMonth() - 1,
                this.currentDate.getFullYear(),
                true
            );
            calendar.appendChild(dayElement);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = this.createDayElement(
                day,
                this.currentDate.getMonth(),
                this.currentDate.getFullYear(),
                false
            );
            calendar.appendChild(dayElement);
        }

        const totalCells = calendar.children.length - 7;
        const remainingCells = (totalCells > 35 ? 42 : 35) - totalCells;
        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = this.createDayElement(
                day,
                this.currentDate.getMonth() + 1,
                this.currentDate.getFullYear(),
                true
            );
            calendar.appendChild(dayElement);
        }
    }

    createDayElement(day, month, year, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';

        const dayDate = new Date(year, month, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }

        if (this.isSameDay(dayDate, today)) {
            dayElement.classList.add('today');
        }

        if (this.isSameDay(dayDate, this.selectedDate)) {
            dayElement.classList.add('selected');
        }

        // Criar estrutura do dia
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);

        const tasksContainer = document.createElement('div');
        tasksContainer.className = 'calendar-tasks';
        dayElement.appendChild(tasksContainer);

        // Adicionar tarefas do dia
        this.renderCalendarTasks(dayDate, tasksContainer);

        // Eventos
        dayElement.addEventListener('click', (e) => {
            const target = e.target.closest('.calendar-task');
            
            if (target && target.dataset.taskId.startsWith('task-')) {
                // Clique em tarefa (task) abre edição
                const taskId = target.dataset.taskId.replace('task-', '');
                this.editTask(taskId);
            } else if (target && target.dataset.taskId.startsWith('sonho-')) {
                // Clique em sonho navega
                this.navigateToItem('sonho', target.dataset.taskId);
            } else if (target && target.dataset.taskId.startsWith('meta-')) {
                // Clique em meta navega
                this.navigateToItem('meta', target.dataset.taskId);
            } else {
                // Clique no dia
                this.selectDate(dayDate);
                if (e.detail === 2) {
                    this.openTaskModal();
                }
            }
        });

        return dayElement;
    }
    
    // MODIFICADO: Adiciona classe de tipo ao item no calendário
    renderCalendarTasks(date, container) {
        const tasksForDay = this.getTasksForDate(date);
        const maxVisible = 3;
        
        container.innerHTML = '';
        
        tasksForDay.slice(0, maxVisible).forEach(item => {
            const taskElement = document.createElement('div');
            
            // Define o ID correto com base no tipo
            let dataId = item.id;
            if (item.type === 'task') {
                dataId = `task-${item.id}`;
            }

            // Adiciona classe específica para sonho, meta ou tarefa
            taskElement.className = `calendar-task calendar-task-${item.type} ${item.completed ? 'completed' : ''} ${item.priority ? item.priority + '-priority' : 'no-priority'}`;
            taskElement.textContent = item.title;
            taskElement.dataset.taskId = dataId; // Usa o ID com prefixo
            taskElement.title = item.description || item.title;
            container.appendChild(taskElement);
        });

        if (tasksForDay.length > maxVisible) {
            const moreElement = document.createElement('div');
            moreElement.className = 'calendar-more-tasks';
            moreElement.textContent = `+${tasksForDay.length - maxVisible} mais`;
            container.appendChild(moreElement);
        }
    }


    selectDate(date) {
        this.selectedDate = new Date(date);
        this.selectedDate.setHours(0, 0, 0, 0);
        this.renderCalendar();
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    // ===== GERENCIAMENTO DE TAREFAS ===== //
    addTask(taskData) {
        const task = {
            id: this.generateId(),
            ...taskData,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        
        if (task.recurring && task.recurringType && task.date) {
            this.createRecurringTasks(task);
        }
        
        this.saveTasks();
    }

    createRecurringTasks(baseTask) {
        const startDate = new Date(baseTask.date + 'T00:00:00');
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);

        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            switch (baseTask.recurringType) {
                case 'daily':
                    currentDate.setDate(currentDate.getDate() + 1);
                    break;
                case 'weekly':
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                case 'monthly':
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    break;
                case 'yearly':
                    currentDate.setFullYear(currentDate.getFullYear() + 1);
                    break;
            }

            if (currentDate <= endDate) {
                const recurringTask = {
                    ...baseTask,
                    id: this.generateId(),
                    date: this.formatDate(currentDate),
                    parentTaskId: baseTask.id,
                    createdAt: new Date().toISOString()
                };
                this.tasks.push(recurringTask);
            }
        }
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    updateTask(id, taskData) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex > -1) {
            const oldTask = this.tasks[taskIndex];
            this.tasks[taskIndex] = {
                ...oldTask,
                ...taskData,
                updatedAt: new Date().toISOString()
            };

            if (taskData.recurring && taskData.recurringType && !oldTask.recurring && taskData.date) {
                this.createRecurringTasks(this.tasks[taskIndex]);
            }
            else if (!taskData.recurring && oldTask.recurring) {
                this.tasks = this.tasks.filter(task => task.parentTaskId !== id);
            }

            this.saveTasks();
        }
    }

    deleteTask(id) {
        // Lógica original: Exclui a tarefa E todas as recorrências filhas
        this.tasks = this.tasks.filter(task => task.id !== id && task.parentTaskId !== id);
        this.saveTasks();
    }

    // MODIFICADO: Gerencia conclusão de tarefas, sonhos e metas
    toggleTaskCompletion(id) {
        if (id.startsWith('sonho-')) {
            this.toggleSonhoCompletion(id);
        } else if (id.startsWith('meta-')) {
            this.toggleMetaCompletion(id);
        } else {
            // Lógica original para tarefas
            const task = this.tasks.find(task => task.id === id);
            if (task) {
                task.completed = !task.completed;
                task.completedAt = task.completed ? new Date().toISOString() : null;
                this.saveTasks();
            }
        }
    }

    // NOVA FUNÇÃO: Concluir Sonho
    toggleSonhoCompletion(id) {
        const originalId = id.replace('sonho-', '');
        const sonho = this.sonhos.find(s => s.id == originalId); // Comparação solta para '1' vs 1
        if (!sonho) return;
        
        // Inverte o status
        sonho.concluido = !sonho.concluido;
        localStorage.setItem('sonhos-objetivos', JSON.stringify(this.sonhos));

        // Força recarga e re-render
        this.sonhos = this.loadSonhos(); // Recarrega do storage
        this.getAllItems(); // Reconstrói allItems
        this.renderTasks();
        this.renderCalendar();
        this.updateStats();
    }

    // NOVA FUNÇÃO: Concluir Meta
    toggleMetaCompletion(id) {
        const originalId = id.replace('meta-', '');
        const meta = this.metas.find(m => m.id == originalId); // Comparação solta
        if (!meta) return;

        // Inverte o status
        meta.status = meta.status === 'concluida' ? 'pendente' : 'concluida'; // Assumindo status
        localStorage.setItem('metas-objetivos', JSON.stringify(this.metas));

        // Força recarga e re-render
        this.metas = this.loadMetas(); // Recarrega do storage
        this.getAllItems(); // Reconstrói allItems
        this.renderTasks();
        this.renderCalendar();
        this.updateStats();
    }
    
    // MODIFICADO: Usa a lista combinada (allItems) e aplica busca E ARQUIVAMENTO
    getFilteredTasks() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let filtered = [];

        switch (this.currentFilter) {
            case 'pending':
                filtered = this.allItems.filter(task => !task.completed);
                break;
            case 'completed':
                filtered = this.allItems.filter(task => task.completed);
                break;
            case 'today':
                filtered = this.allItems.filter(task => {
                    if (!task.date) return false;
                    const taskDate = new Date(task.date + 'T00:00:00');
                    return this.isSameDay(taskDate, today);
                });
                break;
            case 'no-date':
                filtered = this.allItems.filter(task => !task.date);
                break;
            // NOVO CASO: Carrega os arquivados
            case 'archived':
                filtered = this.loadArchive();
                break;
            default:
                filtered = [...this.allItems];
        }
        
        // NOVO: Aplicar filtro de pesquisa
        if (this.currentSearchTerm) {
            filtered = filtered.filter(item => {
                const title = item.title || '';
                const description = item.description || '';
                return title.toLowerCase().includes(this.currentSearchTerm) ||
                       description.toLowerCase().includes(this.currentSearchTerm);
            });
        }

        return filtered;
    }

    // MODIFICADO: Usa a lista combinada (allItems)
    getTasksForDate(date) {
        // this.allItems = this.getAllItems(); // REMOVIDO: this.allItems é atualizado em saveTasks
        return this.allItems.filter(task => {
            if (!task.date) return false;
            const taskDate = new Date(task.date + 'T00:00:00');
            return this.isSameDay(taskDate, date);
        }).sort((a, b) => {
            if (a.time && b.time) {
                return a.time.localeCompare(b.time);
            }
            if (a.time) return -1;
            if (b.time) return 1;
            
            const priorityOrder = { high: 3, medium: 2, low: 1, '': 0 };
            return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        });
    }

    // ===== RENDERIZAÇÃO ===== //
    // MODIFICADO: Passa o status 'isArchived' para 'createTaskHTML'
    renderTasks() {
        const tasksList = document.getElementById('tasks-list');
        const filteredTasks = this.getFilteredTasks();
        const isArchivedView = (this.currentFilter === 'archived'); // Verifica se está na view de arquivos

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = `<div style="text-align: center; padding: 40px; color: #6c7086;"><i class="fas fa-tasks" style="font-size: 3rem; margin-bottom: 15px;"></i><p>Nenhum item encontrado</p></div>`;
            return;
        }

        filteredTasks.sort((a, b) => {
            // Em arquivos, ordena por data de conclusão (se existir), mais recentes primeiro
            if (isArchivedView) {
                const dateA = a.completedAt ? new Date(a.completedAt) : new Date(0);
                const dateB = b.completedAt ? new Date(b.completedAt) : new Date(0);
                return dateB - dateA;
            }

            // Lógica de ordenação original para tarefas ativas
            if (!a.date && b.date) return 1;
            if (a.date && !b.date) return -1;
            if (!a.date && !b.date) {
                const priorityOrder = { high: 3, medium: 2, low: 1, '': 0 };
                return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            }

            const dateA = new Date(a.date + (a.time ? `T${a.time}` : 'T00:00:00'));
            const dateB = new Date(b.date + (b.time ? `T${b.time}` : 'T00:00:00'));
            
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA - dateB;
            }
            
            const priorityOrder = { high: 3, medium: 2, low: 1, '': 0 };
            return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        });

        tasksList.innerHTML = filteredTasks.map(task => this.createTaskHTML(task, isArchivedView)).join('');
    }

    // MODIFICADO: Adiciona tag de tipo, evento de clique para sonho/meta, e botões condicionais
    // E agora renderiza um item 'somente leitura' se 'isArchived' for true
    createTaskHTML(item, isArchived = false) {
        let formattedDate = '';
        let formattedTime = item.time || '';
        
        if (item.date) {
            const taskDate = new Date(item.date + 'T00:00:00');
            formattedDate = taskDate.toLocaleDateString("pt-BR");
        }
        
        const categoryLabels = { 
            work: 'Trabalho', 
            personal: 'Pessoal', 
            health: 'Saúde', 
            study: 'Estudos', 
            other: 'Outros',
            viagem: 'Viagem',
            profissional: 'Profissional',
            financeiro: 'Financeiro',
            meta: 'Meta'
        };
        const categoryLabel = categoryLabels[item.category] || 'Outros';

        // Tag para diferenciar o tipo de item
        let typeTag = '';
        if (item.type === 'sonho') {
            typeTag = '<span class="item-type-tag sonho-tag"><i class="fas fa-star"></i> Sonho</span>';
        } else if (item.type === 'meta') {
            typeTag = '<span class="item-type-tag meta-tag"><i class="fas fa-bullseye"></i> Meta</span>';
        }

        const priorityClass = item.priority ? `${item.priority}-priority` : 'no-priority';
        const dateClass = !item.date ? 'no-date' : '';
        
        // Itens arquivados são tratados como 'task' para lógica de botões, e não são clicáveis
        const isTask = item.type === 'task' || isArchived;
        const isClickable = !isArchived && (item.type === 'sonho' || item.type === 'meta');
        const clickHandler = isClickable ? `onclick="taskPlanner.navigateToItem('${item.type}', '${item.id}')"` : '';

        return `
            <div class="task-item ${item.completed ? 'completed' : ''} ${priorityClass} ${dateClass} ${isClickable ? 'clickable' : ''} ${isArchived ? 'is-archived' : ''}" 
                 data-task-id="${item.id}" 
                 ${clickHandler}>
                <div class="task-header">
                    <h4 class="task-title">
                        ${item.title}
                        ${item.recurring ? '<span class="task-recurring"><i class="fas fa-redo"></i></span>' : ''}
                    </h4>
                    <div class="task-actions">
                        ${isArchived ? 
                            `<span class="archived-tag"><i class="fas fa-archive"></i> Arquivada</span>` :
                            `
                            <button class="task-action-btn complete-btn" 
                                    onclick="${isClickable ? 'event.stopPropagation();' : ''} taskPlanner.toggleTaskCompletion('${item.id}')" 
                                    title="${item.completed ? 'Marcar como pendente' : 'Marcar como concluída'}">
                                <i class="fas ${item.completed ? 'fa-undo' : 'fa-check'}"></i>
                            </button>
                            
                            ${isTask ? `
                            <button class="task-action-btn edit-btn" onclick="taskPlanner.editTask('${item.id}')" title="Editar tarefa">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="task-action-btn delete-btn" onclick="taskPlanner.confirmDeleteTask('${item.id}')" title="Excluir tarefa">
                                <i class="fas fa-trash"></i>
                            </button>
                            ` : ''}
                            `
                        }
                    </div>
                </div>
                ${item.description ? `<p class="task-description">${item.description}</p>` : ''}
                <div class="task-meta">
                    <div class="task-datetime">
                        ${typeTag} ${formattedDate ? `<span><i class="fas fa-calendar"></i> ${formattedDate}</span>` : '<span><i class="fas fa-question-circle"></i> Sem data</span>'}
                        ${formattedTime ? `<span><i class="fas fa-clock"></i> ${formattedTime}</span>` : ''}
                    </div>
                    <span class="task-category">${categoryLabel}</span>
                </div>
            </div>
        `;
    }
    
    // NOVA FUNÇÃO: Navegação para Sonhos/Metas
    navigateToItem(type, id) {
        if (type === 'sonho') {
            const originalId = id.replace('sonho-', '');
            // Redireciona para a página de sonhos
            location.href = `sonhos.html?id=${originalId}`;
        } else if (type === 'meta') {
            const originalId = id.replace('meta-', '');
            // Não há página 'metas.html' no nav.
            // Apenas loga no console para evitar um link quebrado.
            console.log(`Navegação para 'meta' id: ${id} (ID original: ${originalId}). Página de destino não definida.`);
            // Se houvesse uma página, seria:
            // location.href = `metas.html?id=${originalId}`;
        }
    }


    // MODIFICADO: Agora inclui tarefas arquivadas nas estatísticas
    updateStats() {
        // 1. Carrega o arquivo de tarefas
        const archivedTasks = this.loadArchive();
        
        // 2. Combina os itens ativos (this.allItems) com as tarefas arquivadas
        //    this.allItems já contém tarefas ativas, sonhos e metas.
        //    As tarefas arquivadas são *apenas* tarefas concluídas que foram removidas de this.tasks.
        const allItemsForStats = [...this.allItems, ...archivedTasks];

        // 3. Calcula as estatísticas com base na lista combinada
        const totalTasks = allItemsForStats.length;
        
        // Itens pendentes são apenas os de this.allItems, pois o arquivo só tem itens concluídos
        const pendingTasks = this.allItems.filter(item => !item.completed).length; 
        
        // O total de concluídos é o total (ativos + arquivados) - pendentes (só ativos)
        const completedTasks = totalTasks - pendingTasks; 
        
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        document.getElementById('total-tasks').textContent = totalTasks;
        document.getElementById('pending-tasks').textContent = pendingTasks;
        document.getElementById('completed-tasks').textContent = completedTasks;
        document.getElementById('completion-rate').textContent = `${completionRate}%`;
    }

    // ===== MODAL E FORMULÁRIO (sem alterações significativas, pois gerencia apenas tarefas) ===== //
    openTaskModal(task = null) {
        const modal = document.getElementById('task-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('task-form');

        if (task) {
            modalTitle.textContent = 'Editar Tarefa';
            this.editingTaskId = task.id;
            this.populateForm(task);
        } else {
            modalTitle.textContent = 'Nova Tarefa';
            this.editingTaskId = null;
            form.reset();
            
            const dateInput = document.getElementById('task-date');
            const year = this.selectedDate.getFullYear();
            const month = (this.selectedDate.getMonth() + 1).toString().padStart(2, '0');
            const day = this.selectedDate.getDate().toString().padStart(2, '0');
            dateInput.value = `${year}-${month}-${day}`;
        }

        modal.classList.add('active');
    }

    closeTaskModal() {
        document.getElementById('task-modal').classList.remove('active');
        this.editingTaskId = null;
    }

    populateForm(task) {
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-date').value = task.date || '';
        document.getElementById('task-time').value = task.time || '';
        document.getElementById('task-priority').value = task.priority || '';
        document.getElementById('task-category').value = task.category;
        document.getElementById('no-date-checkbox').checked = !task.date;
        document.getElementById('recurring-checkbox').checked = task.recurring || false;
        document.getElementById('recurring-type').value = task.recurringType || 'daily';
        
        this.toggleDateField();
        this.toggleRecurringOptions();
    }

    handleFormSubmit(event) {
        event.preventDefault();
        
        const noDate = document.getElementById('no-date-checkbox').checked;
        const recurring = document.getElementById('recurring-checkbox').checked;
        
        const formData = {
            title: document.getElementById('task-title').value.trim(),
            description: document.getElementById('task-description').value.trim(),
            date: noDate ? null : document.getElementById('task-date').value,
            time: document.getElementById('task-time').value,
            priority: document.getElementById('task-priority').value,
            category: document.getElementById('task-category').value,
            recurring: recurring,
            recurringType: recurring ? document.getElementById('recurring-type').value : null
        };

        if (!formData.title) {
            alert('Por favor, preencha o título da tarefa.');
            return;
        }

        if (recurring && !formData.date) {
            alert('Tarefas recorrentes precisam ter uma data inicial.');
            return;
        }

        if (this.editingTaskId) {
            this.updateTask(this.editingTaskId, formData);
        } else {
            this.addTask(formData);
        }

        this.closeTaskModal();
    }

    toggleDateField() {
        const noDateCheckbox = document.getElementById('no-date-checkbox');
        const dateInput = document.getElementById('task-date');
        const timeInput = document.getElementById('task-time');
        
        if (noDateCheckbox.checked) {
            dateInput.disabled = true;
            timeInput.disabled = true;
            dateInput.value = '';
            timeInput.value = '';
        } else {
            dateInput.disabled = false;
            timeInput.disabled = false;
        }
    }

    toggleRecurringOptions() {
        const recurringCheckbox = document.getElementById('recurring-checkbox');
        const recurringOptions = document.getElementById('recurring-options');
        
        if (recurringCheckbox.checked) {
            recurringOptions.style.display = 'block';
        } else {
            recurringOptions.style.display = 'none';
        }
    }

    editTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) this.openTaskModal(task);
    }

    // MODIFICADO: Confirmação mais clara para tarefas recorrentes
    confirmDeleteTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            let message = `Tem certeza que deseja excluir a tarefa "${task.title}"?`;
            
            if (task.recurring) {
                message = `"${task.title}" é uma tarefa base recorrente.\n\nTem certeza que deseja excluir esta tarefa E TODAS as suas futuras instâncias?`;
            } else if (task.parentTaskId) {
                message = `Tem certeza que deseja excluir apenas esta instância da tarefa recorrente "${task.title}"?`;
            }
            
            if (confirm(message)) {
                this.deleteTask(id);
            }
        }
    }

    // MODIFICADO: Chama as funções de visualização
    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        if (filter === 'archived') {
            this.showArchiveView();
        } else {
            this.showActiveView();
        }

        this.renderTasks();
    }

    // NOVA FUNÇÃO: Esconde elementos da UI para a view de arquivos
    showArchiveView() {
        document.getElementById('add-task-btn').style.display = 'none';
        document.getElementById('archive-tasks-btn').style.display = 'none';
        document.querySelector('.calendar-section').style.display = 'none';
        document.querySelector('.stats-section').style.display = 'none';
    }

    // NOVA FUNÇÃO: Mostra elementos da UI para a view ativa
    showActiveView() {
        document.getElementById('add-task-btn').style.display = 'flex';
        document.getElementById('archive-tasks-btn').style.display = 'flex';
        document.querySelector('.calendar-section').style.display = 'block';
        document.querySelector('.stats-section').style.display = 'grid';
    }


    // MODIFICADO: Adiciona listeners para busca e arquivamento
    bindEvents() {
        document.getElementById('prev-month').addEventListener('click', () => this.previousMonth());
        document.getElementById('next-month').addEventListener('click', () => this.nextMonth());
        document.getElementById('add-task-btn').addEventListener('click', () => this.openTaskModal());
        document.getElementById('close-modal').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('cancel-task').addEventListener('click', () => this.closeTaskModal());
        
        document.getElementById('task-modal').addEventListener('click', (e) => {
            if (e.target.id === 'task-modal') this.closeTaskModal();
        });
        
        document.getElementById('task-form').addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn.dataset.filter) { // Garante que o botão de arquivar (sem data-filter) não quebre
                btn.addEventListener('click', () => this.setFilter(btn.dataset.filter));
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeTaskModal();
        });

        document.getElementById('no-date-checkbox').addEventListener('change', () => this.toggleDateField());
        document.getElementById('recurring-checkbox').addEventListener('change', () => this.toggleRecurringOptions());

        // --- NOVOS EVENTOS ---
        document.getElementById('archive-tasks-btn').addEventListener('click', () => this.manualArchiveTasks());
        
        document.getElementById('task-search').addEventListener('input', (e) => {
            this.currentSearchTerm = e.target.value.toLowerCase();
            this.renderTasks();
        });
    }
}

let taskPlanner;
document.addEventListener('DOMContentLoaded', () => {
    taskPlanner = new TaskPlanner();
    if (typeof atualizarSaldoGlobal === 'function') {
        atualizarSaldoGlobal();
    }
});

// MODIFICADO: Listener de storage agora recarrega todos os dados
window.addEventListener('storage', (event) => {
    if (event.key === 'financeiro-widget' && typeof atualizarSaldoGlobal === 'function') {
        atualizarSaldoGlobal();
    }
    
    // Recarrega os dados do planejamento se sonhos, metas ou tarefas forem alterados
    if (event.key === 'sonhos-objetivos' || event.key === 'metas-objetivos' || event.key === 'sol-de-soter-tasks' || event.key === 'sol-de-soter-tasks-archive') {
        if(taskPlanner) {
            taskPlanner.tasks = taskPlanner.loadTasks(); // Recarrega tudo
            taskPlanner.sonhos = taskPlanner.loadSonhos();
            taskPlanner.metas = taskPlanner.loadMetas();
            taskPlanner.getAllItems(); // Reconstrói allItems
            taskPlanner.renderCalendar();
            taskPlanner.renderTasks();
            taskPlanner.updateStats();
        }
    }
});