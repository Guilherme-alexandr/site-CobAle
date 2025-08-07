let clienteGlobal = null;


document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const cpf = params.get("cpf");
    const numeroContrato = params.get("contrato");

    if (!cpf) {
        alert("CPF não informado na URL.");
    } else {
        buscarClientePorCpf(cpf);
    }

    if (numeroContrato) {
        verificarAcordoAtivo(numeroContrato);
    } else {
        console.warn("Número do contrato não encontrado na URL.");
    }
});


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
    clienteGlobal = cliente;
    document.getElementById("nomeCliente").textContent = cliente.nome;
    document.getElementById("cpfCliente").textContent = cliente.cpf;
    document.getElementById("emailCliente").textContent = cliente.email || "Não informado";

    const contatosBody = document.getElementById("tabelaContatos");
    contatosBody.innerHTML = `
        <tr>
            <td>${cliente.numero || "Sem telefone"}</td>
            <td>${cliente.email || "Sem email"}</td>
            <td><button class="btn-editar" onclick="editarContato()">✏️ Editar</button></td>
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
        const vencimentoDate = new Date(contrato.vencimento);
        const vencimentoFormatado = vencimentoDate.toLocaleDateString("pt-BR");

        const hoje = new Date();
        const diasAtraso = Math.max(0, Math.floor((hoje - vencimentoDate) / (1000 * 60 * 60 * 24)));

        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${index + 1}</td>
            <td>${vencimentoFormatado}</td>
            <td>R$ ${Number(contrato.valor_total).toFixed(2)}</td>
            <td>${diasAtraso} dia(s)</td>
            <td><span class="status-icon ativo"></span></td>
            <td>${contrato.numero_contrato}</td>
        `;
        tbody.appendChild(linha);
    });
}



function editarContato() {
    if (!clienteGlobal) {
        alert("Cliente não carregado.");
        return;
    }
    document.getElementById("editarNumero").value = clienteGlobal.telefone || "";
    document.getElementById("editarEmail").value = clienteGlobal.email || "";

    document.getElementById("popupEditarContato").style.display = "flex";
}
function fecharPopupEditar() {
    document.getElementById("popupEditarContato").style.display = "none";
}
async function salvarContatoEditado() {
    const novoNumero = document.getElementById("editarNumero").value.trim();
    const novoEmail = document.getElementById("editarEmail").value.trim();

    if (!clienteGlobal || !clienteGlobal.id) {
        alert("Cliente invalido.");
        return;
    }
    try {
        const resposta = await fetch(`http://127.0.0.1:5000/clientes/${clienteGlobal.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ numero: novoNumero, email: novoEmail })
        });
        if (!resposta.ok) {
            alert("Erro ao atualizar cliente.");
            return;
        }
        const clienteAtualizado = await resposta.json();
        clienteGlobal = clienteAtualizado;

        preencherInfoCliente(clienteAtualizado);
        fecharPopupEditar();
        alert("Contato atualizado com sucesso.");
    } catch (erro) {
        console.error("Erro ao salvar contato:", erro);
        alert("Erro ao salvar contato.");
    }
}

async function verificarAcordoAtivo(numeroContrato) {
    try {
        const resposta = await fetch(`http://127.0.0.1:5000/acordos/buscar_por_contrato/${numeroContrato}`);
        if (!resposta.ok) return;

        const acordo = await resposta.json();
        if (acordo && acordo.status === "em andamento") {
            if (acordo.parcelamento_json) {
                try {
                    acordo.parcelamento = JSON.parse(acordo.parcelamento_json);
                } catch (e) {
                    console.warn("Erro ao interpretar parcelamento_json:", e);
                }
            }

            renderizarResumoAcordo(acordo);

            const btnCalc = document.getElementById("AbrirCalculadora");
            if (btnCalc) btnCalc.style.display = "none";
        }
    } catch (e) {
        console.error("Erro ao verificar acordo ativo:", e);
    }
}

