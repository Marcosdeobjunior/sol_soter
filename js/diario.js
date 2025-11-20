// Lógica de Dropdown (Global)
document.querySelectorAll('.dropdown').forEach(dropdownContainer => {
    const toggle = dropdownContainer.querySelector('.dropdown-header, .profile');
    if (toggle) {
        toggle.addEventListener('click', (event) => {
            if (event.target.tagName === 'A') return;
            document.querySelectorAll('.dropdown.active').forEach(activeDropdown => {
                if (activeDropdown !== dropdownContainer) activeDropdown.classList.remove('active');
            });
            dropdownContainer.classList.toggle('active');
        });
    }
});
document.addEventListener('click', e => {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown.active').forEach(dropdown => dropdown.classList.remove('active'));
    }
});

// Classe Principal
class DiarioPessoal {
    constructor() {
        this.entradas = [];
        this.entradaEditando = null;
        this.humorSelecionado = null;
        this.imagensSelecionadas = [];
        this.humorChart = null;

        // Configurações
        this.itensPorPagina = 10;
        this.paginaAtual = 1;
        this.storageKey = 'diario_entradas_v1'; // Chave do LocalStorage (Mantida)

        // Filtros e Estado
        this.filtroHumorAtivo = null;
        this.filtroFavoritoAtivo = false;
        this.currentPin = "";
        this.pinStorageKey = 'diario-pin-lock';
        this.pinLocked = true;

        this.humorIconMap = {
            feliz: 'fa-smile-beam', normal: 'fa-smile', neutro: 'fa-meh', triste: 'fa-sad-tear', irritado: 'fa-angry'
        };

        this.initializeElements();
        this.initializeLibraries();
        this.bindEvents();
        this.initializePinLock();
    }

    initializeElements() {
        // Modais e Botoes
        this.formModal = document.getElementById('form-modal');
        this.fabNovaEntrada = document.getElementById('fab-nova-entrada');
        this.fecharFormModalBtn = document.getElementById('fechar-form-modal');
        this.formModalTitle = document.getElementById('form-modal-title');

        // Formulario
        this.form = document.getElementById('diario-form');
        this.tituloInput = document.getElementById('diario-titulo');
        this.dataInput = document.getElementById('diario-data');
        this.conteudoTextarea = document.getElementById('diario-conteudo');
        this.tagsInput = document.getElementById('diario-tags');
        this.salvarBtn = document.getElementById('salvar-entrada');
        this.humorSelector = document.getElementById('diario-humor-selector');
        this.imagensInput = document.getElementById('diario-imagens-input');
        this.imagensPreview = document.getElementById('diario-imagens-preview');
        this.templateButtons = document.querySelectorAll('.btn-template');

        // Busca/Listagem
        this.buscaInput = document.getElementById('busca-diario');
        this.filtroDataInput = document.getElementById('filtro-data');
        this.limparFiltrosBtn = document.getElementById('limpar-filtros');
        this.filtroHumorContainer = document.getElementById('filtro-humor-container');
        this.filtroFavoritoBtn = document.getElementById('filtro-favorito-btn');
        this.listaEntradas = document.getElementById('lista-entradas');
        this.totalEntradas = document.getElementById('total-entradas');
        this.semEntradas = document.getElementById('sem-entradas');
        this.paginacaoContainer = document.getElementById('paginacao-container');

        // Recordações
        this.recordacoesSection = document.getElementById('recordacoes-section');
        this.recordacoesLista = document.getElementById('recordacoes-lista');

        // Stats e Leitura
        this.statsBtn = document.getElementById('stats-btn');
        this.lembreteBtn = document.getElementById('lembrete-btn');
        this.leituraModal = document.getElementById('leitura-modal');
        this.leituraFecharBtn = document.getElementById('leitura-fechar');
        this.statsModal = document.getElementById('stats-modal');
        this.statsFecharBtn = document.getElementById('stats-fechar');

        // PIN
        this.pinOverlay = document.getElementById('pin-lock-overlay');
        this.pinMessage = document.getElementById('pin-message');
        this.pinDisplay = document.getElementById('pin-display');
        this.pinKeypad = document.getElementById('pin-keypad');
    }

