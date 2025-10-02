// ===== DIÁRIO PESSOAL - LÓGICA JAVASCRIPT =====

class DiarioPessoal {
    constructor() {
        this.entradas = [];
        this.entradaEditando = null;
        this.humorSelecionado = null;
        this.storageKey = 'diario-pessoal-entradas';
        
        this.humorIconMap = {
            feliz: 'fa-smile-beam',
            normal: 'fa-smile',
            neutro: 'fa-meh',
            triste: 'fa-sad-tear',
            irritado: 'fa-angry'
        };

        this.initializeElements();
        this.bindEvents();
        this.loadEntradas();
        this.setDataAtual();
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

        // Elementos de busca
        this.buscaInput = document.getElementById('busca-diario');
        this.filtroDataInput = document.getElementById('filtro-data');
        this.limparFiltrosBtn = document.getElementById('limpar-filtros');

        // Elementos de exibição
        this.listaEntradas = document.getElementById('lista-entradas');
        this.totalEntradas = document.getElementById('total-entradas');
        this.semEntradas = document.getElementById('sem-entradas');
        
        // Elementos de Ações
        this.downloadBtn = document.getElementById('download-entradas');
        this.importBtn = document.getElementById('import-entradas');
        this.importFileInput = document.getElementById('import-file-input');
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

        this.humorSelector.addEventListener('click', (e) => {
            const humorBtn = e.target.closest('.humor-btn');
            if (humorBtn) {
                this.selecionarHumor(humorBtn.dataset.humor);
            }
        });

        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) this.loadEntradas();
        });
    }
    
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

    handleSubmit(e) {
        e.preventDefault();
        const titulo = this.tituloInput.value.trim();
        const data = this.dataInput.value;
        const conteudo = this.conteudoTextarea.value.trim();
        const tagsString = this.tagsInput.value.trim();

        if (!titulo || !data || !conteudo) {
            this.showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean) : [];

        const entrada = {
            id: this.entradaEditando ? this.entradaEditando.id : this.generateId(),
            titulo, data, conteudo, tags,
            humor: this.humorSelecionado,
            favorito: this.entradaEditando ? this.entradaEditando.favorito : false,
            criadoEm: this.entradaEditando ? this.entradaEditando.criadoEm : new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };

        if (this.entradaEditando) {
            this.updateEntrada(entrada);
        } else {
            this.addEntrada(entrada);
        }

        this.resetForm();
        this.saveToStorage();
        this.filtrarEntradas(); // Usa filtrar para manter a busca ativa
        this.showNotification('Entrada salva com sucesso!', 'success');
    }

    editarEntrada(id) {
        const entrada = this.entradas.find(e => e.id === id);
        if (!entrada) return;

        this.entradaEditando = entrada;
        this.tituloInput.value = entrada.titulo;
        this.dataInput.value = entrada.data;
        this.conteudoTextarea.value = entrada.conteudo;
        this.tagsInput.value = (entrada.tags || []).join(', ');
        
        this.selecionarHumor(entrada.humor || null);

        this.cancelarBtn.style.display = 'inline-flex';
        this.salvarBtn.innerHTML = '<i class="fas fa-edit"></i> Atualizar Entrada';
        document.querySelector('.entrada-form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    resetForm() {
        this.form.reset();
        this.setDataAtual();
        this.selecionarHumor(null);
        this.entradaEditando = null;
        this.cancelarBtn.style.display = 'none';
        this.salvarBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Entrada';
    }

    cancelarEdicao() {
        this.resetForm();
    }

    toggleFavorito(id) {
        const index = this.entradas.findIndex(e => e.id === id);
        if (index !== -1) {
            this.entradas[index].favorito = !this.entradas[index].favorito;
            this.saveToStorage();
            this.filtrarEntradas();
        }
    }

    createEntradaCard(entrada) {
        const dataFormatada = this.formatarData(entrada.data);
        const tagsHtml = (entrada.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');
        
        const humorIconClass = entrada.humor ? this.humorIconMap[entrada.humor] : '';
        const humorHtml = humorIconClass ? `<i class="fas ${humorIconClass} entrada-humor" title="${entrada.humor}"></i>` : '';

        const isFavorito = entrada.favorito;
        const favoritoClass = isFavorito ? 'fas fa-star' : 'far fa-star';
        const favoritoBtnClass = isFavorito ? 'favorited' : '';

        return `
            <div class="entrada-card" data-id="${entrada.id}">
                <div class="entrada-header">
                    <div style="display: flex; align-items: center; min-width: 0;">
                        ${humorHtml}
                        <h3 class="entrada-titulo">${this.escapeHtml(entrada.titulo)}</h3>
                    </div>
                    <span class="entrada-data">${dataFormatada}</span>
                </div>
                <div class="entrada-conteudo">${this.escapeHtml(entrada.conteudo)}</div>
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
    addEntrada(entrada) { this.entradas.unshift(entrada); }
    updateEntrada(entradaAtualizada) {
        const index = this.entradas.findIndex(e => e.id === entradaAtualizada.id);
        if (index !== -1) this.entradas[index] = entradaAtualizada;
    }
    excluirEntrada(id) {
        if (!confirm('Tem certeza que deseja excluir esta entrada?')) return;
        this.entradas = this.entradas.filter(e => e.id !== id);
        this.saveToStorage();
        this.filtrarEntradas();
        this.showNotification('Entrada excluída.', 'success');
    }
    filtrarEntradas() {
        const termoBusca = this.buscaInput.value.toLowerCase().trim();
        const dataFiltro = this.filtroDataInput.value;
        let entradasFiltradas = this.entradas;

        if (termoBusca) {
            entradasFiltradas = entradasFiltradas.filter(e => 
                e.titulo.toLowerCase().includes(termoBusca) ||
                e.conteudo.toLowerCase().includes(termoBusca) ||
                (e.tags || []).some(tag => tag.toLowerCase().includes(termoBusca))
            );
        }
        if (dataFiltro) {
            entradasFiltradas = entradasFiltradas.filter(e => e.data === dataFiltro);
        }
        this.renderEntradas(entradasFiltradas);
    }
    limparFiltros() { this.buscaInput.value = ''; this.filtroDataInput.value = ''; this.renderEntradas(); }
    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (file.type !== 'application/json') {
            this.showNotification('Arquivo inválido. Selecione um .json.', 'error');
            event.target.value = ''; return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.entradas || !Array.isArray(data.entradas)) throw new Error('JSON inválido.');
                this.mergeEntradas(data.entradas);
            } catch (error) { this.showNotification('Erro ao ler o arquivo.', 'error'); } 
            finally { event.target.value = ''; }
        };
        reader.onerror = () => { this.showNotification('Erro ao tentar ler o arquivo.', 'error'); event.target.value = ''; };
        reader.readAsText(file);
    }
    mergeEntradas(entradasImportadas) {
        let novasEntradasCount = 0;
        const idsExistentes = new Set(this.entradas.map(e => e.id));
        entradasImportadas.forEach(entrada => {
            if (entrada.id && entrada.titulo && !idsExistentes.has(entrada.id)) {
                this.entradas.push(entrada);
                novasEntradasCount++;
            }
        });
        if (novasEntradasCount > 0) {
            this.saveToStorage();
            this.loadEntradas();
            this.showNotification(`${novasEntradasCount} novas entradas importadas!`, 'success');
        } else { this.showNotification('Nenhuma entrada nova para importar.', 'info'); }
    }
    renderEntradas(entradas = this.entradas) {
        this.updateEntradasCount(entradas.length);
        if (entradas.length === 0) {
            this.listaEntradas.style.display = 'none';
            this.semEntradas.style.display = 'block';
        } else {
            this.listaEntradas.style.display = 'grid';
            this.semEntradas.style.display = 'none';
            this.listaEntradas.innerHTML = entradas.map(e => this.createEntradaCard(e)).join('');
        }
    }
    updateEntradasCount(count) { this.totalEntradas.textContent = count === 1 ? '1 entrada' : `${count} entradas`; }
    formatarData(dataString) { const data = new Date(dataString + 'T00:00:00'); return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });}
    escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
    saveToStorage() { localStorage.setItem(this.storageKey, JSON.stringify(this.entradas)); }
    loadEntradas() {
        const dados = localStorage.getItem(this.storageKey);
        this.entradas = dados ? JSON.parse(dados) : [];
        this.entradas.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
        this.renderEntradas();
    }
    showNotification(message, type = 'info') { if (typeof adicionarNotificacao === 'function') { const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'; adicionarNotificacao(message, icon); } else { alert(message); } }
    
    downloadEntradas() {
        if (this.entradas.length === 0) {
            this.showNotification('Não há entradas para baixar.', 'info');
            return;
        }
        this.showDownloadModal();
    }

    showDownloadModal() {
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
        if (!document.getElementById('download-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'download-modal-styles';
            styles.textContent = `
                .download-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 1000; }
                .download-modal { background: #313244; border-radius: 12px; width: 90%; max-width: 500px; border: 1px solid #45475a; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
                .download-modal-header { padding: 20px; border-bottom: 1px solid #45475a; display: flex; justify-content: space-between; align-items: center; }
                .download-modal-header h3 { color: #cdd6f4; margin: 0; font-size: 1.2rem; display: flex; align-items: center; gap: 10px; }
                .modal-close { background: none; border: none; color: #a6adc8; cursor: pointer; padding: 5px; border-radius: 4px; transition: all 0.3s ease; }
                .modal-close:hover { background: #45475a; color: #cdd6f4; }
                .download-modal-body { padding: 20px; }
                .download-modal-body p { color: #bac2de; margin-bottom: 20px; }
                .download-options { display: flex; flex-direction: column; gap: 10px; }
                .download-option { background: #45475a; border: 1px solid #585b70; border-radius: 8px; padding: 15px; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 15px; text-align: left; }
                .download-option:hover { background: #585b70; border-color: #89b4fa; transform: translateY(-2px); }
                .download-option i { font-size: 1.5rem; color: #89b4fa; width: 30px; text-align: center; }
                .download-option div { flex: 1; }
                .download-option strong { color: #cdd6f4; display: block; font-size: 1rem; margin-bottom: 2px; }
                .download-option small { color: #a6adc8; font-size: 0.85rem; }
            `;
            document.head.appendChild(styles);
        }
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }

    downloadJSON() {
        const dados = {
            titulo: 'Diário Pessoal - Sol de Sóter',
            entradas: this.entradas, totalEntradas: this.entradas.length,
            exportadoEm: new Date().toISOString(), versao: '1.0'
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
            conteudo += `\n${entrada.conteudo}\n\n${'-'.repeat(30)}\n\n`;
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
            conteudo += `\n${entrada.conteudo}\n\n`;
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
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.diario = new DiarioPessoal();
});
