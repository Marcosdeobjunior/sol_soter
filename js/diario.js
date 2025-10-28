// ===== DIÁRIO PESSOAL - LÓGICA JAVASCRIPT =====

class DiarioPessoal {
    constructor() {
        this.entradas = [];
        this.entradaEditando = null;
        this.humorSelecionado = null;
        this.imagensSelecionadas = []; // Armazena imagens (Base64)
        this.db = null; // Referência do IndexedDB
        this.humorChart = null; // Instância do gráfico

        // NOVO: Itens de Estado
        this.filtroHumorAtivo = null;
        this.filtroFavoritoAtivo = false;
        this.currentPin = "";
        this.pinStorageKey = 'diario-pin-lock';
        this.pinLocked = true; // App começa travado

        this.humorIconMap = {
            feliz: 'fa-smile-beam',
            normal: 'fa-smile',
            neutro: 'fa-meh',
            triste: 'fa-sad-tear',
            irritado: 'fa-angry'
        };

        this.humorColorMap = {
            feliz: '#a6e3a1',    // Verde
            normal: '#89b4fa',   // Azul
            neutro: '#a6adc8',   // Cinza
            triste: '#74c7ec',   // Azul claro
            irritado: '#f38ba8'  // Vermelho
        };

        this.initializeElements();
        this.initializeLibraries();
        this.bindEvents();
        this.initializeDB(); // Isso agora SÓ inicializa o DB
        this.initializePinLock(); // Trava a tela
        // this.setDataAtual(); // MOVIDO para depois do PIN
    }

    initializeElements() {
        // Elementos do formulário
        this.form = document.getElementById('diario-form');
        this.tituloInput = document.getElementById('diario-titulo');
        this.dataInput = document.getElementById('diario-data');
        this.conteudoTextarea = document.getElementById('diario-conteudo');
        this.tagsInput = document.getElementById('diario-tags');
        this.salvarBtn = document.getElementById('salvar-entrada');
        this.cancelarBtn = document.getElementById('cancelar-edicao');
        this.humorSelector = document.getElementById('diario-humor-selector');
        this.imagensInput = document.getElementById('diario-imagens-input');
        this.imagensPreview = document.getElementById('diario-imagens-preview');
        this.templateButtons = document.querySelectorAll('.btn-template');

        // Elementos de busca
        this.buscaInput = document.getElementById('busca-diario');
        this.filtroDataInput = document.getElementById('filtro-data');
        this.limparFiltrosBtn = document.getElementById('limpar-filtros');
        
        // NOVO: Filtros Rápidos
        this.filtroHumorContainer = document.getElementById('filtro-humor-container');
        this.filtroFavoritoBtn = document.getElementById('filtro-favorito-btn');

        // Elementos de exibição
        this.listaEntradas = document.getElementById('lista-entradas');
        this.totalEntradas = document.getElementById('total-entradas');
        this.semEntradas = document.getElementById('sem-entradas');
        
        // NOVO: Recordações
        this.recordacoesSection = document.getElementById('recordacoes-section');
        this.recordacoesLista = document.getElementById('recordacoes-lista');
        
        // Elementos de Ações
        this.downloadBtn = document.getElementById('download-entradas');
        this.importBtn = document.getElementById('import-entradas');
        this.importFileInput = document.getElementById('import-file-input');
        this.statsBtn = document.getElementById('stats-btn');
        this.lembreteBtn = document.getElementById('lembrete-btn');

        // Modal de Leitura
        this.leituraModal = document.getElementById('leitura-modal');
        this.leituraFecharBtn = document.getElementById('leitura-fechar');
        this.leituraTitulo = document.getElementById('leitura-titulo');
        this.leituraData = document.getElementById('leitura-data');
        this.leituraHumor = document.getElementById('leitura-humor');
        this.leituraImagens = document.getElementById('leitura-imagens');
        this.leituraConteudo = document.getElementById('leitura-conteudo').querySelector('.ql-editor');
        this.leituraTags = document.getElementById('leitura-tags');
        this.leituraExportPdfBtn = document.getElementById('leitura-export-pdf-btn'); // NOVO: Botão PDF

        // Modal de Stats
        this.statsModal = document.getElementById('stats-modal');
        this.statsFecharBtn = document.getElementById('stats-fechar');
        // Armazena o ELEMENTO <canvas>
        this.humorChartCanvasElement = document.getElementById('humor-chart'); 
        this.statsTagsLista = document.getElementById('stats-tags-lista');

        // NOVO: Trava de PIN
        this.pinOverlay = document.getElementById('pin-lock-overlay');
        this.pinMessage = document.getElementById('pin-message');
        this.pinDisplay = document.getElementById('pin-display');
        this.pinKeypad = document.getElementById('pin-keypad');
    }

