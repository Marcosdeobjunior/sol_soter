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

// --- LÓGICA PRINCIPAL DE ESTUDOS ---
document.addEventListener('DOMContentLoaded', () => {
  // --- REFERÊNCIAS DO DOM ---
  const studyForm = document.getElementById('study-form');
  const formTitle = document.getElementById('form-title');
  const topicIdInput = document.getElementById('topic-id');
  const topicNameInput = document.getElementById('topic-name');
  const topicCourseInput = document.getElementById('topic-course');
  const topicPriorityInput = document.getElementById('topic-priority');
  const topicDescInput = document.getElementById('topic-desc');
  const submitBtn = document.getElementById('submit-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');

  const searchBox = document.getElementById('search-box');
  const todayList = document.getElementById('today-reviews-list');
  const upcomingList = document.getElementById('upcoming-reviews-list');
  const startSessionBtn = document.getElementById('start-session-btn'); // NOVO

  const modal = document.getElementById('study-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const exitSessionBtn = document.getElementById('exit-session-btn'); // NOVO
  const flashcard = document.getElementById('flashcard');
  const modalTopicName = document.getElementById('modal-topic-name');
  const modalTopicCourse = document.getElementById('modal-topic-course');
  const modalTopicDesc = document.getElementById('modal-topic-desc');
  
  const toastElement = document.getElementById('toast-notification');

  // --- CONSTANTES ---
  const STORAGE_KEY = 'studyPlannerTopics';
  // Intervalos de revisão (em dias)
  const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60, 90, 180];
  const MASTER_LEVEL = 5; // Nível considerado "mestre"

  // --- ESTADO DA SESSÃO (NOVO) ---
  let reviewSessionQueue = [];
  let currentSessionIndex = 0;
  let isSessionActive = false;
  let topicsTodayGlobal = []; // Armazena os tópicos de hoje

  // --- BANCO DE DADOS (LocalStorage) ---
  const getTopics = () => {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  };

  const saveTopics = (topics) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
    // Dispara um evento de storage para que o 'planejamento.js' possa ouvir
    window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: JSON.stringify(topics)
    }));
  };

  // --- FUNÇÕES PRINCIPAIS ---

  /**
   * Atualiza o dashboard de estatísticas
   */
  const updateStats = (topics) => {
    const statTotal = document.getElementById('stat-total-topics');
    const statToday = document.getElementById('stat-today-reviews');
    const statMastered = document.getElementById('stat-mastered-topics');
    const statAvg = document.getElementById('stat-avg-level');
    
    if (!statTotal) return; 

    const totalTopics = topics.length;
    
    const hoje = getStartOfDate(new Date());
    const todayReviewsCount = topics.filter(t => {
        if (!t.nextReviewAt) return false;
        const reviewDate = getStartOfDate(new Date(t.nextReviewAt));
        return reviewDate <= hoje;
    }).length;
    
    const masteredTopics = topics.filter(t => t.level >= MASTER_LEVEL).length;
    
    let avgLevel = 0;
    if (totalTopics > 0) {
        const sumOfLevels = topics.reduce((acc, t) => acc + t.level, 0);
        avgLevel = (sumOfLevels / totalTopics).toFixed(1);
    }
    
    statTotal.textContent = totalTopics;
    statToday.textContent = todayReviewsCount; // Usa a contagem calculada
    statMastered.textContent = masteredTopics;
    statAvg.textContent = avgLevel;
  };


  /**
   * Renderiza os tópicos nas listas "Hoje" e "Próximas"
   */
  const renderPlanner = () => {
    let topics = getTopics();
    
    updateStats(topics); // Atualiza estatísticas

    const searchTerm = searchBox.value.toLowerCase(); 

    if (searchTerm) {
      topics = topics.filter(t =>
        t.name.toLowerCase().includes(searchTerm) ||
        t.course.toLowerCase().includes(searchTerm)
      );
    }

    todayList.innerHTML = '';
    upcomingList.innerHTML = '';

    const today = getStartOfDate(new Date());

    topicsTodayGlobal = []; // Limpa a fila global
    const topicsUpcoming = [];

    topics.forEach((topic) => {
      const nextReviewDate = getStartOfDate(new Date(topic.nextReviewAt));
      if (nextReviewDate <= today) {
        topicsTodayGlobal.push(topic); // Adiciona na fila global
      } else {
        topicsUpcoming.push(topic);
      }
    });

    // Ordena as listas
    topicsTodayGlobal.sort((a, b) => priorityToValue(b.priority) - priorityToValue(a.priority));
    topicsUpcoming.sort((a, b) => new Date(a.nextReviewAt) - new Date(b.nextReviewAt));

    // Renderiza lista "Hoje"
    if (topicsTodayGlobal.length === 0) {
      todayList.innerHTML = `<li class="empty-list">${searchTerm ? 'Nenhum resultado para hoje' : 'Nenhuma revisão para hoje.'}</li>`;
      startSessionBtn.style.display = 'none'; // Esconde botão de sessão
    } else {
      topicsTodayGlobal.forEach(topic => todayList.appendChild(createTopicElement(topic, true)));
      startSessionBtn.style.display = 'block'; // Mostra botão de sessão
      startSessionBtn.textContent = `Iniciar Sessão (${topicsTodayGlobal.length})`; // Atualiza contagem
    }

    // Renderiza lista "Próximas"
    if (topicsUpcoming.length === 0) {
      upcomingList.innerHTML = `<li class="empty-list">${searchTerm ? 'Nenhum resultado futuro' : 'Nenhum tópico agendado.'}</li>`;
    } else {
      topicsUpcoming.forEach(topic => upcomingList.appendChild(createTopicElement(topic, false)));
    }
  };

  /**
   * Lida com Adição ou Edição de Tópico
   */
  const handleFormSubmit = (e) => {
    e.preventDefault();

    const editingId = topicIdInput.value;
    const topics = getTopics();

    if (editingId) {
      // --- MODO EDIÇÃO ---
      const topicIndex = topics.findIndex(t => t.id === editingId);
      if (topicIndex > -1) {
        const originalTopic = topics[topicIndex];
        topics[topicIndex] = {
          ...originalTopic,
          name: topicNameInput.value,
          course: topicCourseInput.value || 'Geral',
          priority: topicPriorityInput.value,
          desc: topicDescInput.value,
        };
        saveTopics(topics);
        showToast('Tópico atualizado com sucesso!');
      }
    } else {
      // --- MODO ADIÇÃO ---
      const newTopic = {
        id: Date.now().toString(),
        name: topicNameInput.value,
        course: topicCourseInput.value || 'Geral',
        priority: topicPriorityInput.value,
        desc: topicDescInput.value,
        level: 0,
        createdAt: new Date().toISOString(),
        nextReviewAt: calculateNextReview(new Date(), 0).toISOString(),
      };
      topics.push(newTopic);
      saveTopics(topics);
      showToast('Tópico adicionado com sucesso!');
    }

    resetForm();
    renderPlanner();
  };

  /**
   * Reseta o formulário para o modo de adição
   */
  const resetForm = () => {
    studyForm.reset();
    topicIdInput.value = '';
    topicPriorityInput.value = 'media';
    formTitle.textContent = 'Adicionar Novo Tópico de Estudo';
    submitBtn.textContent = 'Adicionar e Agendar Revisão';
    cancelEditBtn.style.display = 'none';
  };

  /**
   * Cria o elemento HTML <li> para um tópico
   */
  const createTopicElement = (topic, isToday) => {
    const li = document.createElement('li');
    li.dataset.id = topic.id;
    li.dataset.priority = topic.priority;

    const reviewDate = new Date(topic.nextReviewAt);
    const formattedDate = reviewDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    li.innerHTML = `
      <div class="review-item-info">
        <span class="course">${topic.course}</span>
        <strong>${topic.name}</strong>
        <span class="next-review">
          <i class="fas fa-history"></i>
          Revisão: ${formattedDate} (Nível ${topic.level})
        </span>
      </div>
      <div class="review-item-actions">
        <button class="btn-action-list btn-edit" title="Editar Tópico" data-id="${topic.id}">
          <i class="fas fa-pencil-alt"></i>
        </button>
        <button class="btn-action-list btn-delete" title="Excluir Tópico" data-id="${topic.id}">
          <i class="fas fa-trash-alt"></i>
        </button>
        ${isToday
          ? `<button class="review-btn" data-id="${topic.id}">Revisar</button>`
          : `<button class="review-btn" title="Apenas revisões de hoje podem ser abertas" disabled>Agendado</button>`
        }
      </div>
    `;
    return li;
  };

  /**
   * Lida com todos os cliques nas listas de revisão
   */
  const handleListClick = (e) => {
    const target = e.target;
    const topicId = target.closest('li')?.dataset.id;
    
    if (!topicId) return;

    if (target.closest('.review-btn') && !target.closest('.review-btn').disabled) {
      // --- CLIQUE EM REVISAR (MODO INDIVIDUAL) ---
      const topics = getTopics();
      const topic = topics.find(t => t.id === topicId);
      if (topic) openStudyModal(topic);
    } 
    else if (target.closest('.btn-edit')) {
      // --- CLIQUE EM EDITAR ---
      handleEdit(topicId);
    } 
    else if (target.closest('.btn-delete')) {
      // --- CLIQUE EM EXCLUIR ---
      handleDelete(topicId);
    }
  };

  /**
   * Preenche o formulário com dados do tópico para edição
   */
  const handleEdit = (topicId) => {
    const topics = getTopics();
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;

    topicIdInput.value = topic.id;
    topicNameInput.value = topic.name;
    topicCourseInput.value = topic.course;
    topicPriorityInput.value = topic.priority;
    topicDescInput.value = topic.desc;

    formTitle.textContent = 'Editando Tópico';
    submitBtn.textContent = 'Salvar Alterações';
    cancelEditBtn.style.display = 'block';

    formTitle.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Exclui um tópico
   */
  const handleDelete = (topicId) => {
    if (!confirm('Tem certeza que deseja excluir este tópico? Esta ação é irreversível.')) {
      return;
    }
    
    let topics = getTopics();
    topics = topics.filter(t => t.id !== topicId);
    saveTopics(topics);
    
    renderPlanner();
    showToast('Tópico excluído com sucesso.', 'error');
  };

  /**
   * Exibe notificação toast
   */
  let toastTimer;
  const showToast = (message, type = 'success') => {
    clearTimeout(toastTimer); 
    
    toastElement.textContent = message;
    toastElement.className = 'toast'; 
    toastElement.classList.add(type); 
    toastElement.classList.add('show');

    toastTimer = setTimeout(() => {
      toastElement.classList.remove('show');
    }, 3000);
  };


  /**
   * Calcula a próxima data de revisão com base no nível
   */
  const calculateNextReview = (baseDate, level) => {
    const safeLevel = Math.min(level, REVIEW_INTERVALS.length - 1);
    const daysToAdd = REVIEW_INTERVALS[safeLevel];

    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return getStartOfDate(nextDate);
  };

  /**
   * Zera horas/minutos/segundos de uma data para comparação
   */
  const getStartOfDate = (date) => {
    const newDate = new Date(date); 
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };

  /**
   * Converte prioridade (string) para valor numérico para ordenação
   */
  const priorityToValue = (priority) => {
    switch (priority) {
      case 'alta': return 3;
      case 'media': return 2;
      case 'baixa': return 1;
      default: return 0;
    }
  };

  // --- LÓGICA DO MODAL E SESSÃO ---

  /**
   * NOVO: Inicia a sessão de revisão
   */
  const startReviewSession = () => {
    reviewSessionQueue = [...topicsTodayGlobal]; // Copia os tópicos de hoje
    
    if (reviewSessionQueue.length === 0) {
      showToast('Não há tópicos para revisar hoje.', 'error');
      return;
    }

    currentSessionIndex = 0;
    isSessionActive = true;
    exitSessionBtn.style.display = 'block';
    
    loadNextSessionCard();
  };

  /**
   * NOVO: Carrega o próximo card da fila no modal
   */
  const loadNextSessionCard = () => {
    if (currentSessionIndex >= reviewSessionQueue.length) {
      endReviewSession(); // Acabou a fila
      return;
    }

    const topic = reviewSessionQueue[currentSessionIndex];
    
    // Popula o modal (semelhante a openStudyModal)
    modalTopicName.textContent = topic.name;
    modalTopicCourse.textContent = topic.course;
    modalTopicDesc.textContent = topic.desc || '(Sem descrição)';

    flashcard.classList.remove('flipped');
    modal.style.display = 'flex';
  };

  /**
   * NOVO: Finaliza a sessão de revisão
   */
  const endReviewSession = () => {
    isSessionActive = false;
    exitSessionBtn.style.display = 'none';
    closeStudyModal();
    
    const reviewedCount = currentSessionIndex;
    if (reviewedCount > 0) {
        showToast(`Sessão concluída! Você revisou ${reviewedCount} tópico(s).`, 'success');
    }

    reviewSessionQueue = [];
    currentSessionIndex = 0;
    renderPlanner(); // Re-renderiza as listas
  };

  /**
   * Abre o modal para um *único* card (Modo Individual)
   */
  const openStudyModal = (topic) => {
    isSessionActive = false; // Garante que não está em modo sessão
    exitSessionBtn.style.display = 'none';

    modal.dataset.currentId = topic.id; // Define o ID para o modo individual
    modalTopicName.textContent = topic.name;
    modalTopicCourse.textContent = topic.course;
    modalTopicDesc.textContent = topic.desc || '(Sem descrição)';

    flashcard.classList.remove('flipped');
    modal.style.display = 'flex';
  };

  /**
   * Fecha o modal (função genérica)
   */
  const closeStudyModal = () => {
    modal.style.display = 'none';
    modal.dataset.currentId = '';
  };

  /**
   * (MODIFICADO) Lida com o resultado da revisão (Anki)
   * Agora funciona tanto para modo individual quanto para sessão.
   * @param {number} difficulty - 0: Errei, 1: Difícil, 2: Bom, 3: Fácil
   */
  const handleReview = (difficulty) => {
    let topicId;
    
    if (isSessionActive) {
      // Modo Sessão: Pega o ID da fila
      const topic = reviewSessionQueue[currentSessionIndex];
      topicId = topic.id;
    } else {
      // Modo Individual: Pega o ID do dataset
      topicId = modal.dataset.currentId;
    }

    if (!topicId) return; // Segurança

    const topics = getTopics();
    const topicIndex = topics.findIndex(t => t.id === topicId);

    if (topicIndex > -1) {
        let topic = topics[topicIndex];
        let newLevel = topic.level;
        let toastMessage = '';
        let toastType = 'success';

        switch (difficulty) {
            case 0: // Errei
                newLevel = 0;
                toastMessage = 'Sem problemas! Tópico re-agendado para amanhã.';
                toastType = 'error';
                break;
            case 1: // Difícil
                newLevel = Math.max(0, topic.level - 1); 
                toastMessage = 'Revisão marcada como "Difícil".';
                toastType = 'success';
                break;
            case 2: // Bom
                newLevel += 1; 
                toastMessage = 'Parabéns! Tópico agendado para a próxima revisão.';
                toastType = 'success';
                break;
            case 3: // Fácil
                newLevel += 2; 
                toastMessage = 'Marcado como "Fácil"! Pulando um nível.';
                toastType = 'success';
                break;
        }

        newLevel = Math.min(newLevel, REVIEW_INTERVALS.length - 1);

        topics[topicIndex].level = newLevel;
        topics[topicIndex].nextReviewAt = calculateNextReview(new Date(), newLevel).toISOString();
        
        saveTopics(topics); // Salva o progresso

        // Decide o que fazer a seguir
        if (isSessionActive) {
            currentSessionIndex++; // Avança na fila
            loadNextSessionCard(); // Carrega o próximo card
        } else {
            // Modo individual
            closeStudyModal();
            renderPlanner();
            showToast(toastMessage, toastType);
        }
    }
  };


  // --- EVENT LISTENERS ---
  studyForm.addEventListener('submit', handleFormSubmit);
  cancelEditBtn.addEventListener('click', resetForm);
  searchBox.addEventListener('input', renderPlanner);
  
  // Delegação de evento para as listas (review individual, edit, delete)
  todayList.addEventListener('click', handleListClick);
  upcomingList.addEventListener('click', handleListClick);

  // NOVO: Botão Iniciar Sessão
  startSessionBtn.addEventListener('click', startReviewSession);

  // Listeners do Modal (Anki)
  document.getElementById('review-fail').addEventListener('click', () => handleReview(0));
  document.getElementById('review-hard').addEventListener('click', () => handleReview(1));
  document.getElementById('review-good').addEventListener('click', () => handleReview(2));
  document.getElementById('review-easy').addEventListener('click', () => handleReview(3));

  // Listeners de Fechamento do Modal (MODIFICADO)
  modalCloseBtn.addEventListener('click', () => {
    if (isSessionActive) {
      endReviewSession(); // Se estiver em sessão, encerra
    } else {
      closeStudyModal(); // Senão, apenas fecha
    }
  });

  exitSessionBtn.addEventListener('click', endReviewSession); // NOVO
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      if (isSessionActive) {
        endReviewSession(); // Encerra se clicar fora durante a sessão
      } else {
        closeStudyModal();
      }
    }
  });

  // --- INICIALIZAÇÃO ---
  renderPlanner();
});