    initializeLibraries() {
        this.quill = new Quill('#diario-conteudo-editor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'header': [2, 3, false] }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['link', 'clean']
                ]
            },
            placeholder: 'Querido diário...',
        });
        this.quill.root.style.color = '#e0e0e0'; // Dark theme fix

        this.tagify = new Tagify(this.tagsInput, {
            placeholder: "Tags...", delimiters: ",|Enter", dropdown: { enabled: 0 }
        });

        this.quill.on('text-change', () => {
            this.conteudoTextarea.value = this.quill.getText().trim().length > 0 ? this.quill.root.innerHTML : '';
        });
    }

    bindEvents() {
        this.fabNovaEntrada.addEventListener('click', () => this.openFormModal());
        this.fecharFormModalBtn.addEventListener('click', () => this.closeFormModal());
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Filtros
        this.buscaInput.addEventListener('input', () => { this.paginaAtual = 1; this.filtrarEntradas(); });
        this.filtroDataInput.addEventListener('change', () => { this.paginaAtual = 1; this.filtrarEntradas(); });
        this.limparFiltrosBtn.addEventListener('click', () => this.limparFiltros());
        this.filtroHumorContainer.addEventListener('click', (e) => { this.paginaAtual = 1; this.handleFiltroHumor(e); });
        this.filtroFavoritoBtn.addEventListener('click', () => { this.paginaAtual = 1; this.handleFiltroFavorito(); });

        // Imagens e Ações
        this.imagensInput.addEventListener('change', (e) => this.handleImageUpload(e));
        this.statsBtn.addEventListener('click', () => this.showStatsModal());
        this.lembreteBtn.addEventListener('click', () => alert("Lembrete definido para 20:00 todo dia!"));
        
        this.imagensPreview.addEventListener('click', (e) => {
            if (e.target.closest('.remover-imagem-btn')) {
                const index = e.target.closest('.remover-imagem-btn').dataset.index;
                this.removerImagem(parseInt(index));
            }
        });

        // CORREÇÃO TEMPLATES: Garante que o clique acione a lógica correta
        this.templateButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Previne submit se estiver dentro de form
                this.aplicarTemplate(btn.dataset.template);
            });
        });

        // Modal Fechar
        this.leituraFecharBtn.addEventListener('click', () => this.leituraModal.style.display = 'none');
        this.statsFecharBtn.addEventListener('click', () => this.statsModal.style.display = 'none');
        
        // Clique nos cards (Delegação)
        this.listaEntradas.addEventListener('click', (e) => this.handleCardClick(e));
        
        // Humor Selector
        this.humorSelector.addEventListener('click', (e) => {
            const btn = e.target.closest('.humor-btn');
            if(btn) this.selecionarHumor(btn.dataset.humor);
        });

        // PIN
        this.pinKeypad.addEventListener('click', (e) => this.handlePinKey(e));
        
        // PDF
        document.getElementById('leitura-export-pdf-btn').addEventListener('click', () => this.exportarPDF());
    }

    // ===== LOCALSTORAGE =====
    loadEntradas() {
        try {
            const data = localStorage.getItem(this.storageKey);
            this.entradas = data ? JSON.parse(data) : [];
            this.filtrarEntradas(); // Renderiza
            this.buscarRecordacoes();
        } catch (e) {
            console.error("Erro ao carregar do localStorage", e);
            this.entradas = [];
        }
    }

    saveEntradas() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.entradas));
    }

    // ===== TEMPLATES (CORRIGIDO) =====
    aplicarTemplate(tipo) {
        // 1. Abre o modal primeiro para garantir que os inputs existem e estão visíveis
        this.openFormModal();

        // 2. Pequeno delay para garantir renderização do Quill
        setTimeout(() => {
            const hojeData = new Date().toISOString().split('T')[0];
            
            if (tipo === 'gratidao') {
                this.tituloInput.value = "Gratidão do Dia";
                this.selecionarHumor('feliz');
                // Define o HTML do Quill diretamente
                const htmlGratidao = `
                    <h3>3 Coisas pelas quais sou grato hoje:</h3>
                    <ol>
                        <li>...</li>
                        <li>...</li>
                        <li>...</li>
                    </ol>
                    <p><br></p>
                    <p><strong>Por que isso foi importante?</strong></p>
                    <p>...</p>
                `;
                this.quill.clipboard.dangerouslyPasteHTML(htmlGratidao);
                
                try { 
                    this.tagify.removeAllTags();
                    this.tagify.addTags(["gratidão"]); 
                } catch(e){ console.error(e); }
            } 
            else if (tipo === 'sonho') {
                this.tituloInput.value = "Registro de Sonho";
                this.selecionarHumor('neutro');
                const htmlSonho = `
                    <h3>O que aconteceu no sonho?</h3>
                    <p>...</p>
                    <h3>Como me senti?</h3>
                    <p>...</p>
                    <h3>Interpretação pessoal:</h3>
                    <p>...</p>
                `;
                this.quill.clipboard.dangerouslyPasteHTML(htmlSonho);
                
                try { 
                    this.tagify.removeAllTags();
                    this.tagify.addTags(["sonho"]); 
                } catch(e){ console.error(e); }
            }
            
            if(!this.dataInput.value) this.dataInput.value = hojeData;
        }, 100);
    }

    // ===== CRUD =====
    handleSubmit(e) {
        e.preventDefault();
        if (this.pinLocked) return;

        const titulo = this.tituloInput.value.trim();
        const data = this.dataInput.value;
        const conteudoHtml = this.quill.root.innerHTML;
        const conteudoTexto = this.quill.getText().trim();

        if (!titulo || !conteudoTexto) {
            alert('Preencha título e conteúdo!');
            return;
        }

        const novaEntrada = {
            id: this.entradaEditando ? this.entradaEditando.id : Date.now().toString(),
            titulo,
            data,
            conteudoHtml,
            conteudoTexto,
            tags: this.tagify.value.map(t => t.value),
            humor: this.humorSelecionado || 'normal',
            imagens: this.imagensSelecionadas,
            favorito: this.entradaEditando ? this.entradaEditando.favorito : false,
            criadoEm: this.entradaEditando ? this.entradaEditando.criadoEm : new Date().toISOString()
        };

        if (this.entradaEditando) {
            const index = this.entradas.findIndex(e => e.id === this.entradaEditando.id);
            if (index !== -1) this.entradas[index] = novaEntrada;
        } else {
            this.entradas.push(novaEntrada);
        }

        this.saveEntradas();
        this.closeFormModal();
        this.filtrarEntradas();
        this.buscarRecordacoes();
        alert('Salvo com sucesso!');
    }

    excluirEntrada(id) {
        if(!confirm("Tem certeza que deseja excluir?")) return;
        this.entradas = this.entradas.filter(e => e.id !== id);
        this.saveEntradas();
        this.filtrarEntradas();
    }

    toggleFavorito(id) {
        const entrada = this.entradas.find(e => e.id === id);
        if (entrada) {
            entrada.favorito = !entrada.favorito;
            this.saveEntradas();
            this.filtrarEntradas();
        }
    }

    editarEntrada(id) {
        const entrada = this.entradas.find(e => e.id === id);
        if (!entrada) return;
        
        this.entradaEditando = entrada;
        this.tituloInput.value = entrada.titulo;
        this.dataInput.value = entrada.data;
        this.quill.root.innerHTML = entrada.conteudoHtml || entrada.conteudoTexto;
        this.tagify.removeAllTags();
        this.tagify.addTags(entrada.tags || []);
        this.imagensSelecionadas = [...(entrada.imagens || [])];
        this.selecionarHumor(entrada.humor);
        this.renderizarPreviewImagens();
        
        this.openFormModal(true);
    }

    // ===== RENDERIZAÇÃO LISTA PROGRESSIVA (TIMELINE) =====
    renderEntradas(lista = this.entradasFiltradas) {
        this.entradasFiltradas = lista;
        
        // Ordenar: Mais recentes primeiro (Timeline Progressiva)
        lista.sort((a, b) => new Date(b.data) - new Date(a.data));

        this.totalEntradas.textContent = `${lista.length} momentos`;

        if (lista.length === 0) {
            this.listaEntradas.style.display = 'none';
            this.paginacaoContainer.style.display = 'none';
            this.semEntradas.style.display = 'block';
            return;
        }
        
        this.semEntradas.style.display = 'none';
        this.listaEntradas.style.display = 'flex'; // Flex column para timeline

        // Paginação
        const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
        const fim = inicio + this.itensPorPagina;
        const paginaItems = lista.slice(inicio, fim);

        this.listaEntradas.innerHTML = paginaItems.map((entrada, index) => this.criarHTMLTimeline(entrada, index)).join('');
        this.renderPaginacao(lista.length);
    }

    criarHTMLTimeline(entrada, index) {
        const dateObj = new Date(entrada.data + 'T12:00:00');
        const dia = dateObj.getDate().toString().padStart(2, '0');
        const mes = dateObj.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
        const ano = dateObj.getFullYear();
        
        const humorIcon = this.humorIconMap[entrada.humor] || 'fa-smile';
        const imagensHtml = (entrada.imagens && entrada.imagens.length) 
            ? `<div class="card-imagens-row">${entrada.imagens.map(src => `<img src="${src}" class="card-img-thumb">`).join('')}</div>` 
            : '';
        
        // Classes de humor para o CSS "Vivo"
        const humorClass = `mood-${entrada.humor}`;

        return `
            <div class="entrada-item-wrapper">
                <!-- Timeline Center Dot -->
                <div class="entrada-timeline-dot ${humorClass}" title="${entrada.humor}">
                    <span>${dia}</span>
                </div>
                
                <div class="entrada-card ${humorClass}" data-id="${entrada.id}" data-humor="${entrada.humor}">
                    <div class="entrada-header">
                        <h3 class="entrada-titulo">${this.escapeHtml(entrada.titulo)}</h3>
                        <div class="entrada-meta-top">
                            <i class="fas ${humorIcon}"></i>
                        </div>
                    </div>
                    
                    ${imagensHtml}
                    
                    <div class="entrada-conteudo-preview">
                        ${entrada.conteudoTexto.substring(0, 200)}${entrada.conteudoTexto.length > 200 ? '...' : ''}
                    </div>
                    
                    <div class="entrada-footer">
                        <span class="entrada-date-display">${dia} de ${mes}, ${ano}</span>
                        <div class="entrada-tags">
                            ${(entrada.tags || []).slice(0, 3).map(tag => `<span class="tag">#${tag}</span>`).join('')}
                        </div>
                        <div class="entrada-card-actions">
                            <button class="btn-icon favorite ${entrada.favorito ? 'favorited' : ''}" data-action="favoritar" title="Favoritar">
                                <i class="${entrada.favorito ? 'fas' : 'far'} fa-star"></i>
                            </button>
                            <button class="btn-icon edit" data-action="editar" title="Editar"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon delete" data-action="excluir" title="Excluir"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    handleCardClick(e) {
        const btn = e.target.closest('button');
        const card = e.target.closest('.entrada-card');
        if (!card) return;
        
        const id = card.dataset.id;

        if (btn) {
            const action = btn.dataset.action;
            if (action === 'favoritar') this.toggleFavorito(id);
            if (action === 'editar') this.editarEntrada(id);
            if (action === 'excluir') this.excluirEntrada(id);
        } else {
            // Clique no card abre leitura
            this.mostrarLeitura(id);
        }
    }

    mostrarLeitura(id) {
        const entrada = this.entradas.find(e => e.id === id);
        if (!entrada) return;
        
        this.leituraModal.style.display = 'flex';
        document.getElementById('leitura-titulo').textContent = entrada.titulo;
        document.getElementById('leitura-data').textContent = new Date(entrada.data + 'T12:00:00').toLocaleDateString('pt-BR');
        document.getElementById('leitura-humor').innerHTML = `<i class="fas ${this.humorIconMap[entrada.humor]}"></i> ${entrada.humor.toUpperCase()}`;
        
        document.querySelector('#leitura-conteudo .ql-editor').innerHTML = entrada.conteudoHtml;
        
        const imgsContainer = document.getElementById('leitura-imagens');
        imgsContainer.innerHTML = (entrada.imagens || []).map(src => `<img src="${src}" class="leitura-imagem">`).join('');
        
        document.getElementById('leitura-tags').innerHTML = (entrada.tags || []).map(t => `<span class="tag">#${t}</span>`).join(' ');
    }

    // ===== FUNCOES UTILITARIAS =====
    
    renderPaginacao(total) {
        const totalPaginas = Math.ceil(total / this.itensPorPagina);
        if (totalPaginas <= 1) { this.paginacaoContainer.style.display = 'none'; return; }
        
        this.paginacaoContainer.style.display = 'flex';
        let html = '';
        for(let i=1; i<=totalPaginas; i++) {
            html += `<button class="btn-pagina ${i === this.paginaAtual ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        this.paginacaoContainer.innerHTML = html;
        
        this.paginacaoContainer.querySelectorAll('.btn-pagina').forEach(btn => {
            btn.addEventListener('click', () => {
                this.paginaAtual = parseInt(btn.dataset.page);
                this.renderEntradas();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    selecionarHumor(humor) {
        this.humorSelecionado = humor;
        this.humorSelector.querySelectorAll('.humor-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.humor === humor);
        });
    }

    handleImageUpload(e) {
        const files = Array.from(e.target.files);
        if (this.imagensSelecionadas.length + files.length > 5) return alert("Máximo 5 imagens");
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                this.imagensSelecionadas.push(ev.target.result);
                this.renderizarPreviewImagens();
            };
            reader.readAsDataURL(file);
        });
    }

    renderizarPreviewImagens() {
        this.imagensPreview.innerHTML = this.imagensSelecionadas.map((src, i) => `
            <div class="preview-imagem-container">
                <img src="${src}" class="preview-imagem">
                <button class="remover-imagem-btn" data-index="${i}">&times;</button>
            </div>
        `).join('');
    }

    removerImagem(index) {
        this.imagensSelecionadas.splice(index, 1);
        this.renderizarPreviewImagens();
    }

    resetForm() {
        this.form.reset();
        this.quill.setText('');
        this.tagify.removeAllTags();
        this.entradaEditando = null;
        this.imagensSelecionadas = [];
        this.renderizarPreviewImagens();
        this.selecionarHumor(null);
        this.formModalTitle.textContent = "Nova Entrada";
    }

    openFormModal(editar = false) {
        if (!editar) this.resetForm();
        else this.formModalTitle.textContent = "Editar Entrada";
        this.formModal.style.display = 'flex';
    }
    
    closeFormModal() { this.formModal.style.display = 'none'; }

    handleFiltroHumor(e) {
        const btn = e.target.closest('.btn-filter-humor');
        if (!btn) return;
        const humor = btn.dataset.humor;
        this.filtroHumorAtivo = (this.filtroHumorAtivo === humor) ? null : humor;
        
        this.filtroHumorContainer.querySelectorAll('.btn-filter-humor').forEach(b => {
            b.classList.toggle('active', b.dataset.humor === this.filtroHumorAtivo);
        });
        this.filtrarEntradas();
    }

    handleFiltroFavorito() {
        this.filtroFavoritoAtivo = !this.filtroFavoritoAtivo;
        this.filtroFavoritoBtn.classList.toggle('active', this.filtroFavoritoAtivo);
        this.filtrarEntradas();
    }

    limparFiltros() {
        this.buscaInput.value = '';
        this.filtroDataInput.value = '';
        this.filtroHumorAtivo = null;
        this.filtroFavoritoAtivo = false;
        this.filtroHumorContainer.querySelectorAll('.btn-filter-humor').forEach(b => b.classList.remove('active'));
        this.filtroFavoritoBtn.classList.remove('active');
        this.renderEntradas(this.entradas);
    }

    filtrarEntradas() {
        let result = this.entradas;
        const termo = this.buscaInput.value.toLowerCase();
        const data = this.filtroDataInput.value;

        if (termo) result = result.filter(e => e.titulo.toLowerCase().includes(termo) || e.conteudoTexto.toLowerCase().includes(termo) || e.tags.some(t => t.toLowerCase().includes(termo)));
        if (data) result = result.filter(e => e.data === data);
        if (this.filtroHumorAtivo) result = result.filter(e => e.humor === this.filtroHumorAtivo);
        if (this.filtroFavoritoAtivo) result = result.filter(e => e.favorito);

        this.renderEntradas(result);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // PIN Lock Logic
    initializePinLock() {
        const savedPin = localStorage.getItem(this.pinStorageKey);
        this.pinMessage.textContent = savedPin ? "Digite seu PIN" : "Crie um PIN de 4 dígitos";
        this.pinOverlay.classList.remove('hidden');
    }

    handlePinKey(e) {
        const btn = e.target.closest('.pin-key');
        if(!btn) return;
        
        const key = btn.dataset.key;
        if(key === 'clear') this.currentPin = this.currentPin.slice(0, -1);
        else if(key === 'enter') this.verificarPin();
        else if(this.currentPin.length < 4) this.currentPin += key;
        
        this.atualizarPinDisplay();
    }

    atualizarPinDisplay() {
        this.pinDisplay.querySelectorAll('.pin-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i < this.currentPin.length);
        });
    }

    verificarPin() {
        const savedPin = localStorage.getItem(this.pinStorageKey);
        
        if (!savedPin) {
            if(this.currentPin.length === 4) {
                localStorage.setItem(this.pinStorageKey, this.currentPin);
                this.unlockApp();
            } else alert("O PIN precisa de 4 dígitos");
        } else {
            if(this.currentPin === savedPin) this.unlockApp();
            else {
                alert("PIN incorreto");
                this.currentPin = "";
                this.atualizarPinDisplay();
            }
        }
    }

    unlockApp() {
        this.pinLocked = false;
        this.pinOverlay.classList.add('hidden');
        setTimeout(() => this.pinOverlay.style.display = 'none', 300);
        this.loadEntradas(); // Carrega dados só agora
    }
    
    buscarRecordacoes() {
        this.recordacoesSection.style.display = 'none';
    }
    
    showStatsModal() {
        this.statsModal.style.display = 'flex';
        const counts = { feliz:0, normal:0, neutro:0, triste:0, irritado:0 };
        this.entradas.forEach(e => { if(counts[e.humor] !== undefined) counts[e.humor]++ });
        
        if(this.humorChart) this.humorChart.destroy();
        this.humorChart = new Chart(document.getElementById('humor-chart'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(counts),
                datasets: [{ data: Object.values(counts), backgroundColor: ['#a6e3a1', '#89b4fa', '#cba6f7', '#74c7ec', '#f38ba8'] }]
            }
        });
    }
    
    exportarPDF() {
        alert("Funcionalidade de exportação simplificada para demonstração.");
    }
}

// Inicializa
window.diario = new DiarioPessoal();