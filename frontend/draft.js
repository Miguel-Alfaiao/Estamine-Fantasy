// Limita a 2 seleções dinamicamente por pote no Draft e atualiza o ecrã
document.querySelectorAll('.pote-card').forEach(card => {
    const checkboxes = card.querySelectorAll('.team-checkbox');
    const counter = card.querySelector('.pote-counter');

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checkedCount = card.querySelectorAll('.team-checkbox:checked').length;
            
            if (checkedCount > 2) {
                checkbox.checked = false;
                alert("Só podes escolher 2 seleções deste pote!");
                return;
            }
            
            counter.textContent = `${checkedCount}/2`;
            atualizarTabelaResumo(); // Invoca a atualização da tabela de escolhas em tempo real
        });
    });
});

// Reconstrói a tabela de resumo baseando-se nas seleções ativas e respetivos pontos (+2, +3, +4, +5)
function atualizarTabelaResumo() {
    const resumoContainer = document.getElementById('resumoDraft');
    const tbody = document.getElementById('resumoTableBody');
    tbody.innerHTML = ''; 

    const todasSelecionadas = document.querySelectorAll('.team-checkbox:checked');

    if (todasSelecionadas.length === 0) {
        resumoContainer.style.display = 'none';
        return;
    }

    resumoContainer.style.display = 'block';

    document.querySelectorAll('.pote-card').forEach(card => {
        const poteNumero = card.getAttribute('data-pote');
        const pontos = card.getAttribute('data-pts'); // Recolhe o valor configurado no HTML (2, 3, 4 ou 5)
        const selecionadasNoPote = card.querySelectorAll('.team-checkbox:checked');

        selecionadasNoPote.forEach(checkbox => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: bold; color: var(--text-secondary);">Pote ${poteNumero}</td>
                <td style="font-style: italic;">${checkbox.value}</td>
                <td style="color: var(--selection-active); font-weight: bold;">+${pontos} pts</td>
                <td style="color: #00bfff; font-weight: bold;">+${pontos} pts</td>
            `;
            tbody.appendChild(tr);
        });
    });
}

// Bloqueia o envio do formulário se o draft estiver incompleto
document.getElementById('draftForm').addEventListener('submit', function(e) {
    let valido = true;
    document.querySelectorAll('.pote-card').forEach(card => {
        const checkedCount = card.querySelectorAll('.team-checkbox:checked').length;
        if (checkedCount !== 2) {
            valido = false;
            const poteNome = card.querySelector('.pote-header span').textContent;
            alert(`Precisas de escolher exatamente 2 seleções no ${poteNome}!`);
        }
    });

    if (!valido) {
        e.preventDefault();
    }
});