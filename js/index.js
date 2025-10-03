// CONTEÚDO PARA O NOVO ARQUIVO js/index.js

document.addEventListener('DOMContentLoaded', () => {
    carregarResumoBiblioteca();
    carregarResumoViagens();
});

function carregarResumoBiblioteca() {
    const container = document.getElementById('livro-atual-container');
    if (!container) return;

    const livro = buscarLivroAtual();

    if (livro) {
        container.innerHTML = `
            <div class="card-resumo">
                <img src="${livro.imagem || 'img/placeholder.png'}" alt="Capa do livro ${livro.titulo}">
                <div class="card-resumo-info">
                    <span class="card-resumo-status">Leitura em andamento</span>
                    <h3>${livro.titulo}</h3>
                    <p>${livro.autor}</p>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="card-resumo-vazio">
                <i class="fas fa-book-open"></i>
                <p>Nenhum livro sendo lido no momento.</p>
                <a href="livraria.html" class="btn-pequeno">Ver Biblioteca</a>
            </div>
        `;
    }
}

function carregarResumoViagens() {
    const container = document.getElementById('proxima-viagem-container');
    if (!container) return;
    
    const viagem = buscarProximaViagem();

    if (viagem) {
        // Formata a data para DD/MM/YYYY
        const dataFormatada = new Date(viagem.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR');

        container.innerHTML = `
            <div class="card-resumo">
                <img src="${viagem.imagem || 'img/placeholder_viagem.png'}" alt="Foto de ${viagem.destino}">
                <div class="card-resumo-info">
                    <span class="card-resumo-status">Próxima Aventura</span>
                    <h3>${viagem.destino}</h3>
                    <p>Início em: ${dataFormatada}</p>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="card-resumo-vazio">
                <i class="fas fa-map-marked-alt"></i>
                <p>Nenhuma viagem planejada.</p>
                <a href="viagens.html" class="btn-pequeno">Ver Viagens</a>
            </div>
        `;
    }
}
