async function buscarPorCpf() {
    const cpf = document.getElementById('cpf').value.trim();

    if (!cpf) {
        alert("Por favor, preencha o CPF.");
        return;
    }

    try {
        console.log("Buscando cliente pelo CPF...");
        const respostaCliente = await fetch(`http://127.0.0.1:5000/clientes/buscar_por_cpf/${cpf}`);

        if (!respostaCliente.ok) {
            alert("Cliente não encontrado.");
            return;
        }

        const cliente = await respostaCliente.json();
        console.log("Cliente encontrado:", cliente);

        if (!cliente.id) {
            alert("Erro: cliente retornado sem ID.");
            return;
        }

        console.log("Buscando contratos do cliente...");
        const respostaContratos = await fetch(`http://127.0.0.1:5000/contratos/buscar_por_cliente/${cliente.id}`);

        if (!respostaContratos.ok) {
            alert("Nenhum contrato encontrado para este cliente.");
            return;
        }

        const contratos = await respostaContratos.json();
        console.log("Contratos encontrados:", contratos);

        const tbody = document.querySelector('#resultado tbody');
        tbody.innerHTML = '';

        contratos.forEach(contrato => {
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${cliente.nome}</td>
                <td>${cliente.cpf}</td>
                <td>${contrato.numero_contrato}</td>
                <td>R$ ${Number(contrato.valor_total).toFixed(2)}</td>
                <td>
                    <a href="../view/negociacao.html?cpf=${cliente.cpf}&contrato=${contrato.numero_contrato}" class="negociar-link">
                        Negociar
                    </a>
                </td>
            `;
            tbody.appendChild(linha);
        });

        console.log("Tabela preenchida com sucesso.");

    } catch (erro) {
        console.error("Erro ao buscar por CPF:", erro);
        alert("Erro ao buscar os dados. Verifique o console.");
    }
}
