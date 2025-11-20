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