const params = new URLSearchParams(window.location.search);
const cpf = params.get('cpf');

if (!cpf) {
    alert("CPF não informado na URL.");
} else {
    buscarClientePorCpf(cpf);
}

async function buscarClientePorCpf(cpf) {
    try {
        const url = `http://127.0.0.1:5000/clientes/buscar_por_cpf/${cpf}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao buscar cliente.");
        const cliente = await response.json();
        preencherInfoCliente(cliente);
        buscarContratos(cliente.id);
    } catch (error) {
        console.error(error);
        alert("Erro ao buscar dados do cliente.");
    }
}

function preencherInfoCliente(cliente) {
    document.getElementById("nomeCliente").textContent = cliente.nome;
    document.getElementById("cpfCliente").textContent = cliente.cpf;
    document.getElementById("emailCliente").textContent = cliente.email || "Não informado";

    const contatosBody = document.getElementById("tabelaContatos");
    contatosBody.innerHTML = `
        <tr>
            <td>${cliente.telefone || "Sem telefone"}</td>
            <td>${cliente.email || "Sem email"}</td>
            <td><button onclick="editarContato()">Editar</button></td>
        </tr>
    `;
}

async function buscarContratos(clienteId) {
    try {
        const url = `http://127.0.0.1:5000/contratos/buscar_por_cliente/${clienteId}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao buscar contratos.");
        const contratos = await response.json();
        preencherContratos(contratos);
    } catch (error) {
        console.error(error);
        alert("Erro ao buscar contratos do cliente.");
    }
}

function preencherContratos(contratos) {
    const tbody = document.getElementById("tabelaContratos");
    tbody.innerHTML = "";

    contratos.forEach((contrato, index) => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${index + 1}</td>
            <td>${contrato.vencimento}</td>
            <td>${Number(contrato.valor_total).toFixed(2)}</td>
            <td>${contrato.atraso || 0}</td>
            <td><span class="status-icon ativo"></span></td>
            <td>
                ${contrato.observacao || "-"}
                <br>
                <button onclick="abrirCalculadoraComContrato('${contrato.numero_contrato}')">Simular</button>
            </td>
        `;
        tbody.appendChild(linha);
    });
}


function editarContato() {
    alert("Função de edição de contato ainda não implementada.");
}