    initializeLibraries() {
        // Quill.js
        this.quill = new Quill('#diario-conteudo-editor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'header': [1, 2, 3, false] }],
                    ['link', 'blockquote', 'code-block'],
                    ['clean']
                ]
            },
            placeholder: 'Escreva seus pensamentos aqui...',
        });

        // Tagify
        this.tagify = new Tagify(this.tagsInput, {
            placeholder: "Tags separadas por vírgula ou Enter...",
            delimiters: ",|Enter",
            dropdown: {
                enabled: 0
            }
        });

        this.quill.on('text-change', () => {
            this.conteudoTextarea.value = this.quill.getText().trim().length > 0 ? this.quill.root.innerHTML : '';
        });
    }

    async initializeDB() {
        try {
            this.db = await idb.openDB('diario-pessoal-db', 1, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains('entradas')) {
                        const store = db.createObjectStore('entradas', {
                            keyPath: 'id',
                            autoIncrement: false,
                        });
                        store.createIndex('data', 'data', { unique: false });
                    }
                },
            });
            console.log("Banco de dados IndexedDB inicializado.");
            // this.loadEntradas(); // MOVIDO para depois do PIN
        } catch (error) {
            console.error("Erro ao inicializar o IndexedDB:", error);
            this.showNotification("Erro ao carregar o banco de dados. Tente recarregar a página.", "error");
        }
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.cancelarBtn.addEventListener('click', () => this.cancelarEdicao());
        this.buscaInput.addEventListener('input', () => this.filtrarEntradas());
        this.filtroDataInput.addEventListener('change', () => this.filtrarEntradas());
        this.limparFiltrosBtn.addEventListener('click', () => this.limparFiltros());
        this.downloadBtn.addEventListener('click', () => this.downloadEntradas());
        this.importBtn.addEventListener('click', () => this.importFileInput.click());
        this.importFileInput.addEventListener('change', (e) => this.handleFileImport(e));
        this.imagensInput.addEventListener('change', (e) => this.handleImageUpload(e));

        this.imagensPreview.addEventListener('click', (e) => {
            if (e.target.classList.contains('remover-imagem-btn')) {
                const index = parseInt(e.target.dataset.index, 10);
                this.removerImagem(index);
            }
        });

        this.templateButtons.forEach(btn => {
            btn.addEventListener('click', () => this.aplicarTemplate(btn.dataset.template));
        });
        
        this.statsBtn.addEventListener('click', () => this.showStatsModal());
        this.lembreteBtn.addEventListener('click', () => this.pedirPermissaoNotificacao());
        
        // Modal de Leitura
        this.leituraFecharBtn.addEventListener('click', () => this.leituraModal.style.display = 'none');
        this.leituraModal.addEventListener('click', (e) => {
            if (e.target === this.leituraModal) this.leituraModal.style.display = 'none';
        });

        // Modal de Stats
        this.statsFecharBtn.addEventListener('click', () => this.statsModal.style.display = 'none');
        this.statsModal.addEventListener('click', (e) => {
            if (e.target === this.statsModal) this.statsModal.style.display = 'none';
        });

        // Delegação de Evento (Card e Tag)
        this.listaEntradas.addEventListener('click', (e) => {
            const card = e.target.closest('.entrada-card');
            if (!card) return;

            if (e.target.closest('.entrada-actions') || e.target.closest('.tag')) {
                if (e.target.closest('.tag')) {
                    const tagNome = e.target.textContent;
                    this.buscaInput.value = `tag:${tagNome}`;
                    this.filtrarEntradas();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                return;
            }
            
            const id = card.dataset.id;
            this.showLeituraModal(id);
        });

        // NOVO: Delegação de Evento (Recordações)
        this.recordacoesLista.addEventListener('click', (e) => {
            const card = e.target.closest('.recordacao-card');
            if (card && card.dataset.id) {
                this.showLeituraModal(card.dataset.id);
            }
        });

        // Seletor de humor
        this.humorSelector.addEventListener('click', (e) => {
            const humorBtn = e.target.closest('.humor-btn');
            if (humorBtn) {
                this.selecionarHumor(humorBtn.dataset.humor);
            }
        });

        // ===== NOVOS EVENTOS =====
        
        // NOVO: Trava de PIN
        this.pinKeypad.addEventListener('click', (e) => this.handlePinKey(e));

        // NOVO: Filtros Rápidos
        this.filtroHumorContainer.addEventListener('click', (e) => this.handleFiltroHumor(e));
        this.filtroFavoritoBtn.addEventListener('click', () => this.handleFiltroFavorito());

        // NOVO: Exportar PDF
        this.leituraExportPdfBtn.addEventListener('click', () => this.exportarEntradaParaPDF());
    }

    // ===== LÓGICA DE TRAVA DE PIN (NOVO) =====

    initializePinLock() {
        const pinSalvo = localStorage.getItem(this.pinStorageKey);
        if (pinSalvo) {
            this.pinMessage.textContent = 'Digite seu PIN de 4 dígitos';
        } else {
            this.pinMessage.textContent = 'Crie um PIN de 4 dígitos';
        }
        this.pinOverlay.style.display = 'flex';
    }

    handlePinKey(e) {
        const keyBtn = e.target.closest('.pin-key');
        if (!keyBtn) return;

        const key = keyBtn.dataset.key;

        this.pinMessage.textContent = '';
        this.pinMessage.classList.remove('error', 'success');

        if (key === 'clear') {
            this.currentPin = this.currentPin.slice(0, -1);
        } else if (key === 'enter') {
            this.verificarPin();
        } else if (this.currentPin.length < 4) {
            this.currentPin += key;
        }

        this.atualizarPinDisplay();
    }

    atualizarPinDisplay() {
        const dots = this.pinDisplay.querySelectorAll('.pin-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index < this.currentPin.length);
        });
    }

    verificarPin() {
        const pinSalvo = localStorage.getItem(this.pinStorageKey);

        if (!pinSalvo) {
            // Criando novo PIN
            if (this.currentPin.length === 4) {
                localStorage.setItem(this.pinStorageKey, this.currentPin);
                this.pinMessage.textContent = 'PIN criado com sucesso!';
                this.pinMessage.classList.add('success');
                setTimeout(() => this.desbloquearApp(), 500);
            } else {
                this.pinMessage.textContent = 'O PIN deve ter 4 dígitos';
                this.pinMessage.classList.add('error');
                this.currentPin = '';
                this.atualizarPinDisplay();
            }
        } else {
            // Verificando PIN existente
            if (this.currentPin === pinSalvo) {
                this.pinMessage.textContent = 'Bem-vindo!';
                this.pinMessage.classList.add('success');
                setTimeout(() => this.desbloquearApp(), 300);
            } else {
                this.pinMessage.textContent = 'PIN incorreto. Tente novamente.';
                this.pinMessage.classList.add('error');
                this.currentPin = '';
                this.atualizarPinDisplay();
            }
        }
    }

    desbloquearApp() {
        this.pinLocked = false;
        this.pinOverlay.classList.add('hidden');
        // Adiciona um delay para a animação de fade-out antes de esconder
        setTimeout(() => {
            this.pinOverlay.style.display = 'none';
        }, 300);

        // Agora carregamos tudo
        this.loadEntradas();
        this.setDataAtual();
    }


    // ===== LÓGICA DO DIÁRIO (Existente e Modificada) =====
    
    selecionarHumor(humor) {
        if (this.humorSelecionado === humor) {
            this.humorSelecionado = null; // Permite desmarcar
        } else {
            this.humorSelecionado = humor;
        }

        this.humorSelector.querySelectorAll('.humor-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.humor === this.humorSelecionado);
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        if (this.pinLocked) return; // Não faz nada se estiver travado

        const titulo = this.tituloInput.value.trim();
        const data = this.dataInput.value;
        const conteudoHtml = this.quill.root.innerHTML;
        const conteudoTexto = this.quill.getText().trim();

        if (!titulo || !data || !conteudoTexto) {
            this.showNotification('Por favor, preencha Título, Data e Conteúdo.', 'error');
            return;
        }

        const tags = this.tagify.value.map(tag => tag.value);

        const entrada = {
            id: this.entradaEditando ? this.entradaEditando.id : this.generateId(),
            titulo, data, 
            conteudoHtml,
            conteudoTexto,
            tags,
            humor: this.humorSelecionado,
            imagens: this.imagensSelecionadas,
            favorito: this.entradaEditando ? this.entradaEditando.favorito : false,
            criadoEm: this.entradaEditando ? this.entradaEditando.criadoEm : new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };

        try {
            if (this.entradaEditando) {
                await this.updateEntrada(entrada);
            } else {
                await this.addEntrada(entrada);
            }

            this.resetForm();
            await this.loadEntradas();
            this.filtrarEntradas();
            this.showNotification('Entrada salva com sucesso!', 'success');
        } catch (error) {
            console.error("Erro ao salvar entrada:", error);
            this.showNotification('Erro ao salvar no banco de dados.', 'error');
        }
    }

    async editarEntrada(id) {
        if (this.pinLocked) return;
        try {
            const entrada = await this.db.get('entradas', id);
            if (!entrada) return;

            this.entradaEditando = entrada;
            this.tituloInput.value = entrada.titulo;
            this.dataInput.value = entrada.data;
            
            this.quill.root.innerHTML = entrada.conteudoHtml || entrada.conteudo;
            this.tagify.loadOriginalValues(entrada.tags || []);
            this.imagensSelecionadas = [...(entrada.imagens || [])];
            this.renderizarPreviewImagens();

            this.selecionarHumor(entrada.humor || null);

            this.cancelarBtn.style.display = 'inline-flex';
            this.salvarBtn.innerHTML = '<i class="fas fa-edit"></i> Atualizar Entrada';
            document.querySelector('.entrada-form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) {
            console.error("Erro ao carregar entrada para edição:", error);
            this.showNotification('Erro ao carregar entrada.', 'error');
        }
    }

    resetForm() {
        this.form.reset();
        if (!this.pinLocked) this.setDataAtual(); // Só seta a data se não estiver travado
        this.selecionarHumor(null);
        
        this.quill.root.innerHTML = '';
        this.tagify.removeAllTags();
        this.imagensSelecionadas = [];
        this.renderizarPreviewImagens();

        this.entradaEditando = null;
        this.cancelarBtn.style.display = 'none';
        this.salvarBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Entrada';
    }

    cancelarEdicao() {
        this.resetForm();
    }

    async toggleFavorito(id) {
        if (this.pinLocked) return;
        try {
            const entrada = await this.db.get('entradas', id);
            if (entrada) {
                entrada.favorito = !entrada.favorito;
                entrada.atualizadoEm = new Date().toISOString();
                await this.db.put('entradas', entrada);
                await this.loadEntradas();
                this.filtrarEntradas();
            }
        } catch (error) {
            console.error("Erro ao favoritar:", error);
            this.showNotification('Erro ao atualizar favorito.', 'error');
        }
    }

    createEntradaCard(entrada) {
        const dataFormatada = this.formatarData(entrada.data);
        const tagsHtml = (entrada.tags || []).map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('');
        const humorIconClass = entrada.humor ? this.humorIconMap[entrada.humor] : '';
        const humorHtml = humorIconClass ? `<i class="fas ${humorIconClass} entrada-humor" title="${entrada.humor}"></i>` : '';
        const imagensPreviewHtml = (entrada.imagens || []).slice(0, 3).map(imgSrc => 
            `<img src="${imgSrc}" alt="Preview" class="card-img-thumb">`
        ).join('');
        const isFavorito = entrada.favorito;
        const favoritoClass = isFavorito ? 'fas fa-star' : 'far fa-star';
        const favoritoBtnClass = isFavorito ? 'favorited' : '';
        const conteudoPreview = entrada.conteudoTexto ? this.escapeHtml(entrada.conteudoTexto) : this.escapeHtml(entrada.conteudo);

        return `
            <div class="entrada-card" data-id="${entrada.id}">
                <div class="entrada-header">
                    <div style="display: flex; align-items: center; min-width: 0;">
                        ${humorHtml}
                        <h3 class="entrada-titulo">${this.escapeHtml(entrada.titulo)}</h3>
                    </div>
                    <span class="entrada-data">${dataFormatada}</span>
                </div>
                
                ${(entrada.imagens && entrada.imagens.length > 0) ? `<div class="card-imagens-preview">${imagensPreviewHtml}</div>` : ''}

                <div class="entrada-conteudo">${conteudoPreview}</div>
                
                ${(entrada.tags && entrada.tags.length > 0) ? `<div class="entrada-tags">${tagsHtml}</div>` : ''}
                
                <div class="entrada-actions">
                    <button class="btn-icon favorite ${favoritoBtnClass}" onclick="diario.toggleFavorito('${entrada.id}')" title="Favoritar entrada">
                        <i class="${favoritoClass}"></i>
                    </button>
                    <button class="btn-icon edit" onclick="diario.editarEntrada('${entrada.id}')" title="Editar entrada">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="diario.excluirEntrada('${entrada.id}')" title="Excluir entrada">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    setDataAtual() { const hoje = new Date(); this.dataInput.value = hoje.toISOString().split('T')[0]; }
    generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
    
    async addEntrada(entrada) { await this.db.add('entradas', entrada); }
    async updateEntrada(entradaAtualizada) { await this.db.put('entradas', entradaAtualizada); }
    
    async excluirEntrada(id) {
        if (this.pinLocked) return;
        if (!confirm('Tem certeza que deseja excluir esta entrada?')) return;
        try {
            await this.db.delete('entradas', id);
            await this.loadEntradas();
            this.filtrarEntradas();
            this.showNotification('Entrada excluída.', 'success');
        } catch (error) {
            console.error("Erro ao excluir:", error);
            this.showNotification('Erro ao excluir entrada.', 'error');
        }
    }

    // ===== LÓGICA DE FILTRO (MODIFICADA) =====
    
    // NOVO: Handle Filtro de Humor
    handleFiltroHumor(e) {
        const btn = e.target.closest('.btn-filter-humor');
        if (!btn) return;

        const humor = btn.dataset.humor;
        
        // Desmarcar
        if (this.filtroHumorAtivo === humor) {
            this.filtroHumorAtivo = null;
            btn.classList.remove('active');
        } else {
            // Marcar novo
            this.filtroHumorAtivo = humor;
            this.filtroHumorContainer.querySelectorAll('.btn-filter-humor').forEach(b => {
                b.classList.toggle('active', b.dataset.humor === humor);
            });
        }
        this.filtrarEntradas();
    }

    // NOVO: Handle Filtro de Favorito
    handleFiltroFavorito() {
        this.filtroFavoritoAtivo = !this.filtroFavoritoAtivo;
        this.filtroFavoritoBtn.classList.toggle('active', this.filtroFavoritoAtivo);
        this.filtrarEntradas();
    }


    // MODIFICADO: Agora inclui filtros de humor e favorito
    filtrarEntradas() {
        if (this.pinLocked) return;
        const termoBusca = this.buscaInput.value.toLowerCase().trim();
        const dataFiltro = this.filtroDataInput.value;
        let entradasFiltradas = this.entradas;

        // Filtro de Texto
        if (termoBusca) {
            if (termoBusca.startsWith('tag:')) {
                const tag = termoBusca.substring(4);
                entradasFiltradas = entradasFiltradas.filter(e => 
                    (e.tags || []).some(t => t.toLowerCase().includes(tag))
                );
            } else {
                entradasFiltradas = entradasFiltradas.filter(e => 
                    e.titulo.toLowerCase().includes(termoBusca) ||
                    (e.conteudoTexto || e.conteudo).toLowerCase().includes(termoBusca) ||
                    (e.tags || []).some(tag => tag.toLowerCase().includes(termoBusca))
                );
            }
        }
        
        // Filtro de Data
        if (dataFiltro) {
            entradasFiltradas = entradasFiltradas.filter(e => e.data === dataFiltro);
        }

        // NOVO: Filtro de Humor
        if (this.filtroHumorAtivo) {
            entradasFiltradas = entradasFiltradas.filter(e => e.humor === this.filtroHumorAtivo);
        }

        // NOVO: Filtro de Favorito
        if (this.filtroFavoritoAtivo) {
            entradasFiltradas = entradasFiltradas.filter(e => e.favorito === true);
        }

        this.renderEntradas(entradasFiltradas);
    }

    limparFiltros() { 
        this.buscaInput.value = ''; 
        this.filtroDataInput.value = ''; 
        // NOVO: Reseta filtros rápidos
        this.filtroHumorAtivo = null;
        this.filtroFavoritoAtivo = false;
        this.filtroHumorContainer.querySelectorAll('.btn-filter-humor').forEach(b => b.classList.remove('active'));
        this.filtroFavoritoBtn.classList.remove('active');

        this.renderEntradas(); 
    }
    
    // ===== IMPORTAÇÃO / EXPORTAÇÃO (Existente e Modificada) =====

    async handleFileImport(event) {
        if (this.pinLocked) return;
        const file = event.target.files[0];
        if (!file) return;
        if (file.type !== 'application/json') {
            this.showNotification('Arquivo inválido. Selecione um .json.', 'error');
            event.target.value = ''; return;
        }
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.entradas || !Array.isArray(data.entradas)) throw new Error('JSON inválido.');
                await this.mergeEntradas(data.entradas);
            } catch (error) { this.showNotification('Erro ao ler o arquivo.', 'error'); } 
            finally { event.target.value = ''; }
        };
        reader.onerror = () => { this.showNotification('Erro ao tentar ler o arquivo.', 'error'); event.target.value = ''; };
        reader.readAsText(file);
    }

    async mergeEntradas(entradasImportadas) {
        let novasEntradasCount = 0;
        try {
            const tx = this.db.transaction('entradas', 'readwrite');
            const store = tx.store;
            const idsExistentes = new Set(await store.getAllKeys());
            
            const promessas = entradasImportadas.map(entrada => {
                if (entrada.id && entrada.titulo && !idsExistentes.has(entrada.id)) {
                    if (!entrada.conteudoTexto && entrada.conteudo) {
                        entrada.conteudoTexto = this.stripHtml(entrada.conteudo);
                        entrada.conteudoHtml = entrada.conteudo;
                    }
                    if (!entrada.tags) entrada.tags = [];
                    if (!entrada.imagens) entrada.imagens = [];

                    novasEntradasCount++;
                    return store.add(entrada);
                }
                return Promise.resolve();
            });

            await Promise.all(promessas);
            await tx.done;

            if (novasEntradasCount > 0) {
                await this.loadEntradas();
                this.showNotification(`${novasEntradasCount} novas entradas importadas!`, 'success');
            } else { this.showNotification('Nenhuma entrada nova para importar.', 'info'); }

        } catch (error) {
            console.error("Erro ao importar entradas:", error);
            this.showNotification('Erro durante a importação.', 'error');
        }
    }

    renderEntradas(entradas = this.entradas) {
        // Ordena por favorito primeiro, depois por data
        entradas.sort((a, b) => {
            if (a.favorito !== b.favorito) return a.favorito ? -1 : 1;
            return new Date(b.data) - new Date(a.data);
        });

        this.updateEntradasCount(entradas.length);
        
        // NOVO: Lógica de exibição com filtros
        const totalEntradas = this.entradas.length;
        const totalExibido = entradas.length;
        const filtrosAtivos = this.buscaInput.value !== '' || this.filtroDataInput.value !== '' || this.filtroHumorAtivo || this.filtroFavoritoAtivo;

        if (totalEntradas === 0) {
            // Nenhuma entrada salva
            this.listaEntradas.style.display = 'none';
            this.semEntradas.style.display = 'block';
            this.semEntradas.innerHTML = `
                <i class="fas fa-book-open"></i>
                <h3>Nenhuma entrada encontrada</h3>
                <p>Comece escrevendo sua primeira entrada no diário!</p>`;
        } else if (totalExibido === 0 && filtrosAtivos) {
            // Entradas existem, mas filtros não acharam nada
            this.listaEntradas.style.display = 'none';
            this.semEntradas.style.display = 'block';
            this.semEntradas.innerHTML = `
                <i class="fas fa-filter"></i>
                <h3>Nenhuma entrada corresponde aos filtros</h3>
                <p>Tente ajustar sua busca ou limpar os filtros.</p>`;
        } else {
            // Exibe entradas
            this.listaEntradas.style.display = 'grid';
            this.semEntradas.style.display = 'none';
            this.listaEntradas.innerHTML = entradas.map(e => this.createEntradaCard(e)).join('');
        }
    }


    updateEntradasCount(count) { 
        if (count === this.entradas.length) {
            this.totalEntradas.textContent = count === 1 ? '1 entrada' : `${count} entradas`; 
        } else {
            this.totalEntradas.textContent = `Exibindo ${count} de ${this.entradas.length}`;
        }
    }
    formatarData(dataString) { const data = new Date(dataString + 'T00:00:00'); return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });}
    escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
    stripHtml(html) { const doc = new DOMParser().parseFromString(html, 'text/html'); return doc.body.textContent || ""; }

    saveToStorage() {
        console.warn("saveToStorage() está obsoleto, os dados são salvos diretamente no IndexedDB.");
    }
    
    async loadEntradas() {
        if (!this.db || this.pinLocked) {
            console.warn("DB não inicializado ou app travado, aguardando...");
            return;
        }
        try {
            this.entradas = await this.db.getAll('entradas');
            this.entradas.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
            this.renderEntradas();
            this.buscarRecordacoes(); // NOVO: Chama a busca por recordações
        } catch (error) {
            console.error("Erro ao carregar entradas do IndexedDB:", error);
            this.showNotification('Erro ao carregar entradas.', 'error');
        }
    }

    showNotification(message, type = 'info') { if (typeof adicionarNotificacao === 'function') { const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'; adicionarNotificacao(message, icon); } else { alert(message); } }
    
    downloadEntradas() {
        if (this.pinLocked) return;
        if (this.entradas.length === 0) {
            this.showNotification('Não há entradas para baixar.', 'info');
            return;
        }
        this.showDownloadModal();
    }

    showDownloadModal() {
        document.querySelector('.download-modal-overlay')?.remove();
        const modal = document.createElement('div');
        modal.className = 'download-modal-overlay';
        modal.innerHTML = `
            <div class="download-modal">
                <div class="download-modal-header">
                    <h3><i class="fas fa-download"></i> Baixar Entradas do Diário</h3>
                    <button class="modal-close" onclick="this.closest('.download-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="download-modal-body">
                    <p>Escolha o formato para baixar suas ${this.entradas.length} entradas:</p>
                    <div class="download-options">
                        <button class="download-option" onclick="window.diario.downloadJSON()">
                            <i class="fas fa-code"></i>
                            <div>
                                <strong>JSON</strong>
                                <small>Formato estruturado para backup</small>
                            </div>
                        </button>
                        <button class="download-option" onclick="window.diario.downloadTXT()">
                            <i class="fas fa-file-alt"></i>
                            <div>
                                <strong>Texto</strong>
                                <small>Formato legível para leitura</small>
                            </div>
                        </button>
                        <button class="download-option" onclick="window.diario.downloadMarkdown()">
                            <i class="fab fa-markdown"></i>
                            <div>
                                <strong>Markdown</strong>
                                <small>Formato para documentação</small>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }

    downloadJSON() {
        const dados = {
            titulo: 'Diário Pessoal - Sol de Sóter',
            entradas: this.entradas, totalEntradas: this.entradas.length,
            exportadoEm: new Date().toISOString(), versao: '2.0-idb'
        };
        this.createDownload(JSON.stringify(dados, null, 2), `diario-pessoal-${this.getDateString()}.json`, 'application/json');
        document.querySelector('.download-modal-overlay')?.remove();
        this.showNotification('Arquivo JSON baixado com sucesso!', 'success');
    }

    downloadTXT() {
        let conteudo = `DIÁRIO PESSOAL - SOL DE SÓTER\n`;
        conteudo += `Exportado em: ${new Date().toLocaleString('pt-BR')}\n`;
        conteudo += `Total de entradas: ${this.entradas.length}\n${'='.repeat(50)}\n\n`;
        this.entradas.forEach((entrada, index) => {
            conteudo += `ENTRADA ${index + 1}\n`;
            conteudo += `Título: ${entrada.titulo}\n`;
            conteudo += `Data: ${this.formatarData(entrada.data)}\n`;
            if (entrada.tags && entrada.tags.length > 0) conteudo += `Tags: ${entrada.tags.join(', ')}\n`;
            if (entrada.humor) conteudo += `Humor: ${entrada.humor}\n`;
            if (entrada.imagens && entrada.imagens.length > 0) conteudo += `Imagens: ${entrada.imagens.length} anexos\n`;
            conteudo += `\n${entrada.conteudoTexto || entrada.conteudo}\n\n${'-'.repeat(30)}\n\n`;
        });
        this.createDownload(conteudo, `diario-pessoal-${this.getDateString()}.txt`, 'text/plain');
        document.querySelector('.download-modal-overlay')?.remove();
        this.showNotification('Arquivo de texto baixado com sucesso!', 'success');
    }

    downloadMarkdown() {
        let conteudo = `# Diário Pessoal - Sol de Sóter\n\n`;
        conteudo += `**Exportado em:** ${new Date().toLocaleString('pt-BR')}  \n`;
        conteudo += `**Total de entradas:** ${this.entradas.length}\n\n---\n\n`;
        this.entradas.forEach((entrada, index) => {
            conteudo += `## ${entrada.titulo}\n\n`;
            conteudo += `**Data:** ${this.formatarData(entrada.data)}  \n`;
            if (entrada.humor) conteudo += `**Humor:** ${entrada.humor}  \n`;
            if (entrada.tags && entrada.tags.length > 0) conteudo += `**Tags:** ${entrada.tags.map(tag => `\`${tag}\``).join(', ')}  \n`;
            conteudo += `\n${entrada.conteudoTexto || entrada.conteudo}\n\n`;
            if (entrada.imagens && entrada.imagens.length > 0) {
                conteudo += `**Imagens:**\n\n`;
                conteudo += `*(${entrada.imagens.length} imagens anexadas - não incluídas no Markdown)*\n\n`
            }
            if (index < this.entradas.length - 1) conteudo += `---\n\n`;
        });
        this.createDownload(conteudo, `diario-pessoal-${this.getDateString()}.md`, 'text/markdown');
        document.querySelector('.download-modal-overlay')?.remove();
        this.showNotification('Arquivo Markdown baixado com sucesso!', 'success');
    }

    createDownload(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    getDateString() {
        return new Date().toISOString().split('T')[0];
    }

    // ===== NOVOS MÉTODOS =====

    // Gerenciamento de Upload de Imagens (Existente)
    handleImageUpload(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        const maxImagens = 5;
        if (this.imagensSelecionadas.length + files.length > maxImagens) {
            this.showNotification(`Você só pode anexar no máximo ${maxImagens} imagens.`, 'error');
            return;
        }

        files.forEach(file => {
            if (!file.type.startsWith('image/')) {
                this.showNotification(`Arquivo '${file.name}' não é uma imagem.`, 'error');
                return;
            }
            if (file.size > 2 * 1024 * 1024) { 
                this.showNotification(`Imagem '${file.name}' é muito grande (Max: 2MB).`, 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                this.imagensSelecionadas.push(e.target.result);
                this.renderizarPreviewImagens();
            };
            reader.onerror = () => {
                this.showNotification(`Erro ao ler a imagem '${file.name}'.`, 'error');
            };
            reader.readAsDataURL(file);
        });
        event.target.value = '';
    }

    renderizarPreviewImagens() {
        this.imagensPreview.innerHTML = '';
        this.imagensSelecionadas.forEach((imgSrc, index) => {
            this.imagensPreview.innerHTML += `
                <div class="preview-imagem-container">
                    <img src="${imgSrc}" class="preview-imagem" alt="Preview ${index + 1}">
                    <button type="button" class="remover-imagem-btn" data-index="${index}">&times;</button>
                </div>
            `;
        });
    }

    removerImagem(index) {
        this.imagensSelecionadas.splice(index, 1);
        this.renderizarPreviewImagens();
    }

    // Templates de Entrada (Existente)
    aplicarTemplate(templateName) {
        let templateConteudo = '';
        if (templateName === 'gratidao') {
            templateConteudo = `<h2>Gratidão do Dia</h2><p>Hoje sou grato(a) por:</p><ol><li>...</li><li>...</li><li>...</li></ol>`;
        } else if (templateName === 'sonho') {
            templateConteudo = `<h2>Registro de Sonho</h2><p>Eu sonhei que...</p><p><strong>Pessoas:</strong> </p><p><strong>Lugares:</strong> </p><p><strong>Sentimentos:</strong> </p>`;
        }
        
        this.quill.root.innerHTML = templateConteudo;
        this.quill.focus();
    }

    // Modal de Leitura (Existente)
    async showLeituraModal(id) {
        if (this.pinLocked) return;
        try {
            const entrada = await this.db.get('entradas', id);
            if (!entrada) return;

            // Armazena o ID no modal para o export PDF
            this.leituraModal.dataset.currentId = id; 

            this.leituraTitulo.textContent = entrada.titulo;
            this.leituraData.innerHTML = `<i class="fas fa-calendar-alt"></i> ${this.formatarData(entrada.data)}`;
            
            if (entrada.humor && this.humorIconMap[entrada.humor]) {
                this.leituraHumor.innerHTML = `<i class="fas ${this.humorIconMap[entrada.humor]}"></i> ${entrada.humor}`;
                this.leituraHumor.style.display = 'flex';
            } else {
                this.leituraHumor.style.display = 'none';
            }

            this.leituraConteudo.innerHTML = entrada.conteudoHtml || entrada.conteudo;

            if (entrada.imagens && entrada.imagens.length > 0) {
                this.leituraImagens.innerHTML = entrada.imagens.map(src => 
                    `<img src="${src}" class="leitura-imagem" alt="Imagem da entrada">`
                ).join('');
                this.leituraImagens.style.display = 'flex';
            } else {
                this.leituraImagens.style.display = 'none';
            }

            if (entrada.tags && entrada.tags.length > 0) {
                this.leituraTags.innerHTML = entrada.tags.map(tag => 
                    `<span class="tag">${this.escapeHtml(tag)}</span>`
                ).join('');
                this.leituraTags.style.display = 'flex';
            } else {
                this.leituraTags.style.display = 'none';
            }

            this.leituraModal.style.display = 'flex';

        } catch (error) {
            console.error("Erro ao abrir modal de leitura:", error);
            this.showNotification('Não foi possível carregar a entrada completa.', 'error');
        }
    }

    // NOVO: Exportar PDF (Entrada Individual)
    async exportarEntradaParaPDF() {
        if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
            this.showNotification('Erro: Bibliotecas de PDF não carregadas.', 'error');
            return;
        }

        const btn = this.leituraExportPdfBtn;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const { jsPDF } = window.jspdf;
            const modalBody = this.leituraModal.querySelector('.modal-body');
            const titulo = this.leituraTitulo.textContent.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            
            const canvas = await html2canvas(modalBody, {
                scale: 2, // Melhor qualidade
                backgroundColor: '#1e1e2e', // Fundo para o canvas
                useCORS: true
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            // Adiciona novas páginas se o conteúdo for muito longo
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(`diario_${titulo}_${this.getDateString()}.pdf`);

        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            this.showNotification('Erro ao gerar o PDF.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-file-pdf"></i>';
        }
    }

    // NOVO: "Neste Dia..." (Recordações)
    buscarRecordacoes() {
        const hoje = new Date();
        const mesDia = hoje.toISOString().substring(5, 10); // Formato "MM-DD"
        const anoAtual = hoje.getFullYear();

        const recordacoes = this.entradas.filter(e => {
            const dataEntrada = new Date(e.data + 'T00:00:00');
            const anoEntrada = dataEntrada.getFullYear();
            return e.data.substring(5, 10) === mesDia && anoEntrada !== anoAtual;
        });

        if (recordacoes.length > 0) {
            this.renderRecordacoes(recordacoes);
            this.recordacoesSection.style.display = 'block';
        } else {
            this.recordacoesSection.style.display = 'none';
        }
    }

    renderRecordacoes(recordacoes) {
        // Ordena da mais antiga para a mais recente
        recordacoes.sort((a, b) => new Date(a.data) - new Date(b.data));

        this.recordacoesLista.innerHTML = recordacoes.map(e => {
            const ano = new Date(e.data + 'T00:00:00').getFullYear();
            const dataFormatada = this.formatarData(e.data);
            return `
                <div class="recordacao-card" data-id="${e.id}">
                    <div class="recordacao-card-header">
                        <span class="ano">${ano}</span>
                        <span class="data">${dataFormatada}</span>
                    </div>
                    <p>${this.escapeHtml(e.titulo)}</p>
                </div>
            `;
        }).join('');
    }


    // Modal de Estatísticas (MODIFICADO)
    showStatsModal() {
        if (this.pinLocked) return;
        
        try {
            this.gerarGraficoHumor();
            this.gerarListaTags();
        } catch (error) {
            console.error("Erro ao gerar estatísticas:", error);
            this.showNotification("Ocorreu um erro ao gerar as estatísticas.", "error");
            // Mesmo se falhar, tenta abrir o modal (pode mostrar erro parcial)
        }
        
        this.statsModal.style.display = 'flex'; // Esta linha agora será alcançada
    }

    // ===== FUNÇÃO CORRIGIDA (da vez anterior) =====
    gerarGraficoHumor() {
        const contagemHumor = { feliz: 0, normal: 0, neutro: 0, triste: 0, irritado: 0 };
        let totalHumor = 0;
        
        this.entradas.forEach(e => {
            if (e.humor && contagemHumor.hasOwnProperty(e.humor)) {
                contagemHumor[e.humor]++;
                totalHumor++;
            }
        });

        // Destrói o gráfico antigo se ele existir
        if (this.humorChart) {
            this.humorChart.destroy();
        }

        // Limpa o container e recria o canvas
        // Usamos this.humorChartCanvasElement (o elemento <canvas>)
        if (this.humorChartCanvasElement && this.humorChartCanvasElement.parentElement) {
             this.humorChartCanvasElement.parentElement.innerHTML = '<canvas id="humor-chart"></canvas>';
        }
        // Re-seleciona o novo elemento canvas
        this.humorChartCanvasElement = document.getElementById('humor-chart');
        
        // Se não houver elemento (erro), saia
        if (!this.humorChartCanvasElement) {
            console.error("Elemento #humor-chart não encontrado após recriação.");
            return;
        }
        
        // Pega o container-pai para o caso de não haver dados
        const chartContainer = this.humorChartCanvasElement.parentElement;
        if (!chartContainer) return;


        if (totalHumor === 0) {
            chartContainer.innerHTML = '<p style="text-align: center; color: #a6adc8;">Nenhum humor registrado ainda.</p>';
            return;
        }

        const labels = Object.keys(contagemHumor);
        const data = Object.values(contagemHumor);
        const colors = Object.values(this.humorColorMap);

        // Obtém o contexto DO NOVO elemento
        const ctx = this.humorChartCanvasElement.getContext('2d');

        this.humorChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Contagem de Humor',
                    data: data,
                    backgroundColor: colors,
                    borderColor: '#313244',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#cdd6f4',
                            font: { family: "'Poppins', sans-serif" }
                        }
                    }
                }
            }
        });
    }
    // ===========================

    gerarListaTags() {
        const contagemTags = {};
        let totalTags = 0;

        this.entradas.forEach(e => {
            (e.tags || []).forEach(tag => {
                const tagLimpa = tag.toLowerCase();
                contagemTags[tagLimpa] = (contagemTags[tagLimpa] || 0) + 1;
                totalTags++;
            });
        });

        if (totalTags === 0) {
            this.statsTagsLista.innerHTML = '<li>Nenhuma tag usada ainda.</li>';
            return;
        }

        const tagsOrdenadas = Object.entries(contagemTags)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10); // Top 10

        this.statsTagsLista.innerHTML = tagsOrdenadas.map(([nome, count]) => `
            <li>
                <span class="tag-nome">${this.escapeHtml(nome)}</span>
                <span class="tag-count">${count}</span>
            </li>
        `).join('');
    }

    // Lembretes / Notificações (Existente)
    async pedirPermissaoNotificacao() {
        if (!('Notification' in window)) {
            this.showNotification('Este navegador não suporta notificações.', 'error');
            return;
        }

        const permissao = await Notification.requestPermission();
        
        if (permissao === 'granted') {
            this.showNotification('Permissão concedida! Lembretes estão ativos.', 'success');
            new Notification('Diário Pessoal', {
                body: 'Tudo pronto para os lembretes!',
                icon: 'img/soldesoter_logo.png'
            });
        } else if (permissao === 'denied') {
            this.showNotification('Permissão de notificação foi negada.', 'info');
        } else {
            this.showNotification('Permissão de notificação pendente.', 'info');
        }
    }

}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Verifica bibliotecas essenciais
    const libs = ['idb', 'Quill', 'Tagify', 'Chart', 'html2canvas', 'jspdf'];
    let libsFaltando = [];
    
    libs.forEach(lib => {
        // Verifica window[lib] (ex: Quill) ou window[lib.toLowerCase()] (ex: idb)
        if (typeof window[lib] === 'undefined' && typeof window[lib.toLowerCase()] === 'undefined') {
            libsFaltando.push(lib);
        }
    });

    if (libsFaltando.length > 0) {
        console.error(`ERRO: Bibliotecas essenciais (${libsFaltando.join(', ')}) não foram carregadas. Verifique os links no HTML.`);
        alert(`Erro ao carregar a aplicação. Bibliotecas faltando: ${libsFaltando.join(', ')}. Verifique a conexão com a internet e os links de script no HTML.`);
        return;
    }
    
    // Inicia a aplicação
    window.diario = new DiarioPessoal();
});