// ===== INTEGRAÇÃO DASHBOARD =====
// Este arquivo deve ser incluído em todas as páginas que precisam notificar o dashboard sobre mudanças

// Função para notificar o dashboard sobre mudanças nos dados
function notifyDashboardUpdate() {
  // Dispara evento customizado para atualizar o dashboard
  if (typeof window.updateDashboard === 'function') {
    window.updateDashboard();
  }
  
  // Também dispara o evento diretamente
  window.dispatchEvent(new CustomEvent('dashboardUpdate'));
  
  // Para páginas em outras abas/janelas
  localStorage.setItem('dashboard-trigger-update', Date.now().toString());
}

// Escuta mudanças no localStorage para sincronizar entre abas
window.addEventListener('storage', (e) => {
  if (e.key === 'dashboard-trigger-update') {
    if (typeof window.updateDashboard === 'function') {
      window.updateDashboard();
    }
  }
});

// Função para ser chamada quando dados são salvos em qualquer página
function onDataSaved(pageType) {
  console.log(`Dados salvos em ${pageType}, notificando dashboard...`);
  notifyDashboardUpdate();
}

// Função para ser chamada quando dados são carregados/importados
function onDataLoaded(pageType) {
  console.log(`Dados carregados em ${pageType}, notificando dashboard...`);
  notifyDashboardUpdate();
}

// Função para ser chamada quando dados são excluídos
function onDataDeleted(pageType) {
  console.log(`Dados excluídos em ${pageType}, notificando dashboard...`);
  notifyDashboardUpdate();
}

// Exporta funções para uso global
window.dashboardIntegration = {
  notifyUpdate: notifyDashboardUpdate,
  onDataSaved: onDataSaved,
  onDataLoaded: onDataLoaded,
  onDataDeleted: onDataDeleted
};

console.log('Dashboard Integration carregado');
