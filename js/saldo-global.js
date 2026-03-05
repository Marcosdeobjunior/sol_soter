function atualizarSaldoGlobal() {
    const elementoSaldo = document.getElementById('saldo-do-dia');
    if (!elementoSaldo) {
        console.log("Elemento 'saldo-do-dia' nao encontrado no cabecalho.");
        return;
    }

    const dadosSalvos = localStorage.getItem('financeiro-widget');
    let saldoFinal = 0;
    let indicador = { estado: 'neutral', titulo: 'Sem dados de salario no mes' };

    if (dadosSalvos) {
        try {
            const dados = JSON.parse(dadosSalvos);
            const saldoInicial = (typeof dados.saldoInicial === 'number') ? dados.saldoInicial : 0;
            const transacoes = Array.isArray(dados.transacoes) ? dados.transacoes : [];

            const hoje = new Date();
            hoje.setHours(23, 59, 59, 999);

            let saldoCalculado = saldoInicial;
            transacoes.forEach(t => {
                const dataTransacao = new Date(t.data);
                if (Number.isNaN(dataTransacao.getTime())) return;
                if (dataTransacao <= hoje) {
                    const valor = typeof t.valor === 'number' ? t.valor : Number(t.valor) || 0;
                    if (t.tipo === 'entrada') {
                        saldoCalculado += valor;
                    } else {
                        saldoCalculado -= valor;
                    }
                }
            });
            saldoFinal = saldoCalculado;

            const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0, 0);
            const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);

            let totalSalarioMes = 0;
            let totalGastosMes = 0;

            transacoes.forEach(t => {
                const dataTransacao = new Date(t.data);
                if (Number.isNaN(dataTransacao.getTime())) return;
                if (dataTransacao < inicioMes || dataTransacao > fimMes || dataTransacao > hoje) return;

                const valor = typeof t.valor === 'number' ? t.valor : Number(t.valor) || 0;
                const categoria = (t.categoria || '').toString().toLowerCase();

                if (t.tipo === 'entrada' && categoria === 'salario') {
                    totalSalarioMes += valor;
                }

                if (t.tipo === 'saida' || t.tipo === 'reserva') {
                    totalGastosMes += valor;
                }
            });

            if (totalSalarioMes > 0) {
                const percentualGasto = (totalGastosMes / totalSalarioMes) * 100;
                if (percentualGasto < 60) {
                    indicador = {
                        estado: 'up',
                        titulo: `Gastos do mes em ${percentualGasto.toFixed(1).replace('.', ',')}% do salario`
                    };
                } else {
                    indicador = {
                        estado: 'down',
                        titulo: `Gastos do mes em ${percentualGasto.toFixed(1).replace('.', ',')}% do salario`
                    };
                }
            }
        } catch (e) {
            console.error('Erro ao ler dados financeiros do localStorage:', e);
            saldoFinal = 0;
        }
    }

    const formatarMoeda = (valor) => `R$ ${valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    elementoSaldo.textContent = formatarMoeda(saldoFinal);

    if (saldoFinal >= 0) {
        elementoSaldo.style.color = 'var(--color-primary)';
    } else {
        elementoSaldo.style.color = 'var(--color-danger)';
    }

    const saldoDisplay = elementoSaldo.closest('.saldo-display');
    if (!saldoDisplay) return;

    let saldoRow = saldoDisplay.querySelector('.saldo-value-row');
    if (!saldoRow) {
        saldoRow = document.createElement('div');
        saldoRow.className = 'saldo-value-row';
        saldoDisplay.appendChild(saldoRow);
    }
    saldoRow.style.display = 'inline-flex';
    saldoRow.style.alignItems = 'center';
    saldoRow.style.gap = '6px';

    if (elementoSaldo.parentElement !== saldoRow) {
        saldoRow.appendChild(elementoSaldo);
    }

    let indicadorEl = saldoRow.querySelector('.saldo-trend-indicator');
    if (!indicadorEl) {
        indicadorEl = document.createElement('span');
        indicadorEl.className = 'saldo-trend-indicator';
        saldoRow.prepend(indicadorEl);
    }

    indicadorEl.classList.remove('up', 'down', 'neutral');
    indicadorEl.classList.add(indicador.estado);
    indicadorEl.title = indicador.titulo;
    indicadorEl.textContent = indicador.estado === 'up' ? '↗' : indicador.estado === 'down' ? '↘' : '→';
    indicadorEl.style.fontSize = '1rem';
    indicadorEl.style.fontWeight = '700';
    indicadorEl.style.lineHeight = '1';
    indicadorEl.style.userSelect = 'none';
    indicadorEl.style.color = indicador.estado === 'up'
        ? '#22c55e'
        : indicador.estado === 'down'
            ? '#ef4444'
            : '#a0a0a0';
}
