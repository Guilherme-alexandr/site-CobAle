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

// ===== BUSCA CLIENTE =====
async function buscarClientePorCpf(cpf) {
    try {
        const response = await fetch(`${API_BASE}/clientes/buscar_por_cpf/${cpf}`);
        if (!response.ok) throw new Error("Erro ao buscar cliente.");

        const cliente = await response.json();
        preencherInfoCliente(cliente);
        buscarContratos(cliente.id);
    } catch (error) {
        console.error(error);
        alert("Erro ao buscar dados do cliente.");
    }
}

// ===== PREENCHER CLIENTE (dados + endereço) =====
function preencherInfoCliente(cliente) {
    console.log("Cliente recebido:", cliente);
    clienteGlobal = cliente;

    document.getElementById("nomeCliente").textContent = cliente.nome;
    document.getElementById("cpfCliente").textContent = cliente.cpf;
    document.getElementById("emailCliente").textContent =
        cliente.email || "Não informado";

    const contatosBody = document.getElementById("tabelaContatos");
    contatosBody.innerHTML = `
    <tr>
      <td>${cliente.telefone || "Sem telefone"}</td>
      <td>${cliente.email || "Sem email"}</td>
      <td><button class="btn-editar" onclick="editarContato()">✏️ Editar</button></td>
    </tr>
  `;

    const enderecoSpan = document.getElementById("enderecoCliente");
    if (cliente.enderecos && cliente.enderecos.length > 0) {
        const e = cliente.enderecos[0];
        enderecoSpan.textContent = `${e.rua}, ${e.numero} - ${e.cidade}/${e.estado}`;
    } else {
        enderecoSpan.textContent = "Não informado";
    }
}

// ===== BUSCA CONTRATOS =====
async function buscarContratos(clienteId) {
    try {
        const response = await fetch(
            `${API_BASE}/contratos/buscar_por_cliente/${clienteId}`
        );

        if (!response.ok) throw new Error("Erro ao buscar contratos.");
        const contratos = await response.json();
        await preencherContratos(contratos); // AGORA É async
    } catch (error) {
        console.error(error);
        alert("Erro ao buscar contratos do cliente.");
    }
}

async function preencherContratos(contratos) {
    const tbody = document.getElementById("tabelaContratos");
    tbody.innerHTML = "";

    for (let index = 0; index < contratos.length; index++) {
        const contrato = contratos[index];

        const vencimentoDate = new Date(contrato.vencimento);
        const vencimentoFormatado = vencimentoDate.toLocaleDateString("pt-BR");

        const hoje = new Date();
        const diasAtraso = Math.max(
            0,
            Math.floor((hoje - vencimentoDate) / (1000 * 60 * 60 * 24))
        );

        // Definir status visual (padrão: em aberto = vermelho)
        let statusClasse = "status-vermelho";
        let statusTitle = "Em aberto";

        try {
            const respAcordo = await fetch(`${API_BASE}/acordos/buscar_por_contrato/${contrato.numero_contrato}`);
            if (respAcordo.ok) {
                const acordo = await respAcordo.json();
                if (acordo && acordo.status) {
                    if (acordo.status.toLowerCase() === "em andamento") {
                        statusClasse = "status-amarelo";
                        statusTitle = "Em andamento";
                    } else if (acordo.status.toLowerCase() === "finalizado") {
                        statusClasse = "status-verde";
                        statusTitle = "Finalizado";
                    }
                }
            }
        } catch (e) {
            console.warn("Erro ao verificar acordo:", e);
        }

        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${index + 1}</td>
            <td>${vencimentoFormatado}</td>
            <td>R$ ${Number(contrato.valor_total).toFixed(2).replace(".", ",")}</td>
            <td>${diasAtraso} dia(s)</td>
            <td><span class="status-icon ${statusClasse}" title="${statusTitle}"></span></td>
            <td>${contrato.numero_contrato}</td>
        `;
        tbody.appendChild(linha);
    }
}


// ===== EDITAR CONTATO =====
function editarContato() {
    if (!clienteGlobal) {
        alert("Cliente não carregado.");
        return;
    }

    document.getElementById("editarTelefone").value = clienteGlobal.telefone || "";
    document.getElementById("editarEmail").value = clienteGlobal.email || "";

    document.getElementById("popupEditarContato").style.display = "flex";
}

function fecharPopupEditar() {
    document.getElementById("popupEditarContato").style.display = "none";
}

async function salvarContatoEditado() {
    const novoNumero = document.getElementById("editarTelefone").value.trim();
    const novoEmail = document.getElementById("editarEmail").value.trim();

    if (!clienteGlobal || !clienteGlobal.id) {
        alert("Cliente inválido.");
        return;
    }

    try {
        console.log("Payload enviado:", { telefone: novoNumero, email: novoEmail });

        const resposta = await fetch(`${API_BASE}/clientes/${clienteGlobal.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                telefone: novoNumero,
                email: novoEmail,
            }),
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

// ===== EDITAR ENDEREÇO =====
function abrirPopupEditarEndereco() {
    if (!clienteGlobal || !clienteGlobal.enderecos?.length) {
        alert("Endereço não encontrado.");
        return;
    }

    const e = clienteGlobal.enderecos[0];
    enderecoId = e.id;
    document.getElementById("editarCep").value = e.cep || "";
    document.getElementById("editarRua").value = e.rua || "";
    document.getElementById("editarNumero").value = e.numero || "";
    document.getElementById("editarCidade").value = e.cidade || "";
    document.getElementById("editarEstado").value = e.estado || "";

    document.getElementById("popupEditarEndereco").style.display = "flex";
}

function fecharPopupEditarEndereco() {
    document.getElementById("popupEditarEndereco").style.display = "none";
}

async function salvarEnderecoEditado() {
    if (!clienteGlobal || !clienteGlobal.id) {
        alert("Cliente inválido.");
        return;
    }

    const enderecoAtualizado = {
        enderecos: [{
            id: enderecoId,
            cep: document.getElementById("editarCep").value,
            rua: document.getElementById("editarRua").value,
            numero: document.getElementById("editarNumero").value,
            cidade: document.getElementById("editarCidade").value,
            estado: document.getElementById("editarEstado").value,
        }]
    };

    try {
        const resposta = await fetch(`${API_BASE}/clientes/${clienteGlobal.id}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(enderecoAtualizado),
            }
        );

        if (!resposta.ok) {
            alert("Erro ao atualizar endereço.");
            return;
        }

        const clienteAtualizado = await resposta.json();
        clienteGlobal = clienteAtualizado;

        preencherInfoCliente(clienteAtualizado);
        fecharPopupEditarEndereco();
        alert("Endereço atualizado com sucesso.");
    } catch (erro) {
        console.error("Erro ao salvar endereço:", erro);
        alert("Erro ao salvar endereço.");
    }
}

// ===== VERIFICAR ACORDO =====
async function verificarAcordoAtivo(numeroContrato) {
    try {
        const resposta = await fetch(
            `${API_BASE}/acordos/buscar_por_contrato/${numeroContrato}`
        );
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
