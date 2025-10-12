// ===== SISTEMA UNIFICADO DE IMPORTAÇÃO E EXPORTAÇÃO =====
// Gerencia todos os dados do site: Finanças, Livros, Mangás e Diário

class UnifiedDataManager {
    constructor() {
        this.storageKeys = {
            financas: 'financeiro-widget',
            livros: 'livrosTracker',
            mangas: 'mangasTracker',
            diario: 'diario-pessoal-entradas',
            sonhos: 'sonhos-objetivos',
            viagens: 'viagens-dados',
            wishlist: 'wishlist-items',
            cinema: 'midiasTracker',
            planejamento: 'planejamento-dados'
        };
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.exportBtn = document.getElementById('unified-export-btn');
        this.importBtn = document.getElementById('unified-import-btn');
        this.importFileInput = document.getElementById('unified-import-file');
    }

    bindEvents() {
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this.showExportModal());
        }
        
        if (this.importBtn) {
            this.importBtn.addEventListener('click', () => this.importFileInput.click());
        }
        
        if (this.importFileInput) {
            this.importFileInput.addEventListener('change', (e) => this.handleFileImport(e));
        }
    }

    // Coleta todos os dados do localStorage
    collectAllData() {
        const allData = {
            metadata: {
                siteName: 'Sol de Sóter',
                exportedAt: new Date().toISOString(),
                version: '1.0',
                description: 'Backup completo de todos os dados do site'
            },
            data: {}
        };

        // Coleta dados de cada seção
        Object.entries(this.storageKeys).forEach(([section, key]) => {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    allData.data[section] = JSON.parse(data);
                } catch (error) {
                    console.warn(`Erro ao parsear dados de ${section}:`, error);
                    allData.data[section] = null;
                }
            } else {
                allData.data[section] = null;
            }
        });

        return allData;
    }

    // Exporta todos os dados
    exportAllData() {
        const allData = this.collectAllData();
        const dataStr = JSON.stringify(allData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `sol-de-soter-backup-${this.getDateString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Backup completo exportado com sucesso!', 'success');
    }

    // Exporta dados específicos de uma seção
    exportSectionData(sections) {
        const exportData = {
            metadata: {
                siteName: 'Sol de Sóter',
                exportedAt: new Date().toISOString(),
                version: '1.0',
                sections: sections,
                description: `Backup das seções: ${sections.join(', ')}`
            },
            data: {}
        };

        sections.forEach(section => {
            if (this.storageKeys[section]) {
                const data = localStorage.getItem(this.storageKeys[section]);
                if (data) {
                    try {
                        exportData.data[section] = JSON.parse(data);
                    } catch (error) {
                        console.warn(`Erro ao parsear dados de ${section}:`, error);
                        exportData.data[section] = null;
                    }
                }
            }
        });

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `sol-de-soter-${sections.join('-')}-${this.getDateString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification(`Dados de ${sections.join(', ')} exportados com sucesso!`, 'success');
    }

    // Importa dados do arquivo
    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'application/json') {
            this.showNotification('Arquivo inválido. Selecione um arquivo JSON.', 'error');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                this.processImportedData(importedData);
            } catch (error) {
                this.showNotification('Erro ao ler o arquivo. Verifique se é um JSON válido.', 'error');
                console.error('Erro de importação:', error);
            } finally {
                event.target.value = '';
            }
        };

        reader.onerror = () => {
            this.showNotification('Erro ao tentar ler o arquivo.', 'error');
            event.target.value = '';
        };

        reader.readAsText(file);
    }

    // Processa os dados importados
    processImportedData(importedData) {
        if (!importedData.data || typeof importedData.data !== 'object') {
            this.showNotification('Formato de arquivo inválido.', 'error');
            return;
        }

        this.showImportModal(importedData);
    }

    // Restaura os dados no localStorage
    restoreData(importedData, selectedSections = null) {
        let restoredSections = [];
        const sectionsToRestore = selectedSections || Object.keys(importedData.data);

        sectionsToRestore.forEach(section => {
            if (importedData.data[section] && this.storageKeys[section]) {
                try {
                    localStorage.setItem(
                        this.storageKeys[section], 
                        JSON.stringify(importedData.data[section])
                    );
                    restoredSections.push(section);
                } catch (error) {
                    console.error(`Erro ao restaurar dados de ${section}:`, error);
                }
            }
        });

        if (restoredSections.length > 0) {
            this.showNotification(
                `Dados restaurados com sucesso: ${restoredSections.join(', ')}. Recarregue a página para ver as alterações.`, 
                'success'
            );
            
            // Opcional: recarregar a página automaticamente após 3 segundos
            setTimeout(() => {
                if (confirm('Deseja recarregar a página agora para aplicar as alterações?')) {
                    window.location.reload();
                }
            }, 3000);
        } else {
            this.showNotification('Nenhum dado foi restaurado.', 'warning');
        }
    }

    // Modal de exportação
    showExportModal() {
        const modal = document.createElement('div');
        modal.className = 'unified-modal-overlay';
        modal.innerHTML = `
            <div class="unified-modal">
                <div class="unified-modal-header">
                    <h3><i class="fas fa-download"></i> Exportar Dados</h3>
                    <button class="modal-close" onclick="this.closest('.unified-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="unified-modal-body">
                    <p>Escolha quais dados você deseja exportar:</p>
                    <div class="export-options">
                        <button class="export-option full" onclick="window.unifiedDataManager.exportAllData(); this.closest('.unified-modal-overlay').remove();">
                            <i class="fas fa-database"></i>
                            <div>
                                <strong>Backup Completo</strong>
                                <small>Todos os dados do site</small>
                            </div>
                        </button>
                        <div class="section-options">
                            <h4>Ou escolha seções específicas:</h4>
                            <div class="section-grid">
                                <label class="section-checkbox">
                                    <input type="checkbox" value="financas" checked>
                                    <span><i class="fas fa-wallet"></i> Finanças</span>
                                </label>
                                <label class="section-checkbox">
                                    <input type="checkbox" value="livros" checked>
                                    <span><i class="fas fa-book"></i> Livros</span>
                                </label>
                                <label class="section-checkbox">
                                    <input type="checkbox" value="mangas" checked>
                                    <span><i class="fas fa-book-open"></i> Mangás</span>
                                </label>
                                <label class="section-checkbox">
                                    <input type="checkbox" value="diario" checked>
                                    <span><i class="fas fa-journal-whills"></i> Diário</span>
                                </label>
                                <label class="section-checkbox">
                                    <input type="checkbox" value="sonhos" checked>
                                    <span><i class="fas fa-rocket"></i> Sonhos</span>
                                </label>
                                <label class="section-checkbox">
                                    <input type="checkbox" value="viagens" checked>
                                    <span><i class="fas fa-plane"></i> Viagens</span>
                                </label>
                                <label class="section-checkbox">
                                    <input type="checkbox" value="wishlist" checked>
                                    <span><i class="fas fa-shopping-cart"></i> Wishlist</span>
                                </label>
                                <label class="section-checkbox">
                                    <input type="checkbox" value="cinema" checked>
                                    <span><i class="fas fa-film"></i> Cinema</span>
                                </label>
                            </div>
                            <button class="export-selected-btn" onclick="window.unifiedDataManager.exportSelectedSections(); this.closest('.unified-modal-overlay').remove();">
                                <i class="fas fa-download"></i> Exportar Selecionados
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.addModalStyles();
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // Modal de importação
    showImportModal(importedData) {
        const availableSections = Object.keys(importedData.data).filter(
            section => importedData.data[section] !== null
        );

        const modal = document.createElement('div');
        modal.className = 'unified-modal-overlay';
        modal.innerHTML = `
            <div class="unified-modal">
                <div class="unified-modal-header">
                    <h3><i class="fas fa-upload"></i> Importar Dados</h3>
                    <button class="modal-close" onclick="this.closest('.unified-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="unified-modal-body">
                    <div class="import-info">
                        <p><strong>Arquivo:</strong> ${importedData.metadata?.siteName || 'Backup'}</p>
                        <p><strong>Exportado em:</strong> ${importedData.metadata?.exportedAt ? new Date(importedData.metadata.exportedAt).toLocaleString('pt-BR') : 'Data desconhecida'}</p>
                        <p><strong>Seções disponíveis:</strong> ${availableSections.length}</p>
                    </div>
                    <div class="import-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Atenção: Esta operação irá substituir os dados existentes nas seções selecionadas.</p>
                    </div>
                    <div class="section-options">
                        <h4>Escolha quais seções importar:</h4>
                        <div class="section-grid">
                            ${availableSections.map(section => `
                                <label class="section-checkbox">
                                    <input type="checkbox" value="${section}" checked>
                                    <span><i class="fas fa-${this.getSectionIcon(section)}"></i> ${this.getSectionName(section)}</span>
                                </label>
                            `).join('')}
                        </div>
                        <div class="import-actions">
                            <button class="import-btn" onclick="window.unifiedDataManager.importSelectedSections(${JSON.stringify(importedData).replace(/"/g, '&quot;')}); this.closest('.unified-modal-overlay').remove();">
                                <i class="fas fa-upload"></i> Importar Selecionados
                            </button>
                            <button class="cancel-btn" onclick="this.closest('.unified-modal-overlay').remove();">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // Exporta seções selecionadas
    exportSelectedSections() {
        const checkboxes = document.querySelectorAll('.section-checkbox input[type="checkbox"]:checked');
        const selectedSections = Array.from(checkboxes).map(cb => cb.value);
        
        if (selectedSections.length === 0) {
            this.showNotification('Selecione pelo menos uma seção para exportar.', 'warning');
            return;
        }

        this.exportSectionData(selectedSections);
    }

    // Importa seções selecionadas
    importSelectedSections(importedData) {
        const checkboxes = document.querySelectorAll('.section-checkbox input[type="checkbox"]:checked');
        const selectedSections = Array.from(checkboxes).map(cb => cb.value);
        
        if (selectedSections.length === 0) {
            this.showNotification('Selecione pelo menos uma seção para importar.', 'warning');
            return;
        }

        this.restoreData(importedData, selectedSections);
    }

    // Utilitários
    getSectionIcon(section) {
        const icons = {
            financas: 'wallet',
            livros: 'book',
            mangas: 'book-open',
            diario: 'journal-whills',
            sonhos: 'rocket',
            viagens: 'plane',
            wishlist: 'shopping-cart',
            cinema: 'film',
            planejamento: 'calendar-alt'
        };
        return icons[section] || 'database';
    }

    getSectionName(section) {
        const names = {
            financas: 'Finanças',
            livros: 'Livros',
            mangas: 'Mangás',
            diario: 'Diário',
            sonhos: 'Sonhos',
            viagens: 'Viagens',
            wishlist: 'Wishlist',
            cinema: 'Cinema',
            planejamento: 'Planejamento'
        };
        return names[section] || section;
    }

    getDateString() {
        return new Date().toISOString().split('T')[0];
    }

    showNotification(message, type = 'info') {
        // Tenta usar o sistema de notificações existente
        if (typeof adicionarNotificacao === 'function') {
            const icons = {
                success: 'fas fa-check-circle',
                error: 'fas fa-exclamation-circle',
                warning: 'fas fa-exclamation-triangle',
                info: 'fas fa-info-circle'
            };
            adicionarNotificacao(message, icons[type] || icons.info);
        } else {
            // Fallback para alert
            alert(message);
        }
    }

    // Adiciona estilos CSS para os modais
    addModalStyles() {
        if (document.getElementById('unified-modal-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'unified-modal-styles';
        styles.textContent = `
            .unified-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                backdrop-filter: blur(5px);
            }

            .unified-modal {
                background: #313244;
                border-radius: 12px;
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                border: 1px solid #45475a;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
            }

            .unified-modal-header {
                padding: 20px;
                border-bottom: 1px solid #45475a;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #1e1e2e;
                border-radius: 12px 12px 0 0;
            }

            .unified-modal-header h3 {
                color: #cdd6f4;
                margin: 0;
                font-size: 1.3rem;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .modal-close {
                background: none;
                border: none;
                color: #a6adc8;
                cursor: pointer;
                padding: 8px;
                border-radius: 6px;
                transition: all 0.3s ease;
                font-size: 1.1rem;
            }

            .modal-close:hover {
                background: #45475a;
                color: #cdd6f4;
            }

            .unified-modal-body {
                padding: 25px;
            }

            .unified-modal-body p {
                color: #bac2de;
                margin-bottom: 20px;
                line-height: 1.5;
            }

            .export-options, .section-options {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .export-option {
                background: #45475a;
                border: 2px solid #6c7086;
                border-radius: 8px;
                padding: 15px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 15px;
                color: #cdd6f4;
            }

            .export-option:hover {
                background: #585b70;
                border-color: #89b4fa;
                transform: translateY(-2px);
            }

            .export-option.full {
                background: linear-gradient(135deg, #89b4fa, #74c7ec);
                border-color: #89b4fa;
                color: #1e1e2e;
                font-weight: 600;
            }

            .export-option i {
                font-size: 1.5rem;
                min-width: 24px;
            }

            .section-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                margin: 15px 0;
            }

            .section-checkbox {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px;
                background: #45475a;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid transparent;
            }

            .section-checkbox:hover {
                background: #585b70;
                border-color: #89b4fa;
            }

            .section-checkbox input[type="checkbox"] {
                margin: 0;
                accent-color: #89b4fa;
            }

            .section-checkbox span {
                color: #cdd6f4;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.9rem;
            }

            .export-selected-btn, .import-btn {
                background: #89b4fa;
                color: #1e1e2e;
                border: none;
                padding: 12px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 15px;
            }

            .export-selected-btn:hover, .import-btn:hover {
                background: #74c7ec;
                transform: translateY(-1px);
            }

            .cancel-btn {
                background: #f38ba8;
                color: #1e1e2e;
                border: none;
                padding: 12px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .cancel-btn:hover {
                background: #eba0ac;
                transform: translateY(-1px);
            }

            .import-info {
                background: #1e1e2e;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                border-left: 4px solid #89b4fa;
            }

            .import-info p {
                margin: 5px 0;
                color: #cdd6f4;
            }

            .import-warning {
                background: #f9e2af;
                color: #1e1e2e;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .import-warning i {
                font-size: 1.2rem;
                color: #f9e2af;
                background: #1e1e2e;
                padding: 5px;
                border-radius: 50%;
            }

            .import-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
            }

            .section-options h4 {
                color: #cdd6f4;
                margin: 20px 0 10px 0;
                font-size: 1.1rem;
            }

            @media (max-width: 768px) {
                .unified-modal {
                    width: 95%;
                    margin: 10px;
                }
                
                .section-grid {
                    grid-template-columns: 1fr;
                }
                
                .import-actions {
                    flex-direction: column;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    window.unifiedDataManager = new UnifiedDataManager();
});
