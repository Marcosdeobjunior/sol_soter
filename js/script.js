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

// ADICIONE ESTE CÓDIGO AO FINAL DE js/script.js

/**
 * Busca o primeiro livro com o status "Lendo".
 * @returns {object|null} O objeto do livro ou null se não encontrar.
 */
function buscarLivroAtual() {
    try {
        const livros = JSON.parse(localStorage.getItem('biblioteca-pessoal-livros')) || [];
        // Encontra o primeiro livro com o status "Lendo"
        const livroAtual = livros.find(livro => livro.status === 'Lendo');
        return livroAtual || null;
    } catch (error) {
        console.error("Erro ao buscar livro atual:", error);
        return null;
    }
}

/**
 * Busca a viagem planejada com a data mais próxima no futuro.
 * @returns {object|null} O objeto da viagem ou null se não encontrar.
 */
function buscarProximaViagem() {
    try {
        const viagens = JSON.parse(localStorage.getItem('viagens-pessoais')) || [];
        const hoje = new Date().toISOString().split('T')[0]; // Pega a data de hoje no formato YYYY-MM-DD

        // Filtra por viagens "Planejada" que ainda não aconteceram
        const viagensFuturas = viagens.filter(viagem => {
            return viagem.status === 'Planejada' && viagem.dataInicio >= hoje;
        });

        // Ordena para encontrar a mais próxima
        if (viagensFuturas.length > 0) {
            viagensFuturas.sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio));
            return viagensFuturas[0];
        }

        return null;
    } catch (error) {
        console.error("Erro ao buscar próxima viagem:", error);
        return null;
    }
}