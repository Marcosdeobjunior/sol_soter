document.addEventListener('DOMContentLoaded', () => {

    class NotificationManager {
        constructor() {
            this.bell = document.getElementById('notification-bell');
            this.countBadge = document.getElementById('notification-count');
            this.panel = document.getElementById('notification-panel');
            this.list = document.getElementById('notification-list');

            if (!this.bell) return; // Não executa se os elementos não existirem na página

            this.notifications = [];
            this.bindEvents();
            this.fetchAllNotifications();
        }

        bindEvents() {
            this.bell.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePanel();
            });

            // Fecha o painel se clicar fora
            document.addEventListener('click', (e) => {
                if (!this.panel.contains(e.target)) {
                    this.closePanel();
                }
            });
        }

        togglePanel() {
            this.panel.classList.toggle('active');
        }
        
        closePanel() {
            this.panel.classList.remove('active');
        }

        // Função principal que reúne todas as fontes de notificação
        async fetchAllNotifications() {
            // Limpa a lista antes de buscar novas
            this.notifications = [];

            // Combina os resultados de todas as fontes
            const metas = this.getMetasNotifications();
            const tarefas = this.getTarefasNotifications();
            const financas = this.getFinancasNotifications();
            const conquistas = this.getConquistasNotifications();

            this.notifications = [...metas, ...tarefas, ...financas, ...conquistas];
            
            // Ordena as notificações, talvez por data (a ser implementado se houver datas)
            // Por enquanto, a ordem de busca é mantida.

            this.render();
        }
        
        /**
         * Busca por metas com prazo se aproximando.
         */
        getMetasNotifications() {
            const metas = JSON.parse(localStorage.getItem('metas-objetivos')) || [];
            const notifications = [];
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            
            // Considerar "próximo" como 7 dias
            const umaSemanaEmMs = 7 * 24 * 60 * 60 * 1000;

            metas
                .filter(meta => meta.prazo && meta.status !== 'concluida')
                .forEach(meta => {
                    const prazo = new Date(meta.prazo + 'T00:00:00');
                    const diff = prazo.getTime() - hoje.getTime();

                    if (diff >= 0 && diff <= umaSemanaEmMs) {
                        const diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24));
                        notifications.push({
                            icon: 'fa-bullseye',
                            type: 'meta',
                            text: `A meta "${meta.titulo}" vence em ${diasRestantes} dia(s).`,
                            timestamp: `Prazo: ${prazo.toLocaleDateString('pt-BR')}`
                        });
                    }
                });
            return notifications;
        }

        /**
         * Busca por tarefas agendadas para hoje.
         */
        getTarefasNotifications() {
            const tarefas = JSON.parse(localStorage.getItem('sol-de-soter-tasks')) || [];
            const notifications = [];
            const hojeFormatado = new Date().toISOString().slice(0, 10); // Formato YYYY-MM-DD

            tarefas
                .filter(tarefa => tarefa.date === hojeFormatado && !tarefa.completed)
                .forEach(tarefa => {
                    notifications.push({
                        icon: 'fa-tasks',
                        type: 'tarefa',
                        text: `Tarefa para hoje: "${tarefa.title}".`,
                        timestamp: `Prioridade: ${tarefa.priority || 'N/A'}`
                    });
                });
            return notifications;
        }

        /**
         * Busca por contas a pagar próximas (EXEMPLO).
         * TODO: Adapte esta função à estrutura de dados do seu sistema de finanças.
         */
        getFinancasNotifications() {
            // Supondo que você tenha um item 'financeiro-contas' no localStorage
            const contas = JSON.parse(localStorage.getItem('financeiro-contas')) || [];
            const notifications = [];
            // Lógica similar à de metas para verificar prazos de contas
            // ...
            
            // Exemplo estático:
            // notifications.push({
            //     icon: 'fa-file-invoice-dollar',
            //     type: 'financa',
            //     text: 'Conta de Luz vence em 3 dias.',
            //     timestamp: 'Vencimento: 04/10/2025'
            // });

            return notifications;
        }

        /**
         * Busca por novas conquistas (EXEMPLO).
         * TODO: Adapte esta função à estrutura de dados do seu sistema de gamificação.
         */
        getConquistasNotifications() {
            // Supondo que você tenha um item 'gamificacao-conquistas' no localStorage
            const conquistas = JSON.parse(localStorage.getItem('gamificacao-conquistas')) || [];
            const notifications = [];
            // Lógica para verificar conquistas não visualizadas
            // ...

            // Exemplo estático:
            // notifications.push({
            //     icon: 'fa-trophy',
            //     type: 'conquista',
            //     text: 'Você alcançou o Nível 5 - Mestre Planejador!',
            //     timestamp: 'Hoje'
            // });

            return notifications;
        }

        render() {
            // Atualiza o contador
            const count = this.notifications.length;
            if (count > 0) {
                this.countBadge.textContent = count;
                this.countBadge.style.display = 'flex';
            } else {
                this.countBadge.style.display = 'none';
            }

            // Limpa a lista atual
            this.list.innerHTML = '';

            // Renderiza as notificações ou o estado de vazio
            if (count === 0) {
                this.list.innerHTML = `
                    <li class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Nenhuma notificação nova</p>
                    </li>
                `;
            } else {
                this.notifications.forEach(notif => {
                    const item = document.createElement('li');
                    item.className = 'notification-item';
                    item.innerHTML = `
                        <div class="notification-icon ${notif.type}">
                            <i class="fas ${notif.icon}"></i>
                        </div>
                        <div class="notification-content">
                            <p>${notif.text}</p>
                            <span>${notif.timestamp}</span>
                        </div>
                    `;
                    this.list.appendChild(item);
                });
            }
        }
    }

    // Inicializa o gerenciador de notificações
    new NotificationManager();
});