function atualizarSaldoGlobal() {
    const elementoSaldo = document.getElementById('saldo-do-dia');
    if (!elementoSaldo) {
        console.log("Elemento 'saldo-do-dia' não encontrado no cabeçalho.");
        return;
    }

    const dadosSalvos = localStorage.getItem('financeiro-widget');
    let saldoFinal = 0;

    if (dadosSalvos) {
        try {
            const dados = JSON.parse(dadosSalvos);
            const saldoInicial = (typeof dados.saldoInicial === 'number') ? dados.saldoInicial : 0;
            const transacoes = Array.isArray(dados.transacoes) ? dados.transacoes : [];

            // Calcula o saldo até o dia de hoje
            const hoje = new Date();
            hoje.setHours(23, 59, 59, 999); // Considera o dia inteiro

            let saldoCalculado = saldoInicial;
            transacoes.forEach(t => {
                const dataTransacao = new Date(t.data);
                if (dataTransacao <= hoje) {
                    if (t.tipo === 'entrada') {
                        saldoCalculado += t.valor;
                    } else {
                        saldoCalculado -= t.valor;
                    }
                }
            });
            saldoFinal = saldoCalculado;

        } catch (e) {
            console.error("Erro ao ler dados financeiros do localStorage:", e);
            saldoFinal = 0; // Zera em caso de erro
        }
    }

    // Formata e exibe o saldo
    const formatarMoeda = (valor) => `R$ ${valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    elementoSaldo.textContent = formatarMoeda(saldoFinal);

    // Altera a cor baseada no valor
    if (saldoFinal >= 0) {
        elementoSaldo.style.color = 'var(--color-primary)';
    } else {
        elementoSaldo.style.color = 'var(--color-danger)';
    }
}
