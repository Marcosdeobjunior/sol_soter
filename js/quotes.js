class QuotesManager {
  constructor() {
    this.quotes = this.loadQuotes();
    this.currentQuoteIndex = 0;
    this.quoteSwapTimeout = null;
    this.initializeEventListeners();
  }

  loadQuotes() {
    // Tentar carregar citações do localStorage primeiro
    const savedQuotes = localStorage.getItem('customQuotes');
    if (savedQuotes) {
      return JSON.parse(savedQuotes);
    }
    
    // Citações padrão se não houver citações salvas
    return [
      {
        text: "A leitura é uma viagem sem passaporte, uma aventura sem limites.",
        author: "Desconhecido"
      },
      {
        text: "Um livro é um jardim que se pode levar no bolso.",
        author: "Provérbio Árabe"
      },
      {
        text: "Ler é sonhar pela mão de outrem.",
        author: "Fernando Pessoa"
      },
      {
        text: "Quem não lê, não pensa, e quem não pensa, será para sempre um escravo.",
        author: "Padre Antônio Vieira"
      },
      {
        text: "Os livros são os mais silenciosos e constantes amigos; os mais acessíveis e sábios conselheiros; e os mais pacientes professores.",
        author: "Charles W. Eliot"
      }
    ];
  }

  saveQuotes() {
    localStorage.setItem('customQuotes', JSON.stringify(this.quotes));
  }

  initializeEventListeners() {
    // Card de citação abre a tela de edição
    const quoteContainer = document.getElementById('quote-display');
    if (quoteContainer && !quoteContainer.dataset.editBound) {
      quoteContainer.dataset.editBound = 'true';
      quoteContainer.setAttribute('role', 'button');
      quoteContainer.setAttribute('tabindex', '0');
      quoteContainer.setAttribute('aria-label', 'Abrir editor de citações');

      quoteContainer.addEventListener('click', () => this.openEditModal());
      quoteContainer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openEditModal();
        }
      });
    }

    // Modal de edição
    const editModal = document.getElementById('edit-quotes-modal');
    if (editModal) {
      const closeBtn = editModal.querySelector('.close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeEditModal());
      }
      
      editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
          this.closeEditModal();
        }
      });
    }

    // Botões de ação
    const addQuoteBtn = document.getElementById('add-quote-btn');
    if (addQuoteBtn) {
      addQuoteBtn.addEventListener('click', () => this.addNewQuote());
    }

    const saveQuotesBtn = document.getElementById('save-quotes-btn');
    if (saveQuotesBtn) {
      saveQuotesBtn.addEventListener('click', () => this.saveAndCloseModal());
    }
  }

  getRandomQuote() {
    if (this.quotes.length === 0) return { text: "Adicione suas citações favoritas!", author: "Sistema" };
    const randomIndex = Math.floor(Math.random() * this.quotes.length);
    return this.quotes[randomIndex];
  }

  renderQuoteContent(quoteContainer, quote) {
    quoteContainer.innerHTML = `
      <div class="quote-content-inner quote-content-enter">
        <p class="quote-text">"${quote.text}"</p>
        <p class="quote-author">- ${quote.author}</p>
      </div>
    `;
  }

  openModalAnimated(modal) {
    if (!modal) return;
    modal.classList.remove('closing');
    modal.classList.add('show');
  }

  closeModalAnimated(modal) {
    if (!modal) return;
    if (!modal.classList.contains('show') || modal.classList.contains('closing')) {
      modal.classList.remove('show');
      return;
    }
    modal.classList.add('closing');
    setTimeout(() => {
      modal.classList.remove('closing', 'show');
    }, 220);
  }

  displayQuote() {
    const quoteContainer = document.getElementById('quote-display');
    if (!quoteContainer) return;

    const randomQuote = this.getRandomQuote();
    const hasRenderedQuote = !!quoteContainer.querySelector('.quote-content-inner');

    if (!hasRenderedQuote) {
      this.renderQuoteContent(quoteContainer, randomQuote);
      return;
    }

    quoteContainer.classList.remove('quote-transition-out');
    void quoteContainer.offsetWidth; // reinicia a animação
    quoteContainer.classList.add('quote-transition-out');

    clearTimeout(this.quoteSwapTimeout);
    this.quoteSwapTimeout = setTimeout(() => {
      this.renderQuoteContent(quoteContainer, randomQuote);
      quoteContainer.classList.remove('quote-transition-out');
    }, 170);
  }

  openEditModal() {
    const modal = document.getElementById('edit-quotes-modal');
    if (!modal) {
      this.createEditModal();
      return this.openEditModal();
    }

    this.renderQuotesList();
    this.openModalAnimated(modal);
  }

  closeEditModal() {
    const modal = document.getElementById('edit-quotes-modal');
    if (modal) {
      this.closeModalAnimated(modal);
    }
  }

  createEditModal() {
    const modalHTML = `
      <div id="edit-quotes-modal" class="modal">
        <div class="modal-content">
          <span class="close-btn">&times;</span>
          <h3>Editar Citações</h3>
          
          <div class="quotes-editor">
            <div class="quotes-list" id="quotes-list">
              <!-- Lista de citações será inserida aqui -->
            </div>
            
            <div class="add-quote-section">
              <h4>Adicionar Nova Citação</h4>
              <textarea id="new-quote-text" placeholder="Digite a citação..." rows="3"></textarea>
              <input type="text" id="new-quote-author" placeholder="Autor da citação">
              <button id="add-quote-btn" class="btn-primary">
                <i class="fas fa-plus"></i> Adicionar Citação
              </button>
            </div>
            
            <div class="modal-actions">
              <button id="save-quotes-btn" class="btn-primary">
                <i class="fas fa-save"></i> Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.initializeEventListeners();
  }

  renderQuotesList() {
    const quotesList = document.getElementById('quotes-list');
    if (!quotesList) return;

    quotesList.innerHTML = '';

    this.quotes.forEach((quote, index) => {
      const quoteItem = document.createElement('div');
      quoteItem.className = 'quote-item';
      quoteItem.innerHTML = `
        <div class="quote-content">
          <textarea class="quote-text-input" data-index="${index}">${quote.text}</textarea>
          <input type="text" class="quote-author-input" data-index="${index}" value="${quote.author}">
        </div>
        <div class="quote-actions">
          <button class="btn-danger delete-quote-btn" data-index="${index}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;

      quotesList.appendChild(quoteItem);
    });

    // Adicionar event listeners para os botões de deletar
    document.querySelectorAll('.delete-quote-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.closest('.delete-quote-btn').dataset.index);
        this.deleteQuote(index);
      });
    });

    // Event listeners para salvar mudanças em tempo real
    document.querySelectorAll('.quote-text-input, .quote-author-input').forEach(input => {
      input.addEventListener('blur', () => this.updateQuoteFromInputs());
    });
  }

  updateQuoteFromInputs() {
    const textInputs = document.querySelectorAll('.quote-text-input');
    const authorInputs = document.querySelectorAll('.quote-author-input');

    textInputs.forEach((input, index) => {
      if (this.quotes[index]) {
        this.quotes[index].text = input.value.trim();
      }
    });

    authorInputs.forEach((input, index) => {
      if (this.quotes[index]) {
        this.quotes[index].author = input.value.trim();
      }
    });
  }

  addNewQuote() {
    const textInput = document.getElementById('new-quote-text');
    const authorInput = document.getElementById('new-quote-author');

    if (!textInput || !authorInput) return;

    const text = textInput.value.trim();
    const author = authorInput.value.trim();

    if (text && author) {
      this.quotes.push({ text, author });
      textInput.value = '';
      authorInput.value = '';
      this.renderQuotesList();
    } else {
      alert('Por favor, preencha tanto a citação quanto o autor.');
    }
  }

  deleteQuote(index) {
    if (confirm('Tem certeza que deseja excluir esta citação?')) {
      this.quotes.splice(index, 1);
      this.renderQuotesList();
    }
  }

  saveAndCloseModal() {
    this.updateQuoteFromInputs();
    
    // Remover citações vazias
    this.quotes = this.quotes.filter(quote => 
      quote.text.trim() !== '' && quote.author.trim() !== ''
    );

    this.saveQuotes();
    this.closeEditModal();
    this.displayQuote(); // Atualizar a citação exibida
  }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  window.quotesManager = new QuotesManager();
  window.quotesManager.displayQuote();
  
  // Trocar citação a cada 10 segundos
  setInterval(() => {
    window.quotesManager.displayQuote();
  }, 10000);
});


